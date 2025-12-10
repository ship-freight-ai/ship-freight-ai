-- Create contact_submissions table
create table if not exists public.contact_submissions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new', -- new, read, archived
  ip_address text
);

-- Enable RLS
alter table public.contact_submissions enable row level security;

-- Policies
-- Allow anyone (public/anon) to insert submissions
create policy "Allow public submissions"
  on public.contact_submissions
  for insert
  with check (true);

-- Only allow admins (service_role) to read/update/delete? 
-- For now, maybe allow authenticated users to see their own if we linked them, but this is a generic contact form.
-- We'll restrict select/update to service_role or admin for now to be safe.
-- (No select policy for public means they can't see what they submitted after the fact via API, which is fine)
