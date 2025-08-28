# 🚨 IMMEDIATE FIX for 500 Error on Vercel

## 🔍 **Step 1: Test Basic API Health**

Visit these URLs in order to isolate the issue:

1. **Health Check**: `https://disrupt-puzzle.vercel.app/api/health`
   - Should return environment variables status
   - Will show if MONGODB_URI is set

2. **Mock Data**: `https://disrupt-puzzle.vercel.app/api/puzzles-mock`
   - Returns sample data without database
   - Tests if frontend can display puzzles

3. **Database Test**: `https://disrupt-puzzle.vercel.app/api/test-db`
   - Tests actual database connection
   - Shows detailed error if connection fails

## 🔧 **Step 2: Fix Environment Variables (Most Likely Issue)**

### In Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add these variables:

```env
MONGODB_URI=mongodb+srv://mayakaduwadulith_db_user:bfWrGg3yKmx5TeFc@puzzle.hvofcqf.mongodb.net/?retryWrites=true&w=majority&appName=Puzzle
MONGODB_DB_NAME=puzzle_db
NODE_ENV=production
```

### Important Notes:
- **No quotes** around the values
- **No spaces** around the `=` sign
- **Case sensitive** variable names
- **Redeploy** after adding environment variables

## 🔧 **Step 3: Check MongoDB Atlas Settings**

### Network Access:
1. Go to MongoDB Atlas Dashboard
2. Navigate to "Network Access"
3. Click "Add IP Address"
4. Add: `0.0.0.0/0` (allows all IPs)
5. Click "Confirm"

### Database Access:
1. Go to "Database Access"
2. Check if user `mayakaduwadulith_db_user` exists
3. Ensure it has "Read and write to any database" permissions
4. If not, create a new user with these permissions

## 🔧 **Step 4: Test Database Connection**

After setting environment variables, test:

```bash
# Test health endpoint
curl https://disrupt-puzzle.vercel.app/api/health

# Test database connection
curl https://disrupt-puzzle.vercel.app/api/test-db

# Test mock data
curl https://disrupt-puzzle.vercel.app/api/puzzles-mock
```

## 🔧 **Step 5: Seed Database (If Connection Works)**

If the database connection works but returns empty results:

```bash
# Seed the database
curl -X POST https://disrupt-puzzle.vercel.app/api/seed
```

## 🔧 **Step 6: Alternative Quick Fix**

If you need the app working immediately while fixing the database:

### Option A: Use Mock Data Temporarily
1. Update your frontend to use `/api/puzzles-mock` instead of `/api/puzzles`
2. This will show sample puzzles without database

### Option B: Use Local Storage
1. The app already has fallback mode
2. Users can still interact with pieces
3. Data persists in browser localStorage

## 🔧 **Step 7: Check Vercel Function Logs**

1. Go to Vercel Dashboard
2. Select your project
3. Go to "Functions" tab
4. Look for `/api/puzzles` function
5. Check the logs for detailed error messages

## 🚨 **Most Common Issues & Solutions**

### Issue 1: "MONGODB_URI is not defined"
**Solution**: Set environment variable in Vercel

### Issue 2: "Authentication failed"
**Solution**: Check MongoDB user credentials and permissions

### Issue 3: "Network access denied"
**Solution**: Add `0.0.0.0/0` to MongoDB Network Access

### Issue 4: "Connection timeout"
**Solution**: The connection options are already optimized for serverless

## 📋 **Debugging Checklist**

- [ ] Health endpoint works (`/api/health`)
- [ ] Environment variables are set in Vercel
- [ ] MongoDB Network Access allows all IPs
- [ ] Database user has correct permissions
- [ ] Database test endpoint works (`/api/test-db`)
- [ ] Mock data endpoint works (`/api/puzzles-mock`)
- [ ] Main puzzles endpoint works (`/api/puzzles`)
- [ ] Database is seeded with data (`/api/seed`)

## 🆘 **If Still Not Working**

1. **Check Vercel Function Logs** for the exact error message
2. **Test locally** with the same environment variables
3. **Try the mock endpoint** to verify frontend works
4. **Contact support** with the error details from `/api/health`

## 🎯 **Expected Results**

After fixing environment variables:

- `/api/health` should show `hasMongoUri: true`
- `/api/test-db` should show connection success
- `/api/puzzles` should return puzzles or empty array
- `/api/seed` should populate database with sample data

The most likely issue is missing environment variables in Vercel. Set those up and the app should work!
