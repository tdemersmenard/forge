create table agents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  business_name text,
  sector text,
  services text,
  tone text,
  language text,
  phone text,
  twilio_account_sid text,
  twilio_auth_token text,
  facebook_page_id text,
  created_at timestamp with time zone default now()
);

create table conversations (
  id uuid default gen_random_uuid() primary key,
  agent_id uuid references agents on delete cascade,
  contact_name text,
  contact_phone text,
  contact_email text,
  last_message text,
  role text default 'user',
  status text default 'new',
  revenue numeric default 0,
  created_at timestamp with time zone default now()
);

alter table agents enable row level security;
alter table conversations enable row level security;

create policy "Users can only access their own agents"
  on agents for all using (auth.uid() = user_id);

create policy "Users can only access their own conversations"
  on conversations for all using (
    agent_id in (select id from agents where user_id = auth.uid())
  );
