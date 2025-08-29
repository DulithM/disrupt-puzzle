"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RotateCcw, QrCode, Smartphone, Target, Trophy, Zap } from "lucide-react"
import { puzzleApi } from "@/lib/puzzle-api"
import type { Puzzle } from "@/lib/types"
import { QRCodeGrid } from "@/components/qr-code-grid"
import { findCurrentActivePuzzle } from "@/lib/puzzle-utils"
import { getActivePuzzleIdLocal, getActivePuzzleIndexLocal, onActivePuzzleChangeLocal, setActivePuzzleLocal } from "@/lib/puzzle-sync"

export default function QRCodesPage() {
  const router = useRouter()
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
        console.log('🔍 QR Codes - Puzzles received:', puzzles)
        
        if (puzzles.length > 0) {
          setAllPuzzles(puzzles)
          
          // Log the puzzle sequence for reference
          console.log('📋 QR Codes - Puzzle Sequence:')
          puzzles.forEach((puzzle, index) => {
            console.log(`  ${index + 1}. ${puzzle.title} (${puzzle.rows}x${puzzle.cols})`)
          })
          
          // If a stored active index exists, prefer it for immediate cross-page sync
          const storedIndex = getActivePuzzleIndexLocal()
          if (storedIndex != null && storedIndex >= 0 && storedIndex < puzzles.length) {
            console.log('🧩 QR Codes - Using stored active index:', storedIndex)
            setCurrentPuzzleIndex(storedIndex)
            const presetPuzzle = puzzles[storedIndex]
            const presetId = presetPuzzle.id || (presetPuzzle as any)._id
            if (presetId) {
              const preset = await puzzleApi.getPuzzle(presetId)
              if (preset) {
                setPuzzle(preset)
                return
              }
            }
          }

          // Otherwise find the current active puzzle using shared utility
          const { activeIndex, activePuzzle } = await findCurrentActivePuzzle(puzzles)
          
          setCurrentPuzzleIndex(activeIndex)
          console.log(`🎯 QR Codes - Active puzzle index: ${activeIndex + 1}/${puzzles.length}`)
          
          if (activePuzzle) {
            console.log('✅ QR Codes - Active puzzle loaded successfully:', activePuzzle.title)
            setPuzzle(activePuzzle)
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

  // Check for puzzle completion and move to next puzzle
  useEffect(() => {
    if (puzzle && puzzle.completedAt) {
      console.log(`🎉 QR Codes - Puzzle "${puzzle.title}" completed, checking for next puzzle...`)
      console.log(`🎉 QR Codes - Current index: ${currentPuzzleIndex}, Total puzzles: ${allPuzzles.length}`)
      
      // Immediately reset the current puzzle
      const currentPuzzleData = allPuzzles[currentPuzzleIndex]
      const currentPuzzleId = currentPuzzleData.id || (currentPuzzleData as any)._id
      if (currentPuzzleId) {
        console.log(`🔄 QR Codes - Resetting completed puzzle: ${currentPuzzleData.title}`)
        puzzleApi.resetPuzzle(currentPuzzleId).then((resetSuccess) => {
          if (resetSuccess) {
            console.log(`✅ QR Codes - Successfully reset: ${currentPuzzleData.title}`)
          } else {
            console.error(`❌ QR Codes - Failed to reset: ${currentPuzzleData.title}`)
          }
        }).catch(error => {
          console.error(`❌ QR Codes - Error resetting puzzle:`, error)
        })
      }
      
      const nextIndex = currentPuzzleIndex + 1
      if (nextIndex < allPuzzles.length) {
        // Move to next puzzle
        console.log(`🔄 QR Codes - Moving to puzzle ${nextIndex + 1}/${allPuzzles.length}`)
        setCurrentPuzzleIndex(nextIndex)
        const nextPuzzle = allPuzzles[nextIndex]
        const puzzleId = nextPuzzle.id || (nextPuzzle as any)._id
        
        if (puzzleId) {
          puzzleApi.getPuzzle(puzzleId).then((puzzleData) => {
            if (puzzleData) {
              console.log(`🔄 QR Codes - Loaded next puzzle: ${puzzleData.title}`)
              setPuzzle(puzzleData)
              setActivePuzzleLocal(puzzleId, nextIndex)
            }
          }).catch(error => {
            console.error('❌ QR Codes - Failed to load next puzzle:', error)
          })
        }
      } else {
        // All puzzles completed, reset to first
        console.log('🔄 QR Codes - All puzzles completed, resetting to first puzzle...')
        setCurrentPuzzleIndex(0)
        const firstPuzzle = allPuzzles[0]
        const puzzleId = firstPuzzle.id || (firstPuzzle as any)._id
        
        if (puzzleId) {
          puzzleApi.getPuzzle(puzzleId).then((puzzleData) => {
            if (puzzleData) {
              console.log(`🔄 QR Codes - Reset to first puzzle: ${puzzleData.title}`)
              setPuzzle(puzzleData)
              setActivePuzzleLocal(puzzleId, 0)
            }
          }).catch(error => {
            console.error('❌ QR Codes - Failed to load first puzzle:', error)
          })
        }
      }
    }
  }, [puzzle?.completedAt, currentPuzzleIndex, allPuzzles])

  useEffect(() => {
    let unsubscribe = () => {}
    let offStorage: (() => void) | null = null

    if (puzzle) {
      // Get the correct puzzle ID for subscription
      const puzzleId = puzzle.id || (puzzle as any)._id
      console.log('🔍 QR Codes - Setting up subscription for puzzle:', puzzleId)
      
      if (puzzleId) {
        unsubscribe = puzzleApi.subscribe(puzzleId, (updatedPuzzle) => {
          console.log('🔄 QR Codes - Puzzle updated via subscription:', updatedPuzzle.title)
          setPuzzle(updatedPuzzle)
        })
      } else {
        console.warn('⚠️ QR Codes - Cannot subscribe: puzzle ID is undefined')
      }
    }

    // Listen for external active puzzle changes (from main page)
    offStorage = onActivePuzzleChangeLocal(async (_id, idx) => {
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
                <CardDescription>{puzzle.description}</CardDescription>
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
