"use client"

import { useEffect, useRef, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

interface QRCodeProps {
  value: string
  size?: number
  className?: string
}

export function QRCode({ value, size = 128, className }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [actualSize, setActualSize] = useState(size)
  const isMobile = useIsMobile()

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current?.parentElement) {
        const containerWidth = canvasRef.current.parentElement.clientWidth
        const containerHeight = canvasRef.current.parentElement.clientHeight
        
        // More responsive sizing for mobile
        const maxSize = isMobile ? 
          Math.min(containerWidth, containerHeight) - 4 : // Smaller padding for mobile
          Math.min(containerWidth, containerHeight) - 8   // Larger padding for desktop
        
        const newSize = Math.min(maxSize, size)
        setActualSize(Math.max(newSize, isMobile ? 24 : 32)) // Minimum size based on device
      }
    }

    updateSize()
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [size, isMobile])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size with device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1
    canvas.width = actualSize * dpr
    canvas.height = actualSize * dpr
    canvas.style.width = `${actualSize}px`
    canvas.style.height = `${actualSize}px`
    
    // Scale context for high DPI displays
    ctx.scale(dpr, dpr)

    // Create QR code using a service
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      ctx.clearRect(0, 0, actualSize, actualSize)
      ctx.drawImage(img, 0, 0, actualSize, actualSize)
    }

    // Use QR Server API to generate QR code with appropriate size
    const qrSize = Math.round(actualSize * dpr)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(value)}&format=png&margin=5`
    img.src = qrUrl
  }, [value, actualSize])

  return (
    <canvas 
      ref={canvasRef} 
      className={cn(
        className,
        "touch-manipulation", // Better touch handling
        isMobile && "cursor-pointer" // Show pointer on mobile for better UX
      )}
      style={{ 
        width: actualSize, 
        height: actualSize,
        maxWidth: '100%',
        maxHeight: '100%'
      }} 
    />
  )
}
