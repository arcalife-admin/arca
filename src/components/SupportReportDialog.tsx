'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface SupportReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SupportReportDialog({
  open,
  onOpenChange,
}: SupportReportDialogProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!description.trim()) {
      toast({
        title: 'Descriere obligatorie',
        description: 'Descrieți problema înainte de trimitere.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/support/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          pageUrl: pathname,
          userAgent: navigator.userAgent,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Trimiterea raportului a eșuat')
      }

      toast({
        title: 'Raport trimis',
        description: 'Am primit mesajul dvs. și vă vom contacta în curând.',
      })
      setDescription('')
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Raportul nu a putut fi trimis',
        description:
          error instanceof Error ? error.message : 'Încercați WhatsApp.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Raportează o problemă</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="support-description">Ce s-a întâmplat?</Label>
            <Textarea
              id="support-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descrieți ce făceați și ce a mers greșit…"
              rows={5}
              disabled={submitting}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Pagină: {pathname}
            {session?.user?.email ? ` · ${session.user.email}` : ''}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Anulează
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Se trimite…
                </>
              ) : (
                'Trimite raportul'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
