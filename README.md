CircuFi
<div align="center">
https://via.placeholder.com/120x120?text=CircuFi

AI-Powered Trust Infrastructure for Cooperative Savings Groups

https://img.shields.io/badge/license-MIT-blue.svg
https://img.shields.io/badge/node-%253E%253D18.0.0-brightgreen
https://img.shields.io/badge/TypeScript-5.4-blue
https://img.shields.io/badge/PRs-welcome-brightgreen.svg

Features • Quick Start • Architecture • API Documentation • Demo

</div>
📖 Overview
CircuFi is a comprehensive platform that digitizes traditional African rotating savings groups (Osusu, Ajo, Esusu) by introducing trust, transparency, and AI-powered coordination. The platform helps groups create and manage contribution cycles, verify participant identities, track contributions, measure trustworthiness through behavioral signals, and provide transparent visibility into group health and member reliability.

Business Problem
Millions of Africans participate in cooperative savings groups to access capital without relying on expensive loans or traditional financial institutions. However, these systems often suffer from:

Member defaults and disappearing beneficiaries

Weak identity verification

Poor record keeping

Limited transparency

Trust-related challenges

Our Solution
CircuFi transforms informal cooperative finance into a more transparent, accountable, and scalable system by making trust measurable, explainable, and portable.

✨ Features
Core MVP Features
Feature	Description	Status
User Registration	Phone-based registration with OTP verification	✅ Complete
Identity Verification	Mock ID verification system (ready for KYC integration)	✅ Complete
Group Management	Create/join savings circles with customizable rules	✅ Complete
Contribution Tracking	Log payments, track history, monitor obligations	✅ Complete
Trust Scoring	AI-powered trust score based on behavioral metrics	✅ Complete
Group Health Dashboard	Real-time group risk assessment and analytics	✅ Complete
AI Assistant	Claude-powered chat assistant for user questions	✅ Complete
Reputation System	Complete audit trail of trust-affecting events	✅ Complete
Trust Score Algorithm
CircuFi's trust score model is built on four key behavioral indicators:

text
Trust Score = 
  (Completion Rate × 0.40) +
  (On-Time Rate × 0.35) +
  (Membership Duration Score × 0.15) +
  (Penalty Score × 0.10)
Risk Categories
Trust Score	Risk Category
90 – 100	Excellent
80 – 89	Good
70 – 79	Fair
60 – 69	Risky
Below 60	High Risk
AI Assistant Capabilities
The AI assistant can answer questions about:

Trust scores and what they mean

Group health and risk indicators

Payment schedules and obligations

Member reliability (general reputation)

How to improve trust scores

🏗️ Architecture
High-Level Architecture
text
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer (React SPA)               │
│  - Group Dashboard     - Member Management                  │
│  - Contribution Tracker - AI Chat Assistant                 │
│  - Reputation Profiles  - Mobile Responsive                 │
├─────────────────────────────────────────────────────────────┤
│                    Backend Layer (Node.js + Express)        │
│  - REST API            - Business Logic                     │
│  - AI Orchestration    - Validation (Zod)                   │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer (Firebase)                    │
│  - Firestore (Primary DB)  - Authentication                 │
│  - Realtime Updates        - File Storage                   │
├─────────────────────────────────────────────────────────────┤
│                    External Services                        │
│  - Claude API (AI Assistant)                                │
│  - (Future) Mobile Money APIs (M-Pesa, Flutterwave)        │
└─────────────────────────────────────────────────────────────┘
Technology Stack
Layer	Technology	Purpose
Frontend	React 18 + TypeScript	UI framework
Tailwind CSS	Styling
Zustand	State management
Axios	HTTP client
Recharts	Data visualization
Backend	Node.js 18 + Express	API server
TypeScript	Type safety
Firebase Admin SDK	Database operations
Anthropic Claude SDK	AI Assistant
JWT	Authentication
Zod	Validation
Database	Firebase Firestore	Primary database
Firebase Auth	User management
Deployment	Vercel/Netlify	Frontend hosting
Render/Railway	Backend hosting
Data Models
typescript
// Core data structures
interface User {
  id: string;
  phoneNumber: string;
  displayName: string;
  reputation: Reputation;
  groupIds: string[];
  verificationStatus: "pending" | "verified" | "failed";
}

interface Group {
  id: string;
  name: string;
  admin: { userId: string; name: string };
  rules: GroupRules;
  members: Record<string, GroupMember>;
  rotation: Rotation;
  stats: GroupStats;
}

interface Contribution {
  id: string;
  groupId: string;
  paidBy: { userId: string; displayName: string };
  amount: number;
  isOnTime: boolean;
  status: "pending" | "completed" | "failed" | "disputed";
}
🚀 Quick Start
Prerequisites
Node.js 18.0 or higher

npm 9.0 or higher

Firebase account (for database)

Anthropic API key (for AI assistant)

Installation
bash
# Clone the repository
git clone https://github.com/yourusername/circufi.git
cd circufi

# Install dependencies for all packages
npm run setup

# Configure environment variables
cp .env.example .env
# Edit .env with your Firebase and Anthropic credentials

# Build all packages
npm run build

# Start development servers
npm run dev
The application will be available at:

Frontend: http://localhost:3000

