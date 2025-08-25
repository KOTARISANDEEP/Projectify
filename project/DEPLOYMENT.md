# 🚀 Projectify Deployment Guide

## Current Setup
- **Backend**: Deployed on Render ✅ (`https://projectify-rrv0.onrender.com`)
- **Frontend**: Deployed on Netlify ✅ (`https://projectify-edu.netlify.app`)
- **Communication**: Frontend → Render Backend via direct API calls

## 🔧 Configuration

### Backend (Render)
Your backend is already deployed on Render and working correctly at `https://projectify-rrv0.onrender.com`.

### Frontend (Netlify)
The frontend is now configured to call your Render backend directly using the full URL.

## 📝 Current Configuration

**Frontend API calls are now hardcoded to use the Render backend URL:**

```typescript
// In AdminDashboard.tsx
const response = await fetch('https://projectify-rrv0.onrender.com/api/admin-projects', {
  // ... request details
});
```

**API Configuration File:**
```typescript
// src/config/api.ts
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://projectify-rrv0.onrender.com'  // Production: Render backend
  : 'http://localhost:5001';                // Development: Local backend
```

## 🚀 How It Works Now

1. **User visits**: `https://projectify-edu.netlify.app/admin/dashboard`
2. **Frontend makes API call**: Directly to `https://projectify-rrv0.onrender.com/api/admin-projects`
3. **Backend responds**: Render backend processes the request and sends response back
4. **No more 404 errors**: Frontend bypasses Netlify and calls Render directly

## 🔍 Testing

After Netlify redeploys:
1. **Test API calls** from your admin dashboard
2. **Check Network tab** to ensure API calls go to Render backend
3. **Verify project creation** works without 404 errors
4. **Check console** for successful API responses

## 🐛 Troubleshooting

- **404 errors**: Should be resolved now - frontend calls Render directly
- **CORS issues**: Ensure your Render backend allows requests from `projectify-edu.netlify.app`
- **Build errors**: Check Netlify build logs for any issues
- **API calls failing**: Verify Render backend is running and accessible

## 🔄 Future Updates

If you need to change the backend URL:
1. Update `src/config/api.ts`
2. Update any hardcoded fetch URLs in components
3. Redeploy to Netlify
