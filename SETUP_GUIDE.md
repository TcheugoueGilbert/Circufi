# 🚀 Digital Osusu - Complete Setup & Testing Guide

## Overview
This guide provides complete step-by-step instructions for setting up, configuring, and testing the Digital Osusu platform (Backend + Frontend).

## 📋 Prerequisites

Before starting, ensure you have:
- **Node.js 18+** - Download from https://nodejs.org/
- **npm 9+** - Comes with Node.js
- **Firebase Account** - Create at https://console.firebase.google.com
- **Ollama** - Download from https://ollama.ai (for AI features)
- **Git** - Version control
- **VS Code** or similar editor (optional but recommended)

### Verify Installation
```bash
node --version        # Should be v18+
npm --version         # Should be v9+
git --version         # Check if installed
```

---

## 🔧 Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd "path/to/Circufi-project_V3/backend"
```

### Step 2: Install Dependencies
```bash
npm install
```

This installs all required packages:
- Express.js - Web framework
- Firebase Admin SDK - Database
- TypeScript - Language
- Zod - Validation
- Axios - HTTP client
- Ollama integration
- And more...

**Expected Output:**
```
added XXX packages, and audited XXX packages
```

### Step 3: Create Environment File
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your editor
# OR use command line:
code .env  # VS Code
```

### Step 4: Configure Firebase

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Click "Add Project"
   - Name it "digital-osusu" (or your choice)
   - Complete the setup wizard

2. **Enable Realtime Database**
   - In Firebase Console, go to "Realtime Database"
   - Click "Create Database"
   - Start in "test mode" (for development)
   - Choose a location

3. **Create Service Account**
   - Go to Project Settings (gear icon)
   - Click "Service Accounts"
   - Click "Generate New Private Key"
   - Save the JSON file

4. **Update .env File**
   ```bash
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY=your-private-key-from-json
   FIREBASE_CLIENT_EMAIL=your-client-email-from-json
   FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
   JWT_SECRET=your_super_secret_key_generate_random_string
   ```

### Step 5: Configure Ollama (for AI features)

#### Option A: Local Ollama (Recommended for Development)
```bash
# Download and install from https://ollama.ai
# Start Ollama service
ollama serve

# In another terminal, pull a model
ollama pull mistral

# Or use other models
ollama pull neural-chat
ollama pull orca-mini
```

Update `.env`:
```bash
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=mistral
OLLAMA_TEMPERATURE=0.7
```

#### Option B: Remote Ollama Service
```bash
# Update .env to point to remote service
OLLAMA_API_URL=https://your-ollama-service.com
```

### Step 6: Verify Backend Setup
```bash
# Build TypeScript to JavaScript
npm run build

# Check if build succeeded
ls dist/  # Should show compiled files

# Or on Windows:
Test-Path dist  # Should return True
```

### Step 7: Start Development Server
```bash
npm run dev
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════╗
║         Digital Osusu - Backend Server Started           ║
╚═══════════════════════════════════════════════════════════╝

🚀 Server is running on port 5000
📡 Environment: development
✅ Ollama AI service is healthy
```

**Verify Backend is Running:**
```bash
# In another terminal
curl http://localhost:5000/health

# Expected response:
{
  "success": true,
  "data": {
    "message": "Server is running",
    "timestamp": "2026-06-06T...",
    "version": "1.0.0"
  }
}
```

---

## 🎨 Frontend Setup

### Step 1: Navigate to Frontend Directory
```bash
cd ../frontend  # from backend directory
# OR
cd "path/to/Circufi-project_V3/frontend"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
```bash
# Copy environment file
cp .env.example .env.local

# Edit with backend URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### Step 4: Start Development Server
```bash
npm run dev
```

**Expected Output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

### Step 5: Verify Frontend is Running
Open http://localhost:3000 in your browser
- Should see the Digital Osusu landing page
- Navigation should work

---

## ✅ Complete System Verification

### Checklist
```
☐ Backend running: http://localhost:5000/health
☐ Frontend running: http://localhost:3000
☐ Firebase connected: Check backend logs
☐ Ollama running: http://localhost:11434/api/tags (or check terminal)
☐ All environment variables configured
```

### Test Endpoints

#### 1. Health Check
```bash
curl http://localhost:5000/health
```

#### 2. API Version
```bash
curl http://localhost:5000/api/version
```

#### 3. Ollama Health
```bash
curl http://localhost:5000/api/v1/chat/health
```

#### 4. AI Models
```bash
curl http://localhost:11434/api/tags
```

---

## 🧪 Testing the Backend

### Run Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- reputation.test.ts

# Run with coverage
npm run test:coverage

# Watch mode (reruns on file changes)
npm run test:watch
```

### Manual API Testing

#### Using cURL
```bash
# Register new user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+234701234567",
    "displayName": "John Doe",
    "email": "john@example.com"
  }'

# Response should include userId and verificationRequired: true
```

#### Using Postman
1. Download Postman: https://www.postman.com/downloads/
2. Create new collection
3. Add requests for each endpoint
4. See backend/README.md for all endpoints

#### Using Frontend UI
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Enter phone number +234701234567
4. Enter verification code 1234 (default test code)
5. Complete signup flow
6. Create a group
7. Add members
8. Log contributions
9. Test AI chat

---

## 🤖 Testing AI Integration

### Verify Ollama is Available
```bash
# Check models
ollama list

