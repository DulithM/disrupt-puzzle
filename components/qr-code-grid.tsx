"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Printer, Copy, Check } from "lucide-react"
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">QR Codes</h2>
          <p className="text-muted-foreground">Scan to access individual puzzle pieces</p>
        </div>
        <Button onClick={printAllQRCodes} variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Print All
        </Button>
      </div>

      {/* QR Code Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {puzzle.pieces.map((piece) => {
          const pieceUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/piece/${piece.id}`

          return (
            <Card key={piece.id} data-piece-id={piece.id} className="print:break-inside-avoid">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Piece ({piece.row}, {piece.col})
                  </CardTitle>
                  <Badge variant={piece.isPlaced ? "default" : "secondary"} className="text-xs">
                    {piece.isPlaced ? "Done" : "Open"}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {piece.isPlaced ? `Completed by ${piece.placedBy}` : "Available to solve"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* QR Code */}
                <div className="flex justify-center">
                  <QRCode value={pieceUrl} size={120} className="border rounded" />
                </div>

                {/* URL */}
                <div className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">{pieceUrl}</div>

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
                        Copy
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadQRCode(piece.id, piece.row, piece.col)}
                    className="text-xs"
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
