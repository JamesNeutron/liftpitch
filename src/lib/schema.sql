-- profiles: one row per authenticated user
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text,
  plan        text not null default 'free' check (plan in ('free', 'pro', 'lifetime')),
  scripts_used integer not null default 0,
  videos_used  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);


-- videos: pitch videos created by users
create table videos (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  verification_hash text,
  share_link        text,
  filename          text,       -- R2 storage key  e.g. "<user-id>/<timestamp>.webm"
  r2_url            text,       -- public URL served from R2 / CDN
  company_name      text,
  role_name         text,
  created_at        timestamptz not null default now()
);

alter table videos enable row level security;

-- Anyone with the UUID link can watch the video (public shareable links)
create policy "Anyone can view videos"
  on videos for select
  using (true);

-- Keep the owner-only write policies below unchanged
create policy "Users can view own videos"
  on videos for select
  using (auth.uid() = user_id);

create policy "Users can insert own videos"
  on videos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own videos"
  on videos for update
  using (auth.uid() = user_id);

create policy "Users can delete own videos"
  on videos for delete
  using (auth.uid() = user_id);


-- video_views: tracking views on shared video links (public inserts, owner reads)
create table video_views (
  id                      uuid primary key default gen_random_uuid(),
  video_id                uuid not null references videos(id) on delete cascade,
  viewed_at               timestamptz not null default now(),
  viewer_ip               text,
  watch_duration_seconds  integer
);

alter table video_views enable row level security;

create policy "Video owners can view their video views"
  on video_views for select
  using (
    exists (
      select 1 from videos
      where videos.id = video_views.video_id
        and videos.user_id = auth.uid()
    )
  );

-- Allow unauthenticated inserts so public viewers can be tracked
create policy "Anyone can log a video view"
  on video_views for insert
  with check (true);


-- survey_responses: post-video survey data (no user account required)
create table survey_responses (
  id              uuid primary key default gen_random_uuid(),
  email           text,
  situation       text,
  referral_source text,
  created_at      timestamptz not null default now()
);

alter table survey_responses enable row level security;

-- Only authenticated users (e.g. admins) can read survey responses
create policy "Authenticated users can view survey responses"
  on survey_responses for select
  using (auth.role() = 'authenticated');

-- Anyone can submit a survey response
create policy "Anyone can submit a survey response"
  on survey_responses for insert
  with check (true);


-- Auto-create a profiles row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
