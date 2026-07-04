import { useEffect, useRef, useState, useCallback } from "react"
import { connectRoomSocket, type AuthUser } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Eraser, Trash2, Pencil, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

type DrawEvent = {
  type: "draw" | "erase" | "clear"
  x0?: number
  y0?: number
  x1?: number
  y1?: number
  color?: string
  size?: number
}

type Props = {
  roomId: string
  user: AuthUser
}

const COLORS = ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#ffffff"]

export default function Whiteboard({ roomId, user }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const socketRef = useRef<WebSocket | null>(null)
  const [tool, setTool] = useState<"pen" | "eraser">("pen")
  const [color, setColor] = useState("#000000")
  const [size, setSize] = useState(3)

  // willReadFrequently: the resize handler reads pixel data back out via
  // getImageData on every window resize, which Chrome otherwise warns about.
  const getCtx = () => canvasRef.current?.getContext("2d", { willReadFrequently: true }) ?? null

  const drawLine = useCallback((x0: number, y0: number, x1: number, y1: number, strokeColor: string, strokeSize: number, erase: boolean) => {
    const ctx = getCtx()
    if (!ctx) return
    ctx.globalCompositeOperation = erase ? "destination-out" : "source-over"
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeSize
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
  }, [])

  const handleRemoteEvent = useCallback((event: DrawEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (event.type === "clear") {
      const ctx = getCtx()
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      return
    }
    if (event.type === "draw" || event.type === "erase") {
      drawLine(
        event.x0! * canvas.width,
        event.y0! * canvas.height,
        event.x1! * canvas.width,
        event.y1! * canvas.height,
        event.color || "#000000",
        event.size || 3,
        event.type === "erase"
      )
    }
  }, [drawLine])

  useEffect(() => {
    // Connect WebSocket channel for whiteboard drawings
    const ws = connectRoomSocket(
      roomId,
      (msg) => {
        if (msg.type === "draw") {
          const payload = msg.payload
          if (payload && payload.userId !== user.id) {
            handleRemoteEvent(payload as DrawEvent)
          }
        }
      }
    )
    socketRef.current = ws

    return () => {
      ws.close()
    }
  }, [roomId, user.id, handleRemoteEvent])

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return
      // Save current drawing
      const imageData = getCtx()?.getImageData(0, 0, canvas.width, canvas.height)
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight
      if (imageData) getCtx()?.putImageData(imageData, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const broadcastDraw = (x0: number, y0: number, x1: number, y1: number) => {
    const canvas = canvasRef.current!
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "draw",
          room_id: roomId,
          from_user: user.id,
          payload: {
            userId: user.id,
            type: tool === "eraser" ? "erase" : "draw",
            x0: x0 / canvas.width,
            y0: y0 / canvas.height,
            x1: x1 / canvas.width,
            y1: y1 / canvas.height,
            color,
            size: tool === "eraser" ? size * 4 : size,
          }
        })
      )
    }
  }

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true
    lastPos.current = getPos(e)
  }

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return
    const pos = getPos(e)
    const isErase = tool === "eraser"
    const strokeSize = isErase ? size * 4 : size
    drawLine(lastPos.current.x, lastPos.current.y, pos.x, pos.y, color, strokeSize, isErase)
    broadcastDraw(lastPos.current.x, lastPos.current.y, pos.x, pos.y)
    lastPos.current = pos
  }

  const onPointerUp = () => { isDrawing.current = false }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = getCtx()
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "draw",
          room_id: roomId,
          from_user: user.id,
          payload: {
            userId: user.id,
            type: "clear"
          }
        })
      )
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex flex-col gap-1.5 p-2 border-b border-border">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant={tool === "pen" ? "default" : "outline"}
            onClick={() => setTool("pen")}
            className="h-7 w-7 p-0"
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant={tool === "eraser" ? "default" : "outline"}
            onClick={() => setTool("eraser")}
            className="h-7 w-7 p-0"
          >
            <Eraser className="w-3 h-3" />
          </Button>

          <Separator orientation="vertical" className="h-5" />

          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool("pen") }}
              className={cn(
                "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                color === c && tool === "pen" ? "border-primary scale-110" : "border-border"
              )}
              style={{ backgroundColor: c }}
            />
          ))}

          <Separator orientation="vertical" className="h-5" />

          <Button size="sm" variant="ghost" onClick={clearCanvas} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Minus className="w-3 h-3 text-muted-foreground shrink-0" />
          <Slider
            min={1}
            max={20}
            value={[size]}
            onValueChange={([v]) => setSize(v)}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-5 text-right">{size}px</span>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden bg-white dark:bg-zinc-900">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none"
          style={{ cursor: tool === "eraser" ? "cell" : "crosshair" }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
        />
      </div>
    </div>
  )
}
