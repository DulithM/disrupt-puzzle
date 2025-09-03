"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import {
  Puzzle,
  Target,
  Zap,
  Brain,
  Clock,
  Star,
  Trophy,
  Gamepad2,
  Hand
} from "lucide-react"
import type { PuzzlePiece } from "@/lib/types"

export interface GameOption {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  difficulty: "Easy" | "Medium" | "Hard"
  timeLimit: number
  category: "Puzzle" | "Speed" | "Logic" | "Memory" | "Strategy"
  color: string
  bgGradient: string
}

const GAME_OPTIONS: GameOption[] = [
  {
    id: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    description: "Beat the AI in a classic game of strategy",
    icon: Brain,
    difficulty: "Medium",
    timeLimit: 120,
    category: "Logic",
    color: "text-purple-600",
    bgGradient: "from-purple-500 to-indigo-600"
  },
  {
    id: "rock-paper-scissors",
    name: "Rock, Paper, Scissors",
    description: "Choose your weapon and beat the AI",
    icon: Hand,
    difficulty: "Easy",
    timeLimit: 60,
    category: "Strategy",
    color: "text-green-600",
    bgGradient: "from-green-500 to-emerald-600"
  },
  {
    id: "memory-match",
    name: "Memory Match",
    description: "Find matching pairs of cards before time runs out",
    icon: Brain,
    difficulty: "Medium",
    timeLimit: 75,
    category: "Memory",
    color: "text-purple-600",
    bgGradient: "from-purple-500 to-indigo-600"
  },
  {
    id: "speed-tap",
    name: "Speed Tap",
    description: "Tap the screen rapidly to reach the target count",
    icon: Zap,
    difficulty: "Hard",
    timeLimit: 45,
    category: "Speed",
    color: "text-yellow-600",
    bgGradient: "from-yellow-500 to-orange-600"
  }
]

interface GameSelectorProps {
  piece: PuzzlePiece
  onGameSelect: (gameId: string) => void
}

export function GameSelector({ piece, onGameSelect }: GameSelectorProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)

  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId)
    onGameSelect(gameId)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center pb-3 sm:pb-4 pt-6 sm:pt-8">
        <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
          <div className="w-14 h-14 sm:w-12 sm:h-12 md:w-16 md:h-16 relative">
            <Image
              src="/logos/logo-01.png"
              alt="Disrupt Asia Logo"
              width={80}
              height={80}
              className="object-contain scale-150 sm:scale-150"
            />
          </div>
          <div className="block">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
              Disrupt <span className="text-red-600">Asia</span> 2025
            </h2>
            <p className="text-xs sm:text-sm font-bold text-cyan-600">Puzzle Challenge</p>
          </div>
        </div>
        <CardDescription className="text-base mt-2">
          Select a mini-game to unlock piece ({piece.row + 1}, {piece.col + 1})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GAME_OPTIONS.map((game) => (
            <Card 
              key={game.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 ${
                selectedGame === game.id 
                  ? 'border-purple-500 shadow-lg' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => handleGameSelect(game.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${game.bgGradient}`}>
                    <game.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm sm:text-base truncate">
                        {game.name}
                      </h3>
                      <Badge 
                        variant={game.difficulty === "Easy" ? "default" : game.difficulty === "Medium" ? "secondary" : "destructive"}
                        className="text-xs"
                      >
                        {game.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {game.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{game.timeLimit}s</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {game.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedGame && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-purple-800">Game Selected!</h4>
            </div>
            <p className="text-sm text-purple-700 mb-3">
              You've chosen: <strong>{GAME_OPTIONS.find(g => g.id === selectedGame)?.name}</strong>
            </p>
            <Button 
              onClick={() => onGameSelect(selectedGame)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Star className="w-4 h-4 mr-2" />
              Start Game
            </Button>
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground">
          <p>💡 Tip: Choose a game that matches your skills!</p>
        </div>
      </CardContent>
    </Card>
  )
}
