# 🧩 Interactive Puzzle Exhibition System

A simple, user-free puzzle exhibition system where visitors scan QR codes to unlock puzzle pieces and watch real-time progress on a big screen display.

## 🎯 How It Works

### 1. **Big Screen Display** (`/exhibition-dashboard`)
- Shows real-time puzzle progress
- Displays visitor count and completion statistics
- Updates instantly when pieces are unlocked
- Perfect for exhibition venues and events

### 2. **QR Code System**
- Each puzzle piece has a unique QR code
- Visitors scan codes to unlock pieces
- No user accounts or login required
- Simple unlock codes like: `mountain_landscape_2024_piece_0_0`

### 3. **Real-time Updates**
- WebSocket connection for instant updates
- All connected displays update simultaneously
- Visitor count and progress tracking
- Celebration animations for completed puzzles

## 🚀 Quick Start

### 1. **Setup Database**
```bash
# Install dependencies
pnpm install

# Create .env.local with your MongoDB connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/puzzle_db

# Seed the database with sample puzzles
npx tsx lib/seed-database.ts
```

### 2. **Start the Server**
```bash
pnpm dev
```

### 3. **Access the System**
- **Big Screen**: `http://localhost:3000/exhibition-dashboard`
- **QR Scanner**: `http://localhost:3000/qr-scanner`
- **Home Page**: `http://localhost:3000`

## 📱 QR Code Generation

After running the seeder, you'll get instructions for creating QR codes:

1. **Use an online QR generator** (e.g., qr-code-generator.com)
2. **Enter unlock codes** for each piece
3. **Print and place** around the exhibition venue
4. **Each QR code** unlocks one specific puzzle piece

## 🎮 Exhibition Flow

### For Visitors:
1. **Find QR codes** placed around the venue
2. **Scan with phone** or enter code manually
3. **Watch piece unlock** on the big screen
4. **Collaborate** with others to complete puzzles

### For Exhibition Staff:
1. **Display dashboard** on large screen/TV
2. **Monitor progress** in real-time
3. **Track visitor engagement**
4. **Celebrate completions** with the crowd

## 🔧 System Features

- **No User Management**: Simple, anonymous participation
- **Real-time Updates**: Instant piece unlocking feedback
- **Visitor Tracking**: Count participants and engagement
- **Progress Visualization**: Beautiful progress bars and stats
- **Mobile Friendly**: Works on any device
- **Exhibition Ready**: Designed for public events

## 📊 Sample Puzzles Included

- **Mountain Landscape** (4x6) - Easy
- **Vintage Street Scene** (5x7) - Medium  
- **Ocean Sunset** (6x8) - Hard
- **City Skyline** (4x5) - Easy
- **Forest Path** (5x6) - Medium

## 🌐 API Endpoints

- `GET /api/exhibition` - Exhibition dashboard data
- `POST /api/unlock` - Unlock puzzle pieces
- `GET /api/puzzles` - List all puzzles
- WebSocket events for real-time updates

## 🎨 Customization

### Add New Puzzles:
1. Update `lib/seed-database.ts`
2. Add puzzle data with unique unlock codes
3. Run seeder again

### Modify Display:
1. Edit `components/exhibition-dashboard.tsx`
2. Customize colors, layout, and animations
3. Add your branding and styling

### Change Unlock System:
1. Modify `app/api/unlock/route.ts`
2. Add validation or additional logic
3. Integrate with other systems if needed

## 🚨 Important Notes

- **No Authentication**: Anyone can unlock pieces
- **Public Access**: All endpoints are publicly accessible
- **Real-time**: Requires WebSocket connection
- **MongoDB**: Requires active database connection
- **Exhibition Use**: Designed for public events, not private use

## 🎉 Perfect For

- **Exhibitions & Trade Shows**
- **Museums & Galleries**
- **Corporate Events**
- **Educational Workshops**
- **Team Building Activities**
- **Public Installations**

## 🆘 Troubleshooting

### Database Connection Issues:
- Check MongoDB connection string
- Verify network access
- Check database permissions

### WebSocket Issues:
- Ensure server is running
- Check browser console for errors
- Verify CORS settings

### QR Code Problems:
- Double-check unlock codes
- Verify API endpoint accessibility
- Check network connectivity

---

**Ready to create an engaging puzzle exhibition?** 🎯

Start with the seeder, generate your QR codes, and watch the magic happen in real-time!
