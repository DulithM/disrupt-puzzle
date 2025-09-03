"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Timer, Zap, CheckCircle, XCircle, Trophy, Star, Target } from "lucide-react"
import type { PuzzlePiece } from "@/lib/types"

interface SpeedTapProps {
  piece: PuzzlePiece
  onSuccess: () => void
  onFailure: () => void
  isSubmitting?: boolean
  pieceSubmitted?: boolean
}

export function SpeedTap({ piece, onSuccess, onFailure, isSubmitting = false, pieceSubmitted = false }: SpeedTapProps) {
  const [gameState, setGameState] = useState<"waiting" | "playing" | "success" | "failure">("waiting")
  const [timeLeft, setTimeLeft] = useState(45)
  const [tapCount, setTapCount] = useState(0)
  const [targetTaps, setTargetTaps] = useState(100)
  const [tapRate, setTapRate] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [lastTapTime, setLastTapTime] = useState<number | null>(null)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)

  const startGame = () => {
    setGameState("playing")
    setTimeLeft(45)
    setTapCount(0)
    setTapRate(0)
    setStartTime(Date.now())
    setLastTapTime(null)
    setCombo(0)
    setMaxCombo(0)
  }

  const resetGame = () => {
    setGameState("waiting")
    setTimeLeft(45)
    setTapCount(0)
    setTapRate(0)
    setStartTime(null)
    setLastTapTime(null)
    setCombo(0)
    setMaxCombo(0)
  }

  const handleTap = () => {
    if (gameState !== "playing") return

    const now = Date.now()
    const newTapCount = tapCount + 1
    setTapCount(newTapCount)

    // Calculate tap rate
    if (startTime) {
      const elapsed = (now - startTime) / 1000 // seconds
      const newTapRate = Math.round(newTapCount / elapsed)
      setTapRate(newTapRate)
    }

    // Calculate combo (taps within 500ms of each other)
    if (lastTapTime && (now - lastTapTime) < 500) {
      const newCombo = combo + 1
      setCombo(newCombo)
      setMaxCombo(prev => Math.max(prev, newCombo))
    } else {
      setCombo(1)
    }

    setLastTapTime(now)

    // Check if target reached
    if (newTapCount >= targetTaps) {
      setGameState("success")
      onSuccess()
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStarRating = () => {
    const efficiency = timeLeft > 0 ? tapCount / (45 - timeLeft) : 0
    if (efficiency >= 3) return 3
    if (efficiency >= 2) return 2
    if (efficiency >= 1) return 1
    return 0
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
      <CardHeader className="text-center bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
          {gameState === "success" && <Trophy className="w-5 h-5 text-yellow-300" />}
          {gameState === "failure" && <XCircle className="w-5 h-5 text-red-300" />}
          {gameState === "playing" && <Zap className="w-5 h-5 text-green-300" />}
          Lightning Speed Challenge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameState === "waiting" && (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-6 rounded-xl text-white">
              <Zap className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Lightning Speed Awaits!</h3>
              <p className="text-yellow-100">
                Prove your lightning-fast reflexes and speed!
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="text-center">
                <Timer className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-yellow-500" />
                <p className="font-semibold">45 Seconds</p>
                <p className="text-muted-foreground">Time Limit</p>
              </div>
              <div className="text-center">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-green-500" />
                <p className="font-semibold">{targetTaps} Taps</p>
                <p className="text-muted-foreground">Target Count</p>
              </div>
              <div className="text-center">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-orange-500" />
                <p className="font-semibold">Speed Test</p>
                <p className="text-muted-foreground">Challenge</p>
              </div>
            </div>

            <Button onClick={startGame} className="w-full text-lg py-6 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700">
              <Zap className="w-5 h-5 mr-2" />
              Start Lightning Challenge
            </Button>
          </div>
        )}

        {gameState === "playing" && (
          <div className="space-y-4">
            {/* Game Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
              <Badge variant="outline" className="flex items-center gap-1 justify-center text-xs sm:text-sm">
                <Timer className="w-3 h-3 sm:w-4 sm:h-4" />
                {formatTime(timeLeft)}
              </Badge>
              <Badge variant="secondary" className="justify-center text-xs sm:text-sm">Taps: {tapCount}</Badge>
              <Badge variant="outline" className="justify-center text-xs sm:text-sm">Target: {targetTaps}</Badge>
              <Badge variant="outline" className="justify-center text-xs sm:text-sm">Rate: {tapRate}/s</Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Progress</span>
                <span>{tapCount} / {targetTaps}</span>
              </div>
              <Progress 
                value={(tapCount / targetTaps) * 100} 
                className="h-2"
              />
            </div>

            {/* Tap Area */}
            <div
              className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 mx-auto bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-dashed border-yellow-300 rounded-lg overflow-hidden cursor-pointer select-none"
              onClick={handleTap}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl sm:text-6xl md:text-8xl font-bold text-yellow-600 mb-2 sm:mb-4">
                    {tapCount}
                  </div>
                  <div className="text-base sm:text-lg md:text-xl font-semibold text-orange-600">
                    TAP HERE!
                  </div>
                </div>
              </div>

              {/* Combo Display */}
              {combo > 1 && (
                <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                  {combo}x Combo!
                </div>
              )}

              {/* Tap Rate Display */}
              <div className="absolute bottom-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                {tapRate} taps/s
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Tap the area as fast as you can! Chain taps for combo bonuses!
            </p>
          </div>
        )}

        {gameState === "success" && !pieceSubmitted && (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 sm:p-6 rounded-lg text-white">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Speed Demon!</h3>
              <p className="text-green-100 text-sm sm:text-base">
                Incredible speed! You've reached the target tap count.
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
                  <p className="font-semibold text-green-600">Total Taps</p>
                  <p className="text-xl sm:text-2xl font-bold">{tapCount}</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-600">Max Combo</p>
                  <p className="text-xl sm:text-2xl font-bold">{maxCombo}x</p>
                </div>
                <div>
                  <p className="font-semibold text-purple-600">Time Left</p>
                  <p className="text-xl sm:text-2xl font-bold">{formatTime(timeLeft)}</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={onSuccess} 
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Piece...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Add to Puzzle
                </>
              )}
            </Button>
          </div>
        )}

        {pieceSubmitted && (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-4 sm:p-6 rounded-lg text-white">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Thank You!</h3>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <p className="text-blue-800 font-medium text-sm sm:text-base">
                You can now check the main puzzle to see your contribution!
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
                You tapped {tapCount} times. Try again to reach {targetTaps} taps!
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-red-800 font-medium text-sm sm:text-base">
                💡 Tip: Use both hands and tap rhythmically for better speed!
              </p>
            </div>

            <Button onClick={resetGame} variant="outline" className="w-full">
              <Zap className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
