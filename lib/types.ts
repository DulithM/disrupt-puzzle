export interface PuzzlePiece {
  id: string
  puzzleId: string
  row: number
  col: number
  imageUrl: string
  isPlaced: boolean
  placedBy?: string
  placedAt?: Date
}

export interface Puzzle {
  id: string
  title: string
  description: string
  imageUrl: string
  rows: number
  cols: number
  pieces: PuzzlePiece[]
  createdAt: Date
  completedAt?: Date
}

export interface PuzzleState {
  puzzle: Puzzle | null
  loading: boolean
  error: string | null
}
