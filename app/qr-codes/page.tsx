"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RotateCcw, QrCode, Smartphone, Target, Trophy } from "lucide-react"
import { puzzleApi } from "@/lib/puzzle-api"
import { puzzleStore } from "@/lib/puzzle-store"
import type { Puzzle } from "@/lib/types"
import { QRCodeGrid } from "@/components/qr-code-grid"

export default function QRCodesPage() {
  const router = useRouter()
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    const loadPuzzle = async () => {
      try {
        const puzzleData = await puzzleApi.getPuzzle("sample-puzzle-1")
        setPuzzle(puzzleData)
      } catch (error) {
        console.error("Failed to load puzzle:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPuzzle()
  }, [])

  useEffect(() => {
    let unsubscribe = () => {}

    if (puzzle) {
      unsubscribe = puzzleApi.subscribe(puzzle.id, (updatedPuzzle) => {
        setPuzzle(updatedPuzzle)
      })
    }

    return () => {
      unsubscribe()
    }
  }, [puzzle])

  const handleReset = async () => {
    if (!puzzle) return
    
    setIsResetting(true)
    try {
      puzzleStore.resetPuzzle(puzzle.id)
      // Reload the puzzle to reflect the reset
      const updatedPuzzle = await puzzleApi.getPuzzle(puzzle.id)
      setPuzzle(updatedPuzzle)
    } catch (error) {
      console.error("Failed to reset puzzle:", error)
    } finally {
      setIsResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading QR codes...</p>
        </div>
      </div>
    )
  }

  if (!puzzle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Puzzle
          </Button>
          
          <Button
            onClick={handleReset}
            disabled={isResetting}
            variant="outline"
            size="sm"
          >
            {isResetting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Puzzle
              </>
            )}
          </Button>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold mb-2">Scan & Play</h1>
            <p className="text-xl text-muted-foreground mb-4">
              Scan QR codes to unlock puzzle pieces through mini-games
            </p>
            
            {/* Progress Overview */}
            <div className="inline-flex items-center gap-4 bg-muted/50 rounded-lg p-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{completedPieces}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{totalPieces}</div>
                <div className="text-sm text-muted-foreground">Total Pieces</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completionPercentage}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                How to Play
              </CardTitle>
              <CardDescription>
                Follow these steps to contribute to the collaborative puzzle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold">1. Scan QR Code</h4>
                  <p className="text-sm text-muted-foreground">
                    Use your phone to scan any QR code below
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <Target className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold">2. Play Mini-Game</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete the puzzle challenge to unlock the piece
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold">3. Claim Piece</h4>
                  <p className="text-sm text-muted-foreground">
                    Enter your name to claim the completed piece
                  </p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-lg font-bold">✓</span>
                  </div>
                  <h4 className="font-semibold">4. See Progress</h4>
                  <p className="text-sm text-muted-foreground">
                    Your piece appears on the main puzzle board
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Code Grid */}
        <QRCodeGrid puzzle={puzzle} />
      </div>
    </div>
  )
}
