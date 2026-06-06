# Digital Osusu - Full Stack Platform

**AI-Powered Trust Infrastructure for Cooperative Savings**

> Digitizing traditional African rotating savings groups (osusu, ajo, esusu) with trust scoring, transparency, and AI-powered coordination.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Features](#features)
- [Core Concepts](#core-concepts)
- [API Documentation](#api-documentation)
- [AI Integration](#ai-integration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Project Overview

**Digital Osusu** is a full-stack web application that modernizes rotating savings groups by introducing:

- ✅ **Digital Coordination** - No more cash handling, all tracking is transparent
- ✅ **AI-Powered Trust** - Smart reputation scoring based on payment history
- ✅ **Smart Rotation** - Automated beneficiary management
- ✅ **Transparent Ledger** - Every contribution is logged and verified
- ✅ **AI Assistant** - Intelligent chat for group inquiries (using Ollama)

### MVP Scope
- Group creation & member management
- Contribution tracking & ledger
- Reputation profiles & trust scoring
- Payment coordination (P2P flow logging)
- AI assistant (Ollama integration)
- Mobile-responsive web interface

### Out of Scope (Post-MVP)
- Actual payment processing
- Advanced KYC/identity verification
- Offline mode / SMS fallback
- Insurance products or lending

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Frontend Layer                          │
│         (Next.js React SPA - Mobile Responsive)        │
│  - Group Dashboard, Member Management                  │
│  - Contribution Tracker, Reputation Profiles           │
│  - AI Chat Assistant                                   │
├─────────────────────────────────────────────────────────┤
│                Backend Layer                            │
│      (Node.js/Express + TypeScript)                     │
│  - REST API (Groups, Members, Contributions, etc.)     │
│  - Business Logic (Reputation Scoring, Validation)     │
│  - AI Orchestration (Ollama Integration)               │
├─────────────────────────────────────────────────────────┤
│               Data & AI Layer                           │
│  - Firebase Realtime DB (Primary)                      │
│  - Firebase Authentication                             │
│  - Ollama (Local LLM for AI)                          │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend**
- Next.js 14+ with React 18+
- TypeScript
- Tailwind CSS
- Zustand (state management)
- Axios (HTTP client)

**Backend**
- Node.js 18+
- Express.js
- TypeScript
- Firebase Admin SDK
- Zod (validation)
- Ollama (AI/LLM)

**Database**
- Firebase Realtime Database
- Firebase Authentication

**Deployment**
- Frontend: Vercel / Netlify
- Backend: Firebase Cloud Functions / Railway / Render

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account
- Ollama (for AI features)

### Installation

#### 1. Clone & Setup
```bash
git clone <repo-url>
cd Circufi-project_V3
```

#### 2. Backend Setup
```bash
cd backend
cp .env.example .env

# Edit .env with your Firebase credentials
nano .env

npm install
npm run dev
```

#### 3. Frontend Setup
```bash
cd ../frontend
cp .env.example .env.local

# The backend URL should point to your local/deployed backend
nano .env.local

npm install
npm run dev
```

#### 4. Start Ollama (for AI features)
```bash
# In a separate terminal
ollama serve

# In another terminal
ollama pull mistral
```

### Verification
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Backend Health: http://localhost:5000/health
- AI Service: http://localhost:5000/api/v1/chat/health

## 📁 Project Structure

```
Circufi-project_V3/
├── frontend/                          # Next.js Frontend
│   ├── app/                           # Next.js app directory
│   │   ├── page.tsx                   # Home page
│   │   ├── layout.tsx                 # Root layout
│   │   ├── auth/                      # Auth pages
│   │   ├── dashboard/                 # Dashboard
│   │   ├── circles/                   # Group management
│   │   ├── notifications/             # Notifications
│   │   └── ...                        # Other pages
│   ├── components/                    # Reusable components
│   │   ├── auth/                      # Auth components
│   │   ├── circles/                   # Circle components
│   │   ├── ui/                        # UI components
│   │   └── layout/                    # Layout components
│   ├── lib/                           # Utilities
│   │   ├── api.ts                     # API client
│   │   ├── hooks.ts                   # React hooks
│   │   └── types/                     # TypeScript types
│   ├── stores/                        # Zustand stores
│   ├── public/                        # Static files
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── README.md
│
├── backend/                           # Express Backend
│   ├── src/
│   │   ├── index.ts                   # Server entry point
│   │   ├── app.ts                     # Express app
│   │   ├── types.ts                   # TypeScript interfaces
│   │   ├── services/
│   │   │   ├── firebaseService.ts    # Firebase operations
│   │   │   ├── authService.ts         # Auth logic
│   │   │   ├── reputationService.ts  # Reputation scoring
│   │   │   └── ollamaAIService.ts    # AI integration
│   │   ├── routes/
│   │   │   ├── authRoutes.ts          # Auth endpoints
│   │   │   ├── userRoutes.ts          # User endpoints
│   │   │   ├── groupRoutes.ts         # Group endpoints
│   │   │   ├── contributionRoutes.ts # Contribution endpoints
│   │   │   ├── reputationRoutes.ts   # Reputation endpoints
│   │   │   └── chatRoutes.ts         # Chat endpoints
│   │   ├── middleware/
│   │   │   ├── auth.ts               # Auth middleware
│   │   │   └── errorHandler.ts       # Error handling
│   │   └── utils/
│   │       └── helpers.ts            # Helper functions
│   ├── tests/                         # Test files
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── .env.example
│   └── README.md
│
├── documents/
│   └── TECHNICAL_SPEC.md             # Full technical specification
│
└── README.md                          # This file
```

## ✨ Features

### 1. **User Management**
- Phone number-based registration
- OTP verification (mock SMS in MVP)
- User profiles with trust scores
- Profile customization (name, email, reference contact)

### 2. **Group Management (Osusu Circles)**
- Create groups with custom rules
- Invite members to groups
- Set contribution amounts and frequency
- Define minimum trust score requirements
- View member list and roles
- Admin controls for group settings

### 3. **Contribution Tracking**
- Log payment contributions
- Multiple payment methods (manual, mobile money, bank transfer)
- Contribution verification by admin
- Payment status tracking
- On-time payment calculation

### 4. **Reputation & Trust Scoring**
- Automatic trust score calculation
- On-time payment rate tracking
- Flag system for late/missed payments
- Reputation event history
- Group health score calculation
- Member reliability ranking

### 5. **Smart Rotation**
- Automatic beneficiary assignment
- Rotation order management
- Payment progress tracking
- Cycle advancement automation
- Immutable rotation history

### 6. **AI Chat Assistant**
- Intelligent responses using Ollama
- Context-aware answers about:
  - Payment schedules
  - Trust scores and member reliability
  - Contribution history
  - Group health and status
- Session-based conversation history
- Real-time context injection

### 7. **Real-time Coordination**
- Current beneficiary display
- Next payment date tracking
- Member payment status
- Group notification system

## 🧮 Core Concepts

### Trust Score Algorithm
```
trustScore = 50 (base) 
           + (onTimeRate * 0.3) 
           + (min(totalPayments, 20) * 2) 
           + (numberOfFlags * -5)

Range: 0-100
```

**Example Calculation:**
- Base score: 50
- On-time rate: 80% → +24
- Total payments: 10 → +20
- Flags: 2 → -10
- **Final score: 84 (Trusted)**

### Group Health Score
```
healthScore = (memberAverageTrustScore * 0.6) 
            + (paymentCompletionRate * 0.4)

Range: 0-100
```

### Reputation Events
- `payment_on_time` (+5) - Payment made on schedule
- `payment_late` (-3) - Payment made after deadline
- `payment_missed` (-10) - Payment not made
- `dispute_resolved` (+2) - Dispute settled
- `verified` (+3) - User verification completed
- `flagged` (-5) - User flagged for violation

### Rotation Logic
1. Group created with initial member list
2. Rotation order defined (usually FIFO)
3. First member becomes beneficiary for cycle 1
4. Other members contribute to beneficiary
5. Once all contribute, rotation advances
6. Next member becomes beneficiary for cycle 2
7. Repeats until all members have received

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
```
Authorization: Bearer {jwt_token}
```

### Authentication Endpoints
```
POST   /auth/register       # Register new user
POST   /auth/verify         # Verify with OTP
POST   /auth/resend         # Resend OTP
```

### User Endpoints
```
GET    /users/:userId       # Get user profile
PUT    /users/:userId       # Update user profile
```

### Group Endpoints
```
POST   /groups              # Create group
GET    /groups              # List user's groups
GET    /groups/:id          # Get group details
PUT    /groups/:id          # Update group
POST   /groups/:id/members  # Add member
DELETE /groups/:id/members/:userId # Remove member
GET    /groups/:id/health   # Group health score
GET    /groups/:id/rotation # Rotation details
```

### Contribution Endpoints
```
POST   /contributions                  # Log contribution
GET    /contributions/:groupId         # Get group contributions
GET    /contributions/user/:userId     # Get user contributions
PUT    /contributions/:id              # Update contribution
POST   /contributions/:id/verify       # Verify (admin)
```

### Reputation Endpoints
```
GET    /reputation/:userId            # Get reputation profile
GET    /reputation/:userId/events     # Get reputation events
```

### Chat/AI Endpoints
```
POST   /chat/message                   # Send message
GET    /chat/sessions                  # List sessions
GET    /chat/sessions/:id              # Get session details
GET    /chat/health                    # Check AI service
```

## 🤖 AI Integration (Ollama)

### Setup Ollama
```bash
# Download and install from https://ollama.ai

# Start Ollama service
ollama serve

# In another terminal, pull a model
ollama pull mistral

# Optional: Other models
ollama pull neural-chat
ollama pull orca-mini
```

### Configuration
Add to `.env`:
```
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=mistral
OLLAMA_TEMPERATURE=0.7
```

### System Prompt
The AI has full context of:
- User reputation and payment history
- Group details and member information
- Current rotation and beneficiary
- Recent events and flags

### Example Queries
- "When's my payout?"
- "Is [member] trustworthy?"
- "How much have I paid total?"
- "Why was I flagged?"
- "What's the group's health?"

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Files
- `tests/services/reputation.test.ts` - Reputation scoring
- `tests/api/auth.test.ts` - Authentication API

### Manual Testing Flow
1. **Register**: Create account with phone number
2. **Verify**: Enter verification code
3. **Create Group**: As admin, create a new osusu circle
4. **Add Members**: Invite other users
5. **Log Contribution**: Make payment contribution
6. **Verify Contribution**: As admin, verify payment
7. **Check Reputation**: View trust scores
8. **Chat with AI**: Ask questions about group
9. **View Rotation**: Check current beneficiary

## 🚢 Deployment

### Frontend Deployment (Vercel)
```bash
cd frontend

# Connect your Git repository to Vercel
# Environment variables:
# - REACT_APP_API_URL=https://api.yourdomain.com

vercel deploy --prod
```

### Backend Deployment (Railway/Render)
```bash
cd backend

# Set environment variables:
# - FIREBASE_PROJECT_ID
# - FIREBASE_PRIVATE_KEY
# - FIREBASE_CLIENT_EMAIL
# - FIREBASE_DATABASE_URL
# - JWT_SECRET
# - OLLAMA_API_URL (for Ollama provider)

# Deploy using your provider's CLI
```

### Environment Variables Checklist
```
✓ FIREBASE_PROJECT_ID
✓ FIREBASE_PRIVATE_KEY
✓ FIREBASE_CLIENT_EMAIL
✓ FIREBASE_DATABASE_URL
✓ JWT_SECRET (strong random string)
✓ JWT_EXPIRATION
✓ OLLAMA_API_URL
✓ OLLAMA_MODEL
✓ CORS_ORIGIN
✓ NODE_ENV=production
```

## 🔐 Security Best Practices

### Implemented
- JWT token-based authentication
- Phone number validation
- CORS protection
- Input validation (Zod)
- Error handling
- Secure error messages

### Recommended for Production
- Rate limiting (express-rate-limit)
- Request signing / HMAC
- End-to-end encryption
- Audit logging
- Secrets management
- Security headers (helmet.js)
- Request logging
- DDoS protection

## 🐛 Troubleshooting

### Issue: Ollama Connection Refused
**Solution:**
```bash
# Ensure Ollama is running
ollama serve

# Check if service is available
curl http://localhost:11434/api/tags
```

### Issue: Firebase Authentication Error
**Solution:**
- Verify credentials in `.env`
- Check database URL format
- Ensure Firebase rules allow access
- Verify service account permissions

### Issue: Port Already in Use
**Solution:**
```bash
# Backend: Change PORT in .env
PORT=5001

# Frontend: Change port in next.config.ts or use
npm run dev -- -p 3001
```

### Issue: CORS Errors
**Solution:**
- Update `CORS_ORIGIN` in `.env`
- Ensure frontend and backend URLs match settings

## 📊 Data Models

### User Model
```typescript
{
  id: string;
  phoneNumber: string;        // Unique identifier
  displayName: string;
  email?: string;
  verificationStatus: "pending" | "verified" | "failed";
  reputation: {
    trustScore: number;       // 0-100
    onTimeRate: number;       // 0-100
    totalPayments: number;
    totalDisbursed: number;
    flags: string[];
  };
  groupIds: string[];         // Groups user belongs to
  adminGroupIds: string[];    // Groups user administers
}
```

### Group Model
```typescript
{
  id: string;
  name: string;
  description?: string;
  admin: { userId: string; name: string };
  rules: {
    contributionAmount: number;
    currency: string;          // NGN, KES, USD, etc.
    frequency: "weekly" | "biweekly" | "monthly";
    nextPaymentDate: number;
    maxMembers?: number;
    minTrustScore?: number;
  };
  members: Record<userId, MemberInfo>;
  rotation: {
    cycle: number;
    order: string[];           // User IDs in rotation order
    currentBeneficiary: string;
    currentBeneficiaryIndex: number;
  };
  stats: {
    totalCollected: number;
    totalDisbursed: number;
    healthScore: number;       // 0-100
    completedCycles: number;
  };
}
```

### Contribution Model
```typescript
{
  id: string;
  groupId: string;
  paidBy: { userId: string; displayName: string };
  amount: number;
  currency: string;
  currentBeneficiary: { userId: string; displayName: string };
  paymentMethod: "manual" | "mobile_money" | "bank_transfer";
  paymentReference?: string;
  scheduledDate: number;
  actualDate: number;
  isOnTime: boolean;
  status: "pending" | "completed" | "failed" | "disputed";
  verifiedBy?: { userId: string; timestamp: number };
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript strictly
- Follow ESLint configuration
- Add tests for new features
- Update documentation

## 📄 License
ISC

## 👥 Authors
- Developed for Digital Osusu MVP
- Built with ❤️ for African cooperative savings communities

## 📞 Support
For issues, questions, or suggestions:
1. Check existing issues
2. Create a new issue with detailed description
3. Include error messages and logs
4. Specify environment (OS, Node version, etc.)

## 🎓 Learn More

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated:** 2026-06-06  
**Version:** 1.0.0 (MVP)

**Built with:** ❤️ TypeScript • Express • Next.js • Firebase • Ollama
