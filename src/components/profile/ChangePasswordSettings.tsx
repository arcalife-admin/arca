'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KeyRound } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function ChangePasswordSettings() {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const resetForm = () => {
    setForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  }

  const handleCancel = () => {
    resetForm()
    setIsEditing(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (form.newPassword !== form.confirmPassword) {
      toast({
        title: 'Eroare',
        description: 'Parolele nu coincid',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          title: 'Eroare',
          description: data.message ?? 'Schimbarea parolei a eșuat',
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Succes',
        description: data.message ?? 'Parola a fost schimbată cu succes',
      })

      resetForm()
      setIsEditing(false)
    } catch {
      toast({
        title: 'Eroare',
        description: 'A apărut o eroare neașteptată',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <KeyRound className="h-5 w-5 text-red-500" />
            <div>
              <CardTitle className="text-xl">Schimbare parolă</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Actualizați parola contului dvs. ArcaLife
              </p>
            </div>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Schimbă parola
            </Button>
          )}
        </div>
      </CardHeader>

      {isEditing && (
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="currentPassword">Parola actuală</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                value={form.currentPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="newPassword">Parolă nouă</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.newPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Minim 8 caractere</p>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmați parola nouă</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.confirmPassword}
                onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Se salvează...' : 'Salvează parola nouă'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                Anulează
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  )
}
