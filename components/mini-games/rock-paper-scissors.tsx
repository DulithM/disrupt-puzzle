"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Timer, CheckCircle, XCircle, Trophy, Star, Zap, Hand } from "lucide-react"
import type { PuzzlePiece } from "@/lib/types"

interface RockPaperScissorsProps {
  piece: PuzzlePiece
  onSuccess: () => void
  onFailure: () => void
  isSubmitting?: boolean
  pieceSubmitted?: boolean
}

type Choice = "rock" | "paper" | "scissors"
type GameStatus = "waiting" | "playing" | "success" | "failure"

interface GameResult {
  playerChoice: Choice
  aiChoice: Choice
  result: "win" | "lose" | "tie"
}

export function RockPaperScissors({ piece, onSuccess, onFailure, isSubmitting = false, pieceSubmitted = false }: RockPaperScissorsProps) {
  const [gameState, setGameState] = useState<GameStatus>("waiting")
  const [timeLeft, setTimeLeft] = useState(60)
  const [score, setScore] = useState(0)
  const [targetScore, setTargetScore] = useState(3)
  const [currentRound, setCurrentRound] = useState(1)
  const [totalRounds, setTotalRounds] = useState(5)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [lastResult, setLastResult] = useState<GameResult | null>(null)
  const [showResult, setShowResult] = useState(false)

  const choices: Choice[] = ["rock", "paper", "scissors"]

  const getAiChoice = useCallback((): Choice => {
    return choices[Math.floor(Math.random() * choices.length)]
  }, [])

  const determineWinner = useCallback((player: Choice, ai: Choice): "win" | "lose" | "tie" => {
    if (player === ai) return "tie"
    
    if (
      (player === "rock" && ai === "scissors") ||
      (player === "paper" && ai === "rock") ||
      (player === "scissors" && ai === "paper")
    ) {
      return "win"
    }
    
    return "lose"
  }, [])

  const startGame = () => {
    setGameState("playing")
    setTimeLeft(60)
    setScore(0)
    setCurrentRound(1)
    setStreak(0)
    setMaxStreak(0)
    setLastResult(null)
    setShowResult(false)
  }

  const resetGame = () => {
    setGameState("waiting")
    setTimeLeft(60)
    setScore(0)
    setCurrentRound(1)
    setStreak(0)
    setMaxStreak(0)
    setLastResult(null)
    setShowResult(false)
  }

  const handleChoice = useCallback((playerChoice: Choice) => {
    if (gameState !== "playing") return

    const aiChoice = getAiChoice()
    const result = determineWinner(playerChoice, aiChoice)
    
    const gameResult: GameResult = {
      playerChoice,
      aiChoice,
      result
    }
    
    setLastResult(gameResult)
    setShowResult(true)

    if (result === "win") {
      const newScore = score + 1
      const newStreak = streak + 1
      setScore(newScore)
      setStreak(newStreak)
      setMaxStreak(prev => Math.max(prev, newStreak))

      if (newScore >= targetScore) {
        setTimeout(() => {
          setGameState("success")
          onSuccess()
        }, 1500)
        return
      }
    } else if (result === "lose") {
      setStreak(0)
    }

    const newRound = currentRound + 1
    setCurrentRound(newRound)

    if (newRound > totalRounds) {
      setTimeout(() => {
        setGameState("failure")
        onFailure()
      }, 1500)
      return
    }

    // Hide result after 1.5 seconds
    setTimeout(() => {
      setShowResult(false)
      setLastResult(null)
    }, 1500)
  }, [gameState, score, streak, currentRound, totalRounds, targetScore, getAiChoice, determineWinner, onSuccess, onFailure])

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
    if (score >= 4) return 3
    if (score >= 3) return 2
    if (score >= 2) return 1
    return 0
  }

  const getChoiceEmoji = (choice: Choice) => {
    switch (choice) {
      case "rock": return "🪨"
      case "paper": return "📄"
      case "scissors": return "✂️"
    }
  }

  const getResultMessage = (result: "win" | "lose" | "tie") => {
    switch (result) {
      case "win": return "You Win! 🎉"
      case "lose": return "You Lose! 😔"
      case "tie": return "It's a Tie! 🤝"
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="text-center bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
          {gameState === "success" && <Trophy className="w-5 h-5 text-yellow-300" />}
          {gameState === "failure" && <XCircle className="w-5 h-5 text-red-300" />}
          {gameState === "playing" && <Hand className="w-5 h-5 text-green-300" />}
          Rock, Paper, Scissors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameState === "waiting" && (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-xl text-white">
              <Hand className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Ready for Epic Battle?</h3>
              <p className="text-green-100">
                Choose your weapon wisely and crush the AI opponent!
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="text-center">
                <Timer className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-green-500" />
                <p className="font-semibold">60 Seconds</p>
                <p className="text-muted-foreground">Time Limit</p>
              </div>
              <div className="text-center">
                <Hand className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-blue-500" />
                <p className="font-semibold">{targetScore} Wins</p>
                <p className="text-muted-foreground">To Win</p>
              </div>
              <div className="text-center">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-yellow-500" />
                <p className="font-semibold">{totalRounds} Rounds</p>
                <p className="text-muted-foreground">Max Games</p>
              </div>
            </div>

            <Button onClick={startGame} className="w-full text-lg py-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              <Hand className="w-5 h-5 mr-2" />
              Start Epic Battle
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
              <Badge variant="secondary" className="justify-center text-xs sm:text-sm">Score: {score}</Badge>
              <Badge variant="outline" className="justify-center text-xs sm:text-sm">Round: {currentRound}/{totalRounds}</Badge>
              <Badge variant="outline" className="justify-center text-xs sm:text-sm">Streak: {streak}</Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Progress</span>
                <span>{score} / {targetScore}</span>
              </div>
              <Progress 
                value={(score / targetScore) * 100} 
                className="h-2"
              />
            </div>

            {/* Result Display */}
            {showResult && lastResult && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 sm:p-6 space-y-4 shadow-lg">
                <div className="text-center">
                  <h3 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 ${lastResult.result === 'win' ? 'text-green-600' : lastResult.result === 'lose' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {getResultMessage(lastResult.result)}
                  </h3>
                  <div className="flex items-center justify-center gap-3 sm:gap-6">
                    <div className="text-center">
                      <div className="text-4xl sm:text-6xl mb-1 sm:mb-2 animate-bounce">{getChoiceEmoji(lastResult.playerChoice)}</div>
                      <p className="text-xs sm:text-sm font-bold text-green-700">YOU</p>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-500">⚔️</div>
                    <div className="text-center">
                      <div className="text-4xl sm:text-6xl mb-1 sm:mb-2 animate-bounce">{getChoiceEmoji(lastResult.aiChoice)}</div>
                      <p className="text-xs sm:text-sm font-bold text-red-700">AI</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Choice Buttons */}
            {!showResult && (
              <div className="space-y-4">
                <h3 className="text-center text-base sm:text-lg font-semibold text-green-700">Choose your weapon:</h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {choices.map((choice) => (
                    <Button
                      key={choice}
                      onClick={() => handleChoice(choice)}
                      className="flex flex-col items-center justify-center p-2 sm:p-4 h-20 sm:h-24 text-base sm:text-lg font-bold hover:scale-105 active:scale-95 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 border-2 border-green-200 hover:border-green-400 hover:shadow-lg"
                      variant="outline"
                    >
                      <div className="text-2xl sm:text-4xl mb-1 animate-pulse">{getChoiceEmoji(choice)}</div>
                      <div className="capitalize font-bold text-green-700 text-xs sm:text-sm">{choice}</div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {!showResult ? "Click a choice to play against the AI!" : "Result will be shown for 1.5 seconds"}
            </p>
          </div>
        )}

        {gameState === "success" && !pieceSubmitted && (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 sm:p-6 rounded-lg text-white">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Victory!</h3>
              <p className="text-green-100 text-sm sm:text-base">
                You've defeated the AI! Great job!
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
                  <p className="font-semibold text-green-600">Wins</p>
                  <p className="text-xl sm:text-2xl font-bold">{score}</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-600">Max Streak</p>
                  <p className="text-xl sm:text-2xl font-bold">{maxStreak}</p>
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
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Game Over!</h3>
              <p className="text-red-100 text-sm sm:text-base">
                You won {score} out of {targetScore} needed. Try again!
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-red-800 font-medium text-sm sm:text-base">
                💡 Tip: Try to predict the AI's pattern and build winning streaks!
              </p>
            </div>

            <Button onClick={resetGame} variant="outline" className="w-full">
              <Hand className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
