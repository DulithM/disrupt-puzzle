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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [puzzleCompleted, setPuzzleCompleted] = useState(false)
  const [pieceSubmitted, setPieceSubmitted] = useState(false)

  // Load all puzzles and find current active puzzle
  useEffect(() => {
    const loadPuzzles = async () => {
      try {
        setLoading(true)
        setError(null)
        
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
          } else if (activePuzzle && foundPuzzle.id !== activePuzzle.id) {
            setPuzzleCompleted(true)
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
        
        if (updatedPuzzle.completedAt) {
          setPuzzleCompleted(true)
        }
      })
    }

    return () => {
      unsubscribe()
    }
  }, [puzzle, pieceId])

  const handleGameSuccess = async () => {
    if (!piece) return

    setIsSubmitting(true)
    try {
      await puzzleApi.placePiece(piece.id, "Anonymous")
      setPieceSubmitted(true)
      
      // Close tab after 5 seconds
      setTimeout(() => {
        window.close()
      }, 5000)
    } catch (error) {
      console.error("Failed to submit piece:", error)
      setError("Failed to place piece. Please try again.")
      setIsSubmitting(false)
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push("/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Puzzle
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!piece || !puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Piece Not Found</CardTitle>
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Puzzle Completed
            </CardTitle>
            <CardDescription>
              This piece belongs to a completed puzzle. 
              Current active puzzle: <strong>{currentActivePuzzle?.title || 'Unknown'}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => router.push("/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Puzzle
            </Button>
            <Button variant="outline" onClick={() => router.push("/qr-codes")} className="w-full">
              View QR Codes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (piece.isPlaced) {
    router.push("/")
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Simple Header */}
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" onClick={() => router.push("/")} size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="ml-4">
          <h1 className="text-lg font-semibold">Puzzle Challenge</h1>
          <p className="text-sm text-muted-foreground">
            Piece ({piece.row + 1}, {piece.col + 1})
          </p>
        </div>
      </div>

      {/* Game Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Game Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Mini Puzzle
              </CardTitle>
              <CardDescription>
                Complete the challenge to unlock this piece
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MiniPuzzleGame 
                piece={piece} 
                onSuccess={handleGameSuccess} 
                onFailure={() => {}} 
                isSubmitting={isSubmitting}
                pieceSubmitted={pieceSubmitted}
              />
            </CardContent>
          </Card> 
        </div>
      </div>
    </div>
  )
}
