# Vercel Deployment Troubleshooting Guide

## 🚨 Current Issue: 500 Internal Server Error on `/api/puzzles`

### 🔍 **Step 1: Test Database Connection**

Visit this URL to test your database connection:
```
https://your-vercel-app.vercel.app/api/test-db
```

This will show you:
- ✅ Connection status
- 📊 Database collections
- 🔧 Environment variables status
- ❌ Detailed error information

### 🔧 **Step 2: Fix Environment Variables**

In your Vercel project settings, add these environment variables:

```env
# Required for MongoDB connection
MONGODB_URI=mongodb+srv://mayakaduwadulith_db_user:bfWrGg3yKmx5TeFc@puzzle.hvofcqf.mongodb.net/?retryWrites=true&w=majority&appName=Puzzle
MONGODB_DB_NAME=puzzle_db

# Optional: For better error handling
NODE_ENV=production
```

### 🔧 **Step 3: Check MongoDB Network Access**

1. **Go to MongoDB Atlas Dashboard**
2. **Navigate to Network Access**
3. **Add IP Address**: `0.0.0.0/0` (allows all IPs)
4. **Or add Vercel's IP ranges** (more secure)

### 🔧 **Step 4: Verify Database User Permissions**

1. **Go to MongoDB Atlas Dashboard**
2. **Navigate to Database Access**
3. **Check if your user has read/write permissions**
4. **Ensure the user can access the `puzzle_db` database**

### 🔧 **Step 5: Seed the Database**

If the connection works but you get empty results, seed your database:

```bash
# Run this locally or create a seed API endpoint
npm run seed
# or
node lib/seed-database.ts
```

### 🔧 **Step 6: Create a Seed API Endpoint**

Add this temporary endpoint to seed your database:

```typescript
// app/api/seed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed-database';

export async function POST(request: NextRequest) {
  try {
    await seedDatabase();
    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
  }
}
```

### 🔧 **Step 7: Check Vercel Function Logs**

1. **Go to Vercel Dashboard**
2. **Select your project**
3. **Go to Functions tab**
4. **Check the logs for `/api/puzzles`**
5. **Look for detailed error messages**

### 🔧 **Step 8: Common Issues and Solutions**

#### Issue 1: Connection Timeout
```
Error: connect ETIMEDOUT
```
**Solution**: Add connection options to database.ts:
```typescript
const db = await mongoose.connect(MONGODB_URI, {
  dbName: DB_NAME,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

#### Issue 2: Authentication Failed
```
Error: Authentication failed
```
**Solution**: 
- Check MongoDB user credentials
- Ensure user has correct permissions
- Verify connection string format

#### Issue 3: Network Access Denied
```
Error: getaddrinfo ENOTFOUND
```
**Solution**: 
- Add `0.0.0.0/0` to MongoDB Network Access
- Or add Vercel's specific IP ranges

#### Issue 4: Database Not Found
```
Error: Database not found
```
**Solution**: 
- Verify `MONGODB_DB_NAME` environment variable
- Ensure database exists in MongoDB Atlas

### 🔧 **Step 9: Alternative Solutions**

#### Option A: Use MongoDB Atlas Data API
If connection issues persist, use MongoDB's Data API:

```typescript
// lib/mongodb-data-api.ts
const MONGODB_DATA_API_URL = process.env.MONGODB_DATA_API_URL;
const MONGODB_DATA_API_KEY = process.env.MONGODB_DATA_API_KEY;

export async function fetchPuzzles() {
  const response = await fetch(`${MONGODB_DATA_API_URL}/action/find`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': MONGODB_DATA_API_KEY,
    },
    body: JSON.stringify({
      dataSource: 'Cluster0',
      database: 'puzzle_db',
      collection: 'puzzles',
    }),
  });
  
  return response.json();
}
```

#### Option B: Use Vercel KV (Redis)
For a simpler solution, use Vercel's built-in KV storage:

```typescript
import { kv } from '@vercel/kv';

export async function getPuzzles() {
  return await kv.get('puzzles');
}
```

### 🔧 **Step 10: Testing Checklist**

- [ ] Database connection test passes (`/api/test-db`)
- [ ] Environment variables are set in Vercel
- [ ] MongoDB Network Access allows Vercel IPs
- [ ] Database user has correct permissions
- [ ] Database is seeded with sample data
- [ ] API route returns puzzles (`/api/puzzles`)
- [ ] Frontend can fetch and display puzzles

### 🆘 **Still Having Issues?**

1. **Check Vercel Function Logs** for detailed error messages
2. **Test locally** with the same environment variables
3. **Try the test endpoint** first: `/api/test-db`
4. **Contact support** with the error details from the test endpoint

### 📞 **Quick Debug Commands**

```bash
# Test database connection locally
curl http://localhost:3000/api/test-db

# Test puzzles endpoint locally
curl http://localhost:3000/api/puzzles

# Check environment variables
echo $MONGODB_URI
echo $MONGODB_DB_NAME
```
