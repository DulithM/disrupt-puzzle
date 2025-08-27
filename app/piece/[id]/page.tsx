"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, Users, Trophy, Target, Star } from "lucide-react"
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
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Puzzle
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-balance">
                Puzzle Piece ({piece.row + 1}, {piece.col + 1})
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground text-pretty">From "{puzzle.title}"</p>
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

        {piece.isPlaced ? (
          // Completed piece view
          <div className="max-w-2xl mx-auto">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Trophy className="w-5 h-5" />
                  Piece Completed!
                </CardTitle>
                <CardDescription>This piece has been successfully placed by {piece.placedBy}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-green-700 mb-2">Congratulations!</h3>
                  <p className="text-green-600 text-sm sm:text-base">
                    This puzzle piece has been completed and is now part of the main puzzle.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-4 space-y-2 text-sm">
                  <p><strong>Completed by:</strong> {piece.placedBy}</p>
                  <p><strong>Completed at:</strong> {piece.placedAt?.toLocaleString() || "Unknown"}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button onClick={() => router.push("/")} className="flex-1">
                    View Main Puzzle
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/qr-codes")}>
                    View All QR Codes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Active piece view - focus on the mini-game
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Game Area - Takes up 2/3 of the space on desktop, full width on mobile */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Game Header */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Target className="w-5 h-5 text-blue-600" />
                      Puzzle Challenge
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Complete this mini-puzzle to unlock piece ({piece.row + 1}, {piece.col + 1}) 
                      and contribute to the main puzzle!
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Mini Game */}
                <MiniPuzzleGame piece={piece} onSuccess={handleGameSuccess} onFailure={handleGameFailure} />

                {/* Claim Form - Only show after game completion */}
                {gameCompleted && (
                  <Card className="border-green-200 bg-green-50/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <Star className="w-5 h-5" />
                        Claim Your Piece
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        Enter your name to claim this puzzle piece and add it to the main puzzle
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
                          disabled={isSubmitting}
                          className="bg-white"
                        />
                      </div>

                      <Button
                        onClick={handleSubmitPiece}
                        disabled={!playerName.trim() || isSubmitting}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Placing Piece...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Place Piece on Main Puzzle
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Failure Message */}
                {gameFailed && (
                  <Card className="border-red-200 bg-red-50/50">
                    <CardContent className="pt-6">
                      <div className="text-center text-red-600">
                        <p className="font-medium mb-2">Don't give up!</p>
                        <p className="text-sm">Try the challenge again to unlock this piece.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Sidebar - Takes up 1/3 of the space on desktop, full width on mobile */}
            <div className="space-y-6">
              {/* Piece Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Target className="w-5 h-5" />
                    Piece Preview
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    This is the piece you're working on
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PieceCanvas piece={piece} puzzle={puzzle} />
                </CardContent>
              </Card>

              {/* Puzzle Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Users className="w-5 h-5" />
                    Overall Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm sm:text-base">
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
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {Math.round((puzzle.pieces.filter((p) => p.isPlaced).length / puzzle.pieces.length) * 100)}%
                      complete
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      1
                    </div>
                    <p>Complete the mini-puzzle challenge above</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      2
                    </div>
                    <p>Enter your name to claim the piece</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      3
                    </div>
                    <p>Your piece will appear on the main puzzle</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                      4
                    </div>
                    <p>Return to see the complete puzzle</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
