# 🚀 Projectify Backend Deployment Guide

## Deploying to Vercel

### Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Have a Vercel account
3. Firebase project configured

### Step 1: Environment Variables
Set these environment variables in your Vercel project:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Email Configuration
EMAIL_USER=your-gmail-address
EMAIL_PASS=your-gmail-app-password

# Frontend URL
FRONTEND_URL=https://projectify-edu.netlify.app
```

### Step 2: Deploy
```bash
# Navigate to project root
cd project

# Deploy to Vercel
vercel

# Follow the prompts to link to your Vercel project
```

### Step 3: Update Frontend
After deployment, update your frontend to use the new Vercel API URL:

```typescript
// In your frontend code, replace:
fetch('/api/admin-projects', ...)

// With:
fetch('https://your-vercel-domain.vercel.app/api/admin-projects', ...)
```

### Step 4: Test
Test the API endpoints:
- Health check: `https://your-vercel-domain.vercel.app/api/health`
- Admin projects: `https://your-vercel-domain.vercel.app/api/admin-projects`

## Local Development
```bash
cd project/backend
npm install
npm run dev
```

## Troubleshooting
- Check Vercel logs for deployment errors
- Verify environment variables are set correctly
- Ensure Firebase credentials are valid
- Check CORS configuration for your frontend domain
