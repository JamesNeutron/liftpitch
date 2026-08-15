# LiftPitch Team Accounts — Stage 2 Database Migration Runbook

**Scope:** database layer only. No application code changes here — Stage 3 rewires
the console/API to the new shape and follows closely (Phases 7–8 intentionally break
the deployed console; see the ordering notes).

**Revision note (defect fixes):** this runbook was corrected against the live schema
output. Fixed: (1) `get_recording_role` rewritten with a **byte-identical** return
signature via `CREATE OR REPLACE` (no `id`, 6 columns, original order) plus the
`REVOKE … FROM PUBLIC` / re-grant; (2) the **`is_org_member` SECURITY DEFINER helper
restored** and every membership check routed through it to avoid `42P17` recursion;
(3) `roles` given membership-based RLS (old `employer_id` policy dropped), `org_id`
made `NOT NULL`, and `employer_id`'s fate decided. Verification suite restored to
seven tests.

## Settled decisions baked in

- `organizations` / `memberships` / `invites`. **Flat** membership — everyone equal,
  no admin roles.
- Pricing (later): pure per-active-role, unlimited teammates. Org is the future
  billing anchor; **no billing built now**.
- **Brand: Option B** — de-denormalize off `roles`. Brand lives on `organizations`;
  `get_recording_role` absorbs the join. Three call sites change (the function,
  `api/video/[id]`, console brand-save fan-out) — the latter two in Stage 3.
