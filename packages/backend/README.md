# Digital Osusu Backend

**AI-Powered Trust Infrastructure for Cooperative Savings**

An Express.js backend server for Digital Osusu, a platform that digitizes traditional African rotating savings groups (osusu, ajo, esusu) using AI-powered coordination and trust scoring.

## 🎯 Overview

This backend provides:
- **REST API** for group management, contributions, and reputation tracking
- **AI Integration** using Ollama for intelligent chat assistance
- **Trust Scoring** algorithm for member reliability assessment
- **Real-time Coordination** for rotating savings cycles
- **Firebase Integration** for data persistence and authentication

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase account and credentials
- Ollama (for AI features)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Download your service account key (JSON)
   - Add credentials to `.env`:
     ```
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_PRIVATE_KEY=your-private-key
     FIREBASE_CLIENT_EMAIL=your-client-email
     FIREBASE_DATABASE_URL=your-database-url
     ```

5. **Start Ollama** (for AI features)
   ```bash
   ollama serve
   ```
   In another terminal, pull a model:
   ```bash
   ollama pull mistral
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
Include JWT token in Authorization header:
```
Authorization: Bearer {token}
```

### Core Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/verify` - Verify phone number with OTP
- `POST /auth/resend` - Resend verification code

#### Users
- `GET /users/:userId` - Get user profile
- `PUT /users/:userId` - Update user profile

#### Groups (Osusu Circles)
- `POST /groups` - Create new group
- `GET /groups` - List user's groups
- `GET /groups/:groupId` - Get group details
- `PUT /groups/:groupId` - Update group
- `POST /groups/:groupId/members` - Add member to group
- `DELETE /groups/:groupId/members/:userId` - Remove member from group
- `GET /groups/:groupId/health` - Get group health score
- `GET /groups/:groupId/rotation` - Get rotation details

#### Contributions
- `POST /contributions` - Log a contribution
- `GET /contributions/:groupId` - Get group contributions
- `GET /contributions/user/:userId?groupId=X` - Get user contributions
- `PUT /contributions/:id` - Update contribution
- `POST /contributions/:id/verify` - Verify contribution (admin)

#### Reputation & Trust Scoring
- `GET /reputation/:userId` - Get user reputation profile
- `GET /reputation/:userId/events` - Get reputation events

#### AI Chat Assistant
- `POST /chat/message` - Send message and get AI response
- `GET /chat/sessions` - List user's chat sessions
- `GET /chat/sessions/:id` - Get full chat session
- `GET /chat/health` - Check if AI service is available

## 🧮 Trust Score Algorithm

```
trustScore = 50 (base) 
           + (onTimeRate * 0.3) 
           + (min(totalPayments, 20) * 2) 
           + (flags * -5)

Range: 0-100
```

### Example
- 8/10 payments on time: (0.8 × 0.3) = +24
- 10 total payments: (10 × 2) = +20
- 2 flags: (2 × -5) = -10
- **Total: 50 + 24 + 20 - 10 = 84 (Trusted)**

## 📊 Data Models

### User
```typescript
{
  id: string;
  phoneNumber: string;
  displayName: string;
  email?: string;
  verificationStatus: "pending" | "verified" | "failed";
  reputation: {
    totalPayments: number;
    onTimeRate: number;      // 0-100
    totalDisbursed: number;
    trustScore: number;      // 0-100
    flags: string[];
  };
  groupIds: string[];
  adminGroupIds: string[];
}
```

### Group
```typescript
{
  id: string;
  name: string;
  admin: { userId: string; name: string };
  rules: {
    contributionAmount: number;
    currency: string;
    frequency: "weekly" | "biweekly" | "monthly";
    nextPaymentDate: number;
    maxMembers?: number;
    minTrustScore?: number;
  };
  members: Record<string, MemberInfo>;
  rotation: {
    cycle: number;
    order: string[];              // User IDs in order
    currentBeneficiary: string;
    currentBeneficiaryIndex: number;
  };
  stats: {
    totalCollected: number;
    totalDisbursed: number;
    healthScore: number;          // 0-100
    completedCycles: number;
  };
}
```

