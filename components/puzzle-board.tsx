"use client"

import { cn } from "@/lib/utils"
import type { Puzzle } from "@/lib/types"
import { QRCode } from "./qr-code"

interface PuzzleBoardProps {
  puzzle: Puzzle
}

export function PuzzleBoard({ puzzle }: PuzzleBoardProps) {
  const { rows, cols, pieces } = puzzle

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        className="grid gap-0 bg-muted p-2 rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          aspectRatio: `${cols}/${rows}`,
        }}
      >
        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: cols }, (_, col) => {
            const piece = pieces.find((p) => p.row === row && p.col === col)
            if (!piece) return null

            return (
              <div
                key={piece.id}
                className={cn(
                  "aspect-square transition-all duration-300 overflow-hidden",
                  piece.isPlaced ? "border-0" : "border border-border/20",
                )}
              >
                {piece.isPlaced ? (
                  <div className="w-full h-full">
                    <div
                      className="w-full h-full bg-cover bg-no-repeat"
                      style={{
                        backgroundImage: `url(${puzzle.imageUrl})`,
                        backgroundPosition: `${(col / (cols - 1)) * 100}% ${(row / (rows - 1)) * 100}%`,
                        backgroundSize: `${cols * 100}% ${rows * 100}%`,
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white p-1">
                    <QRCode
                      value={`${window.location.origin}/piece/${piece.id}`}
                      size={Math.min(120, window.innerWidth / cols - 20)}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            )
          }),
        )}
      </div>

      {/* Progress indicator */}
      <div className="mt-4 text-center">
        <div className="text-sm text-muted-foreground">
          {pieces.filter((p) => p.isPlaced).length} of {pieces.length} pieces completed
        </div>
        <div className="w-full bg-muted rounded-full h-2 mt-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{
              width: `${(pieces.filter((p) => p.isPlaced).length / pieces.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
