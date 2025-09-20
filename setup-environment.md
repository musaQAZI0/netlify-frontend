# 🔐 Environment Variables Setup Guide

## Quick Setup (Recommended)

### 1. **Generate Secure Secrets Automatically**

```bash
cd crowd_backend
node generate-secrets.js
```

This will generate all the secure secrets you need and display them in the terminal.

### 2. **Create .env File**

Create a file named `.env` in your `crowd_backend` folder:

```bash
cd crowd_backend
copy .env.example .env
```

Then copy the generated secrets from step 1 into your `.env` file.

### 3. **Example .env File**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/crowd_events

# JWT Secrets (Use generated values)
JWT_SECRET=your-generated-jwt-secret-here
JWT_REFRESH_SECRET=your-generated-refresh-secret-here
ADMIN_JWT_SECRET=your-generated-admin-jwt-secret-here

# Session Secret (Use generated value)
SESSION_SECRET=your-generated-session-secret-here

# Admin Credentials (Use generated values)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-generated-secure-password
ADMIN_EMAIL=admin@crowd.com

# Server
PORT=3002
NODE_ENV=development
```

## Manual Setup (Alternative)

### 1. **Create JWT Secrets**

You can generate secure random strings using Node.js:

```javascript
// In Node.js console or create a file
const crypto = require('crypto');

// Generate JWT Secret (64 bytes, base64 encoded)
const jwtSecret = crypto.randomBytes(64).toString('base64');
console.log('JWT_SECRET=' + jwtSecret);

// Generate Refresh Secret
const refreshSecret = crypto.randomBytes(64).toString('base64');
console.log('JWT_REFRESH_SECRET=' + refreshSecret);

// Generate Admin JWT Secret
const adminJwtSecret = crypto.randomBytes(64).toString('base64');
console.log('ADMIN_JWT_SECRET=' + adminJwtSecret);

// Generate Session Secret
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('SESSION_SECRET=' + sessionSecret);
```

### 2. **Create Strong Admin Password**

Generate a strong password:

```javascript
// Strong password generator
function generatePassword(length = 16) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

console.log('ADMIN_PASSWORD=' + generatePassword(20));
```

### 3. **Set Admin Username**

Choose a unique admin username:

```env
ADMIN_USERNAME=your_chosen_admin_username
```

## Platform-Specific Setup

### **Windows**

1. Create `.env` file in `crowd_backend` folder
2. Run the secret generator:
   ```cmd
   cd crowd_backend
   node generate-secrets.js
   ```
3. Copy the output to your `.env` file

### **macOS/Linux**

1. Create `.env` file:
   ```bash
   cd crowd_backend
   cp .env.example .env
   ```
2. Generate secrets:
   ```bash
   node generate-secrets.js
   ```
3. Edit `.env` file with your favorite editor

### **Hosting Platforms**

#### **Render.com**
1. Go to your service dashboard
2. Click "Environment" tab
3. Add each variable:
   - `JWT_SECRET`: your-generated-value
   - `ADMIN_USERNAME`: admin
   - `ADMIN_PASSWORD`: your-secure-password
   - etc.

#### **Heroku**
```bash
heroku config:set JWT_SECRET=your-generated-value
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=your-secure-password
```

#### **Netlify Functions**
Add to `netlify.toml`:
```toml
[build.environment]
  JWT_SECRET = "your-generated-value"
  ADMIN_USERNAME = "admin"
  ADMIN_PASSWORD = "your-secure-password"
```

#### **Vercel**
```bash
vercel env add JWT_SECRET
vercel env add ADMIN_USERNAME
vercel env add ADMIN_PASSWORD
```

## Security Best Practices

### ✅ **Do's**
- Use the secret generator for production
- Keep secrets long and random (64+ characters)
- Use different secrets for development and production
- Store secrets in platform environment variables
- Regularly rotate secrets

### ❌ **Don'ts**
- Never commit `.env` files to Git
- Don't use simple passwords like "admin123"
- Don't share secrets in chat/email
- Don't use the same secret for multiple purposes
- Don't hardcode secrets in your application

## Testing Your Setup

1. **Restart your server** after setting environment variables
2. **Check the admin login** at `/admin-access.html`
3. **Test with generated credentials**

## Troubleshooting

### **"Invalid admin token" errors**
- Check `ADMIN_JWT_SECRET` is set correctly
- Ensure no extra spaces in your `.env` file

### **"Invalid credentials" errors**
- Verify `ADMIN_USERNAME` and `ADMIN_PASSWORD` are correct
- Check for typos in your `.env` file

### **Server won't start**
- Ensure `.env` file is in the correct directory (`crowd_backend`)
- Check for syntax errors in `.env` file
- Verify all required variables are set

## Example Complete .env File

```env
# Database
MONGODB_URI=mongodb://localhost:27017/crowd_events

# JWT Configuration
JWT_SECRET=YourGeneratedJWTSecretHere64CharsLong
JWT_REFRESH_SECRET=YourGeneratedRefreshSecretHere64CharsLong
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourSecureGeneratedPassword123!
ADMIN_EMAIL=admin@crowd.com
ADMIN_JWT_SECRET=YourGeneratedAdminJWTSecretHere64CharsLong

# Session Management
SESSION_SECRET=YourGeneratedSessionSecretHere32CharsLong

# Server Configuration
PORT=3002
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Security
BCRYPT_ROUNDS=12
```

Remember to replace all the example values with the actual generated secrets!