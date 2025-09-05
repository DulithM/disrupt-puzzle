"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RotateCcw, QrCode, Smartphone, Target, Trophy, Zap } from "lucide-react"
import { puzzleApi } from "@/lib/puzzle-api"
import type { Puzzle } from "@/lib/types"
import { QRCodeGrid } from "@/components/qr-code-grid"
import { setActivePuzzleLocal, onPuzzleCompleted, onActivePuzzleChangeLocal, getActivePuzzleIndexLocal, getPuzzleState, onPuzzleStateChange, markPuzzleCompleted, isPuzzleCompleted, advanceToNextPuzzle, resetAllPuzzles } from "@/lib/puzzle-sync"

export default function QRCodesPage() {
  const router = useRouter()
  const [allPuzzles, setAllPuzzles] = useState<Puzzle[]>([])
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdvancing, setIsAdvancing] = useState(false)
  const isAdvancingRef = useRef<boolean>(false)

  // Load all puzzles and find the current active one
  useEffect(() => {
    const loadPuzzles = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get all available puzzles
        const puzzles = await puzzleApi.getAllPuzzles()
        console.log('🔍 QR Codes - Puzzles received:', puzzles)
        
        if (puzzles.length > 0) {
          setAllPuzzles(puzzles)
          
          // Log the puzzle sequence for reference
          console.log('📋 QR Codes - Puzzle Sequence:')
          puzzles.forEach((puzzle, index) => {
            console.log(`  ${index + 1}. ${puzzle.title} (${puzzle.rows}x${puzzle.cols})`)
          })
          
          // Get current puzzle from localStorage
          const puzzleState = getPuzzleState()
          const currentIndex = puzzleState.currentPuzzleIndex
          console.log('🎯 QR Codes - Current puzzle index from localStorage:', currentIndex)
          
          if (currentIndex >= 0 && currentIndex < puzzles.length) {
            const currentPuzzle = puzzles[currentIndex]
            const puzzleId = currentPuzzle.id || (currentPuzzle as any)._id
            
            if (puzzleId) {
              const loadedPuzzle = await puzzleApi.getPuzzle(puzzleId)
              if (loadedPuzzle) {
                setPuzzle(loadedPuzzle)
                setCurrentPuzzleIndex(currentIndex)
                console.log(`✅ QR Codes - Loaded puzzle ${currentIndex + 1}/${puzzles.length}: ${loadedPuzzle.title}`)
                
                // Persist active selection for other pages
                setActivePuzzleLocal(puzzleId, currentIndex)
              }
            }
          } else {
            // Default to first puzzle if no state
            const firstPuzzle = puzzles[0]
            const firstPuzzleId = firstPuzzle.id || (firstPuzzle as any)._id
            if (firstPuzzleId) {
              const loadedPuzzle = await puzzleApi.getPuzzle(firstPuzzleId)
              if (loadedPuzzle) {
                setPuzzle(loadedPuzzle)
                setCurrentPuzzleIndex(0)
                console.log(`✅ QR Codes - Defaulted to first puzzle: ${loadedPuzzle.title}`)
                setActivePuzzleLocal(firstPuzzleId, 0)
              }
            }
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

  // Handle puzzle completion using localStorage
  useEffect(() => {
    if (!puzzle) return
    
    const completedCount = puzzle.pieces.filter(p => p.isPlaced).length
    const totalPieces = puzzle.pieces.length
    const isComplete = totalPieces > 0 && completedCount === totalPieces
    
    console.log(`🔍 QR Codes - Puzzle "${puzzle.title}": ${completedCount}/${totalPieces} pieces placed`)
    
    if (isComplete) {
      const puzzleId = puzzle.id || (puzzle as any)._id
      console.log(`🎉 QR Codes - Puzzle "${puzzle.title}" completed!`)
      
      // Mark puzzle as completed in localStorage
      markPuzzleCompleted(puzzleId)
      console.log(`✅ QR Codes - Marked puzzle ${puzzleId} as completed in localStorage`)
      
      // Advance to next puzzle
      const nextIndex = advanceToNextPuzzle(allPuzzles.length)
      console.log(`🔄 QR Codes - Advanced to puzzle index: ${nextIndex}`)
      
      // Load the next puzzle
      if (nextIndex >= 0 && nextIndex < allPuzzles.length) {
        const nextPuzzle = allPuzzles[nextIndex]
        const nextPuzzleId = nextPuzzle.id || (nextPuzzle as any)._id
        
        if (nextPuzzleId) {
          puzzleApi.getPuzzle(nextPuzzleId).then((loadedPuzzle) => {
            if (loadedPuzzle) {
              setPuzzle(loadedPuzzle)
              setCurrentPuzzleIndex(nextIndex)
              setActivePuzzleLocal(nextPuzzleId, nextIndex)
              console.log(`✅ QR Codes - Now viewing puzzle ${nextIndex + 1}/${allPuzzles.length}: ${loadedPuzzle.title}`)
            }
          })
        }
      }
    }
  }, [puzzle, allPuzzles])

  useEffect(() => {
    let unsubscribe = () => {}

    if (puzzle) {
      // Get the correct puzzle ID for subscription
      const puzzleId = puzzle.id || (puzzle as any)._id
      console.log('🔍 QR Codes - Setting up subscription for puzzle:', puzzleId)
      
      if (puzzleId) {
        unsubscribe = puzzleApi.subscribe(puzzleId, (updatedPuzzle) => {
          console.log('🔄 QR Codes - Puzzle updated via subscription:', updatedPuzzle.title)
          
          // Don't update puzzle state if we're in the middle of advancing
          if (isAdvancingRef.current) {
            console.log('🔄 QR Codes - Skipping subscription update - currently advancing to next puzzle')
            return
          }
          
          setPuzzle(updatedPuzzle)
        })
      } else {
        console.warn('⚠️ QR Codes - Cannot subscribe: puzzle ID is undefined')
      }
    }

    // Listen for external active puzzle changes (from main page)
    const offStorage = onActivePuzzleChangeLocal(async (_id, idx) => {
      if (idx != null && idx >= 0 && idx < allPuzzles.length) {
        if (idx !== currentPuzzleIndex) {
          console.log('🔁 QR Codes - Detected external active puzzle change to index', idx)
          setCurrentPuzzleIndex(idx)
          const next = allPuzzles[idx]
          const nextId = next.id || (next as any)._id
          if (nextId) {
            const loaded = await puzzleApi.getPuzzle(nextId)
            if (loaded) setPuzzle(loaded)
          }
        }
      }
    })
    
    // Listen for puzzle completion notifications (from main page)
    const offCompletion = onPuzzleCompleted((puzzleId, index) => {
      console.log('🎉 QR Codes - Received puzzle completion notification:', puzzleId, 'at index:', index)
      // Update the current puzzle to show completion state
      if (index === currentPuzzleIndex) {
        puzzleApi.getPuzzle(puzzleId).then((updatedPuzzle) => {
          if (updatedPuzzle) {
            setPuzzle(updatedPuzzle)
          }
        })
      }
    })

    return () => {
      unsubscribe()
      offStorage()
      offCompletion()
    }
  }, [puzzle, currentPuzzleIndex, allPuzzles])

  // Manual advance function for when puzzle is completed
  const manualAdvancePuzzle = async () => {
    if (!puzzle) return
    
    setIsAdvancing(true)
    try {
      console.log('🔄 Manually advancing to next puzzle...')
      
      const currentPuzzleId = puzzle.id || (puzzle as any)._id
      
      // Check if this is the last puzzle (cycle reset)
      const isLastPuzzle = currentPuzzleIndex === allPuzzles.length - 1
      
      if (isLastPuzzle) {
        // Reset all puzzles and go back to puzzle 1
        console.log('🔄 Last puzzle completed - resetting all puzzles...')
        
        // Reset all puzzles in localStorage
        resetAllPuzzles()
        console.log('✅ Reset all puzzles in localStorage')
        
        // Reset all puzzle pieces in database
        for (const p of allPuzzles) {
          const puzzleId = p.id || (p as any)._id
          if (puzzleId) {
            await fetch(`/api/puzzles/${puzzleId}/reset`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            })
          }
        }
        
        console.log('✅ Cycle reset complete - starting with puzzle 1')
      } else {
        // Normal advancement to next puzzle
        const nextIndex = advanceToNextPuzzle(allPuzzles.length)
        console.log(`🔄 Advanced to puzzle index: ${nextIndex}`)
        
        // Load the next puzzle
        if (nextIndex >= 0 && nextIndex < allPuzzles.length) {
          const nextPuzzle = allPuzzles[nextIndex]
          const nextPuzzleId = nextPuzzle.id || (nextPuzzle as any)._id
          
          if (nextPuzzleId) {
            const loadedPuzzle = await puzzleApi.getPuzzle(nextPuzzleId)
            if (loadedPuzzle) {
              setPuzzle(loadedPuzzle)
              setCurrentPuzzleIndex(nextIndex)
              setActivePuzzleLocal(nextPuzzleId, nextIndex)
              console.log(`✅ Advanced to puzzle ${nextIndex + 1}/${allPuzzles.length}: ${loadedPuzzle.title}`)
            }
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error manually advancing puzzle:', error)
    } finally {
      setIsAdvancing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading QR codes...</p>
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
          <Button variant="outline" onClick={() => router.push("/")} className="mt-2 w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Puzzle
          </Button>
        </div>
      </div>
    )
  }

  if (!puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Puzzle not found</p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Puzzle
          </Button>
        </div>
      </div>
    )
  }

  const completedPieces = puzzle.pieces.filter(p => p.isPlaced).length
  const totalPieces = puzzle.pieces.length
  const completionPercentage = Math.round((completedPieces / totalPieces) * 100)

  return (
    <div className="min-h-screen">
      {/* Puzzle Number Display - Top Right Corner */}
      <div className="fixed top-2 right-2 text-sm font-bold text-gray-600 z-10 bg-white/80 px-2 py-1 rounded shadow-sm">
        Puzzle {currentPuzzleIndex + 1}
      </div>
      
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Puzzle
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            title="Refresh QR codes"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
        </div>

        {/* Puzzle Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{puzzle.title}</CardTitle>
                <div className="mt-2 text-sm text-muted-foreground">
                  Puzzle {currentPuzzleIndex + 1} of {allPuzzles.length}
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                {puzzle.rows}×{puzzle.cols} Grid
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{completedPieces}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{totalPieces}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completionPercentage}%</div>
                  <div className="text-xs text-muted-foreground">Progress</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-muted-foreground">Development Mode</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Advance Button - Shows when puzzle is completed */}
        {(() => {
          const completedPieces = puzzle.pieces.filter(p => p.isPlaced).length
          const totalPieces = puzzle.pieces.length
          const isCompleted = totalPieces > 0 && completedPieces === totalPieces
          
          if (isCompleted) {
            return (
              <div className="mb-6">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600 mb-2">🎉 Puzzle Completed!</div>
                    <div className="text-sm text-gray-600 mb-4">
                      {puzzle.title} - {completedPieces}/{totalPieces} pieces
                    </div>
                    <Button 
                      onClick={manualAdvancePuzzle}
                      disabled={isAdvancing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isAdvancing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Advancing...
                        </>
                      ) : (
                        <>
                          {currentPuzzleIndex === allPuzzles.length - 1 ? '🔄 Reset & Start Over' : '➡️ Next Puzzle'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )
          }
          return null
        })()}

        {/* QR Code Grid */}
        <QRCodeGrid puzzle={puzzle} />
      </div>
    </div>
  )
}
