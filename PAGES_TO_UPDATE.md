# Pages Requiring Backend API Integration

## ⚠️ CRITICAL FINDING

Many frontend pages are currently using **MOCK DATA** instead of connecting to the backend API. These pages need to be updated to use the `api` client from `lib/api.ts`.

---

## 🔴 Pages Using Mock Data (MUST UPDATE)

### 1. **`/auth/login`** (`app/auth/login/page.tsx`)
**Current:** Uses mock authentication, hardcoded timeout
**Needs:**
- Connect to `POST /v1/auth/register` (to send OTP)
- Connect to `POST /v1/auth/verify` (to verify OTP)
- Store JWT token using `useAuthStore`

### 2. **`/auth/signup`** (`app/auth/signup/page.tsx`)
**Current:** Redirects to `/onboarding` without backend call
**Needs:**
- Connect to `POST /v1/auth/register`
- Redirect to `/auth/verify?phone={phoneNumber}`

### 3. **`/dashboard`** (`app/dashboard/page.tsx`)
**Current:** Uses `DEMO_CIRCLES` and `DEMO_ACTIVITY` from `lib/data.ts`
**Needs:**
- Fetch user's circles: `GET /v1/groups`
- Fetch recent activity: `GET /v1/contributions/user/:userId`
- Fetch user profile for greeting: `GET /v1/users/:userId`

### 4. **`/circles/create`** (`app/circles/create/page.tsx`)
**Current:** Fake creation, redirects to hardcoded circle ID
**Needs:**
- Connect to `POST /v1/groups`
- Properly send all form data to backend
- Redirect to actual created circle ID

### 5. **`/circles/[id]`** (`app/circles/[id]/page.tsx`)
**Current:** Uses `DEMO_CIRCLES` and `DEMO_ACTIVITY`
**Needs:**
- Fetch circle details: `GET /v1/groups/:id`
- Fetch contributions: `GET /v1/contributions/:groupId`
- Fetch members: `GET /v1/groups/:id/members`

### 6. **`/circles/join`** (`app/circles/join/page.tsx`)
**Current:** Unknown (not checked yet)
**Needs:**
- Connect to `POST /v1/groups/:id/members`

### 7. **`/log-payment`** (`app/log-payment/page.tsx`)
**Current:** Unknown (not checked yet)
**Needs:**
- Connect to `POST /v1/contributions`

### 8. **`/notifications`** (`app/notifications/page.tsx`)
**Current:** Unknown (not checked yet)
**Needs:**
- Fetch notifications: `GET /v1/notifications` (if endpoint exists)

### 9. **`/reputation`** (`app/reputation/page.tsx`)
**Current:** Unknown (not checked yet)
**Needs:**
- Fetch reputation: `GET /v1/reputation/:userId`
- Fetch reputation events: `GET /v1/reputation/:userId/events`

### 10. **`/settings`** (`app/settings/page.tsx`)
**Current:** Unknown (not checked yet)
**Needs:**
- Fetch user profile: `GET /v1/users/:userId`
- Update profile: `PUT /v1/users/:userId`

---

## ✅ Pages Already Connected to Backend

1. **`/auth/verify`** - ✅ Properly connected
2. **`/profile/[userId]`** - ✅ Properly connected
3. **`/circles/[id]/chat`** - ✅ Properly connected
4. **`/circles/[id]/members`** - ✅ Properly connected
5. **`/circles/[id]/rotation`** - ✅ Properly connected
6. **`/circles/[id]/health`** - ✅ Properly connected
7. **`/payments/history`** - ✅ Properly connected

---

## 📋 Action Items

### Immediate Priority (Critical for Auth Flow)
1. **Fix `/auth/login`** - Currently broken, doesn't actually authenticate
2. **Fix `/auth/signup`** - Doesn't create user in backend
3. **Fix `/dashboard`** - Shows fake data after login

### High Priority (Core Functionality)
4. **Fix `/circles/create`** - Can't actually create circles
5. **Fix `/circles/[id]`** - Shows fake circle data
6. **Fix `/log-payment`** - Can't log actual payments

### Medium Priority
7. **Fix `/circles/join`**
8. **Fix `/notifications`**
9. **Fix `/reputation`**
10. **Fix `/settings`**

---

## 🔧 How to Fix Each Page

### Pattern to Follow:

```typescript
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

export default function YourPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const response = await api.get('/v1/your-endpoint')
            if (response.data.success) {
                setData(response.data.data)
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to load')
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (payload) => {
        setError('')
        setLoading(true)
        try {
            const response = await api.post('/v1/your-endpoint', payload)
            if (response.data.success) {
                // Handle success
                router.push('/success-page')
            }
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Action failed')
        } finally {
            setLoading(false)
        }
    }

    // ... rest of component
}
```

---

## 🚨 Impact Analysis

**Without these fixes:**
- ✅ Users can sign up → ❌ BUT data not saved to backend
- ❌ Users can't actually log in (mock auth only)
- ❌ Dashboard shows fake data
- ❌ Creating circles doesn't work
- ❌ Can't log real payments
- ❌ All data is client-side only

**Current State:**
- Frontend looks beautiful ✅
- Backend API is ready ✅
- **But they're NOT connected** ❌

---

## 📝 Recommended Fix Order

1. **Phase 1: Critical Auth** (1-2 hours)
   - Fix `/auth/login`
   - Fix `/auth/signup`
   - Test end-to-end auth flow

2. **Phase 2: Core Features** (2-3 hours)
   - Fix `/dashboard`
   - Fix `/circles/create`
   - Fix `/circles/[id]`
   - Fix `/log-payment`

3. **Phase 3: Remaining** (1-2 hours)
   - Fix all other pages
   - Final integration testing

**Total estimated time: 4-7 hours**

---

## ✅ Verification Checklist

After fixes, test:
- [ ] Sign up creates user in Firebase
- [ ] Login actually authenticates
- [ ] Dashboard shows real user's circles
- [ ] Can create real circle
- [ ] Can view real circle details
- [ ] Can log real payment
- [ ] All pages fetch real data
- [ ] No mock data remaining

---

**Status:** 🔴 **CRITICAL - Immediate Action Required**

The frontend is beautiful but non-functional without these API connections.

**Last Updated:** 2026-06-06
