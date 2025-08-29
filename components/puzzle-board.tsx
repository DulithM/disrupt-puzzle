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
    <div className="w-full h-[calc(100vh-120px)] sm:h-screen p-2 sm:p-4">
      <div
        className="w-full h-full grid gap-0 bg-muted rounded-lg border border-border/20"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
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
                  "w-full h-full transition-all duration-300 overflow-hidden",
                  piece.isPlaced ? "border-0" : "border border-border/20",
                )}
              >
                {piece.isPlaced ? (
                  <div className="w-full h-full">
                    <div
                      className="w-full h-full bg-cover bg-no-repeat"
                      style={{
                        backgroundImage: `url(${encodeURI(puzzle.imageUrl)})`,
                        backgroundPosition: `${(col / (cols - 1)) * 100}% ${(row / (rows - 1)) * 100}%`,
                        backgroundSize: `${cols * 100}% ${rows * 100}%`,
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white p-1">
                    <QRCode
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/piece/${piece.id}`}
                      size={Math.min(120, Math.min(window.innerWidth / cols - 8, window.innerHeight / rows - 8))}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            )
          }),
        )}
      </div>
    </div>
  )
}
