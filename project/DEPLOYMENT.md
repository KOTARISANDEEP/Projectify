# 🚀 Projectify Deployment Guide

## Current Setup
- **Backend**: Deployed on Render ✅
- **Frontend**: Deployed on Netlify ✅
- **Communication**: Frontend → Render Backend via Netlify redirects

## 🔧 Configuration

### Backend (Render)
Your backend is already deployed on Render and working correctly.

### Frontend (Netlify)
The frontend is configured to communicate with your Render backend through Netlify redirects.

## 📝 Important: Update Backend URL

**Your Render backend URL is configured as: `https://projectify-rrv0.onrender.com`**

The following files are now updated with the correct backend URL:

1. **`project/netlify.toml`** ✅ - Redirects API calls to Render
2. **`project/project/vite.config.ts`** ✅ - Production proxy target

### Current Configuration:

```toml
# In netlify.toml
to = "https://projectify-rrv0.onrender.com/api/:splat"
```

```typescript
// In vite.config.ts
target: process.env.NODE_ENV === 'production' 
  ? 'https://projectify-rrv0.onrender.com'
  : 'http://localhost:5001',
```

## 🚀 How It Works

1. **User visits**: `https://projectify-edu.netlify.app/admin/dashboard`
2. **Frontend makes API call**: `/api/admin-projects`
3. **Netlify redirects**: `/api/admin-projects` → `https://projectify-rrv0.onrender.com/api/admin-projects`
4. **Backend responds**: Render backend processes the request and sends response back

## 🔍 Testing

After updating the backend URL:
1. **Deploy to Netlify** (push changes to GitHub)
2. **Test API calls** from your admin dashboard
3. **Check Network tab** to ensure API calls are successful
4. **Verify project creation** works without 404 errors

## 🐛 Troubleshooting

- **404 errors**: Check if backend URL is correct in both files
- **CORS issues**: Ensure your Render backend allows requests from `projectify-edu.netlify.app`
- **Build errors**: Check Netlify build logs for any issues
