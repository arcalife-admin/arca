'use client'

import React, { useEffect, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { subscribeAppAlert, type AppAlertPayload } from '@/lib/app-alert'

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [alert, setAlert] = useState<AppAlertPayload | null>(null)

  useEffect(() => {
    return subscribeAppAlert((payload) => setAlert(payload))
  }, [])

  return (
    <>
      {children}
      <AlertDialog
        open={alert !== null}
        onOpenChange={(open) => {
          if (!open) setAlert(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alert?.title}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line text-left">
              {alert?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlert(null)}>Înțeles</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
