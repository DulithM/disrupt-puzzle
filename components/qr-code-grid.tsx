"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Printer, Copy, Check, Target, CheckCircle, Clock } from "lucide-react"
import { QRCode } from "./qr-code"
import type { Puzzle } from "@/lib/types"

interface QRCodeGridProps {
  puzzle: Puzzle
}

export function QRCodeGrid({ puzzle }: QRCodeGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  const printAllQRCodes = () => {
    window.print()
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Puzzle Piece QR Codes</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Scan any code to start playing and unlock pieces</p>
        </div>
        <Button onClick={printAllQRCodes} variant="outline" size="sm">
          <Printer className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Print All</span>
          <span className="sm:hidden">Print</span>
        </Button>
      </div>

      {/* QR Code Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(piece.isPlaced)}
                    <span className="hidden sm:inline">Piece ({piece.row + 1}, {piece.col + 1})</span>
                    <span className="sm:hidden">({piece.row + 1}, {piece.col + 1})</span>
                  </CardTitle>
                  <Badge 
                    variant={piece.isPlaced ? "default" : "secondary"} 
                    className={`text-xs ${getStatusColor(piece.isPlaced)}`}
                  >
                    {piece.isPlaced ? "Done" : "Open"}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {piece.isPlaced ? (
                    <span className="text-green-700">
                      ✓ Completed by {piece.placedBy}
                    </span>
                  ) : (
                    <span className="text-blue-700">
                      🎮 Ready to play - scan to start!
                    </span>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className={`p-2 rounded-lg ${
                    piece.isPlaced ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <QRCode value={pieceUrl} size={100} className="border rounded" />
                  </div>
                </div>

                {/* Status Message */}
                {piece.isPlaced ? (
                  <div className="text-center p-2 bg-green-100 rounded-lg">
                    <p className="text-xs text-green-800 font-medium">
                      🎉 This piece is complete!
                    </p>
                  </div>
                ) : (
                  <div className="text-center p-2 bg-blue-100 rounded-lg">
                    <p className="text-xs text-blue-800 font-medium">
                      📱 Scan with your phone to play
                    </p>
                  </div>
                )}

                {/* URL - Hidden on mobile to save space */}
                <div className="hidden sm:block text-xs text-muted-foreground break-all bg-muted p-2 rounded">
                  {pieceUrl}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(pieceUrl, piece.id)}
                    className="flex-1 text-xs"
                  >
                    {copiedId === piece.id ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Copied</span>
                        <span className="sm:hidden">✓</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Copy Link</span>
                        <span className="sm:hidden">Copy</span>
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadQRCode(piece.id, piece.row, piece.col)}
                    className="text-xs"
                    title="Download QR Code"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
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
      `}</style>
    </div>
  )
}
