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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Puzzle Piece QR Codes</h2>
          <p className="text-muted-foreground">Scan any code to start playing and unlock pieces</p>
        </div>
        <Button onClick={printAllQRCodes} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Print All
        </Button>
      </div>

      {/* QR Code Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    Piece ({piece.row + 1}, {piece.col + 1})
                  </CardTitle>
                  <Badge 
                    variant={piece.isPlaced ? "default" : "secondary"} 
                    className={`text-xs ${getStatusColor(piece.isPlaced)}`}
                  >
                    {piece.isPlaced ? "Completed" : "Available"}
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

              <CardContent className="space-y-4">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className={`p-2 rounded-lg ${
                    piece.isPlaced ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <QRCode value={pieceUrl} size={120} className="border rounded" />
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

                {/* URL */}
                <div className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
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
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy Link
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

      {/* Instructions Footer */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-blue-800">Ready to contribute?</h3>
            <p className="text-sm text-blue-700">
              Scan any QR code above with your smartphone to start playing mini-games and unlock puzzle pieces!
            </p>
            <div className="flex justify-center gap-4 text-xs text-blue-600">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                Available pieces
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Completed pieces
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

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
