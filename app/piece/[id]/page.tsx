"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, Target } from "lucide-react"
import { puzzleApi } from "@/lib/puzzle-api"
import type { PuzzlePiece, Puzzle } from "@/lib/types"
import { MiniPuzzleGame } from "@/components/mini-puzzle-game"

export default function PiecePage() {
  const params = useParams()
  const router = useRouter()
  const pieceId = params.id as string

  const [piece, setPiece] = useState<PuzzlePiece | null>(null)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadPiece = async () => {
      try {
        const pieceData = await puzzleApi.getPiece(pieceId)
        if (pieceData) {
          setPiece(pieceData)
          const puzzleData = await puzzleApi.getPuzzle(pieceData.puzzleId)
          setPuzzle(puzzleData)
        }
      } catch (error) {
        console.error("Failed to load piece:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPiece()
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
