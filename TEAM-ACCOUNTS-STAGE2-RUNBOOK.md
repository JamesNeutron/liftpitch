# LiftPitch Team Accounts — Stage 2 Database Migration Runbook

**Scope:** database layer only. No application code changes here — Stage 3 rewires
the console/API to the new shape and follows closely (Phase 7 intentionally breaks
the deployed console; see the ordering note).

**Reconstructed** from the settled decisions + the live schema as evidenced by the
code. The one value to double-check against the existing DB before running Phase 6
is the exact `RETURNS TABLE(...)` signature of `get_recording_role` (its body lives
in Supabase, not the repo).

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
- Invite email-match **off**. Member removal **self-leave only**, WITH the
  `org_member_count` last-member guard.
- **Multi-org membership prevented** via `UNIQUE (memberships.user_id)`. Contention
  surfaces as `SQLSTATE 45001` / `HINT ALREADY_IN_ORG`.
- Full wipe of test data authorized; no real accounts exist.
- **Ordering:** rewrite `get_recording_role` (Phase 6) BEFORE dropping the `roles`
  brand columns (Phase 7).

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

## Phase 1 — organizations

The org is the brand home and the future billing anchor.

```sql
create table public.organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text,                              -- company name captured at signup
  brand_color  text not null default '#0A66C2',   -- DEFAULT_BRAND_COLOR
  accent_color text not null default '#1A1A2E',   -- DEFAULT_ACCENT_COLOR
  created_at   timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- Members can read their own org; writes go through SECURITY DEFINER functions
-- (create_org / brand save in Stage 3), so no direct INSERT/UPDATE policy here.
create policy "Members can view their organization"
  on public.organizations for select
  using (
    exists (select 1 from public.memberships m
            where m.org_id = organizations.id and m.user_id = auth.uid())
  );
```

---

## Phase 2 — memberships (flat, one org per user)

```sql
create table public.memberships (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  user_id    uuid not null references public.profiles(id)      on delete cascade,
  created_at timestamptz not null default now(),
  -- One org per user. This is what makes an invited solo user hit the dead-end
  -- that Phase 8's accept_invite dissolve resolves.
  constraint memberships_user_unique unique (user_id)
);

alter table public.memberships enable row level security;

-- A user can see the membership rows of their own org (the teammate list).
create policy "Members can view co-members"
  on public.memberships for select
  using (
    org_id in (select m.org_id from public.memberships m where m.user_id = auth.uid())
  );
-- No direct INSERT/DELETE policy: join/leave go through SECURITY DEFINER functions.
```

---

## Phase 3 — invites (email-match off)

No email column — the token alone grants entry.

```sql
create table public.invites (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by  uuid references public.profiles(id) on delete set null,
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.invites enable row level security;

-- Org members can see/create their org's invites (creation via a definer fn in
-- Stage 3; a scoped SELECT is convenient for the console list).
create policy "Members can view their org invites"
  on public.invites for select
  using (
    org_id in (select m.org_id from public.memberships m where m.user_id = auth.uid())
  );
```

Acceptance is **not** a table policy — it goes through `accept_invite` (Phase 8),
which is the only thing allowed to move a user between orgs.

---

## Phase 4 — link roles to an org

Add `org_id` now; the denormalized brand columns stay until Phase 7 so nothing
breaks between here and the `get_recording_role` rewrite.

```sql
alter table public.roles
  add column org_id uuid references public.organizations(id) on delete cascade;

create index roles_org_id_idx on public.roles (org_id);
```

`ON DELETE CASCADE` matters for the cascade walkthrough (Phase 8): deleting an org
deletes its roles. We only ever dissolve **zero-role** orgs, so this branch never
actually fires on the dissolve path — but it's the correct semantics for a real org
teardown later.

---

## Phase 5 — backfill (one org per existing employer)

Idempotent; safe to run even after the Phase 0 wipe (it simply finds nothing).

```sql
-- 1. One org per employer profile, seeded from the profile's current brand.
insert into public.organizations (name, brand_color, accent_color)
select p.company_name,
       coalesce(p.brand_color, '#0A66C2'),
       coalesce(p.accent_color, '#1A1A2E')
from public.profiles p
where p.account_type = 'employer'
  and not exists (select 1 from public.memberships m where m.user_id = p.id);

-- NOTE: the insert above doesn't record which employer it belongs to, so do the
-- membership + role stamping via a correlated pass instead. Simpler, explicit form:
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
      values (r.company_name, coalesce(r.brand_color,'#0A66C2'),
              coalesce(r.accent_color,'#1A1A2E'))
      returning id into v_org;
    insert into public.memberships (org_id, user_id) values (v_org, r.uid);
    update public.roles set org_id = v_org where employer_id = r.uid;
  end loop;
end $$;
```

