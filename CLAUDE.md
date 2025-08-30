# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Available Commands

### Development
- `npm run dev` - Start the development server (runs server/server.js)
- `npm start` - Start the production server
- `npm run build` - No-op build command (echo 'no build script')

### Server Details
- Server runs on port 3001 by default
- API endpoints available at `http://localhost:3001/api`
- Frontend served at `http://localhost:3001`

## Project Architecture

This is a crowd event platform backend built with Express.js and MongoDB/JSON file storage.

### Core Structure
```
backend/
├── server/
│   ├── server.js           # Main Express application
│   ├── database/           # Database layer
│   │   ├── db.js          # JSON file-based database operations
│   │   ├── mongodb.js     # MongoDB connection
│   │   ├── mongoDatabase.js # MongoDB operations
│   │   └── models/        # Mongoose models
│   ├── routes/            # API route handlers
│   │   ├── auth.js        # Authentication routes
│   │   ├── users.js       # User management
│   │   ├── events.js      # Event operations
│   │   └── [others]       # Various feature routes
│   └── middleware/        # Express middleware
│       ├── auth.js        # JWT authentication
│       └── adminAuth.js   # Admin authentication
├── api/                   # API utilities
└── test scripts/          # Various test files
```

### Database Architecture
- **Dual Storage**: Supports both JSON file storage (default) and MongoDB
- **Environment Control**: Set `USE_MONGODB=true` to use MongoDB instead of JSON files
- **Data Files**: Located in `server/database/data/` for JSON storage
  - `users.json` - User accounts and profiles
  - `events.json` - Event listings and details
  - `bankAccounts.json` - Payment information
  - `apps.json` - App marketplace data

### Authentication System
- JWT-based authentication with bcrypt password hashing
- Rate limiting on auth endpoints (10 requests/15min)
- Middleware: `authenticateToken` and `requireOrganizer`
- User roles: 'user', 'organizer', 'admin'

### Security Features
- Helmet.js for security headers with CSP configuration
- CORS with environment-specific origins
- Rate limiting (100 req/15min general, 10 req/15min auth)
- Input validation using Joi schemas
- Password hashing with 12 salt rounds

### Key API Endpoints
- `/api/auth/*` - Authentication (signup, login, profile)
- `/api/events/*` - Event management
- `/api/users/*` - User operations
- `/api/finance/*` - Financial operations
- `/api/apps/*` - App marketplace
- `/api/dashboard/*` - Dashboard data
- `/api/health` - Health check

### Database Models
Core entities include User, Event, FinancialAccount, App, Collection with comprehensive field definitions in the models directory.

### Environment Variables
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode
- `JWT_SECRET` - JWT signing secret
- `MONGODB_URI` - MongoDB connection string
- `USE_MONGODB` - Toggle between JSON files and MongoDB

### Development Notes
- Hot reload available via `npm run dev`
- API documentation available in `API_DOCUMENTATION.md`
- Test utilities provided for API testing
- Frontend assets served from root directory