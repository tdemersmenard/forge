-- T3: Lock billing/system columns from direct client updates
-- Run this in your Supabase SQL editor.
--
-- The RLS policy on `agents` uses `for all`, which includes UPDATE.
-- Without column-level grants, an authenticated user could update
-- billing fields (plan, stripe_*) via the anon key.
--
-- Strategy: revoke table-level UPDATE, then grant back only the
-- columns that users legitimately edit from the UI.

-- 1. Revoke table-level UPDATE from authenticated role
REVOKE UPDATE ON agents FROM authenticated;

-- 2. Grant UPDATE on user-editable columns only
--    (billing fields plan, stripe_customer_id, stripe_subscription_id
--     are intentionally omitted — they are only written by the Stripe
--     webhook via the service-role / admin client)
GRANT UPDATE (
  business_name,
  sector,
  services,
  tone,
  language,
  phone,
  twilio_account_sid,
  twilio_auth_token,
  facebook_page_id,
  agent_name,
  services_list,
  qualification_questions,
  disqualification_criteria,
  service_area,
  promotions,
  never_say,
  escalation_criteria,
  bilingual,
  business_hours,
  notifications_prefs
  -- contract_value: uncomment if this column is present and user-editable
  -- facebook_access_token: uncomment if this column is present
) ON agents TO authenticated;
