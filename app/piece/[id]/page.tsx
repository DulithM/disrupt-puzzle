"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, Target, AlertTriangle } from "lucide-react"
import { puzzleApi } from "@/lib/puzzle-api"
import type { PuzzlePiece, Puzzle } from "@/lib/types"
import { MiniPuzzleGame } from "@/components/mini-puzzle-game"

export default function PiecePage() {
  const params = useParams()
  const router = useRouter()
  const pieceId = params.id as string

  const [piece, setPiece] = useState<PuzzlePiece | null>(null)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [allPuzzles, setAllPuzzles] = useState<Puzzle[]>([])
  const [currentActivePuzzle, setCurrentActivePuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [puzzleCompleted, setPuzzleCompleted] = useState(false)

  // Load all puzzles and find current active puzzle
  useEffect(() => {
    const loadPuzzles = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get all available puzzles
        const puzzles = await puzzleApi.getAllPuzzles()
        if (puzzles.length === 0) {
          setError("No puzzles found")
          return
        }
        
        setAllPuzzles(puzzles)
        
        // Find the current active puzzle (first incomplete puzzle)
        let activePuzzle: Puzzle | null = null
        for (const puzzleData of puzzles) {
          const puzzleId = puzzleData.id || (puzzleData as any)._id
          if (puzzleId) {
            const loadedPuzzle = await puzzleApi.getPuzzle(puzzleId)
            if (loadedPuzzle && !loadedPuzzle.completedAt) {
              activePuzzle = loadedPuzzle
              break
            }
          }
        }
        
        setCurrentActivePuzzle(activePuzzle)
        
        // Find the puzzle that contains this piece
        let foundPuzzle: Puzzle | null = null
        let foundPiece: PuzzlePiece | null = null
        
        for (const puzzleData of puzzles) {
          const pieceData = puzzleData.pieces.find(p => p.id === pieceId)
          if (pieceData) {
            const puzzleId = puzzleData.id || (puzzleData as any)._id
            if (puzzleId) {
              const loadedPuzzle = await puzzleApi.getPuzzle(puzzleId)
              if (loadedPuzzle) {
                foundPuzzle = loadedPuzzle
                foundPiece = pieceData
                break
              }
            }
          }
        }
        
        if (foundPuzzle && foundPiece) {
          setPuzzle(foundPuzzle)
          setPiece(foundPiece)
          
          // Check if this piece belongs to a completed puzzle
          if (foundPuzzle.completedAt) {
            setPuzzleCompleted(true)
            console.log(`⚠️ Piece ${pieceId} belongs to completed puzzle: ${foundPuzzle.title}`)
          } else if (activePuzzle && foundPuzzle.id !== activePuzzle.id) {
            // This piece belongs to a puzzle that's not currently active
            setPuzzleCompleted(true)
            console.log(`⚠️ Piece ${pieceId} belongs to inactive puzzle: ${foundPuzzle.title}`)
          }
        } else {
          setError("Piece not found in any puzzle")
        }
      } catch (error) {
        console.error("Failed to load piece:", error)
        setError("Failed to load piece data")
      } finally {
        setLoading(false)
      }
    }

    loadPuzzles()
  }, [pieceId])

  useEffect(() => {
    let unsubscribe = () => {}

    if (puzzle) {
      unsubscribe = puzzleApi.subscribe(puzzle.id, (updatedPuzzle) => {
        setPuzzle(updatedPuzzle)
        const updatedPiece = updatedPuzzle.pieces.find((p) => p.id === pieceId)
        if (updatedPiece) {
          setPiece(updatedPiece)
        }
        
        // Check if puzzle was completed
        if (updatedPuzzle.completedAt) {
          setPuzzleCompleted(true)
        }
      })
    }

    return () => {
      unsubscribe()
    }
  }, [puzzle, pieceId])

  const handleGameSuccess = () => {
    setGameCompleted(true)
  }

  const handleConfirmPiece = async () => {
    if (!piece || !gameCompleted) return

    setIsSubmitting(true)
    try {
      await puzzleApi.placePiece(piece.id, "Anonymous")
      // Redirect back to main puzzle after piece is placed
      router.push("/")
    } catch (error) {
      console.error("Failed to submit piece:", error)
      setError("Failed to place piece. Please try again.")
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading puzzle piece...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Piece</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push("/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Main Puzzle
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!piece || !puzzle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Piece Not Found</CardTitle>
            <CardDescription>The requested puzzle piece could not be loaded.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Puzzle
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show warning if piece belongs to completed/inactive puzzle
  if (puzzleCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Puzzle Already Completed
            </CardTitle>
            <CardDescription>
              This piece belongs to a puzzle that has already been completed. 
              The current active puzzle is: <strong>{currentActivePuzzle?.title || 'Unknown'}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <strong>Current Active Puzzle:</strong> {currentActivePuzzle?.title}
              </p>
              <p className="text-sm text-orange-700 mt-1">
                Please scan a QR code from the current puzzle to continue playing.
              </p>
            </div>
            <Button onClick={() => router.push("/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Main Puzzle
            </Button>
            <Button variant="outline" onClick={() => router.push("/qr-codes")} className="w-full">
              View Current QR Codes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (piece.isPlaced) {
    // If piece is already completed, redirect to main puzzle
    router.push("/")
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Puzzle
          </Button>

          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-balance mb-2">
              Puzzle Challenge
            </h1>
            <p className="text-muted-foreground">
              Complete this mini-puzzle to unlock piece ({piece.row + 1}, {piece.col + 1}) 
              and contribute to the main puzzle!
            </p>
            {currentActivePuzzle && (
              <p className="text-sm text-blue-600 mt-2">
                Current Puzzle: <strong>{currentActivePuzzle.title}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Game Area */}
        <div className="max-w-2xl mx-auto">
          {/* Mini Game */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Target className="w-5 h-5 text-blue-600" />
                Mini Puzzle Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MiniPuzzleGame piece={piece} onSuccess={handleGameSuccess} onFailure={() => {}} />
            </CardContent>
          </Card>

          {/* Confirm Button - Only show after game completion */}
          {gameCompleted && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Challenge Complete!
                </CardTitle>
                <CardDescription>
                  Click confirm to add this piece to the main puzzle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleConfirmPiece}
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding Piece...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm & Add to Main Puzzle
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
