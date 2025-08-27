"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Calendar } from "lucide-react"
import type { Puzzle } from "@/lib/types"

interface PuzzleCompletionProps {
  puzzle: Puzzle
  onReset: () => void
}

export function PuzzleCompletion({ puzzle, onReset }: PuzzleCompletionProps) {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md animate-in zoom-in-95 duration-300">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">🎉 Puzzle Completed! 🎉</CardTitle>
          <CardDescription>
            Congratulations! The collaborative puzzle has been completed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Completed on {puzzle.completedAt.toLocaleDateString()} at {puzzle.completedAt.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{uniqueContributors} contributor{uniqueContributors !== 1 ? 's' : ''} participated</span>
            </div>
          </div>

          <div className="pt-4 space-y-2">
            <Button onClick={onReset} className="w-full" variant="outline">
              Start New Puzzle
            </Button>
            <Button 
              onClick={() => setShowCelebration(false)} 
              className="w-full" 
              variant="ghost"
            >
              Continue Viewing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
