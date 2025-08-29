"use client"

import { cn } from "@/lib/utils"
import type { Puzzle } from "@/lib/types"
import { QRCode } from "./qr-code"
import { useIsMobile } from "@/hooks/use-mobile"

interface PuzzleBoardProps {
  puzzle: Puzzle
}

export function PuzzleBoard({ puzzle }: PuzzleBoardProps) {
  const { rows, cols, pieces } = puzzle
  const isMobile = useIsMobile()

  return (
    <div className="w-full h-[calc(100vh-120px)] sm:h-screen p-1 sm:p-2 md:p-4">
      <div
        className="w-full h-full grid gap-0 bg-muted rounded-lg border border-border/20 overflow-hidden"
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
                  "w-full h-full transition-all duration-300 overflow-hidden relative",
                  piece.isPlaced ? "border-0" : "border border-border/20",
                  // Add touch-friendly interactions for mobile
                  !piece.isPlaced && "hover:bg-muted/50 active:bg-muted/70",
                  isMobile && !piece.isPlaced && "touch-manipulation"
                )}
              >
                {piece.isPlaced ? (
                  <div className="w-full h-full">
                    <div
                      className="w-full h-full bg-cover bg-no-repeat bg-center"
                      style={{
                        backgroundImage: `url(${encodeURI(puzzle.imageUrl)})`,
                        backgroundPosition: `${(col / (cols - 1)) * 100}% ${(row / (rows - 1)) * 100}%`,
                        backgroundSize: `${cols * 100}% ${rows * 100}%`,
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white p-1 sm:p-2">
                    <QRCode
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/piece/${piece.id}`}
                      size={isMobile ? 
                        // Mobile: smaller QR codes, more responsive
                        Math.min(80, Math.min(window.innerWidth / cols - 4, window.innerHeight / rows - 4)) :
                        // Desktop: larger QR codes
                        Math.min(120, Math.min(window.innerWidth / cols - 8, window.innerHeight / rows - 8))
                      }
                      className="w-full h-full object-contain max-w-full max-h-full"
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
