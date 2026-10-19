# @circufi/backend

Express + TypeScript REST API for CircuFi. See the [root README](../../README.md) for the product overview, configuration reference and the full endpoint list.

```bash
cp .env.example .env     # Firebase credentials, JWT secret, CORS origin
npm run dev              # ts-node on http://localhost:5000
npm test                 # Jest + Supertest, no Firebase needed
npm run build && npm start
```

| Path | Role |
|---|---|
| `src/app.ts` | Express app: CORS, JSON parsing, route mounting under `/api/v1`, error handling |
| `src/index.ts` | HTTP server, startup banner, Ollama health probe, graceful shutdown |
| `src/routes/` | One router per resource (auth, users, groups, contributions, reputation, chat, notifications) |
| `src/services/firebaseService.ts` | All Realtime Database access; initialised lazily on first use |
| `src/services/authService.ts` | Registration, OTP verification, JWT creation / verification |
| `src/services/reputationService.ts` | Trust score, circle health, reputation events |
| `src/services/ollamaAIService.ts` | Context-aware chat on top of Ollama |
| `tests/helpers/inMemoryFirebase.ts` | In-memory stand-in for the database layer used by the API tests |
