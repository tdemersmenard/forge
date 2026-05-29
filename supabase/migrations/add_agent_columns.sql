-- Run this in your Supabase SQL editor to add new agent fields

alter table agents add column if not exists agent_name text;
alter table agents add column if not exists services_list jsonb;
alter table agents add column if not exists qualification_questions jsonb;
alter table agents add column if not exists disqualification_criteria text;
alter table agents add column if not exists service_area text;
alter table agents add column if not exists promotions text;
alter table agents add column if not exists never_say text;
alter table agents add column if not exists escalation_criteria text;
alter table agents add column if not exists bilingual boolean default false;
alter table agents add column if not exists business_hours jsonb;
