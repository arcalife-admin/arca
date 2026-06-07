'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, isWithinInterval } from 'date-fns'
import { ro } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Clock,
  Loader2,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { formatHoursShort } from '@/lib/time-clock'

type ApiUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  isDisabled: boolean
}

type ApiEvent = {
  id: string
  userId: string
  eventType: 'CLOCK_IN' | 'CLOCK_OUT'
  occurredAt: string
  source: string
  user: { firstName: string; lastName: string; email: string }
}

type HoursRow = {
  displayName: string
  hoursToday: number
  hoursThisWeek: number
  hoursThisMonth: number
}

export default function ManagerTimeClockPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [users, setUsers] = useState<ApiUser[]>([])
  const [events, setEvents] = useState<ApiEvent[]>([])
  const [hoursByUser, setHoursByUser] = useState<Record<string, HoursRow>>({})
  const [ranges, setRanges] = useState<{
    day: { start: string; end: string }
    week: { start: string; end: string }
    month: { start: string; end: string }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formUserId, setFormUserId] = useState('')
  const [formEventType, setFormEventType] = useState<'CLOCK_IN' | 'CLOCK_OUT'>('CLOCK_IN')
  const [formOccurredAt, setFormOccurredAt] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ApiEvent | null>(null)

  const canAccess =
    session?.user?.role === 'ORGANIZATION_OWNER' || session?.user?.role === 'MANAGER'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/manager/time-clock')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Încărcarea a eșuat')
      }
      const data = await res.json()
      setUsers(data.users ?? [])
      setEvents(data.events ?? [])
      setHoursByUser(data.hoursByUser ?? {})
      setRanges(data.ranges ?? null)
    } catch (e) {
      toast({
        title: 'Pontajul nu a putut fi încărcat',
        description: e instanceof Error ? e.message : 'Eroare necunoscută',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/login')
      return
    }
    if (!canAccess) {
      toast({
        title: 'Acces refuzat',
        description: 'Doar managerii și proprietarii organizației pot accesa această pagină.',
        variant: 'destructive',
      })
      router.push('/dashboard')
      return
    }
    load()
  }, [session, status, router, canAccess, load, toast])

  const postEvent = async (eventType: 'CLOCK_IN' | 'CLOCK_OUT') => {
    if (!selectedUserId) {
      toast({
        title: 'Selectați un utilizator',
        description: 'Alegeți cine înregistrează intrarea sau ieșirea.',
        variant: 'destructive',
      })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/manager/time-clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, eventType }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Cererea a eșuat')
      }
      toast({
        title: eventType === 'CLOCK_IN' ? 'Intrare înregistrată' : 'Ieșire înregistrată',
        description: 'Evenimentul a fost salvat.',
      })
      await load()
    } catch (e) {
      toast({
        title: 'Evenimentul nu a putut fi înregistrat',
        description: e instanceof Error ? e.message : 'Eroare necunoscută',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const openAddEventDialog = () => {
    setEditingId(null)
    setFormUserId(selectedUserId || (users[0]?.id ?? ''))
    setFormEventType('CLOCK_IN')
    setFormOccurredAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
    setEventDialogOpen(true)
  }

  const openEditEventDialog = (ev: ApiEvent) => {
    setEditingId(ev.id)
    setFormUserId(ev.userId)
    setFormEventType(ev.eventType)
    setFormOccurredAt(format(new Date(ev.occurredAt), "yyyy-MM-dd'T'HH:mm"))
    setEventDialogOpen(true)
  }

  const saveEventDialog = async () => {
    if (!formUserId) {
      toast({ title: 'Selectați un utilizator', variant: 'destructive' })
      return
    }
    const at = new Date(formOccurredAt)
    if (Number.isNaN(at.getTime())) {
      toast({ title: 'Dată și oră invalide', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const occurredAtIso = at.toISOString()
      const url =
        editingId !== null
          ? `/api/manager/time-clock/${editingId}`
          : '/api/manager/time-clock'
      const res = await fetch(url, {
        method: editingId !== null ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: formUserId,
          eventType: formEventType,
          occurredAt: occurredAtIso,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Cererea a eșuat')
      }
      toast({
        title: editingId !== null ? 'Eveniment actualizat' : 'Eveniment adăugat',
        description: 'Datele de pontaj au fost salvate.',
      })
      setEventDialogOpen(false)
      setEditingId(null)
      await load()
    } catch (e) {
      toast({
        title: 'Evenimentul nu a putut fi salvat',
        description: e instanceof Error ? e.message : 'Eroare necunoscută',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDeleteEvent = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/manager/time-clock/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Cererea a eșuat')
      }
      toast({ title: 'Eveniment șters', description: 'Pontajul a fost eliminat.' })
      setDeleteTarget(null)
      await load()
    } catch (e) {
      toast({
        title: 'Ștergerea a eșuat',
        description: e instanceof Error ? e.message : 'Eroare necunoscută',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const eventsForPeriod = useCallback(
    (tab: 'day' | 'week' | 'month') => {
      if (!ranges) return events
      const r = tab === 'day' ? ranges.day : tab === 'week' ? ranges.week : ranges.month
      const start = new Date(r.start)
      const end = new Date(r.end)
      return events.filter((ev) =>
        isWithinInterval(new Date(ev.occurredAt), { start, end })
      )
    },
    [events, ranges]
  )

  const activeUsers = useMemo(
    () => users.filter((u) => !u.isDisabled),
    [users]
  )

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!canAccess) {
    return null
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/manager"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Înapoi la panoul manager
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-8 w-8 text-blue-600" />
            Pontaj personal
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Intrare/ieșire manuală pentru testare până la conectarea scanerelor NFC. Adăugați,
            editați sau ștergeți pontaje când cineva uită sau ora este greșită. Orele folosesc
            calendarul serverului pentru azi, săptămâna aceasta (lun–dum) și luna aceasta.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reîmprospătare
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test: intrare sau ieșire</CardTitle>
          <CardDescription>
            Selectați un membru al echipei, apoi înregistrați intrarea sau ieșirea ca și cum ar fi
            atins cititorul NFC.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Utilizator</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Alegeți utilizatorul…" />
              </SelectTrigger>
              <SelectContent>
                {activeUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                    {u.isDisabled ? ' (dezactivat)' : ''}
                  </SelectItem>
                ))}
                {users
                  .filter((u) => u.isDisabled)
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id} className="text-gray-400">
                      {u.firstName} {u.lastName} (dezactivat)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={submitting}
            onClick={() => postEvent('CLOCK_IN')}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Intrare
          </Button>
          <Button
            variant="secondary"
            disabled={submitting}
            onClick={() => postEvent('CLOCK_OUT')}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Ieșire
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rezumat ore</CardTitle>
          <CardDescription>
            Timp lucrat din perechi intrare/ieșire (aceeași fereastră ca mai jos).
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membru echipă</TableHead>
                <TableHead className="text-right">Azi</TableHead>
                <TableHead className="text-right">Săptămâna aceasta</TableHead>
                <TableHead className="text-right">Luna aceasta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const h = hoursByUser[u.id]
                if (!h) return null
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {h.displayName}
                      {u.isDisabled ? (
                        <span className="text-gray-400 text-xs ml-2">(dezactivat)</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatHoursShort(h.hoursToday)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatHoursShort(h.hoursThisWeek)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatHoursShort(h.hoursThisMonth)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Program / jurnal evenimente</CardTitle>
              <CardDescription>
                Evenimente recente (încărcate pentru ultimele 30 de zile). Filtrați după perioadă.
                Folosiți Adaugă eveniment sau acțiunile din rând pentru corecții.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={openAddEventDialog}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adaugă eveniment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="day">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="day">Azi</TabsTrigger>
              <TabsTrigger value="week">Săptămâna aceasta</TabsTrigger>
              <TabsTrigger value="month">Luna aceasta</TabsTrigger>
            </TabsList>
            {(['day', 'week', 'month'] as const).map((tab) => {
              const rows = eventsForPeriod(tab)
              return (
                <TabsContent key={tab} value={tab} className="mt-4">
                  {ranges && (
                    <p className="text-xs text-gray-500 mb-3">
                      {tab === 'day' && (
                        <>
                          {format(new Date(ranges.day.start), 'PPP', { locale: ro })} —{' '}
                          {format(new Date(ranges.day.end), 'p', { locale: ro })}
                        </>
                      )}
                      {tab === 'week' && (
                        <>
                          Săptămâna din {format(new Date(ranges.week.start), 'PPP', { locale: ro })} —{' '}
                          {format(new Date(ranges.week.end), 'PPP p', { locale: ro })}
                        </>
                      )}
                      {tab === 'month' && (
                        <>{format(new Date(ranges.month.start), 'MMMM yyyy', { locale: ro })}</>
                      )}
                    </p>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Când</TableHead>
                        <TableHead>Cine</TableHead>
                        <TableHead>Acțiune</TableHead>
                        <TableHead className="text-right w-[120px]">Gestionare</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-gray-500 text-center py-8">
                            Niciun eveniment în această perioadă.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rows.map((ev) => (
                          <TableRow key={ev.id}>
                            <TableCell className="whitespace-nowrap tabular-nums">
                              {format(new Date(ev.occurredAt), 'PPp', { locale: ro })}
                            </TableCell>
                            <TableCell>
                              {ev.user.firstName} {ev.user.lastName}
                            </TableCell>
                            <TableCell>
                              {ev.eventType === 'CLOCK_IN' ? (
                                <Badge className="bg-emerald-600">Intrare</Badge>
                              ) : (
                                <Badge variant="secondary">Ieșire</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEditEventDialog(ev)}
                                  aria-label="Editează pontaj"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700"
                                  onClick={() => setDeleteTarget(ev)}
                                  aria-label="Șterge pontaj"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              )
            })}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? 'Editează pontaj' : 'Adaugă pontaj'}</DialogTitle>
            <DialogDescription>
              Setați cine, intrare sau ieșire, și data și ora exactă. Orele pentru azi, săptămână
              și lună se actualizează automat.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tc-user">Utilizator</Label>
              <Select value={formUserId} onValueChange={setFormUserId}>
                <SelectTrigger id="tc-user">
                  <SelectValue placeholder="Alegeți utilizatorul…" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                      {u.isDisabled ? ' (dezactivat)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tc-type">Tip</Label>
              <Select
                value={formEventType}
                onValueChange={(v) => setFormEventType(v as 'CLOCK_IN' | 'CLOCK_OUT')}
              >
                <SelectTrigger id="tc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLOCK_IN">Intrare</SelectItem>
                  <SelectItem value="CLOCK_OUT">Ieșire</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tc-when">Dată și oră</Label>
              <Input
                id="tc-when"
                type="datetime-local"
                value={formOccurredAt}
                onChange={(e) => setFormOccurredAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEventDialogOpen(false)
                setEditingId(null)
              }}
            >
              Anulează
            </Button>
            <Button type="button" onClick={saveEventDialog} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId !== null ? (
                'Salvează modificările'
              ) : (
                'Adaugă eveniment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergeți acest pontaj?</AlertDialogTitle>
            <AlertDialogDescription>
              Aceasta elimină evenimentul de intrare sau ieșire. Orele pentru acea zi se pot
              modifica. Acțiunea nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Anulează</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={submitting}
              onClick={() => void confirmDeleteEvent()}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Șterge'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
