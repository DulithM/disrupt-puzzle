import type { Puzzle, PuzzlePiece } from "./types"

// API functions that make actual HTTP requests to the database
export const puzzleApi = {
  async getPuzzle(id: string): Promise<Puzzle | null> {
    try {
      console.log('🔍 Fetching puzzle with ID:', id)
      
      // For mock data, return the first puzzle if ID is mock-1 or mock-2
      if (id.startsWith('mock-')) {
        console.log('🎭 Using mock puzzle data for ID:', id)
        const mockResponse = await fetch('/api/puzzles-mock')
        if (mockResponse.ok) {
          const mockData = await mockResponse.json()
          const mockPuzzle = mockData.data.find((p: any) => p._id === id)
          if (mockPuzzle) {
            // Add some mock pieces for the puzzle
            mockPuzzle.pieces = Array.from({ length: mockPuzzle.rows * mockPuzzle.cols }, (_, i) => ({
              id: `piece-${i}`,
              row: Math.floor(i / mockPuzzle.cols),
              col: i % mockPuzzle.cols,
              imageUrl: mockPuzzle.imageUrl,
              isPlaced: false,
              unlockCode: `${mockPuzzle.unlockCode}_piece_${i}`,
              originalPosition: {
                row: Math.floor(i / mockPuzzle.cols),
                col: i % mockPuzzle.cols
              }
            }))
            return mockPuzzle
          }
        }
      }
      
      // For piece IDs (like piece-0, piece-1, etc.), return the first mock puzzle
      if (id.startsWith('piece-')) {
        console.log('🎭 Using mock puzzle data for piece ID:', id)
        const mockResponse = await fetch('/api/puzzles-mock')
        if (mockResponse.ok) {
          const mockData = await mockResponse.json()
          const mockPuzzle = mockData.data[0] // Use first puzzle
          if (mockPuzzle) {
            // Add mock pieces for the puzzle
            mockPuzzle.pieces = Array.from({ length: mockPuzzle.rows * mockPuzzle.cols }, (_, i) => ({
              id: `piece-${i}`,
              row: Math.floor(i / mockPuzzle.cols),
              col: i % mockPuzzle.cols,
              imageUrl: mockPuzzle.imageUrl,
              isPlaced: false,
              unlockCode: `${mockPuzzle.unlockCode}_piece_${i}`,
              originalPosition: {
                row: Math.floor(i / mockPuzzle.cols),
                col: i % mockPuzzle.cols
              }
            }))
            return mockPuzzle
          }
        }
      }
      
      // Try the main endpoint
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

      // Check if we're using mock data
      const isMockData = puzzleId.startsWith('mock-') || puzzleId.startsWith('piece-')
      
      if (isMockData) {
        console.log('🎭 Using mock piece placement for:', pieceId)
        // For mock data, just simulate success
        console.log('✅ Mock piece placed successfully!')
        return
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
      
      // Try the main endpoint first
      let response = await fetch('/api/puzzles')
      
      // If main endpoint fails, fallback to mock data
      if (!response.ok) {
        console.log('⚠️ Main puzzles endpoint failed, using mock data...')
        response = await fetch('/api/puzzles-mock')
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch puzzles: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('📦 All puzzles data received:', data)
      
      // If this is mock data, populate pieces for each puzzle
      if (data.message && data.message.includes('Mock data')) {
        console.log('🎭 Populating pieces for mock puzzles...')
        const puzzlesWithPieces = data.data.map((puzzle: any) => ({
          ...puzzle,
          pieces: Array.from({ length: puzzle.rows * puzzle.cols }, (_, i) => ({
            id: `piece-${i}`,
            row: Math.floor(i / puzzle.cols),
            col: i % puzzle.cols,
            imageUrl: puzzle.imageUrl,
            isPlaced: false,
            unlockCode: `${puzzle.unlockCode}_piece_${i}`,
            originalPosition: {
              row: Math.floor(i / puzzle.cols),
              col: i % puzzle.cols
            }
          }))
        }))
        return puzzlesWithPieces
      }
      
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
