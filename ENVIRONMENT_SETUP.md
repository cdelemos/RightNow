# Environment Variables Setup

## Security Notice
This project uses environment variables to store sensitive information like API keys and database credentials. **Never commit these values to version control.**

## Backend Environment Variables

### Setup Instructions:
1. Navigate to the `backend/` directory
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Update the `.env` file with your actual credentials

### Required Variables:

#### Database Configuration
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name (default: "rightnow_legal_platform")

#### Authentication
- `JWT_SECRET`: Secret key for JWT token generation (REQUIRED - generate a strong random string of at least 32 characters)

#### OpenAI Integration
- `OPENAI_API_KEY`: Your OpenAI API key (REQUIRED for AI features)
  - Get your API key from: https://platform.openai.com/api-keys
  - Format: `sk-proj-...` (starts with sk-proj-)

### Example .env file:
```bash
MONGO_URL="mongodb://localhost:27017"
DB_NAME="rightnow_legal_platform"
JWT_SECRET="your-super-secure-jwt-secret-key-here-min-32-chars"
OPENAI_API_KEY="sk-proj-your-openai-api-key-here"
```

## Security Requirements

### JWT Secret Generation
The JWT_SECRET must be a strong, randomly generated string of at least 32 characters. You can generate one using:

```bash
# Option 1: Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Option 2: Using OpenSSL
openssl rand -base64 32

# Option 3: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**⚠️ CRITICAL SECURITY NOTES:**
1. **Never use the default JWT secret in production**
2. **Generate a unique JWT secret for each environment** (dev, staging, production)
3. **Keep JWT secrets different from other API keys**
4. **JWT secrets should be at least 32 characters long**

## Frontend Environment Variables

### Setup Instructions:
1. Navigate to the `frontend/` directory
2. The `.env` file should already exist with:
   ```bash
   REACT_APP_BACKEND_URL=your-backend-url
   WDS_SOCKET_PORT=443
   ```

### Required Variables:
- `REACT_APP_BACKEND_URL`: Backend server URL (configured automatically in deployment)

## Deployment Environment Variables

### For Production Deployment:
Set these environment variables in your hosting platform:

#### Vercel:
```bash
vercel env add OPENAI_API_KEY
vercel env add JWT_SECRET
vercel env add MONGO_URL
```

#### Heroku:
```bash
heroku config:set OPENAI_API_KEY=sk-proj-your-key-here
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set MONGO_URL=your-mongodb-url
```

#### Docker:
```bash
docker run -e OPENAI_API_KEY=sk-proj-your-key-here -e JWT_SECRET=your-jwt-secret ...
```

## Security Best Practices

1. ✅ **Never commit `.env` files** to version control
2. ✅ **Use strong, unique secrets** for JWT_SECRET
3. ✅ **Rotate API keys regularly**
4. ✅ **Use different keys** for development/staging/production
5. ✅ **Store keys securely** in your deployment platform
6. ✅ **Limit API key permissions** to only what's needed

## Code Usage

The backend code properly uses environment variables:

```python
import os
from dotenv import load_dotenv

load_dotenv()

# Safe way to access environment variables
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY environment variable is required")
```

## Troubleshooting

### Common Issues:
1. **"OPENAI_API_KEY not found"**: Make sure the key is set in your .env file
2. **"API key invalid"**: Verify the key format starts with `sk-proj-`
3. **"Environment file not found"**: Make sure `.env` exists in the backend directory

### Testing Setup:
```bash
# Test if environment variables are loaded
python -c "import os; print('OpenAI key configured:', 'OPENAI_API_KEY' in os.environ)"
```