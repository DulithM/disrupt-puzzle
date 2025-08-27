"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { puzzleApi } from "@/lib/puzzle-api"
import { puzzleStore } from "@/lib/puzzle-store"
import type { Puzzle } from "@/lib/types"
import { QRCodeGrid } from "@/components/qr-code-grid"

export default function QRCodesPage() {
  const router = useRouter()
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)
  const [isResetting, setIsResetting] = useState(false)

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

  const handleReset = async () => {
    if (!puzzle) return
    
    setIsResetting(true)
    try {
      puzzleStore.resetPuzzle(puzzle.id)
      // Reload the puzzle to reflect the reset
      const updatedPuzzle = await puzzleApi.getPuzzle(puzzle.id)
      setPuzzle(updatedPuzzle)
    } catch (error) {
      console.error("Failed to reset puzzle:", error)
    } finally {
      setIsResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading QR codes...</p>
        </div>
      </div>
    )
  }

  if (!puzzle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Puzzle not found</p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Puzzle
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Puzzle
          </Button>
          
          <Button
            onClick={handleReset}
            disabled={isResetting}
            variant="outline"
            size="sm"
          >
            {isResetting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Puzzle
              </>
            )}
          </Button>
        </div>

        <QRCodeGrid puzzle={puzzle} />
      </div>
    </div>
  )
}
