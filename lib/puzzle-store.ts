import type { Puzzle, PuzzlePiece } from "./types"
import { storageUtils, STORAGE_KEYS } from "./storage-utils"

// Puzzle store with localStorage persistence
class PuzzleStore {
  private puzzles: Map<string, Puzzle> = new Map()
  private listeners: Set<(puzzle: Puzzle) => void> = new Set()

  // Initialize with a sample puzzle
  constructor() {
    this.loadFromStorage()
    if (this.puzzles.size === 0) {
      this.createSamplePuzzle()
    }
  }

  private createSamplePuzzle() {
    const puzzleId = "sample-puzzle-1"
    const rows = 4
    const cols = 6
    const pieces: PuzzlePiece[] = []

    // Create puzzle pieces - all initially unplaced
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const pieceId = `${puzzleId}-${row}-${col}`

        pieces.push({
          id: pieceId,
          puzzleId,
          row,
          col,
          imageUrl: `/vintage-street-scene.png`,
          isPlaced: false,
          placedBy: undefined,
          placedAt: undefined,
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
    this.saveToStorage()
  }

  private loadFromStorage(): void {
    try {
      const data = storageUtils.load(STORAGE_KEYS.PUZZLE_STATE)
      if (data && data.puzzles) {
        // Convert stored data back to Puzzle objects with proper Date objects
        const puzzles = data.puzzles.map((puzzleData: any) => ({
          ...puzzleData,
          createdAt: new Date(puzzleData.createdAt),
          completedAt: puzzleData.completedAt ? new Date(puzzleData.completedAt) : undefined,
          pieces: puzzleData.pieces.map((pieceData: any) => ({
            ...pieceData,
            placedAt: pieceData.placedAt ? new Date(pieceData.placedAt) : undefined,
          }))
        }))
        
        this.puzzles = new Map(puzzles.map((puzzle: Puzzle) => [puzzle.id, puzzle]))
      }
    } catch (error) {
      console.error('Failed to load puzzle state from localStorage:', error)
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        puzzles: Array.from(this.puzzles.values())
      }
      storageUtils.save(STORAGE_KEYS.PUZZLE_STATE, data)
    } catch (error) {
      console.error('Failed to save puzzle state to localStorage:', error)
    }
  }

  getPuzzle(id: string): Puzzle | null {
    return this.puzzles.get(id) || null
  }

  updatePiece(pieceId: string, updates: Partial<PuzzlePiece>): void {
    for (const puzzle of this.puzzles.values()) {
      const piece = puzzle.pieces.find((p) => p.id === pieceId)
      if (piece) {
        Object.assign(piece, updates)
        this.saveToStorage()
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

  // Method to reset the puzzle (useful for testing)
  resetPuzzle(puzzleId: string): void {
    const puzzle = this.puzzles.get(puzzleId)
    if (puzzle) {
      puzzle.pieces.forEach(piece => {
        piece.isPlaced = false
        piece.placedBy = undefined
        piece.placedAt = undefined
      })
      puzzle.completedAt = undefined
      this.saveToStorage()
      this.notifyListeners(puzzle)
    }
  }

  // Method to check if puzzle is completed
  isPuzzleCompleted(puzzleId: string): boolean {
    const puzzle = this.puzzles.get(puzzleId)
    if (!puzzle) return false
    
    const allPiecesPlaced = puzzle.pieces.every(piece => piece.isPlaced)
    if (allPiecesPlaced && !puzzle.completedAt) {
      puzzle.completedAt = new Date()
      this.saveToStorage()
    }
    
    return allPiecesPlaced
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