Backend API: http://localhost:5000

Environment Variables
env
# Backend
PORT=5000
NODE_ENV=development

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Anthropic Claude AI
ANTHROPIC_API_KEY=sk-ant-...

# JWT Secret
JWT_SECRET=your-secret-key-change-this

# Frontend
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
Docker Deployment
bash
# Build the Docker image
docker build -t circufi:latest .

# Run the container
docker run -p 5000:5000 --env-file .env circufi:latest
📚 API Documentation
Authentication Endpoints
Method	Endpoint	Description
POST	/api/auth/register	Register new user
POST	/api/auth/verify	Verify OTP code
GET	/api/auth/me	Get current user
Group Endpoints
Method	Endpoint	Description
POST	/api/groups	Create new group
GET	/api/groups	List user's groups
GET	/api/groups/:groupId	Get group details
POST	/api/groups/:groupId/members	Add member
DELETE	/api/groups/:groupId/members/:userId	Remove member
GET	/api/groups/:groupId/health	Get group health score
GET	/api/groups/:groupId/rotation	Get payment rotation
Contribution Endpoints
Method	Endpoint	Description
POST	/api/contributions	Log contribution
PUT	/api/contributions/:id/verify	Verify contribution (admin)
GET	/api/contributions/group/:groupId	List group contributions
GET	/api/contributions/user	List user's contributions
Reputation Endpoints
Method	Endpoint	Description
GET	/api/reputation/:userId	Get user's trust score
GET	/api/reputation/:userId/history	Get reputation history
Chat Endpoints
Method	Endpoint	Description
POST	/api/chat/message	Send message to AI assistant
GET	/api/chat/sessions	List chat sessions
GET	/api/chat/sessions/:sessionId	Get session history
Example API Calls
javascript
// Register a user
const response = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: '+2347012345678',
    displayName: 'John Doe'
  })
});

// Create a group
const group = await fetch('/api/groups', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Lekki Ladies Savings',
    contributionAmount: 50000,
    currency: 'NGN',
    frequency: 'weekly'
  })
});

// Log a contribution
const contribution = await fetch('/api/contributions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    groupId: 'group123',
    amount: 50000,
    paymentMethod: 'manual',
    scheduledDate: Date.now(),
    actualDate: Date.now()
  })
});
🧪 Testing
Running Tests
bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
Test Coverage Goals
Module	Target Coverage
Trust Score Calculation	100%
Authentication Flow	90%
Contribution Logic	85%
Group Management	85%
API Endpoints	80%
📁 Project Structure
text
circufi/
├── packages/
│   ├── shared/                 # Shared types and utilities
│   │   ├── src/
│   │   │   ├── types/         # TypeScript interfaces
│   │   │   ├── constants/     # App constants
│   │   │   └── utils/         # Shared utilities
│   │   └── package.json
│   │
│   ├── backend/               # Node.js + Express server
│   │   ├── src/
│   │   │   ├── config/        # Firebase config
│   │   │   ├── middleware/    # Auth, validation
│   │   │   ├── routes/        # API endpoints
│   │   │   ├── services/      # Business logic
│   │   │   └── index.ts       # Entry point
│   │   └── package.json
│   │
│   └── frontend/              # React SPA
│       ├── src/
│       │   ├── components/    # Reusable components
│       │   ├── pages/         # Page components
│       │   ├── stores/        # Zustand stores
│       │   ├── services/      # API client
│       │   └── App.tsx        # Main component
│       └── package.json
│
├── docker-compose.yml
├── Dockerfile
└── package.json               # Root workspace config
🔒 Security
Authentication & Authorization
JWT tokens with 7-day expiration

Firebase Authentication integration

Role-based access control (admin vs member)

Rate limiting (100 requests/minute)

Data Protection
Phone numbers hashed in logs

HTTPS enforced in production

CORS configured for approved domains

Firebase Security Rules for data isolation

API Security
Input validation with Zod schemas

SQL injection prevention (Firestore)

XSS protection via Helmet

CSRF protection

📊 Monitoring & Analytics
Key Metrics Tracked
Trust Performance

Average Trust Score

Trust Score Distribution

High-Risk Members Count

Trusted Members Count

Contribution Metrics

Total Contributions

Completion Rate

On-Time Payment Rate

Missed Payment Rate

Group Health

Group Health Score

Risk Flags

Member Reliability Index

🤝 Contributing
We welcome contributions! Please see our Contributing Guide.

Development Workflow
bash
# Fork the repository
# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes
# Run tests
npm test

# Commit your changes
git commit -m 'Add amazing feature'

# Push to the branch
git push origin feature/amazing-feature

# Open a Pull Request
Coding Standards
TypeScript strict mode enabled

ESLint + Prettier for code formatting

Conventional commits for commit messages

80% test coverage required

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Traditional Osusu, Ajo, and Esusu systems that inspired this platform

Anthropic for Claude AI API

Firebase for scalable infrastructure

All contributors and early adopters

📞 Contact & Support
Documentation: 

Issues: GitHub Issues

Discord: Join our community

Email: 

<div align="center">
Built with ❤️ for financial inclusion in Africa

Report Bug • Request Feature • Star on GitHub

</div>
This response is AI-generated, for reference only.
