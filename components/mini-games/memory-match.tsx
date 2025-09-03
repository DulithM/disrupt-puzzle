"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Timer, Brain, CheckCircle, XCircle, Trophy, Star, Heart } from "lucide-react"
import type { PuzzlePiece } from "@/lib/types"

interface MemoryMatchProps {
  piece: PuzzlePiece
  onSuccess: () => void
  onFailure: () => void
  isSubmitting?: boolean
  pieceSubmitted?: boolean
}

interface MemoryCard {
  id: number
  value: string
  isFlipped: boolean
  isMatched: boolean
  icon: string
}

const CARD_ICONS = [
  "🎯", "🎮", "🎲", "🎪", "🎨", "🎭", "🎪", "🎯",
  "🚀", "⚡", "💎", "🌟", "🔥", "💫", "⭐", "✨"
]

export function MemoryMatch({ piece, onSuccess, onFailure, isSubmitting = false, pieceSubmitted = false }: MemoryMatchProps) {
  const [gameState, setGameState] = useState<"waiting" | "playing" | "success" | "failure">("waiting")
  const [timeLeft, setTimeLeft] = useState(75)
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const [totalPairs, setTotalPairs] = useState(8)
  const [canFlip, setCanFlip] = useState(true)

  const initializeGame = useCallback(() => {
    const cardValues = CARD_ICONS.slice(0, totalPairs)
    const gameCards: MemoryCard[] = []
    
    // Create pairs of cards
    cardValues.forEach((icon, index) => {
      gameCards.push(
        { id: index * 2, value: icon, isFlipped: false, isMatched: false, icon },
        { id: index * 2 + 1, value: icon, isFlipped: false, isMatched: false, icon }
      )
    })
    
    // Shuffle cards
    for (let i = gameCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]]
    }
    
    setCards(gameCards)
    setFlippedCards([])
    setMoves(0)
    setMatches(0)
    setCanFlip(true)
  }, [totalPairs])

  const startGame = () => {
    setGameState("playing")
    setTimeLeft(75)
    initializeGame()
  }

  const resetGame = () => {
    setGameState("waiting")
    setTimeLeft(75)
    setCards([])
    setFlippedCards([])
    setMoves(0)
    setMatches(0)
  }

  const handleCardClick = (cardId: number) => {
    if (!canFlip || gameState !== "playing") return
    
    const card = cards.find(c => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched) return

    // Flip the card
    const newCards = cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    )
    setCards(newCards)
    
    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)

    // Check if we have two cards flipped
    if (newFlippedCards.length === 2) {
      setCanFlip(false)
      setMoves(prev => prev + 1)
      
      const [firstId, secondId] = newFlippedCards
      const firstCard = newCards.find(c => c.id === firstId)
      const secondCard = newCards.find(c => c.id === secondId)
      
      if (firstCard && secondCard && firstCard.value === secondCard.value) {
        // Match found
        const updatedCards = newCards.map(c => 
          c.id === firstId || c.id === secondId 
            ? { ...c, isMatched: true }
            : c
        )
        setCards(updatedCards)
        setMatches(prev => prev + 1)
        setFlippedCards([])
        setCanFlip(true)
        
        // Check if game is won
        if (matches + 1 >= totalPairs) {
          setGameState("success")
          onSuccess()
        }
      } else {
        // No match, flip cards back after delay
        setTimeout(() => {
          const resetCards = cards.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isFlipped: false }
              : c
          )
          setCards(resetCards)
          setFlippedCards([])
          setCanFlip(true)
        }, 1000)
      }
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
    const efficiency = moves > 0 ? matches / moves : 0
    if (efficiency >= 0.8) return 3
    if (efficiency >= 0.6) return 2
    if (efficiency >= 0.4) return 1
    return 0
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
      <CardHeader className="text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
          {gameState === "success" && <Trophy className="w-5 h-5 text-yellow-300" />}
          {gameState === "failure" && <XCircle className="w-5 h-5 text-red-300" />}
          {gameState === "playing" && <Brain className="w-5 h-5 text-green-300" />}
          Memory Master Challenge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gameState === "waiting" && (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-xl text-white">
              <Brain className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Memory Challenge Awaits!</h3>
              <p className="text-purple-100">
                Test your memory skills with exciting card matching!
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="text-center">
                <Timer className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-purple-500" />
                <p className="font-semibold">75 Seconds</p>
                <p className="text-muted-foreground">Time Limit</p>
              </div>
              <div className="text-center">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-green-500" />
                <p className="font-semibold">{totalPairs} Pairs</p>
                <p className="text-muted-foreground">To Find</p>
              </div>
              <div className="text-center">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-red-500" />
                <p className="font-semibold">Memory Test</p>
                <p className="text-muted-foreground">Challenge</p>
              </div>
            </div>

            <Button onClick={startGame} className="w-full text-lg py-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
              <Brain className="w-5 h-5 mr-2" />
              Start Memory Challenge
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
              <Badge variant="outline" className="justify-center text-xs sm:text-sm">Matches: {matches}</Badge>
              <Badge variant="outline" className="justify-center text-xs sm:text-sm">Pairs: {totalPairs}</Badge>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Progress</span>
                <span>{matches} / {totalPairs}</span>
              </div>
              <Progress 
                value={(matches / totalPairs) * 100} 
                className="h-2"
              />
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 md:gap-3 max-w-xs sm:max-w-sm mx-auto">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className={`aspect-square cursor-pointer transition-all duration-300 transform ${
                    card.isFlipped || card.isMatched 
                      ? 'rotate-y-180' 
                      : 'hover:scale-105 active:scale-95'
                  } ${!canFlip ? 'pointer-events-none' : ''}`}
                  onClick={() => handleCardClick(card.id)}
                >
                  <div className={`w-full h-full rounded-lg border-2 flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold transition-all duration-300 ${
                    card.isMatched
                      ? 'bg-green-500 text-white border-green-600 scale-110'
                      : card.isFlipped
                      ? 'bg-white text-gray-800 border-purple-500 shadow-lg'
                      : 'bg-gradient-to-br from-purple-400 to-indigo-500 text-white border-purple-600 hover:shadow-md'
                  }`}>
                    {(card.isFlipped || card.isMatched) ? card.icon : '❓'}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Click cards to flip them and find matching pairs!
            </p>
          </div>
        )}

        {gameState === "success" && !pieceSubmitted && (
          <div className="text-center space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 sm:p-6 rounded-lg text-white">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Memory Master!</h3>
              <p className="text-green-100 text-sm sm:text-base">
                Excellent memory! You've found all the matching pairs.
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
                  <p className="font-semibold text-green-600">Efficiency</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {moves > 0 ? Math.round((matches / moves) * 100) : 100}%
                  </p>
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
                You found {matches} out of {totalPairs} pairs. Try again to complete the challenge!
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-red-800 font-medium text-sm sm:text-base">
                💡 Tip: Try to remember card positions and plan your moves efficiently!
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
