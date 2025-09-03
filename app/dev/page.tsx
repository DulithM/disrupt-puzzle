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
import { setActivePuzzleLocal, onPuzzleCompleted, onActivePuzzleChangeLocal } from "@/lib/puzzle-sync"

export default function QRCodesPage() {
  const router = useRouter()
  const [allPuzzles, setAllPuzzles] = useState<Puzzle[]>([])
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
          
          // Get active and next puzzle from server (uses currentlyInUse flag)
          const activeNext = await puzzleApi.getActiveAndNext()
          console.log('🎯 QR Codes - Server returned active puzzle:', activeNext.active?.title)
          
          if (activeNext.active) {
            setPuzzle(activeNext.active)
            
            // Find the index of the active puzzle in our local array
            const activeIndex = puzzles.findIndex(p => 
              (p.id || (p as any)._id) === (activeNext.active?.id || (activeNext.active as any)?._id)
            )
            
            if (activeIndex !== -1) {
              setCurrentPuzzleIndex(activeIndex)
              console.log(`✅ QR Codes - Active puzzle index: ${activeIndex + 1}/${puzzles.length}`)
              
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

  // Simple completion detection and advancement
  useEffect(() => {
    if (!puzzle) return
    
    const completedCount = puzzle.pieces.filter(p => p.isPlaced).length
    const totalPieces = puzzle.pieces.length
    const isComplete = totalPieces > 0 && completedCount === totalPieces
    
    console.log(`🔍 QR Codes - Puzzle "${puzzle.title}": ${completedCount}/${totalPieces} pieces placed`)
    
    if (isComplete) {
      console.log(`🎉 QR Codes - Puzzle "${puzzle.title}" completed! Resetting and advancing...`)
      
      // Simple approach: reset current puzzle and go to next
      const handleCompletion = async () => {
        try {
          const currentPuzzleId = puzzle.id || (puzzle as any)._id
          
          // 1. Reset the completed puzzle
          console.log('🔄 QR Codes - Resetting completed puzzle...')
          await puzzleApi.resetPuzzle(currentPuzzleId)
          
          // 2. Go to next puzzle
          const nextIndex = (currentPuzzleIndex + 1) % allPuzzles.length
          console.log(`🔄 QR Codes - Moving to puzzle ${nextIndex + 1}/${allPuzzles.length}`)
          
          const nextPuzzleData = allPuzzles[nextIndex]
          const nextPuzzleId = nextPuzzleData.id || (nextPuzzleData as any)._id
          
          if (nextPuzzleId) {
            const nextPuzzle = await puzzleApi.getPuzzle(nextPuzzleId)
            if (nextPuzzle) {
              setPuzzle(nextPuzzle)
              setCurrentPuzzleIndex(nextIndex)
              console.log(`✅ QR Codes - Now viewing: ${nextPuzzle.title}`)
            }
          }
        } catch (error) {
          console.error('❌ QR Codes - Error handling completion:', error)
        }
      }
      
      handleCompletion()
    }
  }, [puzzle, currentPuzzleIndex, allPuzzles])

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

        {/* QR Code Grid */}
        <QRCodeGrid puzzle={puzzle} />
      </div>
    </div>
  )
}
