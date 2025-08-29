"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { QrCode, Users } from "lucide-react"
import { puzzleApi } from "@/lib/puzzle-api"
import type { Puzzle } from "@/lib/types"
import { PuzzleBoard } from "@/components/puzzle-board"
import { PuzzleCompletion } from "@/components/puzzle-completion"
import { PuzzleProgress } from "@/components/puzzle-progress"
import { findCurrentActivePuzzle } from "@/lib/puzzle-utils"
import { getActivePuzzleIdLocal, getActivePuzzleIndexLocal, onActivePuzzleChangeLocal, setActivePuzzleLocal } from "@/lib/puzzle-sync"

export default function HomePage() {
  const [allPuzzles, setAllPuzzles] = useState<Puzzle[]>([])
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load all puzzles and set up the first one
  useEffect(() => {
    const loadPuzzles = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get all available puzzles
        const puzzles = await puzzleApi.getAllPuzzles()
        console.log('🔍 Puzzles received:', puzzles)
        
        if (puzzles.length > 0) {
          setAllPuzzles(puzzles)
          
          // Log the puzzle sequence
          console.log('📋 Puzzle Sequence:')
          puzzles.forEach((puzzle, index) => {
            console.log(`  ${index + 1}. ${puzzle.title} (${puzzle.rows}x${puzzle.cols})`)
          })
          
          // If a stored active index exists, prefer it for immediate cross-page sync
          const storedIndex = getActivePuzzleIndexLocal()
          if (storedIndex != null && storedIndex >= 0 && storedIndex < puzzles.length) {
            console.log('🧩 Main Page - Using stored active index:', storedIndex)
            setCurrentPuzzleIndex(storedIndex)
            const preset = await loadPuzzleByIndex(storedIndex)
            if (preset) {
              setPuzzle(preset)
              return
            }
          }

          // Otherwise find the current active puzzle using shared utility
          const { activeIndex, activePuzzle } = await findCurrentActivePuzzle(puzzles)
          
          setCurrentPuzzleIndex(activeIndex)
          console.log(`🎯 Main Page - Active puzzle index: ${activeIndex + 1}/${puzzles.length}`)
          
          if (activePuzzle) {
            console.log('✅ Main Page - Active puzzle loaded successfully:', activePuzzle.title)
            setPuzzle(activePuzzle)
            // Persist active selection for other pages
            const activeId = (activePuzzle as any).id || (activePuzzle as any)._id
            if (activeId) setActivePuzzleLocal(activeId, activeIndex)
          } else {
            setError("Failed to load active puzzle data")
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
          console.log(`✅ Puzzle ${index + 1}/${allPuzzles.length} loaded:`, loadedPuzzle.title)
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

  // Move to next puzzle
  const moveToNextPuzzle = async () => {
    const nextIndex = currentPuzzleIndex + 1
    
    if (nextIndex >= allPuzzles.length) {
      // All puzzles completed, reset to beginning
      console.log('🎉 All puzzles completed! Resetting to first puzzle...')
      console.log('🔄 Cycle complete - starting over from the beginning')
      await resetAllPuzzles()
      setCurrentPuzzleIndex(0)
      const firstPuzzle = await loadPuzzleByIndex(0)
      if (firstPuzzle) {
        setPuzzle(firstPuzzle)
        console.log(`🔄 Restarted with: ${firstPuzzle.title}`)
      }
    } else {
      // Move to next puzzle
      const currentPuzzle = allPuzzles[currentPuzzleIndex]
      const nextPuzzleData = allPuzzles[nextIndex]
      console.log(`🔄 Moving from "${currentPuzzle.title}" to "${nextPuzzleData.title}" (${nextIndex + 1}/${allPuzzles.length})`)
      setCurrentPuzzleIndex(nextIndex)
      const nextPuzzle = await loadPuzzleByIndex(nextIndex)
      if (nextPuzzle) {
        setPuzzle(nextPuzzle)
      }
    }
  }

  // Reset all puzzles (clear completion status)
  const resetAllPuzzles = async () => {
    console.log('🔄 Resetting all puzzles...')
    try {
      // Reset each puzzle by clearing completion status
      for (const puzzleData of allPuzzles) {
        const puzzleId = puzzleData.id || (puzzleData as any)._id
        if (puzzleId) {
          const success = await puzzleApi.resetPuzzle(puzzleId)
          if (success) {
            console.log(`🔄 Reset puzzle: ${puzzleData.title}`)
          } else {
            console.error(`❌ Failed to reset puzzle: ${puzzleData.title}`)
          }
        }
      }
    } catch (error) {
      console.error('Failed to reset puzzles:', error)
    }
  }

  // Handle puzzle completion
  const handlePuzzleCompletion = async () => {
    console.log(`🎉 Puzzle ${currentPuzzleIndex + 1}/${allPuzzles.length} completed!`)
    
    // Immediately reset the current puzzle
    const currentPuzzleData = allPuzzles[currentPuzzleIndex]
    const currentPuzzleId = currentPuzzleData.id || (currentPuzzleData as any)._id
    if (currentPuzzleId) {
      console.log(`🔄 Resetting completed puzzle: ${currentPuzzleData.title}`)
      const resetSuccess = await puzzleApi.resetPuzzle(currentPuzzleId)
      if (resetSuccess) {
        console.log(`✅ Successfully reset: ${currentPuzzleData.title}`)
      } else {
        console.error(`❌ Failed to reset: ${currentPuzzleData.title}`)
      }
    }
    
    // Then move to next puzzle
    await moveToNextPuzzle()
  }

  // Force refresh current puzzle data
  const refreshCurrentPuzzle = async () => {
    if (allPuzzles.length > 0 && currentPuzzleIndex < allPuzzles.length) {
      const puzzleData = allPuzzles[currentPuzzleIndex]
      const puzzleId = puzzleData.id || (puzzleData as any)._id
      
      if (puzzleId) {
        const refreshedPuzzle = await puzzleApi.getPuzzle(puzzleId)
        if (refreshedPuzzle) {
          console.log('🔄 Refreshed puzzle data:', refreshedPuzzle.title)
          setPuzzle(refreshedPuzzle)
        }
      }
    }
  }

  useEffect(() => {
    let unsubscribe = () => {}
    let offStorage: (() => void) | null = null

    if (puzzle) {
      // Get the correct puzzle ID for subscription
      const puzzleId = puzzle.id || (puzzle as any)._id
      console.log('🔍 Setting up subscription for puzzle:', puzzleId)
      
      if (puzzleId) {
        unsubscribe = puzzleApi.subscribe(puzzleId, (updatedPuzzle) => {
          console.log('🔄 Puzzle updated via subscription:', updatedPuzzle.title)
          console.log('🔄 New completed pieces:', updatedPuzzle.pieces.filter(p => p.isPlaced).length)
          console.log('🔄 Total pieces:', updatedPuzzle.pieces.length)
          console.log('🔄 Puzzle completed:', !!updatedPuzzle.completedAt)
          
          setPuzzle(updatedPuzzle)
          
          // Check if puzzle is completed and move to next
          if (updatedPuzzle.completedAt && !puzzle.completedAt) {
            console.log('🎉 Puzzle completed! Moving to next puzzle...')
            // Small delay to ensure the completion modal shows first
            setTimeout(() => {
              handlePuzzleCompletion()
            }, 1000)
          }
        })
      } else {
        console.warn('⚠️ Cannot subscribe: puzzle ID is undefined')
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

    return () => {
      unsubscribe()
      if (offStorage) offStorage()
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
    <div className="min-h-screen">
      {/* Header with navigation */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">Distrupt Puzzle</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              A puzzle game for the Distrupt Asia event
            </p>
            {/* Progress indicator */}
            <div className="mt-2 text-xs text-muted-foreground">
              Puzzle {currentPuzzleIndex + 1} of {allPuzzles.length}: {puzzle.title}
            </div>
          </div>
          <div className="flex gap-2 justify-center sm:justify-end">
            <Button variant="outline" size="sm" asChild>
              <a href="/qr-codes">
                <QrCode className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">QR Codes</span>
                <span className="sm:hidden">QR</span>
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/qr-codes">
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Scan & Play</span>
                <span className="sm:hidden">Play</span>
              </a>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshCurrentPuzzle}
              title="Refresh puzzle data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
          </div>
        </div>
        
        {/* Puzzle Progress */}
        {allPuzzles.length > 1 && (
          <div className="mb-6">
            <PuzzleProgress
              currentIndex={currentPuzzleIndex}
              totalPuzzles={allPuzzles.length}
              completedPuzzles={currentPuzzleIndex}
              puzzleTitles={allPuzzles.map(p => p.title)}
            />
          </div>
        )}
      </div>

      <PuzzleBoard puzzle={puzzle} />
      
      {/* Puzzle completion modal */}
      <PuzzleCompletion 
        puzzle={puzzle} 
        isLastPuzzle={currentPuzzleIndex === allPuzzles.length - 1}
      />
    </div>
  )
}