- Candidate inbox **NOT** in scope. `videos` stays owner-only.
- Signup collects **company name only**; colors set later in the console.
- Invite **email-match off** (acceptance never checks the accepter's email), but an
  informational `invites.email` column is kept so the console can show who was
  invited and Stage 3 knows where to send — see the Q&A at the end.
- Member removal **self-leave only**, WITH the `org_member_count` last-member guard.
- **Multi-org membership prevented** via `UNIQUE (memberships.user_id)`. Contention
  surfaces as `SQLSTATE 45001` / `HINT ALREADY_IN_ORG`.
- Full wipe of test data authorized; no real accounts exist.
- **Ordering that matters:**
  - `is_org_member` (Phase 3) BEFORE any policy that references it (Phase 4).
  - Backfill (Phase 5) BEFORE `roles.org_id` is made `NOT NULL` (Phase 6).
  - Rewrite `get_recording_role` (Phase 7) BEFORE dropping the `roles` brand
    columns (Phase 8).

---

## Phase 0 — Wipe test data (authorized)

Run as `postgres` in the SQL editor (bypasses RLS). No real accounts exist.

```sql
begin;
delete from public.video_views;
delete from public.videos;
delete from public.roles;
-- (organizations/memberships/invites don't exist yet — created below)
commit;
```

Leave `auth.users` / `profiles` alone unless you also want to clear test logins; if
so, `delete from auth.users;` cascades to `profiles` and `videos.user_id`.

---

## Phase 1 — create the three tables (RLS on, policies deferred to Phase 4)

Policies come in Phase 4 because they depend on `is_org_member` (Phase 3), which in
turn needs the `memberships` table to already exist. So: tables first, helper next,
policies last.

```sql
-- organizations: brand home + future billing anchor
create table public.organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text,                              -- company name captured at signup
  brand_color  text not null default '#0A66C2',   -- DEFAULT_BRAND_COLOR
  accent_color text not null default '#1A1A2E',   -- DEFAULT_ACCENT_COLOR
  created_at   timestamptz not null default now()
);
alter table public.organizations enable row level security;

-- memberships: flat, exactly one org per user
create table public.memberships (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null references public.profiles(id)      on delete cascade,
  created_at timestamptz not null default now(),
  -- One org per user. This is exactly what makes an invited solo user hit the
  -- dead-end that Phase 9's accept_invite dissolve resolves.
  constraint memberships_user_unique unique (user_id)
);
alter table public.memberships enable row level security;

-- invites: token grants entry. email-match is OFF (acceptance never checks it),
-- but email is stored so the console can show who was invited / Stage 3 can send.
create table public.invites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  email       text,                              -- informational recipient; NOT enforced
  token       text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by  uuid references public.profiles(id) on delete set null,
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);
alter table public.invites enable row level security;
```

---

## Phase 2 — link roles to an org (column only)

`org_id` is nullable here so the backfill (Phase 5) can populate it; it becomes
`NOT NULL` in Phase 6. The denormalized brand columns stay until Phase 8.

```sql
alter table public.roles
  add column org_id uuid references public.organizations(id) on delete cascade;

create index roles_org_id_idx on public.roles (org_id);
```

`ON DELETE CASCADE` matters for the cascade walkthrough (after Phase 9): deleting an
org deletes its roles. We only ever dissolve **zero-role** orgs, so this branch never
fires on the dissolve path — but it's the correct semantics for a real org teardown.

---

## Phase 3 — is_org_member (SECURITY DEFINER) — the recursion firebreak

**Non-negotiable.** An RLS policy on `memberships` whose `USING` clause selects from
`memberships` raises `42P17 infinite recursion` — the policy re-invokes itself. The
same trap applies to any `organizations` / `invites` / `roles` policy that checks
membership with an inline subquery over `memberships`.

`is_org_member` breaks the cycle: it is `SECURITY DEFINER` and owned by `postgres`
(a table-owner / `BYPASSRLS` role in Supabase), so the `memberships` lookup **inside
it runs without re-triggering `memberships` RLS**. Every membership check in Phase 4
routes through it — no policy ever queries `memberships` directly.

```sql
create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where org_id = target_org
      and user_id = auth.uid()
  );
$$;

revoke execute on function public.is_org_member(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
```

> Ownership check before you rely on this: `is_org_member` must be owned by a role
> that bypasses RLS on `memberships` (default `postgres` in Supabase). Confirm with
> `\df+ public.is_org_member` — the Owner column must be `postgres` (or another
> `BYPASSRLS`/table-owner role). If it isn't, the recursion firebreak doesn't hold.

---

## Phase 4 — RLS policies (every membership check via is_org_member)

Includes the **roles policy cutover** (Defect 3): drop the old owner-scoped policy
and replace it with membership-scoped ones.

```sql
-- organizations: members can read their own org.
create policy "Members can view their organization"
  on public.organizations for select
  using (public.is_org_member(id));

-- memberships: members can see co-members (the teammate list). Routed through the
-- definer function — this is the policy that would otherwise recurse.
create policy "Members can view co-members"
  on public.memberships for select
  using (public.is_org_member(org_id));
-- No direct INSERT/DELETE policy: join/leave go through SECURITY DEFINER functions
-- (create_org / leave_org / accept_invite in Phase 9).

-- invites: members can see their org's invites (console list).
create policy "Members can view their org invites"
  on public.invites for select
  using (public.is_org_member(org_id));
-- No direct INSERT/UPDATE policy: creation via create_invite, acceptance via
-- accept_invite (both Phase 9).

-- roles cutover: drop the old owner-only policy, add membership-scoped CRUD.
-- (Name below matches the live policy; adjust if yours differs — verify with
--  `select policyname from pg_policies where tablename = 'roles';`.)
drop policy if exists "Employers manage their own roles" on public.roles;

create policy "Members can view org roles"
  on public.roles for select
  using (public.is_org_member(org_id));

create policy "Members can create org roles"
  on public.roles for insert
  with check (public.is_org_member(org_id));

create policy "Members can update org roles"
  on public.roles for update
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "Members can delete org roles"
  on public.roles for delete
  using (public.is_org_member(org_id));
```

> **Console-break note:** dropping `"Employers manage their own roles"` and gating
> `roles` on `is_org_member(org_id)` breaks the currently-deployed console's role
> CRUD (it inserts `employer_id`, not `org_id`, and the signed-in user has no
> membership until Stage 3 signup creates one). This is part of the same coordinated
> cutover as Phase 8 — deploy Stage 3 right after.

---

## Phase 5 — backfill (one org per existing employer)

Idempotent; safe to run even after the Phase 0 wipe (it simply finds nothing).

```sql
do $$
declare r record; v_org uuid;
begin
  for r in
    select p.id as uid, p.company_name, p.brand_color, p.accent_color
    from public.profiles p
    where p.account_type = 'employer'
      and not exists (select 1 from public.memberships m where m.user_id = p.id)
  loop
    insert into public.organizations (name, brand_color, accent_color)
      values (r.company_name,
              coalesce(r.brand_color,  '#0A66C2'),
              coalesce(r.accent_color, '#1A1A2E'))
      returning id into v_org;
    insert into public.memberships (org_id, user_id) values (v_org, r.uid);
    update public.roles set org_id = v_org where employer_id = r.uid;
  end loop;
end $$;
```

Verify no role is left unlinked before Phase 6:

```sql
select count(*) from public.roles where org_id is null;  -- must be 0
```

---

## Phase 6 — post-backfill constraints + decide employer_id

Now that every role has an `org_id`, lock it down. And resolve `roles.employer_id`
(Defect 3): it is currently `NOT NULL references profiles(id)` and was the old
authorization key. Authorization now lives entirely on `org_id` + `is_org_member`, so
**employer_id becomes nullable and informational** — a record of which member
originally created the role (Stage 3 may rename it to `created_by`). It is **not
referenced by any policy**. We also relax its FK to `ON DELETE SET NULL` so a
departing creator never orphan-deletes their org's roles.

```sql
-- org_id is now mandatory.
alter table public.roles alter column org_id set not null;

-- employer_id: demote to informational "created by".
alter table public.roles alter column employer_id drop not null;

-- Relax the FK so deleting the creating user preserves the org's roles.
-- (Constraint name is the Postgres default; confirm with
--  `select conname from pg_constraint where conrelid = 'public.roles'::regclass;`.)
alter table public.roles drop constraint roles_employer_id_fkey;
alter table public.roles
  add constraint roles_employer_id_fkey
  foreign key (employer_id) references public.profiles(id) on delete set null;
```

**Decision, stated explicitly:** `roles.employer_id` is **kept**, made **nullable +
informational** (creator record only), and **no longer used for RLS**. It is not
dropped, so the Phase 5 backfill (which stamps `org_id` via `employer_id`) and any
historical audit of "who made this role" both keep working.

---

## Phase 7 — rewrite get_recording_role to join organizations

**Run BEFORE Phase 8.** The body is `LANGUAGE sql`; rewriting it to stop referencing
the `roles` brand columns first means the Phase 8 `DROP COLUMN` has no live
dependency to trip over.

**Signature is byte-identical to the live function** (Defect 1) — same six columns,
same order, same types, **no `id`** — so `CREATE OR REPLACE` succeeds (it cannot
change a function's return type). We deliberately do **not** `DROP + CREATE`: the
live grants include `service_role EXECUTE`, which the sponsored upload routes
(`get-upload-url`, `register-video`) depend on, and a drop would silently strip it.

```sql
create or replace function public.get_recording_role(role_id uuid)
returns table (
  role_title   text,
  question_1   text,
  question_2   text,
  company_name text,
  brand_color  text,
  accent_color text
)
language sql
security definer
set search_path = public
as $$
  select r.role_title,
         r.question_1,
         r.question_2,
         o.name          as company_name,   -- was r.company_name
         o.brand_color,                      -- was r.brand_color
         o.accent_color                      -- was r.accent_color
  from public.roles r
  join public.organizations o on o.id = r.org_id
  where r.id = get_recording_role.role_id;
$$;

-- Tighten EXECUTE: PUBLIC currently holds it; drop that and grant only the three
-- roles that actually call it. CREATE OR REPLACE preserves prior grants, so the
-- REVOKE is required to actually remove PUBLIC.
revoke execute on function public.get_recording_role(uuid) from public;
grant  execute on function public.get_recording_role(uuid)
  to anon, authenticated, service_role;
```

The three brand consumers (`/r`, `get-upload-url`, `register-video`) keep reading
`company_name/brand_color/accent_color` off the returned row — column names and order
are unchanged, only the source of the brand columns moves from the role to its org.
`api/video/[id]` still reads `roles.brand_color/accent_color` directly until Stage 3
flips it to join the org; that read is why Phase 8's drop forces Stage 3.

---

## Phase 8 — drop denormalized brand (BREAKS deployed console; Stage 3 follows)

```sql
alter table public.roles    drop column company_name;
alter table public.roles    drop column brand_color;
alter table public.roles    drop column accent_color;
-- Employer-level brand moves to organizations too:
alter table public.profiles drop column company_name;
alter table public.profiles drop column brand_color;
alter table public.profiles drop column accent_color;
```

After this, the deployed console (`console/page.js` reads `profiles.brand_color` etc.
and writes the `roles.brand_color` fan-out) and `api/video/[id]` (reads
`roles.brand_color`) are broken until Stage 3 repoints them at `organizations`.
Expected and sequenced — do Phase 8 immediately before deploying Stage 3.

---

## Phase 9 — membership functions (create / invite / leave / accept-with-dissolve)

All `SECURITY DEFINER`, owned by `postgres`, so they write `memberships` /
`organizations` / `invites` without needing table INSERT/DELETE policies.

### 9a. create_org — signup (company name only)

```sql
create or replace function public.create_org(org_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_org uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if exists (select 1 from public.memberships where user_id = v_uid) then
    raise exception 'already a member of an organization'
      using errcode = '45001', hint = 'ALREADY_IN_ORG';
  end if;

  insert into public.organizations (name) values (org_name) returning id into v_org;
  insert into public.memberships (org_id, user_id) values (v_org, v_uid);
  return v_org;
end;
$$;

grant execute on function public.create_org(text) to authenticated;
```

### 9b. create_invite — any member can invite (flat membership)

```sql
create or replace function public.create_invite(invitee_email text)
returns text          -- the token, for the console to build the invite link
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_org   uuid;
  v_token text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  select org_id into v_org from public.memberships where user_id = v_uid;
  if v_org is null then
    raise exception 'not a member of any organization' using errcode = '45003';
  end if;

  insert into public.invites (org_id, email, created_by)
    values (v_org, nullif(btrim(invitee_email), ''), v_uid)
    returning token into v_token;
  return v_token;
end;
$$;

grant execute on function public.create_invite(text) to authenticated;
```

### 9c. leave_org — self-leave only, with last-member guard

```sql
create or replace function public.leave_org()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_org   uuid;
  v_count int;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select org_id into v_org from public.memberships where user_id = v_uid;
  if v_org is null then
    raise exception 'not a member of any organization' using errcode = '45003';
  end if;

  -- org_member_count guard: the last member cannot self-leave (would orphan the
  -- org and its roles/invites). Dissolving a genuinely-abandoned solo org is only
  -- allowed as a side effect of accepting an invite (9d) — never as a bare leave.
  select count(*) into v_count from public.memberships where org_id = v_org;
  if v_count <= 1 then
    raise exception 'cannot leave as the last member'
      using errcode = '45002', hint = 'LAST_MEMBER';
  end if;

  delete from public.memberships where user_id = v_uid;
end;
$$;

grant execute on function public.leave_org() to authenticated;
```

### 9d. accept_invite — with abandoned-solo-org dissolve (THE FIX)

The dead-end: a user who signs up solo (creating a solo org) then gets invited can
neither **join** the new org (blocked by `memberships_user_unique`) nor **leave**
their own (blocked by the last-member guard in 9c). `accept_invite` resolves it by
dissolving an *abandoned solo org* — but only under strict conditions, checked **in
this order**. If any fails, it does **not** dissolve: it raises `45001 /
ALREADY_IN_ORG` and falls through to manual recovery.

```sql
create or replace function public.accept_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid          uuid := auth.uid();
  v_target_org   uuid;
  v_current_org  uuid;
  v_member_count int;
  v_role_count   int;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- Resolve the invite → destination org. Lock the invite row so two concurrent
  -- accepts of the same token serialize and only one consumes it.
  select org_id into v_target_org
  from public.invites
  where token = invite_token and accepted_at is null
  for update;

  if v_target_org is null then
    raise exception 'invite not found or already used'
      using errcode = '45004', hint = 'INVITE_INVALID';
  end if;

  -- Is the caller already in an org? Lock their membership row so a concurrent
  -- accept/leave can't race the dissolve.
  select org_id into v_current_org
  from public.memberships
  where user_id = v_uid
  for update;

  if v_current_org is not null then
    -- Idempotent: already in the destination org.
    if v_current_org = v_target_org then
      raise exception 'already a member of this organization'
        using errcode = '45001', hint = 'ALREADY_IN_ORG';
    end if;

    -- Strict dissolve conditions, IN ORDER:
    --   (1) caller is the SOLE member of their current org (count = 1)
    select count(*) into v_member_count
    from public.memberships where org_id = v_current_org;

    --   (2) that org has ZERO roles
    select count(*) into v_role_count
    from public.roles where org_id = v_current_org;

    --   (3) caller is genuinely a member of it — established by the SELECT ...
    --       FOR UPDATE above returning v_current_org for this user_id.
    if v_member_count = 1 and v_role_count = 0 then
      -- Dissolve the abandoned solo org, then join. Order matters: delete the
      -- old membership BEFORE inserting the new one so memberships_user_unique
      -- is never transiently violated.
      delete from public.memberships where org_id = v_current_org;  -- caller's row
      delete from public.organizations where id = v_current_org;    -- cascades invites
      insert into public.memberships (org_id, user_id) values (v_target_org, v_uid);
    else
      -- Not dissolvable (co-members present, or org owns roles) → refuse and
      -- surface to manual recovery. Do NOT touch either org.
      raise exception 'already a member of an organization'
        using errcode = '45001', hint = 'ALREADY_IN_ORG';
    end if;
  else
    -- No current org — the simple join.
    insert into public.memberships (org_id, user_id) values (v_target_org, v_uid);
  end if;

  -- Consume the invite.
  update public.invites
    set accepted_at = now(), accepted_by = v_uid
  where token = invite_token;

  return v_target_org;
end;
$$;

grant execute on function public.accept_invite(text) to authenticated;
```

---

## Atomicity — confirmed

A PL/pgSQL function runs inside the caller's transaction; there is no implicit
sub-transaction around its statements. So for `accept_invite`, all four writes —
`delete membership` → `delete organizations` (+ its cascades) → `insert membership`
→ `update invites` — **commit together or roll back together**.

- If the `insert into memberships` fails (e.g. a concurrent `accept_invite` already
  placed the caller into a different org between our lock acquisition and insert — in
  practice prevented by the `FOR UPDATE` on the membership row, but if it somehow
  raced, `memberships_user_unique` fires `23505`), the exception unwinds the entire
  function: the old membership row and the old organization row are restored, and the
  invite stays unconsumed.
- There is **no window** in which the caller belongs to neither org. They are in
  their original org right up to the commit that atomically swaps them into the new
  one. Failure = they stay exactly where they were.

The `FOR UPDATE` locks on the invite row and the caller's membership row serialize the
two realistic race pairs (two accepts of one token; accept vs. leave) so the happy
path never even reaches the unique-constraint fallback.

---

## Org-deletion cascade — what `delete from organizations` touches

FK actions defined above, walked through for `delete from public.organizations
where id = <org>`:

| Child table            | FK column | On delete    | Effect on org delete |
|------------------------|-----------|--------------|----------------------|
| `public.memberships`   | `org_id`  | **CASCADE**  | member rows removed  |
| `public.invites`       | `org_id`  | **CASCADE**  | that org's invites removed |
| `public.roles`         | `org_id`  | **CASCADE**  | that org's roles removed |

On the **dissolve path specifically**, precondition (2) guarantees the org has
**zero roles**, and we've already deleted the sole membership by hand, so the only
thing the org-delete cascade actually reaps is any dangling `invites` rows for that
solo org. Nothing else.

**Nothing candidate-facing is touched.** `videos` has **no** FK to `organizations` —
it links to `roles` via `role_id` and to `profiles` via `user_id`. Because a
dissolved org owns no roles, the `roles → videos` chain is never even exercised on
this path. `video_views`, `survey_responses`, and the consent columns on `videos`
(`signature_name`, `consented_at`, `terms_version`, `consent_accepted_at`) are
entirely untouched. (For completeness: in a *populated* org teardown — which we never
do here — `roles` cascade-deletes and `videos.role_id` follows whatever action that
FK carries; `api/video/[id]` already tolerates a null/missing `role_id` by falling
back to default brand colors.)

---

## Phase 10 — verification suite (seven tests)

Non-destructive: wrapped in `begin … rollback`. RLS only engages under a non-owner
role, so the RLS tests `set local role authenticated` (or `anon`) — **as `postgres`
you would never observe recursion or isolation failures because owner bypasses RLS.**
`auth.uid()` is driven by `request.jwt.claims`. Run the whole block as `postgres`.

```sql
begin;

-- ── Fixtures (built as postgres; RLS bypassed) ────────────────────────────────
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'solo@test.local'),   -- solo dissolver
  ('22222222-2222-2222-2222-222222222222', 'ownerA@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'ownerB@test.local'),
  ('44444444-4444-4444-4444-444444444444', 'solorole@test.local'); -- neg-check user
update public.profiles set account_type = 'employer'
  where id in ('11111111-1111-1111-1111-111111111111',
               '22222222-2222-2222-2222-222222222222',
               '33333333-3333-3333-3333-333333333333',
               '44444444-4444-4444-4444-444444444444');

-- Two orgs, one role each, one invite into org A (+ a second invite for the neg check).
insert into public.organizations (id, name, brand_color, accent_color) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Acme',   '#123456', '#654321'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Globex', '#0000ff', '#00ff00');
insert into public.memberships (org_id, user_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333');
insert into public.roles (id, org_id, employer_id, role_title, question_1) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '22222222-2222-2222-2222-222222222222', 'Engineer', 'Tell us about yourself'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   '33333333-3333-3333-3333-333333333333', 'Designer', 'Walk us through your portfolio');
insert into public.invites (org_id, token) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TESTTOKEN'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TESTTOKEN2');

-- ── Test 1 — RECURSION SMOKE TEST (run FIRST) ─────────────────────────────────
-- As an authenticated member, is_org_member() and a bare memberships select must
-- NOT raise 42P17. If the firebreak (Phase 3) is wrong, these throw.
select set_config('request.jwt.claims',
  json_build_object('sub','22222222-2222-2222-2222-222222222222')::text, true);
set local role authenticated;
do $$
begin
  perform public.is_org_member('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid);
  perform 1 from public.memberships;   -- exercises the memberships SELECT policy
  assert public.is_org_member('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid) is true,
    'FAIL T1: member of A should be true';
  assert public.is_org_member('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid) is false,
    'FAIL T1: non-member of B should be false';
  raise notice 'Test 1 PASS: no 42P17 recursion';
end $$;
reset role;

-- ── Test 2 — ANONYMOUS CANDIDATE PATH ─────────────────────────────────────────
-- After the rewrite + grant change, anon must still resolve a role with org brand.
set local role anon;
do $$
declare v record;
begin
  select * into v from public.get_recording_role(
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid);
  assert v.company_name = 'Acme',     'FAIL T2: org name not surfaced to anon';
  assert v.brand_color  = '#123456',  'FAIL T2: org brand_color not surfaced';
  assert v.accent_color = '#654321',  'FAIL T2: org accent_color not surfaced';
  assert v.role_title   = 'Engineer', 'FAIL T2: role_title not returned';
  raise notice 'Test 2 PASS: anon get_recording_role returns role + org brand';
end $$;
reset role;

-- ── Test 3 — CROSS-ORG ISOLATION ──────────────────────────────────────────────
-- Member of A must see ONLY org A's roles/orgs/memberships/invites, never B's.
select set_config('request.jwt.claims',
  json_build_object('sub','22222222-2222-2222-2222-222222222222')::text, true);
set local role authenticated;
do $$
begin
  assert (select count(*) from public.roles)         = 1, 'FAIL T3: sees other org roles';
  assert (select count(*) from public.organizations) = 1, 'FAIL T3: sees other orgs';
  assert (select count(*) from public.memberships)   = 1, 'FAIL T3: sees other memberships';
  assert (select count(*) from public.invites)       = 2, 'FAIL T3: sees other org invites';
  assert not exists (select 1 from public.roles
                     where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'),
    'FAIL T3: org B role leaked to org A member';
  raise notice 'Test 3 PASS: cross-org isolation holds';
end $$;
reset role;

-- ── Test 4 — create_org + leave last-member guard ─────────────────────────────
select set_config('request.jwt.claims',
  json_build_object('sub','11111111-1111-1111-1111-111111111111')::text, true);
set local role authenticated;
do $$
declare v_solo uuid; v_err text;
begin
  v_solo := public.create_org('Solo Co');
  assert v_solo is not null, 'FAIL T4: create_org returned null';
  assert (select org_id from public.memberships
          where user_id = '11111111-1111-1111-1111-111111111111') = v_solo,
    'FAIL T4: create_org did not add membership';
  begin
    perform public.leave_org();          -- sole member → must be blocked
    assert false, 'FAIL T4: last member was allowed to leave';
  exception when sqlstate '45002' then
    raise notice 'Test 4 PASS: create_org works; last-member leave blocked (45002)';
  end;
end $$;
reset role;

-- ── Test 5 — SOLO-DISSOLVE HAPPY PATH ─────────────────────────────────────────
-- Solo user (still in zero-role Solo Co from Test 4) accepts the invite into Acme.
set local role authenticated;   -- jwt still sub = 1111 from Test 4
do $$
declare v_solo uuid; v_after uuid; v_role record;
begin
  select org_id into v_solo from public.memberships
    where user_id = '11111111-1111-1111-1111-111111111111';

  perform public.accept_invite('TESTTOKEN');

  assert (select count(*) from public.organizations where id = v_solo) = 0,
    'FAIL T5: abandoned solo org was not dissolved';
  select org_id into v_after from public.memberships
    where user_id = '11111111-1111-1111-1111-111111111111';
  assert v_after = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'FAIL T5: user not moved into Acme';
  assert (select count(*) from public.memberships
          where user_id = '11111111-1111-1111-1111-111111111111') = 1,
    'FAIL T5: user has more than one membership';
  select * into v_role from public.get_recording_role(
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid);
  assert v_role.company_name = 'Acme', 'FAIL T5: Acme brand not visible after join';
  assert (select accepted_at is not null and
                 accepted_by = '11111111-1111-1111-1111-111111111111'
          from public.invites where token = 'TESTTOKEN'),
    'FAIL T5: invite not marked accepted';
  raise notice 'Test 5 PASS: solo -> invited -> accept -> old org dissolved -> in Acme';
end $$;
reset role;

-- ── Test 6 — NEGATIVE: dissolve must NOT fire when the solo org owns a role ────
-- User 4444 makes a solo org, then gets a role in it, then tries to accept.
select set_config('request.jwt.claims',
  json_build_object('sub','44444444-4444-4444-4444-444444444444')::text, true);
set local role authenticated;
do $$
declare v_solo uuid;
begin
  v_solo := public.create_org('Has Role Co');
  insert into public.roles (org_id, employer_id, role_title, question_1)
    values (v_solo, '44444444-4444-4444-4444-444444444444', 'PM', 'Why product?');
  begin
    perform public.accept_invite('TESTTOKEN2');
    assert false, 'FAIL T6: dissolve fired on an org that owns a role';
  exception when sqlstate '45001' then
    assert (select org_id from public.memberships
            where user_id = '44444444-4444-4444-4444-444444444444') = v_solo,
      'FAIL T6: user left their org despite refusal';
    assert (select accepted_at is null from public.invites where token = 'TESTTOKEN2'),
      'FAIL T6: invite consumed despite refusal';
    raise notice 'Test 6 PASS: role-owning solo org NOT dissolved (45001), user intact';
  end;
end $$;
reset role;

-- ── Test 7 — DUPLICATE-ACCEPT IS REJECTED ─────────────────────────────────────
-- The now-Acme user (1111) tries to accept the second Acme invite → already in
-- the destination org → 45001, and TESTTOKEN2 stays unconsumed.
select set_config('request.jwt.claims',
  json_build_object('sub','11111111-1111-1111-1111-111111111111')::text, true);
set local role authenticated;
do $$
begin
  begin
    perform public.accept_invite('TESTTOKEN2');
    assert false, 'FAIL T7: re-accept into same org was allowed';
  exception when sqlstate '45001' then
    assert (select accepted_at is null from public.invites where token = 'TESTTOKEN2'),
      'FAIL T7: invite consumed on a rejected re-accept';
    raise notice 'Test 7 PASS: re-accept into current org rejected (45001)';
  end;
end $$;
reset role;

rollback;   -- non-destructive
```

---

## Answers to your two questions

**Q1 — `invites` had no email column.** You're right that Stage 3 needs to send to
someone and the console needs to show who was invited. Fixed: `invites.email` (text,
nullable) is added in Phase 1 and written by `create_invite` (Phase 9b). Crucially
this is **informational only** — "email-match off" means *acceptance never compares
the accepter's email to `invites.email`*; possession of the token is sufficient.
Storing the address and enforcing it are separate concerns, and only the former is
turned on.

**Q2 — per-person terms acceptance.** Confirmed: the acceptance record stays on
`profiles` — `employer_terms_accepted_at` / `employer_terms_version`, server-stamped
by the `stamp_employer_terms` trigger, written today at employer signup
(`employers/signup/page.js:64`). It is **per-user**, so `memberships` needs no terms
columns and this runbook adds none. Stage 3 keeps writing `employer_terms_version` on
the user's own `profiles` row — including for an invited teammate at the moment they
accept and become an employer, which is a Stage 3 (application) concern; the trigger
already supplies the authoritative timestamp.

---

## Run order summary

0 wipe → 1 create tables → 2 roles.org_id → **3 is_org_member (firebreak)** →
4 RLS policies incl. roles cutover → 5 backfill → 6 constraints + employer_id demote
→ **7 rewrite get_recording_role (byte-identical sig + revoke/grant)** →
**8 drop brand columns (breaks console; deploy Stage 3 now)** →
9 membership functions → 10 verify (7 tests).