(If you ran the bare `insert ... select` first, delete those orphan org rows before
the `do` block, or skip the bare insert — the `do` block is self-sufficient.)

Verify no role is left unlinked before Phase 6:

```sql
select count(*) from public.roles where org_id is null;  -- must be 0
```

---

## Phase 6 — rewrite get_recording_role to join organizations

**Run this BEFORE Phase 7.** The function body is `LANGUAGE sql`; rewriting it to
stop referencing the `roles` brand columns first means the Phase 7 `DROP COLUMN`
has no live dependency to trip over.

```sql
create or replace function public.get_recording_role(role_id uuid)
returns table (
  id           uuid,
  company_name text,
  role_title   text,
  question_1   text,
  question_2   text,
  brand_color  text,
  accent_color text
)
language sql
security definer
set search_path = public
as $$
  select r.id,
         o.name          as company_name,   -- was r.company_name
         r.role_title,
         r.question_1,
         r.question_2,
         o.brand_color,                      -- was r.brand_color
         o.accent_color                      -- was r.accent_color
  from public.roles r
  join public.organizations o on o.id = r.org_id
  where r.id = get_recording_role.role_id;
$$;

grant execute on function public.get_recording_role(uuid) to anon, authenticated;
```

The three brand consumers (`/r`, `get-upload-url`, `register-video`) keep reading
`company_name/brand_color/accent_color` off the returned row — column names are
unchanged, only their source moves from the role to its org. `api/video/[id]` still
reads `roles.brand_color/accent_color` directly until Stage 3 flips it to join the
org; that's why Phase 7's drop is what forces Stage 3, not this phase.

---

## Phase 7 — drop denormalized brand (BREAKS deployed console; Stage 3 follows)

```sql
alter table public.roles   drop column company_name;
alter table public.roles   drop column brand_color;
alter table public.roles   drop column accent_color;
-- Employer-level brand moves to organizations too:
alter table public.profiles drop column company_name;
alter table public.profiles drop column brand_color;
alter table public.profiles drop column accent_color;
```

After this, the deployed console (`console/page.js` reads `profiles.brand_color`
etc. and writes `roles.brand_color` fan-out) and `api/video/[id]` (reads
`roles.brand_color`) are broken until Stage 3 repoints them at `organizations`.
This is expected and sequenced — do Phase 7 immediately before deploying Stage 3.

---

## Phase 8 — membership functions (create / leave / accept-with-dissolve)

### 8a. create_org — signup (company name only)

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

### 8b. leave_org — self-leave only, with last-member guard

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
  -- allowed as a side effect of accepting an invite (8c) — never as a bare leave.
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

### 8c. accept_invite — with abandoned-solo-org dissolve (THE FIX)

The dead-end: a user who signs up solo (creating a solo org) then gets invited can
neither **join** the new org (blocked by `memberships_user_unique`) nor **leave**
their own (blocked by the last-member guard in 8b). `accept_invite` resolves it by
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

- If the `insert into memberships` fails (e.g. a concurrent `accept_invite`
  already placed the caller into a different org between our lock acquisition and
  insert — in practice prevented by the `FOR UPDATE` on the membership row, but if
  it somehow raced, `memberships_user_unique` fires `23505`), the exception
  unwinds the entire function: the old membership row and the old organization row
  are restored, and the invite stays unconsumed.
- There is **no window** in which the caller belongs to neither org. They are in
  their original org right up to the commit that atomically swaps them into the
  new one. Failure = they stay exactly where they were.

The `FOR UPDATE` locks on the invite row and the caller's membership row serialize
the two realistic race pairs (two accepts of one token; accept vs. leave) so the
happy path never even reaches the unique-constraint fallback.

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

