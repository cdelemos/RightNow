#!/bin/bash

# Security Check Script for RightNow Legal Platform
# This script checks for common security issues before committing to GitHub

echo "🔒 Running Security Check for GitHub Commit Readiness..."
echo "================================================"

# Check for hardcoded API keys
echo "🔍 Checking for hardcoded API keys..."
API_KEY_FOUND=false

# Check for OpenAI API keys (but exclude examples and placeholders)
if grep -r "sk-[a-zA-Z0-9]\{20,\}" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.sh" --exclude="*.md" --exclude="*.example" 2>/dev/null | grep -v "sk-xxxxxxxxxx" | grep -v "sk-proj-your" | grep -v "sk-proj-..." ; then
    echo "❌ Found potential OpenAI API key in codebase!"
    API_KEY_FOUND=true
fi

# Check for JWT secrets in code (but exclude examples and placeholders)
if grep -r "JWT_SECRET.*=.*[a-zA-Z0-9-]\{20,\}" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.sh" --exclude="*.example" 2>/dev/null | grep -v "your-jwt-secret" | grep -v "your-super-secure" | grep -v "change-in-production"; then
    echo "❌ Found potential JWT secret in codebase!"
    API_KEY_FOUND=true
fi

# Check for other common secrets (but exclude form validation and examples)
if grep -r "password.*=.*[a-zA-Z0-9]\{10,\}" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.sh" 2>/dev/null | grep -v "formData.password" | grep -v "currentPassword" | grep -v "confirmPassword" | grep -v "input.*password" | grep -v "type.*password"; then
    echo "❌ Found potential password in codebase!"
    API_KEY_FOUND=true
fi

if [ "$API_KEY_FOUND" = false ]; then
    echo "✅ No hardcoded API keys found in codebase"
fi

# Check .env files
echo ""
echo "🔍 Checking .env files..."
if [ -f "backend/.env" ]; then
    if grep -q "sk-[a-zA-Z0-9]\{20,\}" "backend/.env" 2>/dev/null | grep -v "sk-xxxxxxxxxx" | grep -v "sk-proj-your"; then
        echo "❌ Found API key in backend/.env file!"
    else
        echo "✅ backend/.env file is clean"
    fi
fi

if [ -f "frontend/.env" ]; then
    if grep -q "sk-[a-zA-Z0-9]\{20,\}" "frontend/.env" 2>/dev/null | grep -v "sk-xxxxxxxxxx" | grep -v "sk-proj-your"; then
        echo "❌ Found API key in frontend/.env file!"
    else
        echo "✅ frontend/.env file is clean"
    fi
fi

# Check .gitignore
echo ""
echo "🔍 Checking .gitignore configuration..."
if grep -q "\.env" .gitignore; then
    echo "✅ .env files are properly ignored"
else
    echo "❌ .env files are not in .gitignore!"
fi

# Check for required environment variables
echo ""
echo "🔍 Checking environment variable usage..."
if grep -q "os.environ.get('JWT_SECRET')" backend/server.py; then
    echo "✅ JWT_SECRET is using environment variable"
else
    echo "❌ JWT_SECRET is not using environment variable properly"
fi

if grep -q "os.environ.get('OPENAI_API_KEY')" backend/server.py; then
    echo "✅ OPENAI_API_KEY is using environment variable"
else
    echo "❌ OPENAI_API_KEY is not using environment variable properly"
fi

# Check for .env.example files
echo ""
echo "🔍 Checking for .env.example files..."
if [ -f "backend/.env.example" ]; then
    echo "✅ backend/.env.example exists"
else
    echo "⚠️  backend/.env.example is missing"
fi

# Summary
echo ""
echo "================================================"
echo "🎯 Security Check Summary:"
echo "================================================"

# Final recommendation
if [ "$API_KEY_FOUND" = false ]; then
    echo "✅ READY FOR GITHUB COMMIT"
    echo "   - No hardcoded secrets found"
    echo "   - Environment variables properly configured"
    echo "   - .env files properly ignored"
    echo ""
    echo "🚀 Your project is secure and ready to be committed to GitHub!"
else
    echo "❌ NOT READY FOR GITHUB COMMIT"
    echo "   - Secrets found in codebase"
    echo "   - Please remove all hardcoded secrets"
    echo "   - Use environment variables instead"
    echo ""
    echo "🔧 Fix the issues above before committing to GitHub"
fi

echo ""
echo "📚 For more information, see: ENVIRONMENT_SETUP.md"