"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Timer, Shuffle, CheckCircle, XCircle } from "lucide-react"
import type { PuzzlePiece } from "@/lib/types"

interface MiniPuzzleGameProps {
  piece: PuzzlePiece
  onSuccess: () => void
  onFailure: () => void
}

interface PuzzleFragment {
  id: number
  correctX: number
  correctY: number
  currentX: number
  currentY: number
  isPlaced: boolean
  imageSection: string
}

export function MiniPuzzleGame({ piece, onSuccess, onFailure }: MiniPuzzleGameProps) {
  const [gameState, setGameState] = useState<"waiting" | "playing" | "success" | "failure">("waiting")
  const [timeLeft, setTimeLeft] = useState(60)
  const [fragments, setFragments] = useState<PuzzleFragment[]>([])
  const [draggedFragment, setDraggedFragment] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const gameAreaRef = useRef<HTMLDivElement>(null)

  const initializePuzzle = useCallback(() => {
    // Create 4 fragments (2x2 grid) of the puzzle piece
    const newFragments: PuzzleFragment[] = []

    for (let i = 0; i < 4; i++) {
      const row = Math.floor(i / 2)
      const col = i % 2

      newFragments.push({
        id: i,
        correctX: col * 80, // 80px per fragment
        correctY: row * 80,
        currentX: Math.random() * 200, // Random starting position
        currentY: Math.random() * 200,
        isPlaced: false,
        imageSection: `fragment-${i}`, // This would be actual image data in real implementation
      })
    }

    setFragments(newFragments)
    setMoves(0)
  }, [])

  const startGame = () => {
    setGameState("playing")
    setTimeLeft(60)
    initializePuzzle()
  }

  const resetGame = () => {
    setGameState("waiting")
    setTimeLeft(60)
    setMoves(0)
  }

  // Timer countdown
  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (gameState === "playing" && timeLeft === 0) {
      setGameState("failure")
      onFailure()
    }
  }, [gameState, timeLeft, onFailure])

  const checkSolved = useCallback((currentFragments: PuzzleFragment[]) => {
    return currentFragments.every((fragment) => fragment.isPlaced)
  }, [])

  const handleDragStart = (e: React.DragEvent, fragmentId: number) => {
    if (gameState !== "playing") return
    setDraggedFragment(fragmentId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetX: number, targetY: number) => {
    e.preventDefault()

    if (draggedFragment === null || gameState !== "playing") return

    const fragment = fragments.find((f) => f.id === draggedFragment)
    if (!fragment) return

    // Check if dropped in correct position (with some tolerance)
    const tolerance = 20
    const isCorrectPosition =
      Math.abs(fragment.correctX - targetX) < tolerance && Math.abs(fragment.correctY - targetY) < tolerance

    if (isCorrectPosition) {
      const newFragments = fragments.map((f) =>
        f.id === draggedFragment
          ? { ...f, currentX: fragment.correctX, currentY: fragment.correctY, isPlaced: true }
          : f,
      )

      setFragments(newFragments)
      setMoves(moves + 1)

      if (checkSolved(newFragments)) {
        setGameState("success")
        onSuccess()
      }
    }

    setDraggedFragment(null)
  }

  const handleMouseDown = (e: React.MouseEvent, fragmentId: number) => {
    if (gameState !== "playing") return

    const fragment = fragments.find((f) => f.id === fragmentId)
    if (!fragment || fragment.isPlaced) return

    const startX = e.clientX - fragment.currentX
    const startY = e.clientY - fragment.currentY

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - startX
      const newY = e.clientY - startY

      setFragments((prev) => prev.map((f) => (f.id === fragmentId ? { ...f, currentX: newX, currentY: newY } : f)))
    }

    const handleMouseUp = (e: MouseEvent) => {
      const fragment = fragments.find((f) => f.id === fragmentId)
      if (!fragment) return

      // Check if dropped in correct position
      const tolerance = 30
      const isCorrectPosition =
        Math.abs(fragment.correctX - (e.clientX - startX)) < tolerance &&
        Math.abs(fragment.correctY - (e.clientY - startY)) < tolerance

      if (isCorrectPosition) {
        const newFragments = fragments.map((f) =>
          f.id === fragmentId ? { ...f, currentX: fragment.correctX, currentY: fragment.correctY, isPlaced: true } : f,
        )

        setFragments(newFragments)
        setMoves(moves + 1)

        if (checkSolved(newFragments)) {
          setGameState("success")
          onSuccess()
        }
      }

      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {gameState === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
          {gameState === "failure" && <XCircle className="w-5 h-5 text-red-500" />}
          Jigsaw Piece Challenge
        </CardTitle>
        <CardDescription>
          Drag and drop the fragments to reconstruct piece ({piece.row + 1}, {piece.col + 1})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameState === "waiting" && (
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Assemble the jigsaw fragments within 60 seconds to unlock this piece!
            </p>
            <Button onClick={startGame} className="w-full">
              <Shuffle className="w-4 h-4 mr-2" />
              Start Challenge
            </Button>
          </div>
        )}

        {gameState === "playing" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Badge variant="outline" className="flex items-center gap-1">
                <Timer className="w-3 h-3" />
                {formatTime(timeLeft)}
              </Badge>
              <Badge variant="secondary">Moves: {moves}</Badge>
            </div>

            <div
              ref={gameAreaRef}
              className="relative w-80 h-80 mx-auto bg-muted/30 border-2 border-dashed border-muted-foreground/20 rounded-lg overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => {
                const rect = gameAreaRef.current?.getBoundingClientRect()
                if (rect) {
                  const x = e.clientX - rect.left
                  const y = e.clientY - rect.top
                  handleDrop(e, x, y)
                }
              }}
            >
              {/* Drop zones (correct positions) */}
              {[0, 1, 2, 3].map((i) => {
                const row = Math.floor(i / 2)
                const col = i % 2
                return (
                  <div
                    key={`zone-${i}`}
                    className="absolute border border-primary/30 bg-primary/5"
                    style={{
                      left: col * 80 + 100,
                      top: row * 80 + 100,
                      width: 80,
                      height: 80,
                    }}
                  />
                )
              })}

              {/* Draggable fragments */}
              {fragments.map((fragment) => (
                <div
                  key={fragment.id}
                  className={`absolute w-20 h-20 cursor-move transition-all duration-200 ${
                    fragment.isPlaced
                      ? "bg-green-200 border-2 border-green-400"
                      : "bg-blue-200 border-2 border-blue-400 hover:scale-105"
                  }`}
                  style={{
                    left: fragment.currentX,
                    top: fragment.currentY,
                    zIndex: draggedFragment === fragment.id ? 10 : 1,
                  }}
                  draggable={!fragment.isPlaced}
                  onDragStart={(e) => handleDragStart(e, fragment.id)}
                  onMouseDown={(e) => handleMouseDown(e, fragment.id)}
                >
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                    {fragment.isPlaced ? "✓" : `${fragment.id + 1}`}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Drag the numbered fragments to the outlined areas to reconstruct the piece
            </p>
          </div>
        )}

        {gameState === "success" && (
          <div className="text-center space-y-4">
            <div className="text-green-600">
              <CheckCircle className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Piece Assembled!</h3>
              <p className="text-sm text-muted-foreground">
                Completed in {moves} moves with {formatTime(timeLeft)} remaining
              </p>
            </div>
          </div>
        )}

        {gameState === "failure" && (
          <div className="text-center space-y-4">
            <div className="text-red-600">
              <XCircle className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Time's Up!</h3>
              <p className="text-sm text-muted-foreground">You ran out of time. Try again!</p>
            </div>
            <Button onClick={resetGame} variant="outline" className="w-full bg-transparent">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