**Nothing candidate-facing is touched.** `videos` has **no** FK to
`organizations` — it links to `roles` via `role_id` and to `profiles` via
`user_id`. Because a dissolved org owns no roles, the `roles → videos` chain is
never even exercised on this path. `video_views`, `survey_responses`, and the
consent columns on `videos` (`signature_name`, `consented_at`, `terms_version`,
`consent_accepted_at`) are entirely untouched. (For completeness: in a *populated*
org teardown — which we never do here — `roles` cascade-deletes and
`videos.role_id` follows whatever action that FK carries; `api/video/[id]` already
tolerates a null/missing `role_id` by falling back to default brand colors.)

---

## Phase 9 — verification test (solo → invited → accept → old org gone → in new org)

Non-destructive: wrapped in `begin … rollback`. Uses `set_config` to make
`auth.uid()` return each test subject within the transaction (the standard Supabase
impersonation trick). Run as `postgres` in the SQL editor.

```sql
begin;

-- Fixtures: two auth users; handle_new_user() auto-creates their profiles rows.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'solo@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'owner@test.local');

-- Mark both as employers (mirrors real signup).
update public.profiles set account_type = 'employer'
  where id in ('11111111-1111-1111-1111-111111111111',
               '22222222-2222-2222-2222-222222222222');

-- Owner builds the destination org, one role, and an invite.
insert into public.organizations (id, name, brand_color, accent_color)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Acme', '#123456', '#654321');
insert into public.memberships (org_id, user_id)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          '22222222-2222-2222-2222-222222222222');
insert into public.roles (id, org_id, employer_id, role_title, question_1)
  values ('cccccccc-cccc-cccc-cccc-cccccccccccc',
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          '22222222-2222-2222-2222-222222222222',
          'Engineer', 'Tell us about yourself');
insert into public.invites (org_id, token)
  values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'TESTTOKEN');

-- Solo user signs up solo: their own org, zero roles.
select set_config('request.jwt.claims',
  json_build_object('sub','11111111-1111-1111-1111-111111111111')::text, true);
select public.create_org('Solo Co');

do $$
declare
  v_solo_org  uuid;
  v_after_org uuid;
  v_solo_gone int;
  v_role      record;
begin
  -- Precondition: solo user is in their own, zero-role org.
  select org_id into v_solo_org from public.memberships
    where user_id = '11111111-1111-1111-1111-111111111111';
  assert v_solo_org is not null, 'solo user should have an org before accepting';
  assert (select count(*) from public.roles where org_id = v_solo_org) = 0,
    'solo org should have zero roles';

  -- Act: solo user accepts the invite (still impersonating solo via jwt claim).
  perform public.accept_invite('TESTTOKEN');

  -- 1. Old solo org is gone.
  select count(*) into v_solo_gone from public.organizations where id = v_solo_org;
  assert v_solo_gone = 0, 'FAIL: abandoned solo org was not dissolved';

  -- 2. Solo user is now a member of Acme (and only Acme).
  select org_id into v_after_org from public.memberships
    where user_id = '11111111-1111-1111-1111-111111111111';
  assert v_after_org = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'FAIL: user not moved into the destination org';
  assert (select count(*) from public.memberships
          where user_id = '11111111-1111-1111-1111-111111111111') = 1,
    'FAIL: user has more than one membership';

  -- 3. Acme's role + brand are visible through get_recording_role.
  select * into v_role from public.get_recording_role(
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid);
  assert v_role.company_name = 'Acme',    'FAIL: org name not surfaced';
  assert v_role.brand_color  = '#123456', 'FAIL: org brand_color not surfaced';
  assert v_role.accent_color = '#654321', 'FAIL: org accent_color not surfaced';
  assert v_role.role_title   = 'Engineer','FAIL: role not readable';

  -- 4. Invite consumed.
  assert (select accepted_at is not null and
                 accepted_by = '11111111-1111-1111-1111-111111111111'
          from public.invites where token = 'TESTTOKEN'),
    'FAIL: invite not marked accepted';

  raise notice 'PASS: solo -> invited -> accept -> old org dissolved -> in Acme with brand visible';
end $$;

rollback;   -- non-destructive
```

Optional negative check (dissolve must NOT fire when the solo org owns a role):
add a role to `Solo Co` before accepting and assert `accept_invite('TESTTOKEN')`
raises `SQLSTATE 45001` and leaves the user in Solo Co. Wrap in its own
`begin/rollback`.

---

## Run order summary

0 wipe → 1 organizations → 2 memberships → 3 invites → 4 roles.org_id →
5 backfill → **6 rewrite get_recording_role** → **7 drop brand columns (breaks
console; deploy Stage 3 now)** → 8 functions → 9 verify.
