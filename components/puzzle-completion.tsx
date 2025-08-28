"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Users, Calendar } from "lucide-react"
import type { Puzzle } from "@/lib/types"

interface PuzzleCompletionProps {
  puzzle: Puzzle
  isLastPuzzle?: boolean
}

export function PuzzleCompletion({ puzzle, isLastPuzzle = false }: PuzzleCompletionProps) {
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    if (puzzle.completedAt && !showCelebration) {
      setShowCelebration(true)
    }
  }, [puzzle.completedAt, showCelebration])

  if (!showCelebration || !puzzle.completedAt) {
    return null
  }

  const completedPieces = puzzle.pieces.filter(p => p.isPlaced)
  const uniqueContributors = new Set(completedPieces.map(p => p.placedBy)).size

  // Convert completedAt to Date object if it's a string
  const completedAtDate = puzzle.completedAt ? new Date(puzzle.completedAt) : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md animate-in zoom-in-95 duration-300">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">🎉 Puzzle Completed! 🎉</CardTitle>
          <CardDescription>
            {isLastPuzzle 
              ? "Congratulations! All puzzles have been completed! The cycle will now restart."
              : "Congratulations! This puzzle has been completed successfully. Moving to the next puzzle!"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>
                {completedAtDate 
                  ? `Completed on ${completedAtDate.toLocaleDateString()} at ${completedAtDate.toLocaleTimeString()}`
                  : 'Completed just now'
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{uniqueContributors} contributor{uniqueContributors !== 1 ? 's' : ''} participated</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
