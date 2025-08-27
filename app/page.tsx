"use client"

import { useEffect, useState } from "react"
import { puzzleApi } from "@/lib/puzzle-api"
import { puzzleStore } from "@/lib/puzzle-store"
import { storageUtils } from "@/lib/storage-utils"
import type { Puzzle } from "@/lib/types"
import { PuzzleBoard } from "@/components/puzzle-board"
import { PuzzleNotifications } from "@/components/puzzle-notifications"
import { PuzzleCompletion } from "@/components/puzzle-completion"
import { Button } from "@/components/ui/button"
import { RotateCcw, Bug } from "lucide-react"

export default function HomePage() {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading puzzle...</p>
        </div>
      </div>
    )
  }

  if (!puzzle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Puzzle not found</p>
        </div>
      </div>
    )
  }

  const handleReset = async () => {
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

  const handleDebug = () => {
    storageUtils.debugPuzzleState()
  }

  const completedPieces = puzzle.pieces.filter((p) => p.isPlaced).length
  const totalPieces = puzzle.pieces.length
  const isCompleted = puzzleStore.isPuzzleCompleted(puzzle.id)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header with progress and reset button */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{puzzle.title}</h1>
            <p className="text-muted-foreground">{puzzle.description}</p>
            <div className="mt-2 text-sm text-muted-foreground">
              {completedPieces} of {totalPieces} pieces completed
              {isCompleted && (
                <span className="ml-2 text-green-600 font-medium">🎉 Puzzle Completed!</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDebug}
              variant="outline"
              size="sm"
            >
              <Bug className="w-4 h-4 mr-2" />
              Debug
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
        </div>

        <PuzzleBoard puzzle={puzzle} />
        <PuzzleNotifications puzzleId={puzzle.id} />
        <PuzzleCompletion puzzle={puzzle} onReset={handleReset} />
      </div>
    </div>
  )
}
