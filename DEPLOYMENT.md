# Crowd Backend - Deployment Guide

## Quick Start

The backend is now ready for deployment! Here's what you need to do:

## 1. GitHub Setup

The `crowd_backend` folder is already connected to GitHub. Make sure to:

```bash
cd crowd_backend
git add .
git commit -m "Initial backend setup for deployment"
git push origin main
```

## 2. Render Deployment

### Automatic Deployment (Recommended)
1. Go to [Render](https://render.com)
2. Connect your GitHub repository
3. Create a new "Web Service"
4. Select your `crowd_backend` repository
5. Use these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: Latest (automatically detected)

### Manual Configuration
The project includes:
- ✅ `Procfile` for process management
- ✅ `render.yaml` for Render configuration
- ✅ Proper `package.json` with correct scripts

## 3. Environment Variables on Render

Set these environment variables in your Render dashboard:

```env
NODE_ENV=production
PORT=10000
USE_MONGODB=true
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=https://your-frontend-domain.com
```

**Note**: Copy the actual values from your local `.env` file when setting up Render environment variables.

## 4. Update Google OAuth Settings

Once deployed, add your new Render URL to Google Console:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add these to **Authorized redirect URIs**:
   ```
   https://your-render-app.onrender.com/api/auth/google/callback
   http://localhost:3002/api/auth/google/callback
   ```

## 5. Frontend Integration

Update your frontend API calls to point to the new backend:

```javascript
// In your frontend config
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-render-app.onrender.com/api'
  : 'http://localhost:3002/api';
```

## 6. Testing Deployment

After deployment, test these endpoints:
- `GET /api/health` - Health check
- `POST /api/auth/signup` - User registration  
- `POST /api/auth/login` - User login
- `GET /api/auth/google` - Google OAuth (should redirect)

## Current Local Testing

Your backend is currently running locally at:
- **API Base URL**: `http://localhost:3002/api`
- **Health Check**: `http://localhost:3002/api/health`
- **Google OAuth**: `http://localhost:3002/api/auth/google`

## Files Structure

```
crowd_backend/
├── server/                 # Main server code
│   ├── server.js          # Entry point
│   ├── routes/            # API routes
│   ├── models/            # Database models
│   ├── middleware/        # Auth & security middleware
│   ├── config/            # Passport & other config
│   └── database/          # Database connections
├── .env                   # Environment variables (ignored by git)
├── package.json           # Dependencies & scripts
├── Procfile              # Process management
├── render.yaml           # Render configuration
└── README.md             # Documentation
```

## Security Notes

- ✅ Environment variables properly configured
- ✅ JWT authentication implemented
- ✅ MongoDB connection secured
- ✅ Google OAuth configured
- ✅ Rate limiting enabled
- ✅ CORS protection configured
- ✅ Security headers with Helmet.js
- ✅ Sensitive data excluded from repository

## Next Steps

1. Push to GitHub
2. Deploy to Render
3. Update Google OAuth URLs
4. Update frontend to use new backend URL
5. Test all functionality

Your backend is production-ready! 🚀