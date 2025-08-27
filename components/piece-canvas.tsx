"use client"

import { cn } from "@/lib/utils"
import type { PuzzlePiece, Puzzle } from "@/lib/types"

interface PieceCanvasProps {
  piece: PuzzlePiece
  puzzle: Puzzle
}

export function PieceCanvas({ piece, puzzle }: PieceCanvasProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        {/* Main piece display */}
        <div
          className={cn(
            "aspect-square rounded-lg border-4 transition-all duration-300 overflow-hidden",
            piece.isPlaced ? "border-green-500 shadow-lg shadow-green-500/20" : "border-border hover:border-primary/50",
          )}
        >
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <img
              src={piece.imageUrl || "/placeholder.svg"}
              alt={`Puzzle piece ${piece.row}-${piece.col}`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Piece position indicator */}
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-mono">
          {piece.row},{piece.col}
        </div>

        {/* Completion overlay */}
        {piece.isPlaced && (
          <div className="absolute inset-0 bg-green-500/10 rounded-lg flex items-center justify-center">
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">✓ Completed</div>
          </div>
        )}
      </div>

      {/* Context preview */}
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Position in Puzzle</h3>
        <div className="bg-muted p-3 rounded-lg">
          <div
            className="grid gap-px bg-border rounded"
            style={{
              gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
              aspectRatio: `${puzzle.cols}/${puzzle.rows}`,
            }}
          >
            {Array.from({ length: puzzle.rows }, (_, row) =>
              Array.from({ length: puzzle.cols }, (_, col) => {
                const isCurrentPiece = row === piece.row && col === piece.col
                const puzzlePiece = puzzle.pieces.find((p) => p.row === row && p.col === col)

                return (
                  <div
                    key={`${row}-${col}`}
                    className={cn(
                      "aspect-square",
                      isCurrentPiece ? "bg-primary" : puzzlePiece?.isPlaced ? "bg-green-500/50" : "bg-background",
                    )}
                  />
                )
              }),
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Blue square shows your piece position</p>
      </div>
    </div>
  )
}
