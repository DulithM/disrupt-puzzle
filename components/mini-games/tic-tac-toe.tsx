"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Timer, X, CheckCircle, XCircle, Trophy, Star, Brain, Circle } from "lucide-react"
import type { PuzzlePiece } from "@/lib/types"

interface TicTacToeProps {
  piece: PuzzlePiece
  onSuccess: () => void
  onFailure: () => void
  isSubmitting?: boolean
  pieceSubmitted?: boolean
}

type Player = "X" | "O" | null
type GameStatus = "waiting" | "playing" | "success" | "failure"

export function TicTacToe({ piece, onSuccess, onFailure, isSubmitting = false, pieceSubmitted = false }: TicTacToeProps) {
  const [gameState, setGameState] = useState<GameStatus>("waiting")
  const [timeLeft, setTimeLeft] = useState(120)
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null))
  const [currentPlayer, setCurrentPlayer] = useState<"X" | "O">("X")
  const [gameWon, setGameWon] = useState<boolean>(false)
  const [winner, setWinner] = useState<Player>(null)
  const [moves, setMoves] = useState(0)
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium")

  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ]

  const checkWinner = useCallback((boardState: Player[]): Player => {
    for (const combination of winningCombinations) {
      const [a, b, c] = combination
      if (boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c]) {
        return boardState[a]
      }
    }
    return null
  }, [])

  const checkDraw = useCallback((boardState: Player[]): boolean => {
    return boardState.every(cell => cell !== null)
  }, [])

  const getAiMove = useCallback((boardState: Player[], difficulty: string): number => {
    const availableMoves = boardState.map((cell, index) => cell === null ? index : -1).filter(index => index !== -1)
    
    if (availableMoves.length === 0) return -1

    if (difficulty === "easy") {
      // Random move
      return availableMoves[Math.floor(Math.random() * availableMoves.length)]
    } else if (difficulty === "medium") {
      // 70% chance of smart move, 30% random
      if (Math.random() < 0.7) {
        // Try to win
        for (const move of availableMoves) {
          const testBoard = [...boardState]
          testBoard[move] = "O"
          if (checkWinner(testBoard) === "O") return move
        }
        // Block player win
        for (const move of availableMoves) {
          const testBoard = [...boardState]
          testBoard[move] = "X"
          if (checkWinner(testBoard) === "X") return move
        }
      }
      return availableMoves[Math.floor(Math.random() * availableMoves.length)]
    } else {
      // Hard: Always try to win or block
      // Try to win
      for (const move of availableMoves) {
        const testBoard = [...boardState]
        testBoard[move] = "O"
        if (checkWinner(testBoard) === "O") return move
      }
      // Block player win
      for (const move of availableMoves) {
        const testBoard = [...boardState]
        testBoard[move] = "X"
        if (checkWinner(testBoard) === "X") return move
      }
      // Take center if available
      if (availableMoves.includes(4)) return 4
      // Take corners
      const corners = [0, 2, 6, 8]
      const availableCorners = corners.filter(corner => availableMoves.includes(corner))
      if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)]
      }
      // Take any available move
      return availableMoves[Math.floor(Math.random() * availableMoves.length)]
    }
  }, [checkWinner])

  const handleCellClick = useCallback((index: number) => {
    if (gameState !== "playing" || board[index] !== null || currentPlayer !== "X") return

    const newBoard = [...board]
    newBoard[index] = "X"
    setBoard(newBoard)
    setMoves(prev => prev + 1)

    const gameWinner = checkWinner(newBoard)
    if (gameWinner) {
      setWinner(gameWinner)
      setGameWon(true)
      if (gameWinner === "X") {
        setGameState("success")
        onSuccess()
      } else {
        setGameState("failure")
        onFailure()
      }
      return
    }

    if (checkDraw(newBoard)) {
      setGameState("failure")
      onFailure()
      return
    }

    setCurrentPlayer("O")

    // AI move after a short delay
    setTimeout(() => {
      const aiMove = getAiMove(newBoard, aiDifficulty)
      if (aiMove !== -1) {
        const aiBoard = [...newBoard]
        aiBoard[aiMove] = "O"
        setBoard(aiBoard)
        setMoves(prev => prev + 1)

        const aiGameWinner = checkWinner(aiBoard)
        if (aiGameWinner) {
          setWinner(aiGameWinner)
          setGameWon(true)
          if (aiGameWinner === "X") {
            setGameState("success")
            onSuccess()
          } else {
            setGameState("failure")
            onFailure()
          }
          return
        }

        if (checkDraw(aiBoard)) {
          setGameState("failure")
          onFailure()
          return
        }

        setCurrentPlayer("X")
      }
    }, 500)
  }, [board, currentPlayer, gameState, aiDifficulty, checkWinner, checkDraw, getAiMove, onSuccess, onFailure])

  const startGame = () => {
    setGameState("playing")
    setTimeLeft(120)
    setBoard(Array(9).fill(null))
    setCurrentPlayer("X")
    setGameWon(false)
    setWinner(null)
    setMoves(0)
  }

  const resetGame = () => {
    setGameState("waiting")
    setTimeLeft(120)
    setBoard(Array(9).fill(null))
    setCurrentPlayer("X")
    setGameWon(false)
    setWinner(null)
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStarRating = () => {
    if (moves <= 6) return 3
    if (moves <= 8) return 2
    if (moves <= 10) return 1
    return 0
  }

  const renderCell = (index: number) => {
    const cell = board[index]
    const isWinningCell = winner && winningCombinations.some(combo => 
      combo.includes(index) && combo.every(pos => board[pos] === winner)
    )

    return (
      <div
        key={index}
        className={`aspect-square border-2 border-gray-300 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold cursor-pointer transition-all duration-200 hover:bg-gray-50 active:scale-95 ${
          isWinningCell ? 'bg-green-100 border-green-500' : ''
        } ${cell ? 'cursor-not-allowed' : 'hover:scale-105'}`}
        onClick={() => handleCellClick(index)}
      >
        {cell === "X" && <X className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />}
        {cell === "O" && <Circle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />}
      </div>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
          {gameState === "success" && <Trophy className="w-5 h-5 text-yellow-300" />}
          {gameState === "failure" && <XCircle className="w-5 h-5 text-red-300" />}
          {gameState === "playing" && <Brain className="w-5 h-5 text-green-300" />}
          Tic-Tac-Toe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameState === "waiting" && (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 sm:p-6 rounded-lg text-white">
              <h3 className="text-lg sm:text-xl font-bold mb-2">Ready to Play?</h3>
              <p className="text-purple-100 text-sm sm:text-base">
                Challenge the AI in a game of Tic-Tac-Toe!
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="text-center">
                <Timer className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-purple-500" />
                <p className="font-semibold">2 Minutes</p>
                <p className="text-muted-foreground">Time Limit</p>
              </div>
              <div className="text-center">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-green-500" />
                <p className="font-semibold">AI Opponent</p>
                <p className="text-muted-foreground">Medium Level</p>
              </div>
              <div className="text-center">
                <X className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-blue-500" />
                <p className="font-semibold">You Play X</p>
                <p className="text-muted-foreground">Go First</p>
              </div>
            </div>

            <Button onClick={startGame} className="w-full text-base sm:text-lg py-4 sm:py-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Start Game
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
              <Badge variant="secondary" className="justify-center text-xs sm:text-sm">Moves: {moves}</Badge>
              <Badge variant="outline" className="justify-center text-xs sm:text-sm">Turn: {currentPlayer}</Badge>
              <Badge variant="outline" className="justify-center text-xs sm:text-sm">AI: {aiDifficulty}</Badge>
            </div>

            {/* Game Board */}
            <div className="grid grid-cols-3 gap-1 sm:gap-2 max-w-xs sm:max-w-sm mx-auto">
              {Array(9).fill(null).map((_, index) => renderCell(index))}
            </div>

            <div className="text-center">
              <p className="text-sm font-medium">
                {currentPlayer === "X" ? "Your turn (X)" : "AI thinking..."}
              </p>
            </div>
          </div>
        )}

        {gameState === "success" && !pieceSubmitted && (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 sm:p-6 rounded-lg text-white">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2">You Won!</h3>
              <p className="text-green-100 text-sm sm:text-base">
                Excellent strategy! You've defeated the AI.
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
                  <p className="font-semibold text-green-600">Moves Used</p>
                  <p className="text-xl sm:text-2xl font-bold">{moves}</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-600">Time Left</p>
                  <p className="text-xl sm:text-2xl font-bold">{formatTime(timeLeft)}</p>
                </div>
                <div>
                  <p className="font-semibold text-purple-600">AI Level</p>
                  <p className="text-xl sm:text-2xl font-bold">{aiDifficulty}</p>
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
                {winner === "O" ? "The AI won this round." : "It's a draw!"} Try again to beat the AI!
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-red-800 font-medium text-sm sm:text-base">
                💡 Tip: Try to control the center and create multiple winning opportunities!
              </p>
            </div>

            <Button onClick={resetGame} variant="outline" className="w-full">
              <Brain className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
