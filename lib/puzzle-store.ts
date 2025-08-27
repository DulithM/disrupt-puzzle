import type { Puzzle, PuzzlePiece } from "./types"

// Mock data store - in a real app this would be replaced with Supabase
class PuzzleStore {
  private puzzles: Map<string, Puzzle> = new Map()
  private listeners: Set<(puzzle: Puzzle) => void> = new Set()

  // Initialize with a sample puzzle
  constructor() {
    this.createSamplePuzzle()
  }

  private createSamplePuzzle() {
    const puzzleId = "sample-puzzle-1"
    const rows = 4
    const cols = 6
    const pieces: PuzzlePiece[] = []

    // Create puzzle pieces
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const pieceId = `${puzzleId}-${row}-${col}`
        const isCompleted = Math.random() > 0.5

        pieces.push({
          id: pieceId,
          puzzleId,
          row,
          col,
          imageUrl: `/vintage-street-scene.png`,
          isPlaced: isCompleted,
          placedBy: isCompleted ? `User${Math.floor(Math.random() * 10) + 1}` : undefined,
          placedAt: isCompleted ? new Date(Date.now() - Math.random() * 86400000) : undefined,
        })
      }
    }

    const puzzle: Puzzle = {
      id: puzzleId,
      title: "Vintage British Street Scene",
      description:
        "A collaborative jigsaw puzzle featuring a charming vintage British street with cobblestones, brick houses, and period characters",
      imageUrl: "/vintage-street-scene.png",
      rows,
      cols,
      pieces,
      createdAt: new Date(),
    }

    this.puzzles.set(puzzleId, puzzle)
  }

  getPuzzle(id: string): Puzzle | null {
    return this.puzzles.get(id) || null
  }

  updatePiece(pieceId: string, updates: Partial<PuzzlePiece>): void {
    for (const puzzle of this.puzzles.values()) {
      const piece = puzzle.pieces.find((p) => p.id === pieceId)
      if (piece) {
        Object.assign(piece, updates)
        this.notifyListeners(puzzle)
        break
      }
    }
  }

  placePiece(pieceId: string, placedBy: string): void {
    this.updatePiece(pieceId, {
      isPlaced: true,
      placedBy,
      placedAt: new Date(),
    })
  }

  subscribe(listener: (puzzle: Puzzle) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(puzzle: Puzzle): void {
    this.listeners.forEach((listener) => listener(puzzle))
  }

  getAllPuzzles(): Puzzle[] {
    return Array.from(this.puzzles.values())
  }
}

export const puzzleStore = new PuzzleStore()
