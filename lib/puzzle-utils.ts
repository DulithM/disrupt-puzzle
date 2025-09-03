import { puzzleApi } from './puzzle-api'
import type { Puzzle } from './types'

export async function findCurrentActivePuzzle(puzzles: Puzzle[]): Promise<{ activeIndex: number; activePuzzle: Puzzle | null }> {
  console.log('🔍 Finding current active puzzle...')
  
  // Prefer server-provided active
  const activeNext = await puzzleApi.getActiveAndNext()
  if (activeNext.active) {
    const activeId = (activeNext.active as any)._id || (activeNext.active as any).id
    const index = puzzles.findIndex(p => ((p as any)._id || (p as any).id) === activeId)
    if (index !== -1) {
      console.log(`✅ Using server-provided active puzzle: ${activeNext.active.title} at index ${index}`)
      return { activeIndex: index, activePuzzle: activeNext.active }
    }
  }
  
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
  
  // If all puzzles are completed, return the first one but don't trigger reset
  // This allows users to revisit completed puzzles
  console.log('🔄 All puzzles completed, returning first puzzle for revisiting')
  const firstPuzzle = puzzles[0]
  const firstPuzzleId = firstPuzzle.id || (firstPuzzle as any)._id
  
  if (firstPuzzleId) {
    try {
      // Load the first puzzle so it can be displayed (without resetting)
      const loadedPuzzle = await puzzleApi.getPuzzle(firstPuzzleId)
      console.log(`🔄 Returning first puzzle for revisiting: ${loadedPuzzle?.title || 'Unknown'}`)
      return { activeIndex: 0, activePuzzle: loadedPuzzle }
    } catch (error) {
      console.error('❌ Error loading first puzzle for revisiting:', error)
    }
  }
  
  return { activeIndex: 0, activePuzzle: null }
}
