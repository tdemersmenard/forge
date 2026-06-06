<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics across your Next.js 16.2.6 App Router project. The existing PostHog client setup in `src/app/providers.tsx` was enhanced with error tracking (`capture_exceptions: true`) and switched to the new reverse proxy (`/ingest`) for improved ad-blocker resilience. A server-side PostHog helper (`src/lib/posthog-server.ts`) was created to track critical business events in API routes. PostHog rewrites and updated CSP headers were added to `next.config.ts`. User identity is now linked at both login and signup, and `posthog.reset()` is called on logout.

| Event | Description | File |
|---|---|---|
| `user_logged_in` | User successfully authenticated via email/password | `src/app/login/page.tsx` |
| `exit_intent_popup_shown` | Exit intent popup triggered when cursor leaves browser | `src/app/components/ExitIntentPopup.tsx` |
| `exit_intent_email_submitted` | User submitted email in exit intent popup | `src/app/components/ExitIntentPopup.tsx` |
| `checkout_initiated` | User clicked Upgrade and was redirected to Stripe checkout | `src/app/dashboard/billing/BillingClient.tsx` |
| `billing_portal_opened` | User clicked Manage Subscription | `src/app/dashboard/billing/BillingClient.tsx` |
| `agent_settings_saved` | User saved a settings section (with `section` property) | `src/app/dashboard/settings/SettingsClient.tsx` |
| `checkout_session_created` | Server created a Stripe checkout session | `src/app/api/stripe/checkout/route.ts` |
| `subscription_activated` | Stripe webhook confirmed checkout complete | `src/app/api/stripe/webhook/route.ts` |
| `subscription_canceled` | Stripe webhook confirmed subscription deleted | `src/app/api/stripe/webhook/route.ts` |
| `agent_created` | Server successfully created a new AI agent | `src/app/api/agent/create/route.ts` |
| `email_captured` | Exit intent email saved server-side | `src/app/api/leads/email-capture/route.ts` |

Pre-existing events (`user_signed_up`, `landing_viewed`, `plan_selected`, `onboarding_step_viewed`, `onboarding_step_completed`, `subscription_started`) were left in place and not duplicated.

## Next steps

We've built a dashboard and 5 insights for you to keep an eye on user behavior:

- [Analytics basics dashboard](https://us.posthog.com/project/451882/dashboard/1661499)
- [Signups & Logins (30d)](https://us.posthog.com/project/451882/insights/6yadc0ub) — daily unique signups vs logins
- [Subscription conversion funnel](https://us.posthog.com/project/451882/insights/bszkt62r) — signup → plan selected → checkout → subscribed
- [New subscriptions (30d)](https://us.posthog.com/project/451882/insights/KhgQoKX3) — total activations from Stripe webhook
- [Subscription cancellations (30d)](https://us.posthog.com/project/451882/insights/4iTYQv4Z) — churn events from Stripe webhook
- [Product engagement: agents & settings](https://us.posthog.com/project/451882/insights/3tn5tECY) — agent creation and settings saves

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
