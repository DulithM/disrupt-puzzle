const { createServer } = require('http')
const { Server } = require('socket.io')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

// Store active connections
const activeConnections = new Map() // puzzleId -> Set of socketIds
const socketToPuzzle = new Map() // socketId -> puzzleId
const socketToUser = new Map() // socketId -> userId

app.prepare().then(() => {
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
    console.log('Client connected:', socket.id)

    // Join puzzle room
    socket.on('join_puzzle', (data) => {
      const { puzzleId, userId } = data
      
      // Leave previous puzzle if any
      const previousPuzzle = socketToPuzzle.get(socket.id)
      if (previousPuzzle) {
        socket.leave(previousPuzzle)
        const connections = activeConnections.get(previousPuzzle)
        if (connections) {
          connections.delete(socket.id)
          if (connections.size === 0) {
            activeConnections.delete(previousPuzzle)
          }
        }
      }

      // Join new puzzle
      socket.join(puzzleId)
      socketToPuzzle.set(socket.id, puzzleId)
      socketToUser.set(socket.id, userId)

      // Track active connections
      if (!activeConnections.has(puzzleId)) {
        activeConnections.set(puzzleId, new Set())
      }
      activeConnections.get(puzzleId).add(socket.id)

      // Notify others in the puzzle
      socket.to(puzzleId).emit('user_joined', {
        userId,
        userCount: activeConnections.get(puzzleId).size,
        timestamp: new Date()
      })

      // Send current user count to the joining user
      socket.emit('puzzle_joined', {
        userCount: activeConnections.get(puzzleId).size,
        timestamp: new Date()
      })

      console.log(`User ${userId} joined puzzle ${puzzleId}`)
    })

    // Handle piece placement
    socket.on('piece_placed', (data) => {
      const { puzzleId, pieceId, placedBy } = data
      
      // Broadcast to all users in the puzzle
      io.to(puzzleId).emit('piece_placed', {
        pieceId,
        placedBy,
        timestamp: new Date()
      })

      console.log(`Piece ${pieceId} placed by ${placedBy} in puzzle ${puzzleId}`)
    })

    // Handle puzzle update
    socket.on('puzzle_updated', (data) => {
      const { puzzleId, puzzle } = data
      
      // Broadcast to all users in the puzzle
      io.to(puzzleId).emit('puzzle_updated', {
        puzzle,
        timestamp: new Date()
      })

      console.log(`Puzzle ${puzzleId} updated`)
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      const puzzleId = socketToPuzzle.get(socket.id)
      const userId = socketToUser.get(socket.id)

      if (puzzleId) {
        // Remove from tracking
        const connections = activeConnections.get(puzzleId)
        if (connections) {
          connections.delete(socket.id)
          if (connections.size === 0) {
            activeConnections.delete(puzzleId)
          }
        }

        // Notify others
        socket.to(puzzleId).emit('user_left', {
          userId,
          userCount: activeConnections.get(puzzleId)?.size || 0,
          timestamp: new Date()
        })
      }

      // Clean up
      socketToPuzzle.delete(socket.id)
      socketToUser.delete(socket.id)

      console.log('Client disconnected:', socket.id)
    })
  })

  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`)
  })
})
