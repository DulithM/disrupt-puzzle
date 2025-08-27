import { puzzleStore } from "./puzzle-store"
import { realtimeSync } from "./realtime-sync"
import type { Puzzle, PuzzlePiece } from "./types"

// API functions that would normally make HTTP requests
export const puzzleApi = {
  async getPuzzle(id: string): Promise<Puzzle | null> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100))
    return puzzleStore.getPuzzle(id)
  },

  async placePiece(pieceId: string, placedBy: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200))
    puzzleStore.placePiece(pieceId, placedBy)

    const puzzle = puzzleStore.getAllPuzzles().find((p) => p.pieces.some((piece) => piece.id === pieceId))
    if (puzzle) {
      // Notify via WebSocket
      realtimeSync.notifyPiecePlaced(puzzle.id, pieceId, placedBy)
      // Also notify puzzle update
      realtimeSync.notifyPuzzleUpdated(puzzle.id, puzzle)
    }
  },

  async getPiece(pieceId: string): Promise<PuzzlePiece | null> {
    await new Promise((resolve) => setTimeout(resolve, 100))
    const puzzles = puzzleStore.getAllPuzzles()
    for (const puzzle of puzzles) {
      const piece = puzzle.pieces.find((p) => p.id === pieceId)
      if (piece) return piece
    }
    return null
  },

  subscribe(puzzleId: string, callback: (puzzle: Puzzle) => void): () => void {
    const storeUnsubscribe = puzzleStore.subscribe(callback)

    const realtimeUnsubscribe = realtimeSync.subscribe(puzzleId, (event) => {
      if (event.type === "piece_placed" || event.type === "puzzle_updated") {
        // Refresh puzzle data when pieces are placed
        const puzzle = puzzleStore.getPuzzle(puzzleId)
        if (puzzle) {
          callback(puzzle)
        }
      }
    })

    return () => {
      storeUnsubscribe()
      realtimeUnsubscribe()
    }
  },
}
