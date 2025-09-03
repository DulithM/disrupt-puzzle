export interface PuzzlePiece {
  id: string
  row: number
  col: number
  imageUrl: string
  isPlaced: boolean
  unlockCode: string
  unlockedAt?: Date
  originalPosition: {
    row: number
    col: number
  }
}

export interface Puzzle {
  id: string
  title: string
  imageUrl: string
  rows: number
  cols: number
  pieces: PuzzlePiece[]
  unlockCode: string
  isUnlocked: boolean
  unlockedAt?: Date
  completedAt?: Date
  currentlyInUse?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PuzzleState {
  puzzle: Puzzle | null
  loading: boolean
  error: string | null
}

// WebSocket types
export interface NextApiResponseServerIO extends Response {
  socket: any
  server: any
}

export interface WebSocketEvent {
  type: 'piece_placed' | 'puzzle_updated' | 'user_joined' | 'user_left' | 'puzzle_joined'
  data: any
  timestamp: Date
  userId?: string
}
