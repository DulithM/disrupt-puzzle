"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Users } from "lucide-react"
import { puzzleApi } from "@/lib/puzzle-api"
import type { PuzzlePiece, Puzzle } from "@/lib/types"
import { PieceCanvas } from "@/components/piece-canvas"
import { RealtimeStatus } from "@/components/realtime-status"
import { MiniPuzzleGame } from "@/components/mini-puzzle-game"

export default function PiecePage() {
  const params = useParams()
  const router = useRouter()
  const pieceId = params.id as string

  const [piece, setPiece] = useState<PuzzlePiece | null>(null)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)
  const [playerName, setPlayerName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`)
  const [gameCompleted, setGameCompleted] = useState(false)
  const [gameFailed, setGameFailed] = useState(false)

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
    setGameFailed(false)
  }

  const handleGameFailure = () => {
    setGameFailed(true)
    setGameCompleted(false)
  }

  const handleSubmitPiece = async () => {
    if (!piece || !playerName.trim() || !gameCompleted) return

    setIsSubmitting(true)
    try {
      await puzzleApi.placePiece(piece.id, playerName.trim())
      const updatedPiece = await puzzleApi.getPiece(pieceId)
      setPiece(updatedPiece)
    } catch (error) {
      console.error("Failed to submit piece:", error)
    } finally {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Puzzle
          </Button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-balance">
                Puzzle Piece ({piece.row}, {piece.col})
              </h1>
              <p className="text-muted-foreground text-pretty">From "{puzzle.title}"</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={piece.isPlaced ? "default" : "secondary"}>
                {piece.isPlaced ? "Completed" : "Available"}
              </Badge>
            </div>
          </div>

          {/* Real-time status for piece page */}
          <RealtimeStatus puzzleId={puzzle.id} userId={userId} />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Piece Canvas */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {piece.isPlaced && <CheckCircle className="w-5 h-5 text-green-500" />}
                  Puzzle Piece
                </CardTitle>
                <CardDescription>
                  Position: Row {piece.row + 1}, Column {piece.col + 1}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PieceCanvas piece={piece} puzzle={puzzle} />
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {piece.isPlaced ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    Piece Completed!
                  </CardTitle>
                  <CardDescription>This piece has been successfully placed by {piece.placedBy}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <strong>Completed by:</strong> {piece.placedBy}
                    </p>
                    <p>
                      <strong>Completed at:</strong> {piece.placedAt?.toLocaleString() || "Unknown"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <MiniPuzzleGame piece={piece} onSuccess={handleGameSuccess} onFailure={handleGameFailure} />

                <Card>
                  <CardHeader>
                    <CardTitle>Complete This Piece</CardTitle>
                    <CardDescription>
                      {!gameCompleted
                        ? "Complete the puzzle challenge above first!"
                        : "Enter your name to claim this puzzle piece"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="playerName">Your Name</Label>
                      <Input
                        id="playerName"
                        placeholder="Enter your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        disabled={isSubmitting || !gameCompleted}
                      />
                    </div>

                    <Button
                      onClick={handleSubmitPiece}
                      disabled={!playerName.trim() || isSubmitting || !gameCompleted}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Placing Piece...
                        </>
                      ) : (
                        "Place Piece"
                      )}
                    </Button>

                    {!gameCompleted && !gameFailed && (
                      <p className="text-xs text-muted-foreground text-center">
                        Complete the sliding puzzle challenge to unlock this form
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Puzzle Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Completed Pieces</span>
                    <span>
                      {puzzle.pieces.filter((p) => p.isPlaced).length} / {puzzle.pieces.length}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(puzzle.pieces.filter((p) => p.isPlaced).length / puzzle.pieces.length) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((puzzle.pieces.filter((p) => p.isPlaced).length / puzzle.pieces.length) * 100)}%
                    complete
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>1. Study the puzzle piece image above</p>
                <p>2. Complete the sliding puzzle challenge</p>
                <p>3. Enter your name in the form</p>
                <p>4. Click "Place Piece" to complete this section</p>
                <p>5. Return to the main board to see your contribution</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
