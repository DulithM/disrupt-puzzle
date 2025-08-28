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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPuzzle = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get all available puzzles and use the first one
        const puzzles = await puzzleApi.getAllPuzzles()
        console.log('🔍 Puzzles received:', puzzles)
        
        if (puzzles.length > 0) {
          const firstPuzzle = puzzles[0]
          console.log('🔍 First puzzle object:', firstPuzzle)
          console.log('🔍 First puzzle ID:', firstPuzzle.id)
          console.log('🔍 First puzzle _id:', (firstPuzzle as any)._id)
          
          // Try to get the puzzle using either id or _id
          const puzzleId = firstPuzzle.id || (firstPuzzle as any)._id
          console.log('🔍 Using puzzle ID:', puzzleId)
          
          if (puzzleId) {
            const puzzleData = await puzzleApi.getPuzzle(puzzleId)
            if (puzzleData) {
              console.log('✅ Puzzle loaded successfully:', puzzleData.title)
              console.log('✅ Pieces count:', puzzleData.pieces.length)
              console.log('✅ Completed pieces:', puzzleData.pieces.filter(p => p.isPlaced).length)
              setPuzzle(puzzleData)
            } else {
              setError("Failed to load puzzle data")
            }
          } else {
            setError("Puzzle ID not found")
          }
        } else {
          setError("No puzzles found. Please seed the database first.")
        }
      } catch (error) {
        console.error("Failed to load puzzle:", error)
        setError("Failed to load puzzle. Please check the database connection.")
      } finally {
        setLoading(false)
      }
    }

    loadPuzzle()
  }, [])

  useEffect(() => {
    let unsubscribe = () => {}

    if (puzzle) {
      // Get the correct puzzle ID for subscription
      const puzzleId = puzzle.id || (puzzle as any)._id
      console.log('🔍 Setting up subscription for puzzle:', puzzleId)
      
      if (puzzleId) {
        unsubscribe = puzzleApi.subscribe(puzzleId, (updatedPuzzle) => {
          console.log('🔄 Puzzle updated via subscription:', updatedPuzzle.title)
          console.log('🔄 New completed pieces:', updatedPuzzle.pieces.filter(p => p.isPlaced).length)
          setPuzzle(updatedPuzzle)
        })
      } else {
        console.warn('⚠️ Cannot subscribe: puzzle ID is undefined')
      }
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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
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
