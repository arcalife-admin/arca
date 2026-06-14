'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Nu am putut trimite e-mailul de resetare.')
        return
      }

      setSuccess(
        data.message ??
          'Dacă există un cont activ asociat acestei adrese de e-mail, veți primi în curând un link de resetare a parolei.'
      )
      setEmail('')
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
            Ați uitat parola?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Introduceți adresa de e-mail a contului. Vă vom trimite un link pentru resetarea parolei.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              placeholder="Adresă de e-mail"
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          {success && <div className="text-green-600 text-sm text-center">{success}</div>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Se trimite...' : 'Trimite link de resetare'}
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

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  )
}
