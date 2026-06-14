'use client'

import React, { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { translateAuthError } from '@/lib/auth-errors'

function LoginForm() {
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showMfa, setShowMfa] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const totpCode = (formData.get('totpCode') as string)?.trim() || ''

    try {
      const checkRes = await fetch('/api/auth/mfa/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          totpCode: totpCode || undefined,
        }),
      })

      const checkData = await checkRes.json()

      if (!checkData.ok) {
        if (checkData.error === 'MFA_REQUIRED') {
          setShowMfa(true)
        }
        setError(translateAuthError(checkData.error ?? 'INVALID_CREDENTIALS'))
        return
      }

      const result = await signIn('credentials', {
        email,
        password,
        totpCode: checkData.mfaRequired ? totpCode : '',
        redirect: false,
      })

      if (!result?.ok || result?.error) {
        setError(translateAuthError(result?.error ?? 'CredentialsSignin'))
        return
      }

      const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
      window.location.href = callbackUrl
    } catch {
      setError('A apărut o eroare. Încercați din nou.')
    } finally {
      setIsLoading(false)
    }
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
            Autentificare în cont
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sau{' '}
            <Link href="/register" className="font-medium text-red-500 hover:text-red-600">
              creați un cont nou
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Adresă de e-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Adresă de e-mail"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Parolă
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${showMfa ? '' : 'rounded-b-md'} focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                placeholder="Parolă"
              />
            </div>
            {showMfa && (
              <div>
                <label htmlFor="totpCode" className="sr-only">
                  Cod MFA
                </label>
                <input
                  id="totpCode"
                  name="totpCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Cod MFA (6 cifre)"
                />
              </div>
            )}
          </div>

          {showMfa && !error && (
            <p className="text-sm text-center text-gray-600">
              Contul are MFA activat. Introduceți codul din aplicația de autentificare.
            </p>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div className="text-center">
            <Link href="/forgot-password" className="text-sm font-medium text-red-500 hover:text-red-600">
              Ați uitat parola?
            </Link>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Se autentifică...' : showMfa ? 'Verifică cod MFA' : 'Autentificare'}
            </button>
          </div>
          <p className="text-center text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gray-700">
              Politica de confidențialitate
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
