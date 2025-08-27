// Real-time synchronization using WebSocket-like functionality
// In a production app, this would use Supabase real-time or WebSockets

type SyncEventType = "piece_placed" | "puzzle_updated" | "user_joined" | "user_left"

interface SyncEvent {
  type: SyncEventType
  data: any
  timestamp: Date
  userId?: string
}

class RealtimeSync {
  private listeners: Map<string, Set<(event: SyncEvent) => void>> = new Map()
  private activeUsers: Set<string> = new Set()
  private connectionStatus: "connected" | "disconnected" | "connecting" = "disconnected"
  private statusListeners: Set<(status: string) => void> = new Set()

  constructor() {
    // Simulate connection
    this.connect()
  }

  private connect() {
    this.connectionStatus = "connecting"
    this.notifyStatusListeners()

    // Simulate connection delay
    setTimeout(() => {
      this.connectionStatus = "connected"
      this.notifyStatusListeners()
    }, 1000)
  }

  subscribe(puzzleId: string, callback: (event: SyncEvent) => void): () => void {
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

  broadcast(puzzleId: string, event: SyncEvent) {
    const listeners = this.listeners.get(puzzleId)
    if (listeners) {
      listeners.forEach((callback) => {
        // Simulate network delay
        setTimeout(() => callback(event), Math.random() * 100 + 50)
      })
    }
  }

  joinPuzzle(puzzleId: string, userId: string) {
    this.activeUsers.add(userId)
    this.broadcast(puzzleId, {
      type: "user_joined",
      data: { userId, userCount: this.activeUsers.size },
      timestamp: new Date(),
      userId,
    })
  }

  leavePuzzle(puzzleId: string, userId: string) {
    this.activeUsers.delete(userId)
    this.broadcast(puzzleId, {
      type: "user_left",
      data: { userId, userCount: this.activeUsers.size },
      timestamp: new Date(),
      userId,
    })
  }

  notifyPiecePlaced(puzzleId: string, pieceId: string, placedBy: string) {
    this.broadcast(puzzleId, {
      type: "piece_placed",
      data: { pieceId, placedBy },
      timestamp: new Date(),
      userId: placedBy,
    })
  }

  getActiveUserCount(): number {
    return this.activeUsers.size
  }

  getConnectionStatus(): string {
    return this.connectionStatus
  }

  private notifyStatusListeners() {
    this.statusListeners.forEach((callback) => callback(this.connectionStatus))
  }
}

export const realtimeSync = new RealtimeSync()
