# Circufi - Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Node.js 18+
- Firebase account
- Ollama (optional, for AI features)

---

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
# From project root
npm install
```

### 2. Configure Backend
```bash
cd packages/backend

# Copy and edit environment file
cp .env.example .env
# Edit .env with your Firebase credentials
```

**Required .env variables:**
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
JWT_SECRET=change-this-to-random-string
```

### 3. Configure Frontend
```bash
cd packages/frontend

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" > .env.local
```

### 4. Start Everything
```bash
# Terminal 1: Backend
cd packages/backend
npm run dev

# Terminal 2: Frontend
cd packages/frontend
npm run dev
```

---

## 🌐 Access Points

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000
- **Backend Health:** http://localhost:5000/health
- **API Base:** http://localhost:5000/api/v1

---

## 🧪 Test the App

### 1. Sign Up
```
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Enter phone: +234701234567
4. Enter name: Test User
5. Click Sign Up
```

### 2. Verify
```
1. Enter code: 1234
2. Click Verify
3. Redirected to dashboard
```

### 3. Test Features
```
✅ Create a circle
✅ Add members
✅ Chat with AI
✅ View rotation
✅ Check health
✅ Log payment
✅ View history
```

---

## 📁 Key Files

### Backend
```
packages/backend/
├── .env              # Configuration
├── src/
│   ├── app.ts        # Express app
│   ├── routes/       # API endpoints
│   └── services/     # Business logic
```

### Frontend
```
packages/frontend/
├── .env.local        # Configuration
├── app/              # Pages
│   ├── auth/verify/
│   ├── circles/[id]/
│   │   ├── chat/
│   │   ├── members/
│   │   ├── rotation/
│   │   └── health/
│   ├── profile/[userId]/
│   └── payments/history/
├── lib/
│   └── api.ts        # API client
└── stores/
    └── authStore.ts  # Auth state
```

---

## 🔗 API Endpoints

### Auth
```
POST /v1/auth/register   - Sign up
POST /v1/auth/verify     - Verify OTP
POST /v1/auth/resend     - Resend OTP
```

### Users
```
GET    /v1/users/:id     - Get user profile
PUT    /v1/users/:id     - Update profile
```

### Groups (Circles)
```
POST   /v1/groups                - Create circle
GET    /v1/groups                - List circles
GET    /v1/groups/:id            - Circle details
GET    /v1/groups/:id/members    - List members
POST   /v1/groups/:id/members    - Add member
DELETE /v1/groups/:id/members/:userId - Remove member
GET    /v1/groups/:id/rotation   - Rotation info
GET    /v1/groups/:id/health     - Health metrics
```

### Contributions
```
POST /v1/contributions                - Log payment
GET  /v1/contributions/:groupId       - Group payments
GET  /v1/contributions/user/:userId   - User payments
POST /v1/contributions/:id/verify     - Verify payment
```

### Chat
```
POST /v1/chat/message    - Send AI message
GET  /v1/chat/sessions   - List sessions
```

---

## 🔧 Common Commands

### Development
```bash
# Backend
npm run dev          # Start dev server
npm run build        # Build for production
npm test             # Run tests

# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Lint code
```

### Troubleshooting
```bash
# Clear caches
rm -rf node_modules package-lock.json
npm install

# Check processes on ports
# Windows
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :5000
lsof -i :3000
```

---

## 📱 App Flow

```
1. Landing (/)
   ↓
2. Sign Up (/auth/signup)
   ↓
3. Verify OTP (/auth/verify)
   ↓
4. Dashboard (/dashboard)
   ↓
5. Create/Join Circle (/circles/create or /circles/join)
   ↓
6. Circle Details (/circles/[id])
   ├── Chat (/circles/[id]/chat)
   ├── Members (/circles/[id]/members)
   ├── Rotation (/circles/[id]/rotation)
   └── Health (/circles/[id]/health)
   ↓
7. Log Payment (/log-payment)
   ↓
8. View History (/payments/history)
```

---

## 🛡️ Authentication

**JWT Token Flow:**
```
1. User signs up → Receives userId
2. User verifies OTP → Receives JWT token
3. Token stored in Zustand state
4. All API calls include: Authorization: Bearer {token}
5. 401 response → Auto logout → Redirect to login
```

---

## 📊 Database Schema (Firebase)

```
/users
  /{userId}
    - displayName
    - phoneNumber
    - reputation { trustScore, onTimeRate, ... }
    - groupIds []

/groups
  /{groupId}
    - name
    - admin { userId, name }
    - rules { contributionAmount, frequency, ... }
    - members { [userId]: { role, status, ... } }
    - rotation { cycle, order[], currentBeneficiary }
    - stats { healthScore, totalCollected, ... }

/contributions
  /{contributionId}
    - groupId
    - paidBy { userId, displayName }
    - amount
    - status
    - isOnTime
```

---

## 🎯 Trust Score Algorithm

```
trustScore = 50 (base)
           + (onTimeRate * 0.3)
           + (min(totalPayments, 20) * 2)
           + (flags * -5)

Range: 0-100
```

---

## 🐛 Quick Fixes

### "Cannot connect to backend"
```bash
# Check backend is running
curl http://localhost:5000/health

# Check NEXT_PUBLIC_API_URL in .env.local
cat packages/frontend/.env.local
```

### "CORS error"
```bash
# Check CORS_ORIGIN in backend .env
# Should match frontend URL: http://localhost:3000
```

### "401 Unauthorized"
```bash
# Token expired or invalid
# Solution: Log in again
```

### "Port already in use"
```bash
# Change port in .env
PORT=5001  # Backend
# Or kill process using port
```

---

## 📚 Documentation

- **INTEGRATION_GUIDE.md** - Full integration guide
- **CHANGES_SUMMARY.md** - All changes made
- **README.md** - Project overview
- **SETUP_GUIDE.md** - Detailed setup

---

## ✅ Pre-Launch Checklist

- [ ] Backend running (http://localhost:5000)
- [ ] Frontend running (http://localhost:3000)
- [ ] Environment variables configured
- [ ] Firebase connected
- [ ] Can sign up and verify
- [ ] Can create circle
- [ ] Can add members
- [ ] AI chat working (if Ollama running)
- [ ] All pages accessible

---

## 🚢 Production Deployment

### Backend (Railway/Render)
```bash
1. Set all environment variables
2. npm run build
3. npm start
4. Note deployed URL
```

### Frontend (Vercel)
```bash
1. Set NEXT_PUBLIC_API_URL=https://your-backend.com/api/v1
2. vercel deploy --prod
```

---

## 💡 Pro Tips

1. **Use browser DevTools** - Network tab shows all API calls
2. **Check backend logs** - Errors appear in terminal
3. **Test with Postman** - Easier API testing
4. **Use test code 1234** - For OTP verification in development
5. **Clear browser cache** - If seeing old data

---

**Need Help?**
- Check INTEGRATION_GUIDE.md for detailed info
- Review CHANGES_SUMMARY.md for what changed
- Open browser DevTools for debugging

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** 2026-06-06
