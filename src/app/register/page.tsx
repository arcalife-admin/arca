'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import AddressAutocomplete from '@/components/AddressAutocomplete'

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
  { value: 'ORGANIZATION_OWNER', label: 'Organization Owner' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'DENTIST', label: 'Dentist' },
  { value: 'HYGIENIST', label: 'Hygienist' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'ASSISTANT', label: 'Assistant' },
  { value: 'ORTHODONTIST', label: 'Orthodontist' },
  { value: 'PERIODONTOLOGIST', label: 'Periodontologist' },
  { value: 'IMPLANTOLOGIST', label: 'Implantologist' },
  { value: 'ENDODONTIST', label: 'Endodontist' },
  { value: 'ANESTHESIOLOGIST', label: 'Anesthesiologist' },
  { value: 'DENTAL_TECHNICIAN', label: 'Dental Technician' },
  { value: 'DENTAL_LAB_TECHNICIAN', label: 'Dental Lab Technician' },
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
        setError('All fields are required')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
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
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (role !== 'ORGANIZATION_OWNER' && !selectedOrgId) {
      setError('Please select an organization')
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
        setError('All organization fields are required')
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
        throw new Error(data.message || 'Registration failed')
      }

      router.push('/login?registered=true')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed')
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
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {step === 1 ? (
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="firstName" className="sr-only">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="sr-only">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Last Name"
                />
              </div>
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="phone" className="sr-only">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Phone Number"
                />
              </div>
              <div>
                <label htmlFor="address" className="sr-only">
                  Address
                </label>
                <AddressAutocomplete
                  onSelect={(result) => {
                    setFormData(prev => ({ ...prev, address: result.display_name }))
                  }}
                  className="appearance-none rounded-none relative block w-full focus:border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Address"
                />
              </div>
              <div>
                <label htmlFor="role" className="sr-only">
                  Role
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
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                >
                  {USER_ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-md shadow-sm -space-y-px">
              {role === 'ORGANIZATION_OWNER' ? (
                <>
                  <div>
                    <label htmlFor="organizationName" className="sr-only">
                      Organization Name
                    </label>
                    <input
                      id="organizationName"
                      name="organizationName"
                      type="text"
                      required
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Organization Name"
                    />
                  </div>
                  <div>
                    <label htmlFor="organizationEmail" className="sr-only">
                      Organization Email
                    </label>
                    <input
                      id="organizationEmail"
                      name="organizationEmail"
                      type="email"
                      required
                      value={formData.organizationEmail}
                      onChange={handleInputChange}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Organization Email"
                    />
                  </div>
                  <div>
                    <label htmlFor="organizationPhone" className="sr-only">
                      Organization Phone
                    </label>
                    <input
                      id="organizationPhone"
                      name="organizationPhone"
                      type="tel"
                      required
                      value={formData.organizationPhone}
                      onChange={handleInputChange}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Organization Phone"
                    />
                  </div>
                  <div>
                    <label htmlFor="organizationAddress" className="sr-only">
                      Organization Address
                    </label>
                    <AddressAutocomplete
                      onSelect={(result) => {
                        setFormData(prev => ({ ...prev, organizationAddress: result.display_name }))
                      }}
                      className="appearance-none rounded-none relative block w-full focus:border placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"

                      placeholder="Organization Address"
                    />
                  </div>
                  <div>
                    <label htmlFor="organizationLogo" className="sr-only">
                      Organization Logo
                    </label>
                    <input
                      id="organizationLogo"
                      name="organizationLogo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="organizationId" className="sr-only">
                    Organization
                  </label>
                  <select
                    id="organizationId"
                    name="organizationId"
                    value={selectedOrgId}
                    onChange={e => setSelectedOrgId(e.target.value)}
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  >
                    <option value="">Select an organization</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                  {organizations.length === 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      No organizations available. Please contact your administrator.
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
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  )
} 