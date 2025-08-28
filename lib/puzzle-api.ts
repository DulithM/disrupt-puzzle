import type { Puzzle, PuzzlePiece } from "./types"

// API functions that make actual HTTP requests to the database
export const puzzleApi = {
  async getPuzzle(id: string): Promise<Puzzle | null> {
    try {
      console.log('🔍 Fetching puzzle with ID:', id)
      const response = await fetch(`/api/puzzles/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch puzzle: ${response.statusText}`)
      }
      const data = await response.json()
      console.log('📦 Puzzle data received:', data)
      return data.success ? data.data : null
    } catch (error) {
      console.error('Error fetching puzzle:', error)
      return null
    }
  },

  async placePiece(pieceId: string, placedBy: string): Promise<void> {
    try {
      console.log('🔍 Placing piece:', pieceId, 'by:', placedBy)
      
      // First, find which puzzle this piece belongs to
      const puzzles = await this.getAllPuzzles()
      console.log('🔍 Found puzzles:', puzzles.length)
      
      const puzzle = puzzles.find((p) => p.pieces.some((piece) => piece.id === pieceId))
      
      if (!puzzle) {
        throw new Error('Puzzle not found for piece')
      }

      // Get the correct puzzle ID (handle both id and _id fields)
      const puzzleId = puzzle.id || (puzzle as any)._id
      console.log('🔍 Using puzzle ID:', puzzleId)
      
      if (!puzzleId) {
        throw new Error('Puzzle ID not found')
      }

      // Update the piece in the database
      const response = await fetch(`/api/puzzles/${puzzleId}/pieces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pieceId,
          placedBy,
          isPlaced: true
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API response error:', response.status, errorText)
        throw new Error(`Failed to place piece: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ Piece placement response:', data)
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to place piece')
      }

      console.log('✅ Piece placed successfully!')
      
      // Notify via WebSocket for real-time updates
      this.notifyPiecePlaced(puzzleId, pieceId, placedBy)
    } catch (error) {
      console.error('❌ Error placing piece:', error)
      throw error
    }
  },

  async getPiece(pieceId: string): Promise<PuzzlePiece | null> {
    try {
      // Get all puzzles and find the piece
      const puzzles = await this.getAllPuzzles()
      for (const puzzle of puzzles) {
        const piece = puzzle.pieces.find((p) => p.id === pieceId)
        if (piece) return piece
      }
      return null
    } catch (error) {
      console.error('Error fetching piece:', error)
      return null
    }
  },

  async getAllPuzzles(): Promise<Puzzle[]> {
    try {
      console.log('🔍 Fetching all puzzles...')
      const response = await fetch('/api/puzzles')
      if (!response.ok) {
        throw new Error(`Failed to fetch puzzles: ${response.statusText}`)
      }
      const data = await response.json()
      console.log('📦 All puzzles data received:', data)
      return data.success ? data.data : []
    } catch (error) {
      console.error('Error fetching puzzles:', error)
      return []
    }
  },

  subscribe(puzzleId: string, callback: (puzzle: Puzzle) => void): () => void {
    // Set up polling to check for updates since we're not using WebSocket in the frontend
    const interval = setInterval(async () => {
      try {
        const puzzle = await this.getPuzzle(puzzleId)
        if (puzzle) {
          callback(puzzle)
        }
      } catch (error) {
        console.error('Error in puzzle subscription:', error)
      }
    }, 2000) // Check every 2 seconds

    // Return unsubscribe function
    return () => {
      clearInterval(interval)
    }
  },

  // Helper method to notify WebSocket (if needed)
  private notifyPiecePlaced(puzzleId: string, pieceId: string, placedBy: string): void {
    // This could be used to notify other clients via WebSocket
    // For now, we'll rely on the polling subscription
    console.log(`Piece ${pieceId} placed by ${placedBy} in puzzle ${puzzleId}`)
  }
}
