'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'

type SignaturePadProps = {
  value: string | null
  onChange: (dataUrl: string | null) => void
  disabled?: boolean
}

export default function SignaturePad({ value, onChange, disabled }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  const getCtx = () => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    return { canvas, ctx }
  }

  useEffect(() => {
    const pack = getCtx()
    if (!pack || !value) return
    const img = new Image()
    img.onload = () => {
      pack.ctx.clearRect(0, 0, pack.canvas.width, pack.canvas.height)
      pack.ctx.drawImage(img, 0, 0, pack.canvas.width, pack.canvas.height)
    }
    img.src = value
  }, [value])

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return
    drawing.current = true
    const { ctx } = getCtx()!
    const { x, y } = pointerPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled) return
    const { ctx } = getCtx()!
    const { x, y } = pointerPos(e)
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const endDraw = useCallback(() => {
    if (!drawing.current) return
    drawing.current = false
    const canvas = canvasRef.current
    if (canvas) onChange(canvas.toDataURL('image/png'))
  }, [onChange])

  const clear = () => {
    const pack = getCtx()
    if (!pack) return
    pack.ctx.clearRect(0, 0, pack.canvas.width, pack.canvas.height)
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={400}
        height={120}
        className="w-full border rounded-md bg-white touch-none cursor-crosshair"
        onPointerDown={startDraw}
        onPointerMove={draw}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
      />
      <Button type="button" variant="outline" size="sm" onClick={clear} disabled={disabled}>
        Șterge semnătura
      </Button>
    </div>
  )
}