# You should see installed models like:
# mistral              b537f20e5a8357eec2b3e4a3e4e4e4e
```

### Test AI Endpoint
```bash
curl -X POST http://localhost:5000/api/v1/chat/message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "groupId": "test-group-123",
    "message": "When is my payout?"
  }'
```

### Test in Frontend
1. Navigate to a group
2. Open the AI Chat panel
3. Ask a question:
   - "When's my payout?"
   - "Is member X trustworthy?"
   - "How much have I paid?"

---

## 🐛 Troubleshooting

### Issue: "firebase-admin is required"
**Solution:**
```bash
cd backend
npm install firebase-admin
npm run build
```

### Issue: Ollama Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:11434
```
**Solution:**
```bash
# Ensure Ollama is running
ollama serve

# In another terminal, check models
ollama list
```

### Issue: Firebase Credentials Invalid
**Solution:**
- Verify .env file has correct values
- Download fresh service account from Firebase
- Check for extra spaces in .env values
- Verify Firebase Realtime Database is created

### Issue: "Port 5000 is already in use"
**Solution:**
```bash
# Change port in .env
PORT=5001

# Or kill the process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti :5000 | xargs kill -9
```

### Issue: npm install fails
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: TypeScript build errors
**Solution:**
```bash
# Ensure TypeScript is installed
npm install --save-dev typescript

# Clear build
rm -rf dist

# Rebuild
npm run build
```

---

## 📊 Testing Scenarios

### Scenario 1: User Registration Flow
```
1. Register with phone +234701234567
2. Verify with code 1234
3. Check user profile
4. Update display name
5. Verify reputation score = 50 (new user)
```

### Scenario 2: Group Creation & Contribution
```
1. Admin creates group "Savings Group 1"
   - Contribution: 10,000 NGN
   - Frequency: Weekly
2. Add 3 members
3. Each member logs contribution
4. Admin verifies contributions
5. Check member reputation scores
   - Should increase if on-time
   - Should decrease if late
```

### Scenario 3: Trust Scoring
```
1. User A: 10/10 on-time payments
   - Expected score: ~84
2. User B: 5/10 on-time payments
   - Expected score: ~64
3. User C: 0 payments (new)
   - Expected score: 50
```

### Scenario 4: AI Chat
```
1. Join group
2. Open chat
3. Ask: "When is my payout?"
   - Should show current beneficiary & next payment date
4. Ask: "Is member X trustworthy?"
   - Should show their trust score
5. Ask: "How much have I contributed?"
   - Should show total
```

---

## 📝 Production Deployment

### Environment Variables for Production
```bash
NODE_ENV=production
PORT=5000

# Strong JWT secret (use something like uuidgen)
JWT_SECRET=<very-long-random-string>

# Firebase production database
FIREBASE_PROJECT_ID=<production-project-id>
FIREBASE_PRIVATE_KEY=<production-key>
FIREBASE_CLIENT_EMAIL=<production-email>
FIREBASE_DATABASE_URL=<production-url>

# Ollama or external AI service
OLLAMA_API_URL=<production-ollama-url>

# CORS and API settings
CORS_ORIGIN=https://yourdomain.com
API_VERSION=v1
```

### Build for Production
```bash
# Backend
npm run build
npm start

# Frontend
npm run build
npm start
```

---

## 📚 Documentation

See additional documentation:
- [Backend README](./backend/README.md) - Backend API details
- [Frontend README](./frontend/README.md) - Frontend setup details
- [TECHNICAL_SPEC.md](./documents/TECHNICAL_SPEC.md) - Full specification

---

## 🆘 Getting Help

### If Something Doesn't Work:
1. Check error messages carefully
2. Verify all prerequisites are installed
3. Check environment variables are correct
4. See troubleshooting section above
5. Check log files for detailed errors
6. Verify ports are available
7. Clear cache and reinstall if needed

### Useful Commands
```bash
# Check Node/npm versions
node -v
npm -v

# Clear npm cache
npm cache clean --force

# Check if ports are in use
# Windows:
netstat -ano | findstr :5000

# Mac/Linux:
lsof -i :5000

# Kill process on port
# Windows:
taskkill /PID <PID> /F

# Mac/Linux:
kill -9 <PID>
```

---

## 🎉 Next Steps

Once everything is running:
1. **Create test data** - Register users and groups
2. **Test all features** - Use the app to test functionality
3. **Run tests** - Execute npm test in backend
4. **Review code** - Understand the architecture
5. **Deploy** - Follow deployment guides
6. **Monitor** - Check logs and error tracking
7. **Iterate** - Make improvements based on feedback

---

## 📞 Support

For issues:
1. Check this guide first
2. Check README.md files
3. Check code comments
4. Check technical specification
5. Open an issue on GitHub

---

**Last Updated:** 2026-06-06  
**Version:** 1.0.0 (MVP)

**Happy coding! 🚀**
