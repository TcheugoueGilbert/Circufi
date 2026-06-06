# Circufi Frontend-Backend Integration Guide

## 🔗 Overview

This guide explains how the Circufi frontend (Next.js) seamlessly connects with the backend (Express.js + Firebase).

---

## 📁 Project Structure

```
Circufi/
├── packages/
│   ├── backend/              # Express.js API Server
│   │   ├── src/
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── services/     # Business logic
│   │   │   ├── middleware/   # Auth & error handling
│   │   │   └── types.ts      # TypeScript types
│   │   └── .env              # Backend config
│   │
│   ├── frontend/             # Next.js 16 App
│   │   ├── app/              # Pages (App Router)
│   │   ├── components/       # React components
│   │   ├── lib/
│   │   │   └── api.ts        # ⭐ API client (Axios)
│   │   ├── stores/           # State management (Zustand)
│   │   └── .env.local        # Frontend config
│   │
│   └── shared/               # Shared types & utilities
│       └── src/
│           ├── types/
│           ├── constants/
│           └── utils/
```

---

## 🔌 Connection Architecture

### 1. API Client (`packages/frontend/lib/api.ts`)

The frontend uses a centralized Axios instance to communicate with the backend:

```typescript
// Base URL from environment variable
baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'

// Automatic JWT token injection
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Automatic logout on 401 (unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout()
            window.location.href = '/auth/login'
        }
        return Promise.reject(error)
    }
)
```

### 2. Backend API Routes (`packages/backend/src/app.ts`)

All routes are mounted under `/api/v1`:

```
/api/v1/auth          - Authentication
/api/v1/users         - User management
/api/v1/groups        - Circle/group operations
/api/v1/contributions - Payment tracking
/api/v1/reputation    - Trust scoring
/api/v1/chat          - AI assistant (Ollama)
```

---

## 🚀 Setup & Configuration

### Backend Setup

1. **Navigate to backend:**
   ```bash
   cd packages/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment (`.env`):**
   ```env
   # Server
   NODE_ENV=development
   PORT=5000

   # Firebase
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
   FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

   # JWT
   JWT_SECRET=your-super-secret-key-change-in-production
   JWT_EXPIRATION=7d

   # Ollama AI
   OLLAMA_API_URL=http://localhost:11434
   OLLAMA_MODEL=mistral
   OLLAMA_TEMPERATURE=0.7

   # CORS
   CORS_ORIGIN=http://localhost:3000
   API_VERSION=v1
   ```

4. **Start backend:**
   ```bash
   npm run dev
   ```
   Server runs on: `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend:**
   ```bash
   cd packages/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment (`.env.local`):**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
   ```

4. **Start frontend:**
   ```bash
   npm run dev
   ```
   App runs on: `http://localhost:3000`

---

## 🔐 Authentication Flow

### 1. User Registration

**Frontend → Backend:**
```typescript
// packages/frontend/app/auth/signup/page.tsx
const response = await api.post('/v1/auth/register', {
    phoneNumber: '+234701234567',
    displayName: 'John Doe',
    email: 'john@example.com'
})
```

**Backend Response:**
```json
{
    "success": true,
    "data": {
        "userId": "abc123",
        "verificationRequired": true,
        "message": "Verification code sent"
    }
}
```

### 2. OTP Verification

**Frontend → Backend:**
```typescript
// packages/frontend/app/auth/verify/page.tsx
const response = await api.post('/v1/auth/verify', {
    phoneNumber: '+234701234567',
    code: '1234'
})
```

**Backend Response:**
```json
{
    "success": true,
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "id": "abc123",
            "displayName": "John Doe",
            "phoneNumber": "+234701234567",
            "reputation": {
                "trustScore": 50,
                "onTimeRate": 0,
                "totalPayments": 0
            }
        }
    }
}
```

### 3. Token Storage

The JWT token is stored in Zustand state:

```typescript
// packages/frontend/stores/authStore.ts
const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    login: (token, user) => set({ token, user }),
    logout: () => set({ token: null, user: null }),
}))
```

### 4. Authenticated Requests

All subsequent API calls automatically include the JWT token:

```typescript
// Automatic via interceptor
api.get('/v1/groups')  // Header: Authorization: Bearer {token}
```

---

## 📡 API Integration Examples

### Fetch User Profile

```typescript
// packages/frontend/app/profile/[userId]/page.tsx
const response = await api.get(`/v1/users/${userId}`)
const user = response.data.data
```

### Create a Circle

```typescript
// packages/frontend/app/circles/create/page.tsx
const response = await api.post('/v1/groups', {
    name: 'Family Savings',
    description: 'Monthly family savings',
    rules: {
        contributionAmount: 10000,
        currency: 'NGN',
        frequency: 'monthly',
        nextPaymentDate: Date.now() + 7 * 24 * 60 * 60 * 1000
    }
})
```

### Log a Contribution

```typescript
// packages/frontend/app/log-payment/page.tsx
const response = await api.post('/v1/contributions', {
    groupId: 'group123',
    amount: 10000,
    currency: 'NGN',
    paymentMethod: 'mobile_money',
    paymentReference: 'REF123456',
    note: 'Payment for cycle 1'
})
```

### AI Chat Message

```typescript
// packages/frontend/app/circles/[id]/chat/page.tsx
const response = await api.post('/v1/chat/message', {
    groupId: 'group123',
    message: 'When is my payout?',
    sessionId: 'session123'
})
const aiResponse = response.data.data.message
```

