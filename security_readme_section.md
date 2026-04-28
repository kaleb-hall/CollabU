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
