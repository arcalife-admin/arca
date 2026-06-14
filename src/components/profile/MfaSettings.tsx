'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, ShieldCheck, ShieldOff } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

type MfaStatus = {
  enabled: boolean
  pendingSetup: boolean
  isPrivileged: boolean
}

export default function MfaSettings() {
  const [status, setStatus] = useState<MfaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string } | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/mfa/status')
      if (res.ok) {
        setStatus(await res.json())
      }
    } catch {
      toast({ title: 'Eroare', description: 'Nu s-a putut încărca starea MFA', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  const startSetup = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/auth/mfa/setup', { method: 'POST' })
      const text = await res.text()
      let data: { error?: string; secret?: string; otpauthUrl?: string } = {}
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = {}
      }
      if (!res.ok) {
        toast({
          title: 'Eroare',
          description: data.error ?? `Configurare eșuată (${res.status})`,
          variant: 'destructive',
        })
        return
      }
      if (!data.secret) {
        toast({
          title: 'Eroare',
          description: 'Răspuns invalid de la server',
          variant: 'destructive',
        })
        return
      }
      setSetupData({ secret: data.secret, otpauthUrl: data.otpauthUrl ?? '' })
      setCode('')
      await loadStatus()
      toast({ title: 'Pasul 1', description: 'Adăugați contul în Google Authenticator sau Authy' })
    } catch {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut contacta serverul',
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  const enableMfa = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      toast({ title: 'Cod invalid', description: 'Introduceți cele 6 cifre din aplicație', variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Eroare', description: data.error ?? 'Activare eșuată', variant: 'destructive' })
        return
      }
      setSetupData(null)
      setCode('')
      await loadStatus()
      toast({ title: 'MFA activat', description: 'Autentificarea în doi pași este activă' })
    } finally {
      setBusy(false)
    }
  }

  const disableMfa = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      toast({ title: 'Cod invalid', description: 'Introduceți codul MFA curent', variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: 'Eroare', description: data.error ?? 'Dezactivare eșuată', variant: 'destructive' })
        return
      }
      setCode('')
      await loadStatus()
      toast({ title: 'MFA dezactivat' })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <Card className="mt-8">
        <CardContent className="py-8 text-center text-gray-500">Se încarcă setările MFA...</CardContent>
      </Card>
    )
  }

  if (!status?.isPrivileged) {
    return null
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {status.enabled ? (
            <ShieldCheck className="h-5 w-5 text-green-600" />
          ) : (
            <Shield className="h-5 w-5 text-amber-600" />
          )}
          Autentificare în doi pași (MFA)
        </CardTitle>
        <p className="text-sm text-gray-600">
          Obligatoriu pentru Manager și Proprietar organizație. Folosiți Google Authenticator, Authy sau similar.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          Status:{' '}
          <span className={status.enabled ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>
            {status.enabled ? 'Activat' : status.pendingSetup ? 'Configurare în curs' : 'Neactivat'}
          </span>
        </div>

        {!status.enabled && !setupData && (
          <Button onClick={startSetup} disabled={busy}>
            Configurează MFA
          </Button>
        )}

        {setupData && !status.enabled && (
          <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
            <p className="text-sm font-medium">Pasul 1 — Adăugați în aplicația de autentificare</p>
            <p className="text-xs text-gray-600 break-all">
              Cheie secretă: <code className="bg-white px-1 py-0.5 rounded">{setupData.secret}</code>
            </p>
            <p className="text-xs text-gray-500">
              În Google Authenticator: + → Introducere manuală → Nume: ArcaLife → Cheie: secretul de mai sus
            </p>
            <div className="space-y-2">
              <Label htmlFor="mfa-enable-code">Pasul 2 — Cod din aplicație (6 cifre)</Label>
              <Input
                id="mfa-enable-code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={enableMfa} disabled={busy}>
                Activează MFA
              </Button>
              <Button variant="outline" onClick={() => setSetupData(null)} disabled={busy}>
                Anulează
              </Button>
            </div>
          </div>
        )}

        {status.enabled && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              La autentificare vi se va cere parola și codul din aplicația de autentificare.
            </p>
            <div className="space-y-2">
              <Label htmlFor="mfa-disable-code">Cod MFA pentru dezactivare</Label>
              <Input
                id="mfa-disable-code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
              />
            </div>
            <Button variant="destructive" onClick={disableMfa} disabled={busy} className="gap-2">
              <ShieldOff className="h-4 w-4" />
              Dezactivează MFA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
