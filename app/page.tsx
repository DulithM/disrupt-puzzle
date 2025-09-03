"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { puzzleApi } from "@/lib/puzzle-api"
import type { Puzzle } from "@/lib/types"
import { PuzzleBoard } from "@/components/puzzle-board"
import { getActivePuzzleIdLocal, getActivePuzzleIndexLocal, onActivePuzzleChangeLocal, setActivePuzzleLocal } from "@/lib/puzzle-sync"

export default function HomePage() {
  const [allPuzzles, setAllPuzzles] = useState<Puzzle[]>([])
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all puzzles and find the current active one
  useEffect(() => {
    const loadPuzzles = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get all available puzzles
        const puzzles = await puzzleApi.getAllPuzzles()
        console.log('🔍 Main Page - Puzzles received:', puzzles)
        
        if (puzzles.length > 0) {
          setAllPuzzles(puzzles)
          
          // Log the puzzle sequence
          console.log('📋 Main Page - Puzzle Sequence:')
          puzzles.forEach((puzzle, index) => {
            console.log(`  ${index + 1}. ${puzzle.title} (${puzzle.rows}x${puzzle.cols})`)
          })
          
          // Get active and next puzzle from server
          const activeNext = await puzzleApi.getActiveAndNext()
          console.log('🎯 Main Page - Server returned active puzzle:', activeNext.active?.title)
          
          if (activeNext.active) {
            setPuzzle(activeNext.active)
            
            // Find the index of the active puzzle in our local array
            const activeIndex = puzzles.findIndex(p => 
              (p.id || (p as any)._id) === (activeNext.active?.id || (activeNext.active as any)?._id)
            )
            
            if (activeIndex !== -1) {
              setCurrentPuzzleIndex(activeIndex)
              console.log(`✅ Main Page - Active puzzle index: ${activeIndex + 1}/${puzzles.length}`)
              
              // Persist active selection for other pages
              const activeId = activeNext.active.id || (activeNext.active as any)._id
              if (activeId) setActivePuzzleLocal(activeId, activeIndex)
            }
          } else {
            setError("No active puzzle found. Please check the database.")
          }
        } else {
          setError("No puzzles found. Please seed the database first.")
        }
      } catch (error) {
        console.error("Failed to load puzzles:", error)
        setError("Failed to load puzzles. Please check the database connection.")
      } finally {
        setLoading(false)
      }
    }

    loadPuzzles()
  }, [])

  // Load puzzle by index
  const loadPuzzleByIndex = async (index: number) => {
    if (index >= allPuzzles.length) return null
    
    try {
      const puzzleData = allPuzzles[index]
      const puzzleId = puzzleData.id || (puzzleData as any)._id
      
      if (puzzleId) {
        const loadedPuzzle = await puzzleApi.getPuzzle(puzzleId)
        if (loadedPuzzle) {
          console.log(`✅ Main Page - Puzzle ${index + 1}/${allPuzzles.length} loaded:`, loadedPuzzle.title)
          // Persist active selection for other pages
          setActivePuzzleLocal(puzzleId, index)
          return loadedPuzzle
        }
      }
    } catch (error) {
      console.error(`Failed to load puzzle at index ${index}:`, error)
    }
    return null
  }

  // Simple completion handling - reset and go to next
  const handlePuzzleCompletion = async () => {
    console.log(`🎉 Main Page - Puzzle ${currentPuzzleIndex + 1}/${allPuzzles.length} completed!`)
    
    try {
      const currentPuzzleId = puzzle?.id || (puzzle as any)?._id
      
      // 1. Reset the completed puzzle
      console.log('🔄 Main Page - Resetting completed puzzle...')
      await puzzleApi.resetPuzzle(currentPuzzleId)
      
      // 2. Go to next puzzle
      const nextIndex = (currentPuzzleIndex + 1) % allPuzzles.length
      console.log(`🔄 Main Page - Moving to puzzle ${nextIndex + 1}/${allPuzzles.length}`)
      
      const nextPuzzleData = allPuzzles[nextIndex]
      const nextPuzzleId = nextPuzzleData.id || (nextPuzzleData as any)._id
      
      if (nextPuzzleId) {
        const nextPuzzle = await puzzleApi.getPuzzle(nextPuzzleId)
        if (nextPuzzle) {
          setPuzzle(nextPuzzle)
          setCurrentPuzzleIndex(nextIndex)
          
          // Notify other pages about the change
          setActivePuzzleLocal(nextPuzzleId, nextIndex)
          
          console.log(`✅ Main Page - Now viewing: ${nextPuzzle.title}`)
        }
      }
    } catch (error) {
      console.error('❌ Main Page - Error handling completion:', error)
    }
  }

  // Go to a specific puzzle by index (for revisiting)
  const goToPuzzle = async (index: number) => {
    if (index >= 0 && index < allPuzzles.length) {
      console.log(`🔄 Main Page - Manually going to puzzle ${index + 1}/${allPuzzles.length}`)
      setCurrentPuzzleIndex(index)
      const targetPuzzle = await loadPuzzleByIndex(index)
      if (targetPuzzle) {
        setPuzzle(targetPuzzle)
        console.log(`✅ Main Page - Now viewing: ${targetPuzzle.title}`)
      }
    }
  }

  // Test function to manually advance to next puzzle (for debugging)
  const testAdvancePuzzle = async () => {
    console.log('🧪 Main Page - Testing manual puzzle advance...')
    handlePuzzleCompletion()
  }

  useEffect(() => {
    let unsubscribe = () => {}
    let offStorage: (() => void) | null = null

    if (puzzle) {
      // Get the correct puzzle ID for subscription
      const puzzleId = puzzle.id || (puzzle as any)._id
      console.log('🔍 Main Page - Setting up subscription for puzzle:', puzzleId)
      
      if (puzzleId) {
        unsubscribe = puzzleApi.subscribe(puzzleId, (updatedPuzzle) => {
          console.log('🔄 Main Page - Puzzle updated via subscription:', updatedPuzzle.title)
          console.log('🔄 Main Page - New completed pieces:', updatedPuzzle.pieces.filter(p => p.isPlaced).length)
          console.log('🔄 Main Page - Total pieces:', updatedPuzzle.pieces.length)
          
          setPuzzle(updatedPuzzle)
          
          // Simple completion detection
          const completedCount = updatedPuzzle.pieces.filter(p => p.isPlaced).length
          const totalPieces = updatedPuzzle.pieces.length
          const isComplete = totalPieces > 0 && completedCount === totalPieces
          
          console.log(`🔍 Main Page - Puzzle "${updatedPuzzle.title}": ${completedCount}/${totalPieces} pieces placed`)
          
          if (isComplete) {
            console.log('🎉 Main Page - Puzzle completed! Moving to next puzzle automatically...')
            handlePuzzleCompletion()
          }
        })
      } else {
        console.warn('⚠️ Main Page - Cannot subscribe: puzzle ID is undefined')
      }
    }

    // Listen to external active puzzle changes (from QR page)
    offStorage = onActivePuzzleChangeLocal(async (_id, idx) => {
      if (idx != null && idx >= 0 && idx < allPuzzles.length) {
        if (idx !== currentPuzzleIndex) {
          console.log('🔁 Main Page - Detected external active puzzle change to index', idx)
          setCurrentPuzzleIndex(idx)
          const next = await loadPuzzleByIndex(idx)
          if (next) setPuzzle(next)
        }
      }
    })

    // Listen for custom puzzle piece placed events
    const handlePuzzlePiecePlaced = async (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('🎯 Main Page - Received puzzle piece placed event:', customEvent.detail)
      const { puzzleId, pieceId } = customEvent.detail
      
      // Refresh the puzzle data to reflect the new piece placement
      if (puzzle && (puzzle.id || (puzzle as any)._id) === puzzleId) {
        console.log('🔄 Main Page - Refreshing puzzle data after piece placement...')
        const refreshedPuzzle = await puzzleApi.getPuzzle(puzzleId)
        if (refreshedPuzzle) {
          console.log('✅ Main Page - Puzzle data refreshed:', refreshedPuzzle.title)
          setPuzzle(refreshedPuzzle)
        }
      }
    }

    window.addEventListener('puzzlePiecePlaced', handlePuzzlePiecePlaced)

    return () => {
      unsubscribe()
      if (offStorage) offStorage()
      window.removeEventListener('puzzlePiecePlaced', handlePuzzlePiecePlaced)
    }
  }, [puzzle, currentPuzzleIndex, allPuzzles])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading puzzle...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Puzzle not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full overflow-hidden">
      {/* Puzzle Number Display - Bottom Right Corner */}
      <div className="fixed bottom-2 right-2 text-sm font-bold text-gray-600 z-10">
        {currentPuzzleIndex + 1}
      </div>
      <PuzzleBoard puzzle={puzzle} />
    </div>
  )
}
