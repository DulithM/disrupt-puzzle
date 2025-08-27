# Real-time Puzzle Demo Guide

## How to Test the WebSocket Functionality

### 1. Start the Application
```bash
pnpm dev
```
The application will be available at http://localhost:3000

### 2. Test Real-time Updates

#### Method 1: Multiple Browser Tabs
1. Open the main puzzle page in multiple browser tabs/windows
2. Navigate to individual piece pages by clicking on QR codes
3. Complete pieces and watch them update in real-time across all tabs
4. Notice the real-time status indicators showing connection and user count

#### Method 2: QR Code Scanning
1. Print the QR codes from `/qr-codes` page
2. Scan QR codes with mobile devices
3. Complete pieces on mobile and see updates on desktop
4. All connected devices will see real-time updates

### 3. Real-time Features to Observe

#### Connection Status
- **Connected**: Green indicator showing WebSocket is active
- **Connecting**: Yellow indicator during connection
- **Disconnected**: Red indicator when connection is lost

#### User Activity
- **Active Users**: Shows number of people currently viewing the puzzle
- **Recent Activity**: Displays recent actions (piece completions, user joins/leaves)
- **Toast Notifications**: Pop-up notifications for real-time events

#### Puzzle Updates
- **Piece Completion**: When someone completes a piece, it immediately appears on all connected devices
- **Progress Bar**: Updates in real-time showing completion percentage
- **Visual Feedback**: Smooth transitions and animations for updates

### 4. WebSocket Events

The application handles these real-time events:

- **`piece_placed`**: When a puzzle piece is completed
- **`user_joined`**: When someone joins the puzzle
- **`user_left`**: When someone leaves the puzzle
- **`puzzle_updated`**: When the entire puzzle state changes

### 5. Technical Implementation

#### Server-side (server.js)
- Socket.IO server handling WebSocket connections
- Room-based communication for each puzzle
- User tracking and activity broadcasting

#### Client-side (lib/realtime-sync.ts)
- Socket.IO client connecting to server
- Event subscription and broadcasting
- Connection status management

#### Components
- **RealtimeStatus**: Shows connection and user count
- **PuzzleNotifications**: Displays toast notifications
- **PuzzleBoard**: Updates puzzle display in real-time

### 6. Testing Scenarios

1. **Multiple Users**: Have 3-4 people join simultaneously
2. **Mobile + Desktop**: Test cross-device functionality
3. **Network Issues**: Disconnect/reconnect to test resilience
4. **Concurrent Actions**: Have multiple people complete pieces at the same time

### 7. Expected Behavior

- ✅ Real-time piece completion updates
- ✅ Live user count and activity
- ✅ Connection status indicators
- ✅ Toast notifications for events
- ✅ Smooth visual transitions
- ✅ Cross-device synchronization

This demonstrates a fully functional real-time collaborative puzzle application using WebSocket technology!
