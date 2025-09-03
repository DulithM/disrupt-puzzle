"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Copy, Check, Target, CheckCircle, Clock, Zap } from "lucide-react"
import { QRCode } from "./qr-code"
import { puzzleApi } from "@/lib/puzzle-api"
import type { Puzzle } from "@/lib/types"

interface QRCodeGridProps {
  puzzle: Puzzle
}

export function QRCodeGrid({ puzzle }: QRCodeGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [completingPiece, setCompletingPiece] = useState<string | null>(null)

  const copyToClipboard = async (text: string, pieceId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(pieceId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const downloadQRCode = (pieceId: string, row: number, col: number) => {
    const canvas = document.querySelector(`[data-piece-id="${pieceId}"] canvas`) as HTMLCanvasElement
    if (!canvas) return

    const link = document.createElement("a")
    link.download = `puzzle-piece-${row}-${col}.png`
    link.href = canvas.toDataURL()
    link.click()
  }



  const completePiece = async (pieceId: string) => {
    if (completingPiece) return // Prevent multiple clicks
    
    try {
      setCompletingPiece(pieceId)
      console.log(`🔄 Completing piece: ${pieceId}`)
      
      // Use the test endpoint for more reliable piece placement
      const response = await fetch('/api/test-piece', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pieceId,
          placedBy: "Dev Tester"
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to place piece: ${response.statusText} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ Piece placement response:', data)
      
      if (!data.success) {
        if (data.error === 'Piece already completed') {
          console.log('⚠️ Piece already completed by:', data.data.alreadyPlacedBy)
          console.log('⚠️ Completed at:', data.data.placedAt)
          console.log('⚠️ Puzzle:', data.data.puzzleTitle)
          // Don't throw error for already completed pieces, just log it
          return
        }
        throw new Error(data.error || 'Failed to place piece')
      }
      
      console.log(`✅ Piece ${pieceId} completed successfully`)
      console.log(`✅ Puzzle: ${data.data.puzzleTitle}`)
      console.log(`✅ Completed pieces: ${data.data.completedPieces}/${data.data.totalPieces}`)
      console.log(`✅ Puzzle completed: ${data.data.puzzleCompleted}`)
      
    } catch (error) {
      console.error(`❌ Failed to complete piece ${pieceId}:`, error)
    } finally {
      setCompletingPiece(null)
    }
  }

  const getStatusIcon = (isPlaced: boolean) => {
    if (isPlaced) {
      return <CheckCircle className="w-4 h-4 text-green-600" />
    }
    return <Target className="w-4 h-4 text-blue-600" />
  }

  const getStatusColor = (isPlaced: boolean) => {
    if (isPlaced) {
      return "bg-green-100 text-green-800 border-green-200"
    }
    return "bg-blue-100 text-blue-800 border-blue-200"
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Puzzle Piece QR Codes</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Scan any code to start playing and unlock pieces</p>
        </div>
        
        {/* Bulk Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            onClick={async () => {
              // Complete all remaining pieces
              const incompletePieces = puzzle.pieces.filter(p => !p.isPlaced)
              console.log(`🔄 Completing all ${incompletePieces.length} remaining pieces...`)
              
              for (const piece of incompletePieces) {
                await completePiece(piece.id)
                // Small delay to prevent overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 100))
              }
            }}
            className="text-sm bg-green-600 hover:bg-green-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            Complete All Remaining (Dev)
          </Button>
        </div>
      </div>



      {/* QR Code Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 3xl:grid-cols-10 gap-3 sm:gap-4 max-w-full">
        {puzzle.pieces.map((piece) => {
          const pieceUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/piece/${piece.id}`

          return (
            <Card 
              key={piece.id} 
              data-piece-id={piece.id} 
              className={`print:break-inside-avoid transition-all duration-300 hover:shadow-lg ${
                piece.isPlaced ? 'border-green-200 bg-green-50/30' : 'border-blue-200 bg-blue-50/30'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(piece.isPlaced)}
                    <span className="hidden sm:inline">Piece ({piece.row + 1}, {piece.col + 1})</span>
                    <span className="sm:hidden">({piece.row + 1}, {piece.col + 1})</span>
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 sm:space-y-3">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className={`p-1 rounded-lg ${
                    piece.isPlaced ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <QRCode value={pieceUrl} size={80} className="border rounded" />
                  </div>
                </div>

                {/* Status Message */}
                {piece.isPlaced ? (
                  <div className="text-center p-1.5 bg-green-100 rounded-lg">
                    <p className="text-xs text-green-800 font-medium">
                      🎉 Complete!
                    </p>
                  </div>
                ) : (
                  <div className="text-center p-1.5 bg-blue-100 rounded-lg">
                    <p className="text-xs text-blue-800 font-medium">
                      📱 Ready to play
                    </p>
                  </div>
                )}

                {/* URL - Hidden on smaller screens to save space */}
                <div className="hidden lg:block text-xs text-muted-foreground break-all bg-muted p-1.5 rounded">
                  {pieceUrl}
                </div>

                {/* Actions */}
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(pieceUrl, piece.id)}
                    className="flex-1 text-xs h-7 px-2"
                  >
                    {copiedId === piece.id ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        <span className="hidden lg:inline">Copied</span>
                        <span className="lg:hidden">✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        <span className="hidden lg:inline">Copy</span>
                        <span className="lg:hidden">Copy</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Development Complete Button */}
                {!piece.isPlaced ? (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => completePiece(piece.id)}
                    disabled={completingPiece === piece.id}
                    className="w-full text-xs bg-yellow-600 hover:bg-yellow-700 text-white h-7"
                  >
                    {completingPiece === piece.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        <span className="hidden lg:inline">Completing...</span>
                        <span className="lg:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 mr-1" />
                        <span className="hidden lg:inline">Complete (Dev)</span>
                        <span className="lg:hidden">Complete</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="w-full text-xs bg-green-100 text-green-800 p-1.5 rounded text-center">
                    ✓ Complete
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>



      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          [data-piece-id] * {
            visibility: visible;
          }
          
          [data-piece-id] {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: auto !important;
            height: auto !important;
            overflow: visible !important;
            page-break-inside: avoid;
          }
        }
        
        /* Custom breakpoint for 3xl screens */
        @media (min-width: 1920px) {
          .grid {
            grid-template-columns: repeat(10, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  )
}
