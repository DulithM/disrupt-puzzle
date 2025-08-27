"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Timer, Shuffle, CheckCircle, XCircle, Trophy, Star, Target } from "lucide-react"
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
  color: string
}

const FRAGMENT_COLORS = [
  "bg-blue-400 border-blue-600",
  "bg-green-400 border-green-600", 
  "bg-purple-400 border-purple-600",
  "bg-orange-400 border-orange-600",
  "bg-pink-400 border-pink-600",
  "bg-indigo-400 border-indigo-600",
  "bg-teal-400 border-teal-600",
  "bg-yellow-400 border-yellow-600",
]

export function MiniPuzzleGame({ piece, onSuccess, onFailure }: MiniPuzzleGameProps) {
  const [gameState, setGameState] = useState<"waiting" | "playing" | "success" | "failure">("waiting")
  const [timeLeft, setTimeLeft] = useState(90) // Increased time to 90 seconds
  const [fragments, setFragments] = useState<PuzzleFragment[]>([])
  const [draggedFragment, setDraggedFragment] = useState<number | null>(null)
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [hints, setHints] = useState(3)
  const [showHint, setShowHint] = useState(false)
  const gameAreaRef = useRef<HTMLDivElement>(null)

  const initializePuzzle = useCallback(() => {
    // Create 6 fragments (2x3 grid) for more complexity
    const newFragments: PuzzleFragment[] = []

    for (let i = 0; i < 6; i++) {
      const row = Math.floor(i / 3)
      const col = i % 3

      newFragments.push({
        id: i,
        correctX: col * 60, // Smaller fragments for mobile
        correctY: row * 60,
        currentX: Math.random() * 200, // Random starting position
        currentY: Math.random() * 150,
        isPlaced: false,
        imageSection: `fragment-${i}`,
        color: FRAGMENT_COLORS[i % FRAGMENT_COLORS.length],
      })
    }

    setFragments(newFragments)
    setMoves(0)
    setScore(0)
    setHints(3)
  }, [])

  const startGame = () => {
    setGameState("playing")
    setTimeLeft(90)
    initializePuzzle()
  }

  const resetGame = () => {
    setGameState("waiting")
    setTimeLeft(90)
    setMoves(0)
    setScore(0)
    setHints(3)
    setShowHint(false)
  }

  const useHint = () => {
    if (hints > 0 && gameState === "playing") {
      setHints(hints - 1)
      setShowHint(true)
      setTimeout(() => setShowHint(false), 2000)
    }
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
    const tolerance = 25
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
      
      // Calculate score based on time remaining and moves
      const timeBonus = Math.floor(timeLeft / 10) * 10
      const moveBonus = Math.max(0, 50 - moves * 5)
      const newScore = score + 100 + timeBonus + moveBonus
      setScore(newScore)

      if (checkSolved(newFragments)) {
        setGameState("success")
        onSuccess()
      }
    }

    setDraggedFragment(null)
  }

  const handleTouchStart = (e: React.TouchEvent, fragmentId: number) => {
    if (gameState !== "playing") return

    const fragment = fragments.find((f) => f.id === fragmentId)
    if (!fragment || fragment.isPlaced) return

    const touch = e.touches[0]
    const startX = touch.clientX - fragment.currentX
    const startY = touch.clientY - fragment.currentY

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const touch = e.touches[0]
      const newX = touch.clientX - startX
      const newY = touch.clientY - startY

      setFragments((prev) => prev.map((f) => (f.id === fragmentId ? { ...f, currentX: newX, currentY: newY } : f)))
    }

    const handleTouchEnd = (e: TouchEvent) => {
      const fragment = fragments.find((f) => f.id === fragmentId)
      if (!fragment) return

      const touch = e.changedTouches[0]
      // Check if dropped in correct position
      const tolerance = 30
      const isCorrectPosition =
        Math.abs(fragment.correctX - (touch.clientX - startX)) < tolerance &&
        Math.abs(fragment.correctY - (touch.clientY - startY)) < tolerance

      if (isCorrectPosition) {
        const newFragments = fragments.map((f) =>
          f.id === fragmentId ? { ...f, currentX: fragment.correctX, currentY: fragment.correctY, isPlaced: true } : f,
        )

        setFragments(newFragments)
        setMoves(moves + 1)
        
        // Calculate score
        const timeBonus = Math.floor(timeLeft / 10) * 10
        const moveBonus = Math.max(0, 50 - moves * 5)
        const newScore = score + 100 + timeBonus + moveBonus
        setScore(newScore)

        if (checkSolved(newFragments)) {
          setGameState("success")
          onSuccess()
        }
      }

      document.removeEventListener("touchmove", handleTouchMove, { passive: false })
      document.removeEventListener("touchend", handleTouchEnd)
    }

    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd)
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
        
        // Calculate score
        const timeBonus = Math.floor(timeLeft / 10) * 10
        const moveBonus = Math.max(0, 50 - moves * 5)
        const newScore = score + 100 + timeBonus + moveBonus
        setScore(newScore)

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

  const getStarRating = () => {
    if (score >= 800) return 3
    if (score >= 600) return 2
    if (score >= 400) return 1
    return 0
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          {gameState === "success" && <Trophy className="w-5 h-5 text-yellow-500" />}
          {gameState === "failure" && <XCircle className="w-5 h-5 text-red-500" />}
          {gameState === "playing" && <Target className="w-5 h-5 text-blue-500" />}
          Puzzle Piece Challenge
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Assemble the puzzle fragments to unlock piece ({piece.row + 1}, {piece.col + 1})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameState === "waiting" && (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 rounded-lg text-white">
              <h3 className="text-lg sm:text-xl font-bold mb-2">Ready to Solve?</h3>
              <p className="text-blue-100 text-sm sm:text-base">
                Complete this mini-puzzle to unlock the main puzzle piece!
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="text-center">
                <Timer className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-blue-500" />
                <p className="font-semibold">90 Seconds</p>
                <p className="text-muted-foreground">Time Limit</p>
              </div>
              <div className="text-center">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-green-500" />
                <p className="font-semibold">6 Fragments</p>
                <p className="text-muted-foreground">To Assemble</p>
              </div>
              <div className="text-center">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-yellow-500" />
                <p className="font-semibold">3 Hints</p>
                <p className="text-muted-foreground">Available</p>
              </div>
            </div>

            <Button onClick={startGame} className="w-full text-base sm:text-lg py-4 sm:py-6">
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Start Challenge
            </Button>
          </div>
        )}

        {gameState === "playing" && (
          <div className="space-y-4">
            {/* Game Stats */}
            <div className="grid grid-cols-4 gap-1 sm:gap-2">
              <Badge variant="outline" className="flex items-center gap-1 justify-center text-xs">
                <Timer className="w-3 h-3" />
                {formatTime(timeLeft)}
              </Badge>
              <Badge variant="secondary" className="justify-center text-xs">Moves: {moves}</Badge>
              <Badge variant="outline" className="justify-center text-xs">Score: {score}</Badge>
              <Badge variant="outline" className="justify-center text-xs">Hints: {hints}</Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Progress</span>
                <span>{fragments.filter(f => f.isPlaced).length} / {fragments.length}</span>
              </div>
              <Progress 
                value={(fragments.filter(f => f.isPlaced).length / fragments.length) * 100} 
                className="h-2"
              />
            </div>

            {/* Hint Button */}
            {hints > 0 && (
              <Button 
                onClick={useHint} 
                variant="outline" 
                size="sm" 
                className="w-full text-xs sm:text-sm"
                disabled={showHint}
              >
                <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                {showHint ? "Showing Hint..." : `Use Hint (${hints} left)`}
              </Button>
            )}

            {/* Game Area */}
            <div
              ref={gameAreaRef}
              className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-300 rounded-lg overflow-hidden"
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
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const row = Math.floor(i / 3)
                const col = i % 3
                return (
                  <div
                    key={`zone-${i}`}
                    className={`absolute border-2 border-dashed transition-all duration-300 ${
                      showHint ? 'border-yellow-400 bg-yellow-100/50' : 'border-blue-300 bg-blue-50/30'
                    }`}
                    style={{
                      left: col * 60 + 20,
                      top: row * 60 + 20,
                      width: 60,
                      height: 60,
                    }}
                  />
                )
              })}

              {/* Draggable fragments */}
              {fragments.map((fragment) => (
                <div
                  key={fragment.id}
                  className={`absolute w-14 h-14 sm:w-16 sm:h-16 cursor-move transition-all duration-300 rounded-lg shadow-lg hover:shadow-xl touch-none ${
                    fragment.isPlaced
                      ? "bg-green-400 border-2 border-green-600 scale-110"
                      : `${fragment.color} border-2 hover:scale-105`
                  }`}
                  style={{
                    left: fragment.currentX,
                    top: fragment.currentY,
                    zIndex: draggedFragment === fragment.id ? 10 : 1,
                  }}
                  draggable={!fragment.isPlaced}
                  onDragStart={(e) => handleDragStart(e, fragment.id)}
                  onMouseDown={(e) => handleMouseDown(e, fragment.id)}
                  onTouchStart={(e) => handleTouchStart(e, fragment.id)}
                >
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                    {fragment.isPlaced ? "✓" : `${fragment.id + 1}`}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Drag or touch the numbered fragments to the outlined areas
            </p>
          </div>
        )}

        {gameState === "success" && (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 sm:p-6 rounded-lg text-white">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Piece Assembled!</h3>
              <p className="text-green-100 text-sm sm:text-base">
                Excellent work! You've successfully completed this puzzle piece.
              </p>
            </div>

            {/* Score Display */}
            <div className="space-y-3">
              <div className="flex justify-center gap-1">
                {[1, 2, 3].map((star) => (
                  <Star 
                    key={star}
                    className={`w-5 h-5 sm:w-6 sm:h-6 ${star <= getStarRating() ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <p className="font-semibold text-green-600">Final Score</p>
                  <p className="text-xl sm:text-2xl font-bold">{score}</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-600">Moves Used</p>
                  <p className="text-xl sm:text-2xl font-bold">{moves}</p>
                </div>
                <div>
                  <p className="font-semibold text-purple-600">Time Left</p>
                  <p className="text-xl sm:text-2xl font-bold">{formatTime(timeLeft)}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <p className="text-green-800 font-medium text-sm sm:text-base">
                🎉 You can now claim this puzzle piece!
              </p>
            </div>
          </div>
        )}

        {gameState === "failure" && (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-red-500 to-pink-600 p-4 sm:p-6 rounded-lg text-white">
              <XCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Time's Up!</h3>
              <p className="text-red-100 text-sm sm:text-base">
                Don't worry, you can try again to complete this puzzle piece.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-red-800 font-medium text-sm sm:text-base">
                💡 Tip: Try to place fragments quickly and use hints if needed!
              </p>
            </div>

            <Button onClick={resetGame} variant="outline" className="w-full">
              <Shuffle className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