---

## 🛡️ Error Handling

### Frontend Error Handling Pattern

```typescript
try {
    const response = await api.post('/v1/groups', data)
    if (response.data.success) {
        // Handle success
        router.push('/circles')
    }
} catch (err: any) {
    // Extract error message from backend response
    const errorMessage = err.response?.data?.error?.message || 'An error occurred'
    setError(errorMessage)
}
```

### Backend Error Response Format

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid phone number format",
        "statusCode": 400
    }
}
```

---

## 🎯 New Pages Built

All pages connect to backend via the API client:

1. **`/auth/verify`** - OTP verification → `POST /v1/auth/verify`
2. **`/profile/[userId]`** - User profile → `GET /v1/users/:userId`
3. **`/circles/[id]/chat`** - AI assistant → `POST /v1/chat/message`
4. **`/circles/[id]/members`** - Member management → `GET /v1/groups/:id/members`
5. **`/circles/[id]/rotation`** - Rotation view → `GET /v1/groups/:id/rotation`
6. **`/circles/[id]/health`** - Group health → `GET /v1/groups/:id/health`
7. **`/payments/history`** - Payment history → `GET /v1/contributions/user/:userId`

---

## 🧪 Testing the Integration

### 1. Start Both Servers

```bash
# Terminal 1: Backend
cd packages/backend
npm run dev

# Terminal 2: Frontend
cd packages/frontend
npm run dev
```

### 2. Verify Health Endpoints

```bash
# Backend health
curl http://localhost:5000/health

# API version
curl http://localhost:5000/api/version
```

### 3. Test Authentication Flow

1. Open `http://localhost:3000`
2. Click "Sign Up"
3. Enter phone: `+234701234567`
4. Enter name: `Test User`
5. Click "Sign Up" → redirects to `/auth/verify?phone=+234701234567`
6. Enter code: `1234` (test code)
7. Click "Verify" → redirects to `/dashboard`
8. Token is stored, all API calls now authenticated

### 4. Test API Calls

Open browser DevTools → Network tab to see:
- All requests go to `http://localhost:5000/api/v1/*`
- `Authorization: Bearer {token}` header is present
- Response format: `{ success: true/false, data: {...} }`

---

## 🔧 Troubleshooting

### CORS Errors

**Symptom:** Browser console shows CORS policy errors

**Fix:** Ensure backend `.env` has:
```env
CORS_ORIGIN=http://localhost:3000
```

### 401 Unauthorized

**Symptom:** API calls return 401, user logged out automatically

**Causes:**
- Invalid/expired JWT token
- Backend JWT_SECRET changed
- Token not in request headers

**Fix:**
- Log in again
- Check token in localStorage/Zustand state
- Verify JWT_SECRET matches between sessions

### Connection Refused

**Symptom:** `ERR_CONNECTION_REFUSED` or `ECONNREFUSED`

**Fix:**
- Ensure backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Verify no firewall blocking localhost

### API Returns 404

**Symptom:** `Cannot GET /api/groups`

**Fix:**
- Ensure frontend uses `/v1` in API calls
- Check `NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1`
- Verify route exists in `packages/backend/src/app.ts`

---

## 📦 Deployment

### Frontend (Vercel)

1. **Set environment variable:**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.com/api/v1
   ```

2. **Deploy:**
   ```bash
   cd packages/frontend
   vercel deploy --prod
   ```

### Backend (Railway/Render)

1. **Set environment variables:**
   - All `.env` variables
   - Ensure `CORS_ORIGIN` points to frontend URL

2. **Deploy:**
   ```bash
   cd packages/backend
   npm run build
   npm start
   ```

---

## 🔗 Key Integration Points

| Frontend Component | Backend Endpoint | Purpose |
|-------------------|------------------|---------|
| `app/auth/signup` | `POST /v1/auth/register` | User registration |
| `app/auth/verify` | `POST /v1/auth/verify` | OTP verification |
| `app/dashboard` | `GET /v1/groups` | List user's circles |
| `app/circles/[id]` | `GET /v1/groups/:id` | Circle details |
| `app/circles/[id]/chat` | `POST /v1/chat/message` | AI assistant |
| `app/log-payment` | `POST /v1/contributions` | Log contribution |
| `app/profile/[userId]` | `GET /v1/users/:userId` | User profile |
| `lib/api.ts` | All endpoints | Centralized HTTP client |
| `stores/authStore.ts` | JWT token storage | Authentication state |

---

## ✅ Verification Checklist

- [x] Backend runs on `http://localhost:5000`
- [x] Frontend runs on `http://localhost:3000`
- [x] `NEXT_PUBLIC_API_URL` includes `/v1`
- [x] CORS configured correctly
- [x] JWT token stored after login
- [x] API calls include `Authorization` header
- [x] 401 errors trigger logout
- [x] Error messages display from backend
- [x] All pages make correct API calls

---

## 📞 Support

For issues:
1. Check browser DevTools → Network tab
2. Check backend logs for errors
3. Verify environment variables
4. Ensure both servers are running
5. Test with `curl` to isolate frontend/backend issues

---

**Last Updated:** 2026-06-06
**Version:** 1.0.0

**Built with:** Next.js • Express • TypeScript • Firebase • Ollama
