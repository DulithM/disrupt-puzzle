"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { QrCode, Users } from "lucide-react"
import { puzzleApi } from "@/lib/puzzle-api"
import type { Puzzle } from "@/lib/types"
import { PuzzleBoard } from "@/components/puzzle-board"

export default function HomePage() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPuzzle = async () => {
      try {
        const puzzleData = await puzzleApi.getPuzzle("sample-puzzle-1")
        setPuzzle(puzzleData)
      } catch (error) {
        console.error("Failed to load puzzle:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPuzzle()
  }, [])

  useEffect(() => {
    let unsubscribe = () => {}

    if (puzzle) {
      unsubscribe = puzzleApi.subscribe(puzzle.id, (updatedPuzzle) => {
        setPuzzle(updatedPuzzle)
      })
    }

    return () => {
      unsubscribe()
    }
  }, [puzzle])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading puzzle...</p>
        </div>
      </div>
    )
  }

  if (!puzzle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Puzzle not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with navigation */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold">Distrupt Puzzle</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              A puzzle game for the Distrupt Asia event
            </p>
          </div>
          <div className="flex gap-2 justify-center sm:justify-end">
            <Button variant="outline" size="sm" asChild>
              <a href="/qr-codes">
                <QrCode className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">QR Codes</span>
                <span className="sm:hidden">QR</span>
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/qr-codes">
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Scan & Play</span>
                <span className="sm:hidden">Play</span>
              </a>
            </Button>
          </div>
        </div>
      </div>

      <PuzzleBoard puzzle={puzzle} />
    </div>
  )
}
