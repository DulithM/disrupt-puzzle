"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle, Target, AlertTriangle } from "lucide-react"
import { puzzleApi } from "@/lib/puzzle-api"
import type { PuzzlePiece, Puzzle } from "@/lib/types"
import { GameManager } from "@/components/mini-games/game-manager"
import { getActivePuzzleIdLocal, getActivePuzzleIndexLocal, onActivePuzzleChangeLocal, getPuzzleState } from "@/lib/puzzle-sync"
import Image from "next/image"

export default function PiecePage() {
  const params = useParams()
  const router = useRouter()
  const pieceId = params.id as string

  const [piece, setPiece] = useState<PuzzlePiece | null>(null)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [allPuzzles, setAllPuzzles] = useState<Puzzle[]>([])
  const [currentActivePuzzle, setCurrentActivePuzzle] = useState<Puzzle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pieceSubmitted, setPieceSubmitted] = useState(false)

  // Load all puzzles and find current active puzzle using the same method as other pages
  useEffect(() => {
    const loadPuzzles = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const puzzles = await puzzleApi.getAllPuzzles()
        if (puzzles.length === 0) {
          setError("No puzzles found")
          return
        }
        
        console.log('🔍 Piece Page - All puzzles loaded:', puzzles.map(p => ({
          title: p.title,
          id: p.id || (p as any)._id,
          piecesCount: p.pieces?.length || 0,
          isActive: (p as any).isActive,
          currentlyInUse: (p as any).currentlyInUse
        })))
        
        setAllPuzzles(puzzles)
        
        // Get current active puzzle from localStorage
        const puzzleState = getPuzzleState()
        const currentIndex = puzzleState.currentPuzzleIndex
        console.log('🎯 Piece Page - Current puzzle index from localStorage:', currentIndex)
        
        if (currentIndex >= 0 && currentIndex < puzzles.length) {
          const currentPuzzle = puzzles[currentIndex]
          setCurrentActivePuzzle(currentPuzzle)
          console.log(`✅ Piece Page - Current active puzzle: ${currentPuzzle.title} (${currentIndex + 1}/${puzzles.length})`)
        } else {
          setError("No active puzzle found")
          return
        }
        
        console.log('🔍 Piece Page - Looking for piece:', pieceId)
        
        // Find the puzzle that contains this piece
        let foundPuzzle: Puzzle | null = null
        let foundPiece: PuzzlePiece | null = null
        
        // For mock data, piece IDs like piece-0, piece-1, etc. belong to the first puzzle
        if (pieceId.startsWith('piece-')) {
          console.log('🎭 Mock piece detected, using first puzzle')
          const firstPuzzleData = puzzles[0]
          if (firstPuzzleData) {
            const puzzleId = firstPuzzleData.id || (firstPuzzleData as any)._id
            if (puzzleId) {
              const loadedPuzzle = await puzzleApi.getPuzzle(puzzleId)
              if (loadedPuzzle) {
                foundPuzzle = loadedPuzzle
                // Find the piece in the loaded puzzle
                foundPiece = loadedPuzzle.pieces.find(p => p.id === pieceId) || null
                if (!foundPiece) {
                  console.warn('⚠️ Piece not found in loaded puzzle, creating mock piece')
                  // Create a mock piece if not found
                  const pieceIndex = parseInt(pieceId.replace('piece-', ''))
                  foundPiece = {
                    id: pieceId,
                    row: Math.floor(pieceIndex / loadedPuzzle.cols),
                    col: pieceIndex % loadedPuzzle.cols,
                    imageUrl: loadedPuzzle.imageUrl,
                    isPlaced: false,
                    unlockCode: `${loadedPuzzle.unlockCode}_piece_${pieceIndex}`,
                    originalPosition: {
                      row: Math.floor(pieceIndex / loadedPuzzle.cols),
                      col: pieceIndex % loadedPuzzle.cols
                    }
                  }
                }
              }
            }
          }
        } else {
          // For non-mock pieces, search through all puzzles
          for (const puzzleData of puzzles) {
            const pieceData = puzzleData.pieces.find(p => p.id === pieceId)
            if (pieceData) {
              const puzzleId = puzzleData.id || (puzzleData as any)._id
              if (puzzleId && typeof puzzleId === 'string') {
                const loadedPuzzle = await puzzleApi.getPuzzle(puzzleId)
                if (loadedPuzzle) {
                  foundPuzzle = loadedPuzzle
                  foundPiece = pieceData
                  break
                }
              }
            }
          }
        }
        
        // If we still haven't found the piece, try to find it in any puzzle's pieces array
        if (!foundPuzzle || !foundPiece) {
          console.log('🔍 Piece not found in initial search, searching through puzzle pieces...')
          for (const puzzleData of puzzles) {
            if (puzzleData.pieces && puzzleData.pieces.length > 0) {
              const pieceData = puzzleData.pieces.find(p => p.id === pieceId)
              if (pieceData) {
                console.log('🔍 Found piece in puzzle:', puzzleData.title)
                const puzzleId = puzzleData.id || (puzzleData as any)._id
                if (puzzleId) {
                  const loadedPuzzle = await puzzleApi.getPuzzle(puzzleId)
                  if (loadedPuzzle) {
                    foundPuzzle = loadedPuzzle
                    foundPiece = pieceData
                    break
                  }
                }
              }
            }
          }
        }
        
        if (foundPuzzle && foundPiece) {
          setPuzzle(foundPuzzle)
          setPiece(foundPiece)
          
          console.log('🔍 Piece Page - Found piece in puzzle:', foundPuzzle.title, 'ID:', foundPuzzle.id || (foundPuzzle as any)._id)
          console.log('🔍 Piece Page - Piece details:', foundPiece)
          
          // Always allow play - any piece can be filled when scanned
          console.log('🔍 Piece Page - Piece found, allowing play regardless of puzzle')
        } else {
          setError("Piece not found in any puzzle")
        }
      } catch (error) {
        console.error("Failed to load piece:", error)
        setError("Failed to load piece data")
      } finally {
        setLoading(false)
      }
    }

    loadPuzzles()
  }, [pieceId])

  // Listen for external active puzzle changes (from other pages)
  useEffect(() => {
    const offStorage = onActivePuzzleChangeLocal(async (_id, idx) => {
      if (idx != null && idx >= 0 && idx < allPuzzles.length) {
        console.log('🔁 Piece Page - Detected external active puzzle change to index', idx)
        
        // Update the current active puzzle
        const newActivePuzzle = allPuzzles[idx]
        const newActivePuzzleId = newActivePuzzle.id || (newActivePuzzle as any)._id
        if (newActivePuzzleId) {
          const loadedPuzzle = await puzzleApi.getPuzzle(newActivePuzzleId)
          if (loadedPuzzle) {
            setCurrentActivePuzzle(loadedPuzzle)
            
            // Re-evaluate if the current piece is still playable
            if (puzzle && piece) {
              const foundPuzzleId = puzzle.id || (puzzle as any)._id
              if (foundPuzzleId === newActivePuzzleId) {
                console.log('🔍 Piece Page - Piece is now playable (belongs to active puzzle)')
                setPuzzleCompleted(false)
              } else {
                console.log('🔍 Piece Page - Piece is no longer playable (belongs to different puzzle)')
                setPuzzleCompleted(true)
              }
            }
          }
        }
      }
    })

    return () => {
      offStorage()
    }
  }, [allPuzzles, puzzle, piece])

  useEffect(() => {
    let unsubscribe = () => {}

    if (puzzle && puzzle.id) {
      unsubscribe = puzzleApi.subscribe(puzzle.id, (updatedPuzzle) => {
        setPuzzle(updatedPuzzle)
        const updatedPiece = updatedPuzzle.pieces.find((p) => p.id === pieceId)
        if (updatedPiece) {
          setPiece(updatedPiece)
        }
        
        // Check if puzzle is still active after update
        if (currentActivePuzzle) {
          const foundPuzzleId = updatedPuzzle.id || (updatedPuzzle as any)._id
          const activePuzzleId = currentActivePuzzle.id || (currentActivePuzzle as any)._id
          
          if (foundPuzzleId === activePuzzleId) {
            setPuzzleCompleted(false)
          } else {
            setPuzzleCompleted(true)
          }
        }
      })
    }

    return () => {
      unsubscribe()
    }
      }, [puzzle, pieceId, currentActivePuzzle])

  const handleGameSuccess = async () => {
    if (!piece) return

    setIsSubmitting(true)
    try {
      const updatedPuzzle = await puzzleApi.placePiece(piece.id, "Anonymous")
      console.log('✅ puzzleApi.placePiece completed successfully')
      
      if (updatedPuzzle) {
        console.log('📊 Received updated puzzle data:', updatedPuzzle)
        
        // Update the local piece state to reflect completion
        if (piece) {
          console.log('🔄 Updating local piece state...')
          const updatedPiece = updatedPuzzle.pieces.find(p => p.id === piece.id)
          if (updatedPiece) {
            console.log('📊 Updated piece state:', updatedPiece)
            setPiece(updatedPiece)
          }
        }
        
        // Update the puzzle state with the returned data
        console.log('🔄 Updating puzzle state with returned data...')
        setPuzzle(updatedPuzzle)
        
        // Force a refresh of the main puzzle view by triggering a custom event
        console.log('🔄 Triggering puzzle update event...')
        const event = new CustomEvent('puzzlePiecePlaced', {
          detail: { puzzleId: updatedPuzzle.id, pieceId: piece.id }
        })
        window.dispatchEvent(event)
      }
      
      setPieceSubmitted(true)
      
      // Close tab after 5 seconds
      setTimeout(() => {
        window.close()
      }, 5000)
    } catch (error) {
      console.error("Failed to submit piece:", error)
      setError("Failed to place piece. Please try again.")
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-100 via-white to-orange-100 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 bg-gradient-to-br from-cyan-100 via-white to-orange-100">
        <Card className="w-full max-w-xs sm:max-w-sm">
          <CardHeader className="text-center pb-3 sm:pb-4 pt-6 sm:pt-8">
            <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
              <div className="w-14 h-14 sm:w-12 sm:h-12 md:w-16 md:h-16 relative">
                <Image
                  src="/logos/logo-02.png"
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
            <CardDescription className="text-sm mt-2">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!piece || !puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 bg-gradient-to-br from-cyan-100 via-white to-orange-100">
        <Card className="w-full max-w-xs sm:max-w-sm">
          <CardHeader className="text-center pb-3 sm:pb-4 pt-6 sm:pt-8">
            <div className="flex items-center justify-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
              <div className="w-14 h-14 sm:w-12 sm:h-12 md:w-16 md:h-16 relative">
                <Image
                  src="/logos/logo-02.png"
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
            <CardDescription className="text-sm mt-2">The requested puzzle piece could not be loaded.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }


  // Only redirect if piece is placed AND we're not showing the success state
  if (piece.isPlaced && !pieceSubmitted) {
    router.push("/")
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-100 via-white to-orange-100">
      {/* Game Content */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
        <div className="w-full max-w-sm sm:max-w-md space-y-4 sm:space-y-6">
          {/* Game Card */}
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
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
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              <GameManager 
                piece={piece} 
                onSuccess={handleGameSuccess} 
                onFailure={() => {}} 
                isSubmitting={isSubmitting}
                pieceSubmitted={pieceSubmitted}
              />
            </CardContent>
          </Card>
          
          {/* Footer Branding */}
          <div className="text-center px-2">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Part of the Disrupt Asia 2025 Interactive Experience
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
