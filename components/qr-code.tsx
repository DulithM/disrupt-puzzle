"use client"

import { useEffect, useRef, useState } from "react"

interface QRCodeProps {
  value: string
  size?: number
  className?: string
}

export function QRCode({ value, size = 128, className }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [actualSize, setActualSize] = useState(size)

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current?.parentElement) {
        const containerWidth = canvasRef.current.parentElement.clientWidth
        const containerHeight = canvasRef.current.parentElement.clientHeight
        const newSize = Math.min(containerWidth, containerHeight, size) - 8
        setActualSize(Math.max(newSize, 32))
      }
    }

    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [size])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = actualSize
    canvas.height = actualSize

    // Create QR code using a service
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      ctx.clearRect(0, 0, actualSize, actualSize)
      ctx.drawImage(img, 0, 0, actualSize, actualSize)
    }

    // Use QR Server API to generate QR code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${actualSize}x${actualSize}&data=${encodeURIComponent(value)}&format=png&margin=5`
    img.src = qrUrl
  }, [value, actualSize])

  return <canvas ref={canvasRef} className={className} style={{ width: actualSize, height: actualSize }} />
}
