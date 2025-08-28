"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RotateCcw, QrCode, Smartphone, Target, Trophy } from "lucide-react"
import { puzzleApi } from "@/lib/puzzle-api"
import type { Puzzle } from "@/lib/types"
import { QRCodeGrid } from "@/components/qr-code-grid"

export default function QRCodesPage() {
  const router = useRouter()
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
        console.log('🔍 QR Codes - Puzzles received:', puzzles)
        
        if (puzzles.length > 0) {
          const firstPuzzle = puzzles[0]
          console.log('🔍 QR Codes - First puzzle object:', firstPuzzle)
          console.log('🔍 QR Codes - First puzzle ID:', firstPuzzle.id)
          console.log('🔍 QR Codes - First puzzle _id:', (firstPuzzle as any)._id)
          
          // Try to get the puzzle using either id or _id
          const puzzleId = firstPuzzle.id || (firstPuzzle as any)._id
          console.log('🔍 QR Codes - Using puzzle ID:', puzzleId)
          
          if (puzzleId) {
            const puzzleData = await puzzleApi.getPuzzle(puzzleId)
            if (puzzleData) {
              console.log('✅ QR Codes - Puzzle loaded successfully:', puzzleData.title)
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
      console.log('🔍 QR Codes - Setting up subscription for puzzle:', puzzleId)
      
      if (puzzleId) {
        unsubscribe = puzzleApi.subscribe(puzzleId, (updatedPuzzle) => {
          console.log('🔄 QR Codes - Puzzle updated via subscription:', updatedPuzzle.title)
          setPuzzle(updatedPuzzle)
        })
      } else {
        console.warn('⚠️ QR Codes - Cannot subscribe: puzzle ID is undefined')
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
          <p className="text-muted-foreground">Loading QR codes...</p>
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
          <Button variant="outline" onClick={() => router.push("/")} className="mt-2 w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Puzzle
          </Button>
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

  const completedPieces = puzzle.pieces.filter(p => p.isPlaced).length
  const totalPieces = puzzle.pieces.length
  const completionPercentage = Math.round((completedPieces / totalPieces) * 100)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Puzzle
          </Button>
        </div>

        {/* QR Code Grid */}
        <QRCodeGrid puzzle={puzzle} />
      </div>
    </div>
  )
}
