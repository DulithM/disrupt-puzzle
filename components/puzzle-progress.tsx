"use client"

import { CheckCircle, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface PuzzleProgressProps {
  currentIndex: number
  totalPuzzles: number
  completedPuzzles: number
  puzzleTitles: string[]
}

export function PuzzleProgress({ 
  currentIndex, 
  totalPuzzles, 
  completedPuzzles, 
  puzzleTitles 
}: PuzzleProgressProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Progress: {completedPuzzles} of {totalPuzzles} completed
        </span>
        <span className="text-sm text-muted-foreground">
          {Math.round((completedPuzzles / totalPuzzles) * 100)}% complete
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2 mb-4">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${(completedPuzzles / totalPuzzles) * 100}%` }}
        />
      </div>
      
      {/* Puzzle indicators */}
      <div className="flex items-center justify-between gap-2">
        {puzzleTitles.map((title, index) => (
          <div 
            key={index}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-300",
              index === currentIndex 
                ? "bg-primary/10 border border-primary/20" 
                : index < currentIndex 
                  ? "bg-green-50 border border-green-200"
                  : "bg-muted/50 border border-border/20"
            )}
          >
            <div className="flex items-center gap-1">
              {index < currentIndex ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : index === currentIndex ? (
                <Circle className="w-4 h-4 text-primary fill-primary" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-xs font-medium">
                {index + 1}
              </span>
            </div>
            <span className={cn(
              "text-xs text-center line-clamp-2",
              index === currentIndex 
                ? "text-primary font-medium" 
                : index < currentIndex 
                  ? "text-green-700"
                  : "text-muted-foreground"
            )}>
              {title}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
