'use client'

import React, { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import EmbeddedLink from '@/components/layout/EmbeddedLink'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { useIsEmbedded } from '@/hooks/useIsEmbedded'
import { FilterX } from 'lucide-react'
import { toast } from 'sonner'

interface PpsScores {
  quadrant1: number
  quadrant2: number
  quadrant3: number
  quadrant4: number
}

interface TreatmentPlan {
  longTermGoals: string[]
  shortTermGoals: string[]
}

interface HealthInsurance {
  provider: string
  policyNumber: string
  coverageDetails: string
  validUntil: string
}

interface Patient {
  id: string
  patientCode: string
  familyHeadCode?: string
  familyPosition?: number
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  email?: string
  phone: string
  address?: string
  cnp?: string
  country: string
  healthInsurance?: HealthInsurance
  asaScore?: number
  ppsScores?: PpsScores
  ppsTreatment?: 'NO_TREATMENT' | 'PREVENTIVE' | 'PERIODONTAL'
  lastAppointment?: string
  nextDentistRecall?: string
  nextHygieneRecall?: string
  treatmentPlan?: TreatmentPlan
  organizationId: string
  isLongTermCareAct?: boolean
  isDisabled?: boolean
  disabledMotiv?: string
  disabledAt?: string
  disabledBy?: string
}

function PatientsPageContent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState<string>('')
  const [countryFilter, setCountryFilter] = useState<string>('')
  const [ppsFilter, setPpsFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const isEmbedded = useIsEmbedded()

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await fetch('/api/patients')
      if (!response.ok) {
        throw new Error('Încărcarea pacienților a eșuat')
      }
      return response.json()
    },
  })

  // Helper to normalize date strings for comparison
  function normalizeDate(dateString: string): string[] {
    if (!dateString) return []
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return [dateString]
    // Standard formats
    const us = date.toLocaleDateString('ro-RO') // MM/DD/YYYY
    const gb = date.toLocaleDateString('en-GB') // DD/MM/YYYY
    const iso = date.toISOString().slice(0, 10) // YYYY-MM-DD
    // Compact formats
    const pad = (n: number) => n.toString().padStart(2, '0')
    const day = pad(date.getDate())
    const month = pad(date.getMonth() + 1)
    const year = date.getFullYear().toString()
    const year2 = year.slice(-2)
    const compact = [
      `${day}${month}${year2}`,
      `${month}${day}${year2}`,
      `${day}${month}${year}`,
      `${month}${day}${year}`,
    ]
    return [us, gb, iso, ...compact]
  }

  const filteredPatients = patients.filter((patient) => {
    const search = searchQuery.trim().toLowerCase()
    const matchesSearch = !search || [
      patient.patientCode || '',
      patient.firstName || '',
      patient.lastName || '',
      patient.email || '',
      patient.phone || '',
      patient.address || '',
      ...normalizeDate(patient.dateOfBirth).map((d) => d.toLowerCase()),
    ].some((field) => String(field).toLowerCase().includes(search))

    const matchesGender = !genderFilter || patient.gender === genderFilter
    const matchesCountry = !countryFilter || patient.country === countryFilter
    const matchesPps = !ppsFilter || patient.ppsTreatment === ppsFilter
    const matchesStatus = !statusFilter ||
      (statusFilter === 'disabled' && patient.isDisabled) ||
      (statusFilter === 'active' && !patient.isDisabled)

    return matchesSearch && matchesGender && matchesCountry && matchesPps && matchesStatus
  })

  function resetFilters() {
    setSearchQuery('')
    setGenderFilter('')
    setCountryFilter('')
    setPpsFilter('')
    setStatusFilter('')
  }

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copiat în clipboard`)
    } catch {
      toast.error('Copierea în clipboard a eșuat')
    }
  }

  // Handle patient navigation - use DynamicPane messaging if embedded
  const handlePatientNavigation = (patientId: string) => {
    if (isEmbedded && window.parent) {
      // Tell parent DynamicPane to switch to patient view
      window.parent.postMessage({
        type: 'openPane',
        pane: 'patient',
        patientId: patientId
      }, '*')
    } else {
      // Direct navigation for non-embedded context
      window.location.href = `/dashboard/patients/${patientId}`
    }
  }

  const genderLabel = (gender: string) => {
    switch (gender) {
      case 'MALE': return 'Masculin'
      case 'FEMALE': return 'Feminin'
      case 'OTHER': return 'Altul'
      default: return gender
    }
  }

  // Get unique countries for filter
  const countries = Array.from(new Set(patients.map(p => p.country))).sort()

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pacienți</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestionați fișele și informațiile pacienților
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button asChild>
            <EmbeddedLink href="/dashboard/patients/new">
              Adaugă pacient
            </EmbeddedLink>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 space-y-4">
        {/* Search Bar */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Căutare
          </label>
          <input
            type="text"
            name="search"
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Căutați după cod pacient, nume, dată naștere, email, telefon, adresă..."
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Sex
            </label>
            <select
              name="gender"
              id="gender"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Toate</option>
              <option value="MALE">Masculin</option>
              <option value="FEMALE">Feminin</option>
              <option value="OTHER">Altul</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              Țară
            </label>
            <select
              name="country"
              id="country"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Toate</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="pps" className="block text-sm font-medium text-gray-700">
              Tratament PPS
            </label>
            <select
              name="pps"
              id="pps"
              value={ppsFilter}
              onChange={(e) => setPpsFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Toate</option>
              <option value="NO_TREATMENT">Fără tratament</option>
              <option value="PREVENTIVE">Preventiv</option>
              <option value="PERIODONTAL">Parodontal</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Toate</option>
              <option value="active">Activ</option>
              <option value="disabled">Dezactivat</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex justify-center items-center rounded-md border border-red-300 bg-red-100 w-10 h-10 text-sm font-medium text-red-700 shadow-sm hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition"
              title="Resetează filtrele"
            >
              <FilterX className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Niciun pacient găsit
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cod pacient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data nașterii
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sex
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient) => {
                  const formattedDateOfBirth = new Date(patient.dateOfBirth).toLocaleDateString()
                  const fullName = `${patient.firstName} ${patient.lastName}`

                  return (
                    <motion.tr
                      key={patient.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => handlePatientNavigation(patient.id)}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="text-sm font-medium text-blue-600 cursor-copy hover:text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(patient.patientCode, 'Cod pacient')
                          }}
                        >
                          {patient.patientCode}
                          {patient.familyHeadCode && patient.familyHeadCode !== patient.patientCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-medium text-gray-900 cursor-copy hover:text-blue-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(fullName, 'Nume')
                            }}
                          >
                            {fullName}
                          </span>
                          {patient.isDisabled && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Dezactivat
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="text-sm text-gray-500 cursor-copy hover:text-blue-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(formattedDateOfBirth, 'Data nașterii')
                          }}
                        >
                          {formattedDateOfBirth}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {genderLabel(patient.gender)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="block w-fit text-sm text-gray-500 cursor-copy hover:text-blue-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyToClipboard(patient.phone, 'Telefon')
                          }}
                        >
                          {patient.phone}
                        </span>
                        {patient.email && (
                          <span
                            className="block w-fit text-sm text-gray-500 cursor-copy hover:text-blue-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(patient.email!, 'Email')
                            }}
                          >
                            {patient.email}
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PatientsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Se încarcă...</div>}>
      <PatientsPageContent />
    </Suspense>
  );
}