### Contribution
```typescript
{
  id: string;
  groupId: string;
  paidBy: { userId: string; displayName: string };
  amount: number;
  currency: string;
  currentBeneficiary: { userId: string; displayName: string };
  paymentMethod: "manual" | "mobile_money" | "bank_transfer";
  scheduledDate: number;
  actualDate: number;
  isOnTime: boolean;
  status: "pending" | "completed" | "failed" | "disputed";
  note?: string;
}
```

## 🤖 AI Assistant (Ollama Integration)

The AI assistant provides context-aware responses using user and group data.

### Available Models
- `mistral` (default) - Fast and efficient
- `neural-chat` - Good for conversation
- `orca-mini` - Lightweight alternative

### System Prompt Context
The assistant has access to:
- User reputation and payment history
- Group details and member list
- Current rotation and payment status
- Recent reputation events

### Usage Example
```bash
curl -X POST http://localhost:5000/api/v1/chat/message \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "group123",
    "message": "When is my payout?",
    "sessionId": "session123"  // optional
  }'
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Test Files
- `tests/services/reputation.test.ts` - Reputation scoring tests
- `tests/api/auth.test.ts` - Authentication API tests

## 📦 Building for Production

1. **Build TypeScript**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

3. **Environment setup**
   - Set `NODE_ENV=production`
   - Update all `.env` variables
   - Configure Firebase production database
   - Set strong `JWT_SECRET`
   - Configure proper CORS origin

## 🔐 Security Considerations

### Implemented
- JWT token-based authentication
- Phone number validation and verification
- CORS protection
- Input validation using Zod
- Error handling and logging
- Firebase security rules (basic)

### Recommended for Production
- Rate limiting
- Request signing
- End-to-end encryption for sensitive data
- Advanced KYC/identity verification
- Audit logging
- API key management
- Secrets manager integration

## 📋 Environment Variables

```bash
# Server
NODE_ENV=development
PORT=5000

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Auth
JWT_SECRET=your_super_secret_key
JWT_EXPIRATION=7d

# Ollama AI (Local LLM Provider)
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=mistral
OLLAMA_TEMPERATURE=0.7

# CORS
CORS_ORIGIN=http://localhost:3000

# API
API_VERSION=v1
```

## 🛠 Development

### Project Structure
```
backend/
├── src/
│   ├── index.ts              # Server entry point
│   ├── app.ts                # Express app
│   ├── types.ts              # TypeScript interfaces
│   ├── services/
│   │   ├── firebaseService.ts
│   │   ├── authService.ts
│   │   ├── reputationService.ts
│   │   └── ollamaAIService.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── groupRoutes.ts
│   │   ├── contributionRoutes.ts
│   │   ├── reputationRoutes.ts
│   │   └── chatRoutes.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   └── utils/
│       └── helpers.ts
├── tests/
│   ├── services/
│   └── api/
├── package.json
├── tsconfig.json
└── .env.example
```

### Code Style
- TypeScript strict mode
- ESLint enabled
- Consistent error handling
- Comprehensive type safety

## 🚢 Deployment

### Option 1: Firebase Cloud Functions
```bash
firebase deploy --only functions
```

### Option 2: Railway / Render
1. Push to Git repository
2. Connect repository to deployment service
3. Set environment variables
4. Deploy

### Option 3: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["node", "dist/index.js"]
```

## 🐛 Troubleshooting

### Ollama Connection Error
```
Make sure Ollama is running:
$ ollama serve

In another terminal, pull a model:
$ ollama pull mistral
```

### Firebase Authentication Error
- Verify Firebase credentials in `.env`
- Check database URL format
- Ensure security rules allow read/write

### Port Already in Use
```bash
# Change PORT in .env
PORT=5001
```

## 📄 License
ISC

## 👥 Contributing
Contributions welcome! Please create a feature branch and submit a PR.

## 📞 Support
For issues and questions, please open an issue on the repository.

---

**Built with ❤️ for African cooperative savings communities**
