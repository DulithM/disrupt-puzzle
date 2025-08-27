"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Users } from "lucide-react"
import { realtimeSync } from "@/lib/realtime-sync"

interface RealtimeStatusProps {
  puzzleId: string
  userId?: string
}

export function RealtimeStatus({ puzzleId, userId }: RealtimeStatusProps) {
  const [connectionStatus, setConnectionStatus] = useState<string>("disconnected")
  const [activeUsers, setActiveUsers] = useState(0)
  const [recentActivity, setRecentActivity] = useState<string[]>([])

  useEffect(() => {
    // Subscribe to connection status
    const unsubscribeStatus = realtimeSync.subscribeToStatus(setConnectionStatus)

    // Subscribe to puzzle events
    const unsubscribeEvents = realtimeSync.subscribe(puzzleId, (event) => {
      switch (event.type) {
        case "user_joined":
          setActiveUsers(event.data.userCount)
          if (event.userId !== userId) {
            setRecentActivity((prev) => [`${event.userId} joined`, ...prev.slice(0, 4)])
          }
          break
        case "user_left":
          setActiveUsers(event.data.userCount)
          if (event.userId !== userId) {
            setRecentActivity((prev) => [`${event.userId} left`, ...prev.slice(0, 4)])
          }
          break
        case "piece_placed":
          if (event.userId !== userId) {
            setRecentActivity((prev) => [`${event.data.placedBy} placed a piece`, ...prev.slice(0, 4)])
          }
          break
      }
    })

    // Join puzzle if userId provided
    if (userId) {
      realtimeSync.joinPuzzle(puzzleId, userId)
    }

    // Initial user count
    setActiveUsers(realtimeSync.getActiveUserCount())

    return () => {
      unsubscribeStatus()
      unsubscribeEvents()
      if (userId) {
        realtimeSync.leavePuzzle(puzzleId, userId)
      }
    }
  }, [puzzleId, userId])

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="w-3 h-3" />
      case "connecting":
        return <div className="animate-spin rounded-full h-3 w-3 border-b border-current" />
      default:
        return <WifiOff className="w-3 h-3" />
    }
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "default"
      case "connecting":
        return "secondary"
      default:
        return "destructive"
    }
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Badge variant={getStatusColor()} className="flex items-center gap-1">
        {getStatusIcon()}
        {connectionStatus}
      </Badge>

      <Badge variant="outline" className="flex items-center gap-1">
        <Users className="w-3 h-3" />
        {activeUsers} active
      </Badge>

      {recentActivity.length > 0 && <div className="text-xs text-muted-foreground">{recentActivity[0]}</div>}
    </div>
  )
}
