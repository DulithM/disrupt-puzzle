"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { realtimeSync } from "@/lib/realtime-sync"
import { CheckCircle, Users } from "lucide-react"

interface PuzzleNotificationsProps {
  puzzleId: string
  userId?: string
}

export function PuzzleNotifications({ puzzleId, userId }: PuzzleNotificationsProps) {
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe(puzzleId, (event) => {
      switch (event.type) {
        case "piece_placed":
          if (event.userId !== userId) {
            toast.success(
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>{event.data.placedBy} completed a puzzle piece!</span>
              </div>,
              {
                duration: 4000,
                position: "top-right",
              }
            )
          }
          break
        case "user_joined":
          if (event.userId !== userId) {
            toast.info(
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span>{event.userId} joined the puzzle</span>
              </div>,
              {
                duration: 3000,
                position: "top-right",
              }
            )
          }
          break
        case "user_left":
          if (event.userId !== userId) {
            toast.info(
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span>{event.userId} left the puzzle</span>
              </div>,
              {
                duration: 3000,
                position: "top-right",
              }
            )
          }
          break
      }
    })

    return () => {
      unsubscribe()
    }
  }, [puzzleId, userId])

  return null // This component doesn't render anything visible
}
