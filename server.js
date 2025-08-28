const { createServer } = require('http')
const { Server } = require('socket.io')
const next = require('next')
const mongoose = require('mongoose')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mayakaduwadulith_db_user:bfWrGg3yKmx5TeFc@puzzle.hvofcqf.mongodb.net/?retryWrites=true&w=majority&appName=Puzzle';
const DB_NAME = process.env.MONGODB_DB_NAME || 'puzzle_db';

// Store active connections for exhibition display
const exhibitionConnections = new Map() // exhibitionId -> Set of socketIds
const socketToExhibition = new Map() // socketId -> exhibitionId

// MongoDB connection function
async function connectToDatabase() {
  try {
    if (mongoose.connection.readyState === 1) {
      return; // Already connected
    }
    
    const db = await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    return db;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Simple Puzzle model for server-side use
const PuzzleSchema = new mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
  rows: Number,
  cols: Number,
  pieces: [{
    id: String,
    row: Number,
    col: Number,
    imageUrl: String,
    isPlaced: Boolean,
    unlockCode: String,
    unlockedAt: Date,
    originalPosition: {
      row: Number,
      col: Number
    }
  }],
  isActive: Boolean,
  difficulty: String,
  category: String,
  tags: [String],
  maxPlayers: Number,
  currentPlayers: Number,
  exhibitionId: String,
  unlockCode: String,
  isUnlocked: Boolean,
  unlockedAt: Date,
  completedAt: Date
}, { timestamps: true });

const Puzzle = mongoose.models.Puzzle || mongoose.model('Puzzle', PuzzleSchema);

// Simple PuzzleSession model for server-side use
const PuzzleSessionSchema = new mongoose.Schema({
  puzzleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Puzzle' },
  sessionId: String,
  isActive: Boolean,
  startedAt: Date,
  endedAt: Date,
  currentState: {
    placedPieces: [String],
    lastPiecePlacedAt: Date,
    completionPercentage: Number,
    unlockedPieces: [String]
  },
  settings: {
    maxPlayers: Number,
    allowSpectators: Boolean,
    timeLimit: Number
  },
  exhibitionId: String,
  visitorCount: Number,
  lastActivityAt: Date
}, { timestamps: true });

const PuzzleSession = mongoose.models.PuzzleSession || mongoose.model('PuzzleSession', PuzzleSessionSchema);

app.prepare().then(async () => {
  // Connect to MongoDB
  try {
    await connectToDatabase()
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error)
    process.exit(1)
  }

  const server = createServer((req, res) => {
    handle(req, res)
  })

  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.com'] 
        : ['http://localhost:3000'],
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    console.log('Exhibition display connected:', socket.id)

    // Join exhibition room for big screen display
    socket.on('join_exhibition', async (data) => {
      const { exhibitionId = 'main-exhibition' } = data
      
      try {
        // Leave previous exhibition if any
        const previousExhibition = socketToExhibition.get(socket.id)
        if (previousExhibition) {
          socket.leave(previousExhibition)
          const connections = exhibitionConnections.get(previousExhibition)
          if (connections) {
            connections.delete(socket.id)
            if (connections.size === 0) {
              exhibitionConnections.delete(previousExhibition)
            }
          }
        }

        // Join new exhibition
        socket.join(exhibitionId)
        socketToExhibition.set(socket.id, exhibitionId)

        // Track active connections
        if (!exhibitionConnections.has(exhibitionId)) {
          exhibitionConnections.set(exhibitionId, new Set())
        }
        exhibitionConnections.get(exhibitionId).add(socket.id)

        console.log(`Exhibition display joined: ${exhibitionId}`)
        
        // Send current exhibition data
        socket.emit('exhibition_joined', {
          exhibitionId,
          timestamp: new Date()
        })
        
      } catch (error) {
        console.error('Error joining exhibition:', error)
        socket.emit('error', { message: 'Failed to join exhibition' })
      }
    })

    // Handle piece unlock (from QR code scanning)
    socket.on('piece_unlocked', async (data) => {
      const { unlockCode, exhibitionId = 'main-exhibition' } = data
      
      try {
        // Find puzzle piece by unlock code
        const puzzle = await Puzzle.findOne({
          'pieces.unlockCode': unlockCode,
          isActive: true
        })
        
        if (puzzle) {
          // Find the specific piece
          const piece = puzzle.pieces.find(p => p.unlockCode === unlockCode)
          if (piece && !piece.unlockedAt) {
            // Unlock the piece
            piece.unlockedAt = new Date()
            await puzzle.save()
            
            // Get or create session
            let session = await PuzzleSession.findOne({
              puzzleId: puzzle._id,
              isActive: true,
              exhibitionId
            })
            
            if (!session) {
              session = new PuzzleSession({
                puzzleId: puzzle._id,
                sessionId: `exhibition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                exhibitionId,
                settings: {
                  maxPlayers: puzzle.maxPlayers,
                  allowSpectators: true
                }
              })
            }
            
            // Update session
            if (!session.currentState.unlockedPieces.includes(unlockCode)) {
              session.currentState.unlockedPieces.push(unlockCode)
            }
            session.lastActivityAt = new Date()
            session.visitorCount += 1
            await session.save()
            
            // Check if puzzle is completed
            const allPiecesUnlocked = puzzle.pieces.every(p => p.unlockedAt)
            if (allPiecesUnlocked && !puzzle.completedAt) {
              puzzle.completedAt = new Date()
              puzzle.isUnlocked = true
              puzzle.unlockedAt = new Date()
              await puzzle.save()
            }
            
            // Broadcast to all exhibition displays
            io.to(exhibitionId).emit('piece_unlocked', {
              unlockCode,
              pieceId: piece.id,
              puzzleId: puzzle._id,
              puzzleTitle: puzzle.title,
              isCompleted: !!puzzle.completedAt,
              completionPercentage: Math.round((puzzle.pieces.filter(p => p.unlockedAt).length / puzzle.pieces.length) * 100),
              visitorCount: session.visitorCount,
              timestamp: new Date()
            })
            
            console.log(`Piece ${piece.id} unlocked in puzzle ${puzzle.title}`)
          }
        }
      } catch (error) {
        console.error('Error handling piece unlock:', error)
        socket.emit('error', { message: 'Failed to unlock piece' })
      }
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      const exhibitionId = socketToExhibition.get(socket.id)

      if (exhibitionId) {
        // Remove from tracking
        const connections = exhibitionConnections.get(exhibitionId)
        if (connections) {
          connections.delete(socket.id)
          if (connections.size === 0) {
            exhibitionConnections.delete(exhibitionId)
          }
        }
      }

      // Clean up
      socketToExhibition.delete(socket.id)

      console.log('Exhibition display disconnected:', socket.id)
    })
  })

  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    console.log(`> Exhibition server ready on http://localhost:${PORT}`)
  })
})
