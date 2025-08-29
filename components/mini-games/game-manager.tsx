"use client"

import { useState, useEffect } from "react"
import { TicTacToe } from "./tic-tac-toe"
import { RockPaperScissors } from "./rock-paper-scissors"
import { MemoryMatch } from "./memory-match"
import { SpeedTap } from "./speed-tap"
import type { PuzzlePiece } from "@/lib/types"

interface GameManagerProps {
  piece: PuzzlePiece
  onSuccess: () => void
  onFailure: () => void
  isSubmitting?: boolean
  pieceSubmitted?: boolean
}

const AVAILABLE_GAMES = ["tic-tac-toe", "rock-paper-scissors", "memory-match", "speed-tap"]

export function GameManager({ piece, onSuccess, onFailure, isSubmitting = false, pieceSubmitted = false }: GameManagerProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)

  // Randomly select a game when component mounts
  useEffect(() => {
    const randomGame = AVAILABLE_GAMES[Math.floor(Math.random() * AVAILABLE_GAMES.length)]
    setSelectedGame(randomGame)
  }, [])

  const renderGame = () => {
    switch (selectedGame) {
      case "tic-tac-toe":
        return (
          <TicTacToe
            piece={piece}
            onSuccess={onSuccess}
            onFailure={onFailure}
            isSubmitting={isSubmitting}
            pieceSubmitted={pieceSubmitted}
          />
        )
      case "rock-paper-scissors":
        return (
          <RockPaperScissors
            piece={piece}
            onSuccess={onSuccess}
            onFailure={onFailure}
            isSubmitting={isSubmitting}
            pieceSubmitted={pieceSubmitted}
          />
        )
      case "memory-match":
        return (
          <MemoryMatch
            piece={piece}
            onSuccess={onSuccess}
            onFailure={onFailure}
            isSubmitting={isSubmitting}
            pieceSubmitted={pieceSubmitted}
          />
        )
      case "speed-tap":
        return (
          <SpeedTap
            piece={piece}
            onSuccess={onSuccess}
            onFailure={onFailure}
            isSubmitting={isSubmitting}
            pieceSubmitted={pieceSubmitted}
          />
        )
      default:
        return (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {renderGame()}
    </div>
  )
}
