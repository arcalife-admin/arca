'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { zodMessages } from '@/lib/zod-messages'
import { apiErrors } from '@/lib/api-errors'

interface AddressResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

const USER_ROLES = [
  { value: 'ORGANIZATION_OWNER', label: 'Proprietar organizație' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'PLASTIC_SURGEON', label: 'Chirurg plastician' },
  { value: 'SURGEON', label: 'Chirurg' },
  { value: 'NURSE', label: 'Asistent medical' },
  { value: 'RECEPTIONIST', label: 'Recepționer' },
  { value: 'ASSISTANT', label: 'Asistent' },
  { value: 'ANESTHESIOLOGIST', label: 'Anestezist' },
  { value: 'AESTHETIC_NURSE', label: 'Asistent estetic' },
  { value: 'MEDICAL_ASSISTANT', label: 'Asistent medical' },
  { value: 'COUNSELOR', label: 'Consilier' },
  { value: 'PHOTOGRAPHER', label: 'Fotograf' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<AddressResult | null>(null)
  const [role, setRole] = useState('ORGANIZATION_OWNER')
  const [organizations, setOrganizations] = useState<{ id: string; name: string; logoUrl?: string }[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationEmail: '',
    organizationPhone: '',
    organizationAddress: '',
    organizationLogo: null as File | null,
  })

  useEffect(() => {
    if (role !== 'ORGANIZATION_OWNER') {
      fetch('/api/organizations')
        .then((res) => res.json())
        .then(setOrganizations)
        .catch(() => setOrganizations([]))
    }
  }, [role])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, organizationLogo: e.target.files![0] }))
    }
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address || !formData.password || !formData.confirmPassword) {
        setError(zodMessages.required)
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError(zodMessages.passwordsDoNotMatch)
        return
      }
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError(zodMessages.passwordsDoNotMatch)
      setIsLoading(false)
      return
    }

    if (role !== 'ORGANIZATION_OWNER' && !selectedOrgId) {
      setError('Selectați o organizație')
      setIsLoading(false)
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append('firstName', formData.firstName)
    formDataToSend.append('lastName', formData.lastName)
    formDataToSend.append('email', formData.email)
    formDataToSend.append('phone', formData.phone)
    formDataToSend.append('address', formData.address)
    formDataToSend.append('password', formData.password)
    formDataToSend.append('role', role)

    if (role === 'ORGANIZATION_OWNER') {
      if (!formData.organizationName || !formData.organizationEmail || !formData.organizationPhone || !formData.organizationAddress) {
        setError('Toate câmpurile organizației sunt obligatorii')
        setIsLoading(false)
        return
      }

      const organizationData = {
        name: formData.organizationName,
        email: formData.organizationEmail,
        phone: formData.organizationPhone,
        address: formData.organizationAddress,
      }

      formDataToSend.append('organization', JSON.stringify(organizationData))

      if (formData.organizationLogo) {
        formDataToSend.append('organization.logo', formData.organizationLogo)
      }
    } else {
      formDataToSend.append('organizationId', selectedOrgId)
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: formDataToSend,
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle validation errors with detailed messages
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ')
          throw new Error(errorMessages || data.message || apiErrors.registrationFailed)
        }
        throw new Error(data.message || apiErrors.registrationFailed)
      }

      router.push('/login?registered=true')
    } catch (error) {
      setError(error instanceof Error ? error.message : apiErrors.registrationFailed)
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
            Creează contul tău
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sau{' '}
            <Link href="/login" className="font-medium text-red-500 hover:text-red-600">
              autentifică-te în contul tău
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {step === 1 ? (
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="firstName" className="sr-only">
                  Prenume
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Prenume"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="sr-only">
                  Nume
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Nume"
                />
              </div>
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
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Adresă de e-mail"
                />
              </div>
              <div>
                <label htmlFor="phone" className="sr-only">
                  Număr de telefon
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Număr de telefon"
                />
              </div>
              <div>
                <label htmlFor="address" className="sr-only">
                  Adresă
                </label>
                <AddressAutocomplete
                  onSelect={(result) => {
                    setFormData(prev => ({ ...prev, address: result.display_name }))
                  }}
                  className="appearance-none rounded-none relative block w-full focus:border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Adresă"
                />
              </div>
              <div>
                <label htmlFor="role" className="sr-only">
                  Rol
                </label>
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={e => {
                    setRole(e.target.value)
                    setSelectedOrgId('')
                  }}
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                >
                  {USER_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Parolă
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Parolă"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirmă parola
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  placeholder="Confirmă parola"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-md shadow-sm -space-y-px">
              {role === 'ORGANIZATION_OWNER' ? (
                <>
                  <div>
                    <label htmlFor="organizationName" className="sr-only">
                      Nume organizație
                    </label>
                    <input
                      id="organizationName"
                      name="organizationName"
                      type="text"
                      required
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                      placeholder="Nume organizație"
                    />
                  </div>
                  <div>
                    <label htmlFor="organizationEmail" className="sr-only">
                      E-mail organizație
                    </label>
                    <input
                      id="organizationEmail"
                      name="organizationEmail"
                      type="email"
                      required
                      value={formData.organizationEmail}
                      onChange={handleInputChange}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                      placeholder="E-mail organizație"
                    />
                  </div>
                  <div>
                    <label htmlFor="organizationPhone" className="sr-only">
                      Telefon organizație
                    </label>
                    <input
                      id="organizationPhone"
                      name="organizationPhone"
                      type="tel"
                      required
                      value={formData.organizationPhone}
                      onChange={handleInputChange}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                      placeholder="Telefon organizație"
                    />
                  </div>
                  <div>
                    <label htmlFor="organizationAddress" className="sr-only">
                      Adresă organizație
                    </label>
                    <AddressAutocomplete
                      onSelect={(result) => {
                        setFormData(prev => ({ ...prev, organizationAddress: result.display_name }))
                      }}
                      className="appearance-none rounded-none relative block w-full focus:border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"

                      placeholder="Adresă organizație"
                    />
                  </div>
                  <div>
                    <label htmlFor="organizationLogo" className="sr-only">
                      Logo organizație
                    </label>
                    <input
                      id="organizationLogo"
                      name="organizationLogo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="organizationId" className="sr-only">
                    Organizație
                  </label>
                  <select
                    id="organizationId"
                    name="organizationId"
                    value={selectedOrgId}
                    onChange={e => setSelectedOrgId(e.target.value)}
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                  >
                    <option value="">Selectați o organizație</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  {organizations.length === 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      Nu există organizații disponibile. Contactați administratorul.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            {step === 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Următorul
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Se creează contul...' : 'Creează cont'}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  )
} 