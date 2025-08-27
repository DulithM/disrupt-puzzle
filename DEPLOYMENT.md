# Deployment Guide for Vercel

## 🚨 **WebSocket Issue on Vercel**

Vercel is a serverless platform that doesn't support long-running WebSocket servers. Here are the solutions:

## 🔧 **Solution 1: Use a WebSocket Service (Recommended)**

### Option A: Supabase Realtime
1. **Sign up for Supabase**: https://supabase.com
2. **Create a project** and get your API keys
3. **Update environment variables**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. **Replace WebSocket code** with Supabase Realtime

### Option B: Pusher
1. **Sign up for Pusher**: https://pusher.com
2. **Create a Channels app**
3. **Update environment variables**:
   ```env
   NEXT_PUBLIC_PUSHER_APP_ID=your_app_id
   NEXT_PUBLIC_PUSHER_KEY=your_key
   NEXT_PUBLIC_PUSHER_SECRET=your_secret
   NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
   ```

### Option C: Ably
1. **Sign up for Ably**: https://ably.com
2. **Create an app**
3. **Update environment variables**:
   ```env
   NEXT_PUBLIC_ABLY_API_KEY=your_api_key
   ```

## 🔧 **Solution 2: Use Fallback Mode (Current Implementation)**

The current implementation includes a fallback mode that:
- ✅ Works without WebSocket server
- ✅ Shows "offline" status instead of "disconnected"
- ✅ Persists data in localStorage
- ❌ No real-time updates (users need to refresh)

### How to Deploy with Fallback Mode:
1. **Deploy to Vercel** as-is
2. **The app will work** but show "offline" status
3. **Users can still complete pieces** and see their progress
4. **Refresh the page** to see updates from other users

## 🔧 **Solution 3: Use a Separate WebSocket Server**

### Option A: Railway
1. **Deploy the WebSocket server** to Railway
2. **Update environment variables**:
   ```env
   NEXT_PUBLIC_WEBSOCKET_URL=wss://your-railway-app.railway.app
   ```

### Option B: Render
1. **Deploy the WebSocket server** to Render
2. **Update environment variables**:
   ```env
   NEXT_PUBLIC_WEBSOCKET_URL=wss://your-render-app.onrender.com
   ```

### Option C: DigitalOcean App Platform
1. **Deploy the WebSocket server** to DigitalOcean
2. **Update environment variables**:
   ```env
   NEXT_PUBLIC_WEBSOCKET_URL=wss://your-digitalocean-app.com
   ```

## 🚀 **Quick Fix for Current Deployment**

If you want to deploy right now with the current code:

1. **Add environment variable** in Vercel:
   ```
   NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket-service.com
   ```

2. **Or leave it empty** to use fallback mode

3. **Deploy** - the app will work with fallback mode

## 📝 **Environment Variables for Vercel**

Add these in your Vercel project settings:

```env
# For fallback mode (current implementation)
NEXT_PUBLIC_WEBSOCKET_URL=

# For Supabase Realtime
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# For Pusher
NEXT_PUBLIC_PUSHER_APP_ID=your_app_id
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_SECRET=your_secret
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster
```

## 🎯 **Recommended Approach**

1. **For quick deployment**: Use the current fallback mode
2. **For production**: Use Supabase Realtime (free tier available)
3. **For scalability**: Use Pusher or Ably

## 🔍 **Testing Your Deployment**

1. **Deploy to Vercel**
2. **Check the status indicator**:
   - ✅ "connected" = WebSocket working
   - ⚠️ "offline" = fallback mode (still functional)
   - ❌ "disconnected" = connection failed
3. **Test piece completion** - should work in all modes
4. **Test persistence** - refresh page to verify localStorage works

The app will work in all scenarios, just with different levels of real-time functionality!
