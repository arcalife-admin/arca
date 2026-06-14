'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!token) {
      setError('Linkul de resetare este invalid. Solicitați un link nou.')
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Parolele nu coincid')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Resetarea parolei a eșuat.')
        return
      }

      setSuccess(data.message ?? 'Parola a fost resetată cu succes.')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch {
      setError('A apărut o eroare. Încercați din nou.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Link invalid</h2>
          <p className="text-sm text-gray-600">
            Linkul de resetare lipsește sau este invalid. Solicitați un link nou.
          </p>
          <Link href="/forgot-password" className="inline-block font-medium text-red-500 hover:text-red-600">
            Solicită un link nou
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Setați o parolă nouă
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Alegeți o parolă nouă pentru contul dvs. ArcaLife.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                Parolă nouă
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Parolă nouă (min. 8 caractere)"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirmați parola
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Confirmați parola"
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center">{success}</div>}

          <div>
            <button
              type="submit"
              disabled={isLoading || Boolean(success)}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Se salvează...' : 'Salvează parola nouă'}
            </button>
          </div>

          <p className="text-center text-sm text-gray-600">
            <Link href="/login" className="font-medium text-red-500 hover:text-red-600">
              Înapoi la autentificare
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
