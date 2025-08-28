import { puzzleApi } from './puzzle-api'
import type { Puzzle } from './types'

export async function findCurrentActivePuzzle(puzzles: Puzzle[]): Promise<{ activeIndex: number; activePuzzle: Puzzle | null }> {
  console.log('🔍 Finding current active puzzle...')
  
  // Find the first incomplete puzzle
  for (let i = 0; i < puzzles.length; i++) {
    const puzzleData = puzzles[i]
    const puzzleId = puzzleData.id || (puzzleData as any)._id
    
    if (puzzleId) {
      try {
        const loadedPuzzle = await puzzleApi.getPuzzle(puzzleId)
        if (loadedPuzzle) {
          console.log(`🔍 Checking puzzle ${i + 1}: ${loadedPuzzle.title}`)
          console.log(`🔍 Completed pieces: ${loadedPuzzle.pieces.filter(p => p.isPlaced).length}/${loadedPuzzle.pieces.length}`)
          console.log(`🔍 Puzzle completed: ${!!loadedPuzzle.completedAt}`)
          
          if (!loadedPuzzle.completedAt) {
            console.log(`✅ Found active puzzle: ${loadedPuzzle.title} at index ${i}`)
            return { activeIndex: i, activePuzzle: loadedPuzzle }
          }
        }
      } catch (error) {
        console.error(`❌ Error loading puzzle ${i}:`, error)
      }
    }
  }
  
  // If all puzzles are completed, return the first one (will be reset)
  console.log('🔄 All puzzles completed, returning first puzzle')
  const firstPuzzle = puzzles[0]
  const firstPuzzleId = firstPuzzle.id || (firstPuzzle as any)._id
  
  if (firstPuzzleId) {
    try {
      const loadedPuzzle = await puzzleApi.getPuzzle(firstPuzzleId)
      return { activeIndex: 0, activePuzzle: loadedPuzzle }
    } catch (error) {
      console.error('❌ Error loading first puzzle:', error)
    }
  }
  
  return { activeIndex: 0, activePuzzle: null }
}
