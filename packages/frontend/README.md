# @circufi/frontend

Next.js 16 (App Router) web app for CircuFi. See the [root README](../../README.md) for setup and deployment.

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev                  # http://localhost:3000
npm run build && npm start
```

| Path | Role |
|---|---|
| `app/` | Routes: `landing`, `auth/*`, `dashboard`, `circles/*`, `log-payment`, `payments/history`, `reputation`, `notifications`, `settings`, `profile/[userId]` |
| `components/ui` | Buttons, inputs (phone input accepts +234 and +237), cards, badges |
| `components/layout` | App shell and public navigation |
| `lib/api.ts` | Axios client: base URL, bearer token, automatic sign-out on 401 |
| `lib/types` | API-shaped TypeScript types |
| `stores/authStore.ts` | Persisted auth state (token + user) |

Pages call versioned paths such as `/v1/groups`; the API base URL therefore ends at `/api`.
