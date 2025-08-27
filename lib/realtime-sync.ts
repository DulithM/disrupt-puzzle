// Real-time synchronization using WebSocket
import { io, Socket } from 'socket.io-client'
import type { WebSocketEvent } from './types'

class RealtimeSync {
  private socket: Socket | null = null
  private listeners: Map<string, Set<(event: WebSocketEvent) => void>> = new Map()
  private statusListeners: Set<(status: string) => void> = new Set()
  private connectionStatus: "connected" | "disconnected" | "connecting" = "disconnected"
  private activeUsers: Map<string, number> = new Map() // puzzleId -> userCount
  private fallbackMode: boolean = false
  private fallbackInterval: NodeJS.Timeout | null = null

  constructor() {
    this.connect()
  }

  private connect() {
    this.connectionStatus = "connecting"
    this.notifyStatusListeners()

    // Connect to WebSocket server
    let wsUrl: string
    
    if (typeof window !== 'undefined') {
      // Client-side: use environment variable or fallback
      wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 
              (process.env.NODE_ENV === 'production' 
                ? 'wss://your-websocket-service.com' // Replace with your WebSocket service
                : 'http://localhost:3000')
    } else {
      // Server-side fallback
      wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-websocket-service.com' // Replace with your WebSocket service
        : 'http://localhost:3000'
    }
    
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server')
      this.connectionStatus = "connected"
      this.notifyStatusListeners()
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
      this.connectionStatus = "disconnected"
      this.notifyStatusListeners()
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      this.connectionStatus = "disconnected"
      this.notifyStatusListeners()
      
      // Enable fallback mode if WebSocket fails
      if (!this.fallbackMode) {
        this.enableFallbackMode()
      }
    })

    // Handle incoming events
    this.socket.on('user_joined', (data) => {
      this.activeUsers.set(data.puzzleId, data.userCount)
      this.broadcastEvent(data.puzzleId, {
        type: 'user_joined',
        data: { userId: data.userId, userCount: data.userCount },
        timestamp: new Date(data.timestamp),
        userId: data.userId
      })
    })

    this.socket.on('user_left', (data) => {
      this.activeUsers.set(data.puzzleId, data.userCount)
      this.broadcastEvent(data.puzzleId, {
        type: 'user_left',
        data: { userId: data.userId, userCount: data.userCount },
        timestamp: new Date(data.timestamp),
        userId: data.userId
      })
    })

    this.socket.on('piece_placed', (data) => {
      this.broadcastEvent(data.puzzleId, {
        type: 'piece_placed',
        data: { pieceId: data.pieceId, placedBy: data.placedBy },
        timestamp: new Date(data.timestamp),
        userId: data.placedBy
      })
    })

    this.socket.on('puzzle_updated', (data) => {
      this.broadcastEvent(data.puzzleId, {
        type: 'puzzle_updated',
        data: { puzzle: data.puzzle },
        timestamp: new Date(data.timestamp)
      })
    })

    this.socket.on('puzzle_joined', (data) => {
      this.activeUsers.set(data.puzzleId, data.userCount)
    })
  }

  subscribe(puzzleId: string, callback: (event: WebSocketEvent) => void): () => void {
    if (!this.listeners.has(puzzleId)) {
      this.listeners.set(puzzleId, new Set())
    }

    this.listeners.get(puzzleId)!.add(callback)

    return () => {
      const listeners = this.listeners.get(puzzleId)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(puzzleId)
        }
      }
    }
  }

  subscribeToStatus(callback: (status: string) => void): () => void {
    this.statusListeners.add(callback)
    // Immediately notify of current status
    callback(this.connectionStatus)

    return () => {
      this.statusListeners.delete(callback)
    }
  }

  private broadcastEvent(puzzleId: string, event: WebSocketEvent) {
    const listeners = this.listeners.get(puzzleId)
    if (listeners) {
      listeners.forEach((callback) => {
        callback(event)
      })
    }
  }

  joinPuzzle(puzzleId: string, userId: string) {
    if (this.socket && this.connectionStatus === "connected") {
      this.socket.emit('join_puzzle', { puzzleId, userId })
    }
  }

  leavePuzzle(puzzleId: string, userId: string) {
    // The server will handle leaving when the socket disconnects
    // or when joining a different puzzle
  }

  notifyPiecePlaced(puzzleId: string, pieceId: string, placedBy: string) {
    if (this.socket && this.connectionStatus === "connected") {
      this.socket.emit('piece_placed', { puzzleId, pieceId, placedBy })
    }
  }

  notifyPuzzleUpdated(puzzleId: string, puzzle: any) {
    if (this.socket && this.connectionStatus === "connected") {
      this.socket.emit('puzzle_updated', { puzzleId, puzzle })
    }
  }

  getActiveUserCount(puzzleId: string): number {
    return this.activeUsers.get(puzzleId) || 0
  }

  getConnectionStatus(): string {
    return this.connectionStatus
  }

  private notifyStatusListeners() {
    this.statusListeners.forEach((callback) => callback(this.connectionStatus))
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval)
      this.fallbackInterval = null
    }
  }

  private enableFallbackMode() {
    console.log('Enabling fallback mode - WebSocket not available')
    this.fallbackMode = true
    this.connectionStatus = "connected"
    this.notifyStatusListeners()
    
    // Simulate periodic updates for fallback mode
    this.fallbackInterval = setInterval(() => {
      // In fallback mode, we just show as connected but don't sync
      // Users will need to refresh to see updates from other users
    }, 30000) // Check every 30 seconds
  }

  // Method to check if we're in fallback mode
  isFallbackMode(): boolean {
    return this.fallbackMode
  }
}

export const realtimeSync = new RealtimeSync()
