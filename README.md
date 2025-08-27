# Collaborative Puzzle Application

A real-time collaborative jigsaw puzzle application built with Next.js and WebSocket technology. Users can scan QR codes to access individual puzzle pieces and complete them collaboratively.

## Features

- **Real-time Collaboration**: Multiple users can work on the same puzzle simultaneously
- **QR Code Integration**: Each puzzle piece has a unique QR code for easy access
- **WebSocket Communication**: Live updates when pieces are completed
- **Responsive Design**: Works on desktop and mobile devices
- **Progress Tracking**: Real-time progress indicators and user activity

## How It Works

1. **Main Puzzle Board** (`/`) - Shows the overall puzzle with QR codes for incomplete pieces
2. **QR Codes Page** (`/qr-codes`) - Displays all QR codes for printing/scanning
3. **Individual Piece Pages** (`/piece/[id]`) - Where users scan QR codes to complete pieces

## Real-time Updates

The application uses WebSocket technology to provide real-time updates:
- When someone scans a QR code and completes a piece, all connected users see the update immediately
- Active user count and connection status are displayed
- Recent activity is shown to all participants

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Development

The application uses a custom server (`server.js`) that combines Next.js with Socket.IO for WebSocket functionality. This allows for real-time communication between clients.

### Testing Real-time Features

1. Open the main puzzle page in multiple browser tabs/windows
2. Scan QR codes or navigate to individual piece pages
3. Complete pieces and watch them update in real-time across all tabs
4. Check the real-time status indicators for connection and user count

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main puzzle board
│   ├── qr-codes/          # QR codes page
│   └── piece/[id]/        # Individual piece pages
├── components/            # React components
├── lib/                   # Utilities and API
│   ├── puzzle-api.ts      # Puzzle API functions
│   ├── puzzle-store.ts    # Data store
│   ├── realtime-sync.ts   # WebSocket client
│   └── types.ts           # TypeScript types
├── server.js              # WebSocket server
└── package.json
```

## Technologies Used

- **Next.js 15** - React framework
- **Socket.IO** - WebSocket communication
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **QR Code API** - QR code generation

## Deployment

For production deployment, you'll need to:

1. Update the WebSocket URL in `lib/realtime-sync.ts` to match your domain
2. Configure CORS settings in `server.js` for your production domain
3. Set up environment variables as needed

## Contributing

This is a collaborative puzzle application designed for events and team-building activities. The real-time nature makes it perfect for group activities where participants can work together to complete a puzzle.