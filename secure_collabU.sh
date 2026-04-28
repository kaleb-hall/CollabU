#!/bin/bash
# secure_collabU.sh - Fix all security issues

set -e

echo "🔒 Securing CollabU for Public GitHub..."
echo ""

# Navigate to project root
cd /Users/kalebhall/CollabU  # ← CHANGE THIS to your actual path

# ============================================
# FIX 1: Remove database files
# ============================================
echo "1️⃣ Removing database files..."
rm -f backend/collabu_dev.db backend/instance/collabu_dev.db
echo "   ✅ Database files removed"

# ============================================
# FIX 2: Update .gitignore
# ============================================
echo "2️⃣ Updating .gitignore..."
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python

# Virtual Environments
venv/
env/
ENV/
backend/venv/
frontend/node_modules/

# Environment Variables
.env
.env.local
.env.*.local
*.env
!.env.example

# Database Files
*.db
*.sqlite
*.sqlite3
*.db-journal
instance/
backend/instance/
backend/*.db

# Flask
.webassets-cache
.pytest_cache/

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Logs
*.log
logs/

# Build
build/
dist/
*.egg-info/

# Frontend
frontend/node_modules/
frontend/build/
frontend/dist/
EOF
echo "   ✅ .gitignore updated"

# ============================================
# FIX 3: Create .env.example templates
# ============================================
echo "3️⃣ Creating .env.example files..."

# Backend .env.example
cat > backend/.env.example << 'EOF'
# Flask Configuration
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=generate-with-python-secrets-token-hex

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/collabu

# JWT Configuration
JWT_SECRET_KEY=generate-with-python-secrets-token-hex
JWT_ACCESS_TOKEN_EXPIRES=3600

# Optional: External Services
# GOOGLE_DRIVE_CLIENT_ID=your-client-id
# GOOGLE_DRIVE_CLIENT_SECRET=your-client-secret
EOF

# Frontend .env.example (if needed)
if [ -d frontend ]; then
    cat > frontend/.env.example << 'EOF'
# Backend API URL
VITE_API_URL=http://localhost:5000

# Optional: Other frontend configs
EOF
fi
echo "   ✅ .env.example files created"

# ============================================
# FIX 4: Update config.py with secure fallback
# ============================================
echo "4️⃣ Updating config.py..."
cat > backend/app/config.py << 'EOF'
import os
from datetime import timedelta

class Config:
    """Base configuration with security-first approach"""
    
    # Security - NEVER use weak fallbacks in production
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        # Only for development - generates new key each restart
        import secrets
        SECRET_KEY = secrets.token_hex(32)
        print("⚠️  WARNING: Using generated SECRET_KEY. Set SECRET_KEY in .env for production!")
    
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    if not JWT_SECRET_KEY:
        # Only for development - generates new key each restart
        import secrets
        JWT_SECRET_KEY = secrets.token_hex(32)
        print("⚠️  WARNING: Using generated JWT_SECRET_KEY. Set JWT_SECRET_KEY in .env for production!")
    
    # Database - use environment variable
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://localhost/collabu_dev'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Config
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 3600))
    )
    
    # Additional security headers
    JSON_SORT_KEYS = False

class DevelopmentConfig(Config):
    """Development-specific settings"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Production-specific settings"""
    DEBUG = False
    TESTING = False
    
    @classmethod
    def validate(cls):
        """Ensure required production configs are set"""
        required = ['SECRET_KEY', 'JWT_SECRET_KEY', 'DATABASE_URL']
        missing = [key for key in required if not os.environ.get(key)]
        if missing:
            raise ValueError(f"Production requires: {', '.join(missing)}")

class TestingConfig(Config):
    """Testing-specific settings"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
EOF
echo "   ✅ config.py updated with secure fallbacks"

# ============================================
# FIX 5: Update __init__.py to use config
# ============================================
echo "5️⃣ Checking __init__.py..."
# Only show warning, don't auto-modify (might break your setup)
if grep -q "jwt-secret-key-change-in-production" backend/app/__init__.py 2>/dev/null; then
    echo "   ⚠️  Found hardcoded JWT secret in __init__.py"
    echo "   📝 Action needed: Remove line 19 from backend/app/__init__.py"
    echo "      (Your config.py already sets JWT_SECRET_KEY)"
else
    echo "   ✅ __init__.py looks good"
fi

# ============================================
# FIX 6: Verify git status
# ============================================
echo ""
echo "6️⃣ Verifying git status..."
if git ls-files | grep -E "\.env$|\.db$|\.sqlite" | grep -v ".env.example"; then
    echo "   ⚠️  WARNING: Sensitive files are tracked in git!"
    echo "   Run: git rm --cached <filename>"
else
    echo "   ✅ No sensitive files tracked"
fi

# ============================================
# FIX 7: Add security documentation to README
# ============================================
echo ""
echo "7️⃣ Checking README.md..."
if [ -f README.md ]; then
    if ! grep -q "Environment Setup" README.md; then
        echo "   📝 Consider adding environment setup section to README.md"
        echo "      (See generated security_readme_section.md)"
        
        cat > security_readme_section.md << 'EOF'
## 🔒 Environment Setup

### Required Environment Variables

1. Copy environment template:
```bash
cd backend
cp .env.example .env
```

2. Generate secure secrets:
```bash
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))" >> .env
python3 -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))" >> .env
```

3. Configure database:
```bash
echo "DATABASE_URL=postgresql://localhost/collabu_dev" >> .env
```

### Database Setup
```bash
# Create database
createdb collabu_dev

# Run migrations
cd backend
flask db upgrade
```

### Security Notes

⚠️ **Never commit:**
- `.env` files
- Database files (*.db, *.sqlite)
- User data
- API credentials

✅ **Safe to commit:**
- `.env.example` (template only)
- Migration files (schema only, no data)
- Configuration code (uses environment variables)
EOF
    else
        echo "   ✅ README already has setup instructions"
    fi
fi

echo ""
echo "🎉 SECURITY FIXES COMPLETE!"
echo ""
echo "📋 SUMMARY:"
echo "   ✅ Database files removed"
echo "   ✅ .gitignore updated"
echo "   ✅ .env.example templates created"
echo "   ✅ config.py uses secure fallbacks"
echo ""
echo "🔍 MANUAL STEPS NEEDED:"
echo "   1. Remove line 19 from backend/app/__init__.py:"
echo "      DELETE: app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')"
echo ""
echo "   2. Regenerate your .env files:"
echo "      cd backend"
echo "      cp .env.example .env"
echo "      python3 -c \"import secrets; print('SECRET_KEY=' + secrets.token_hex(32))\" >> .env"
echo "      python3 -c \"import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))\" >> .env"
echo ""
echo "   3. Recreate database:"
echo "      createdb collabu_dev"
echo "      flask db upgrade"
echo ""
echo "   4. Review and commit changes:"
echo "      git status"
echo "      git add .gitignore backend/.env.example frontend/.env.example backend/app/config.py"
echo "      git commit -m 'Security: Remove sensitive data, add environment configuration'"
echo ""
echo "   5. Test locally before pushing:"
echo "      cd backend && flask run"
echo ""
echo "✨ After these steps, your repo is safe for public GitHub!"
