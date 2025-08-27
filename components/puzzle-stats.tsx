"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { Puzzle } from "@/lib/types"

interface PuzzleStatsProps {
  puzzle: Puzzle
}

export function PuzzleStats({ puzzle }: PuzzleStatsProps) {
  const totalPieces = puzzle.pieces.length
  const completedPieces = puzzle.pieces.filter((p) => p.isPlaced).length
  const completionPercentage = Math.round((completedPieces / totalPieces) * 100)

  const uniqueContributors = new Set(puzzle.pieces.filter((p) => p.placedBy).map((p) => p.placedBy)).size

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{completedPieces}</div>
          <div className="text-sm text-muted-foreground">Pieces Placed</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{totalPieces - completedPieces}</div>
          <div className="text-sm text-muted-foreground">Remaining</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{completionPercentage}%</div>
          <div className="text-sm text-muted-foreground">Complete</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{uniqueContributors}</div>
          <div className="text-sm text-muted-foreground">Contributors</div>
        </CardContent>
      </Card>
    </div>
  )
}
