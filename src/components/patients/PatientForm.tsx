'use client'

import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { Button } from '@/components/ui/button'
import { DEFAULT_COUNTRY } from '@/lib/intake/field-registry'

const healthInsuranceSchema = z.preprocess(
  (val) => {
    if (!val || typeof val !== 'object') return undefined
    const o = val as Record<string, string | undefined>
    const hasAny = Boolean(
      o.provider?.trim() || o.policyNumber?.trim() || o.validUntil?.trim()
    )
    return hasAny ? val : undefined
  },
  z
    .object({
      provider: z.string().min(1, 'Furnizorul este obligatoriu'),
      policyNumber: z.string().min(1, 'Numărul poliței este obligatoriu'),
      coverageDetails: z.string().optional(),
      validUntil: z.string().min(1, 'Data de valabilitate este obligatorie'),
    })
    .optional()
)

const patientSchema = z.object({
  firstName: z.string().min(1, 'Prenumele este obligatoriu'),
  lastName: z.string().min(1, 'Numele este obligatoriu'),
  dateOfBirth: z.string().min(1, 'Data nașterii este obligatorie'),
  gender: z.enum(['MALE', 'FEMALE']),
  email: z.union([
    z.string().email('Adresă de e-mail invalidă'),
    z.literal('')
  ]).transform(val => val === '' ? undefined : val).optional(),
  phone: z.union([
    z.string(),
    z.literal('')
  ]).transform(val => val === '' ? undefined : val).optional(),
  address: z.object({
    display_name: z.string().min(1, 'Adresa este obligatorie'),
    lat: z.string(),
    lon: z.string(),
    altitude: z.number(),
  }),
  cnp: z.string().min(1, 'CNP-ul este obligatoriu'),
  country: z.string().default('Netherlands'),
  healthInsurance: healthInsuranceSchema,
  medicalHistory: z.any().optional(),
})

type PatientFormData = z.infer<typeof patientSchema>

interface PatientFormProps {
  initialData?: Partial<PatientFormData>
  onSubmit: (data: PatientFormData) => void
  onValuesChange?: (data: Partial<PatientFormData>) => void
  isSubmitting?: boolean
  buttonText?: string
}

export default function PatientForm({
  initialData,
  onSubmit,
  onValuesChange,
  isSubmitting = false,
  buttonText = 'Următorul'
}: PatientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    mode: 'onChange',
    defaultValues: {
      country: DEFAULT_COUNTRY,
      address: {
        display_name: '',
        lat: '',
        lon: '',
        altitude: 0
      },
      healthInsurance: undefined,
      ...initialData,
    },
  })

  React.useEffect(() => {
    if (!onValuesChange) return
    const subscription = watch((values) => {
      onValuesChange(values as Partial<PatientFormData>)
    })
    return () => subscription.unsubscribe()
  }, [watch, onValuesChange])

  const showHealthInsurance = watch('healthInsurance')
  const addressValue = watch('address')

  // Ensure healthInsurance is always undefined or a valid object
  React.useEffect(() => {
    const currentValue = watch('healthInsurance');
    if (currentValue === null) {
      setValue('healthInsurance', undefined);
    }
  }, [watch('healthInsurance'), setValue]);

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Display all form errors at the top */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-red-800">Erori în formular:</h3>
            <div className="mt-2 text-sm text-red-700">
              <ul>
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>{field}: {error?.message?.toString() || 'Valoare invalidă'}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900">Informații de bază</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                Prenume
              </label>
              <input
                type="text"
                id="firstName"
                {...register('firstName')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Nume
              </label>
              <input
                type="text"
                id="lastName"
                {...register('lastName')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                Data nașterii
              </label>
              <input
                type="date"
                id="dateOfBirth"
                {...register('dateOfBirth')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Sex
              </label>
              <select
                id="gender"
                {...register('gender')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Selectați sexul</option>
                <option value="MALE">Masculin</option>
                <option value="FEMALE">Feminin</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="cnp" className="block text-sm font-medium text-gray-700">
                CNP
              </label>
              <input
                type="text"
                id="cnp"
                {...register('cnp')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.cnp && (
                <p className="mt-1 text-sm text-red-600">{errors.cnp.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Țară
              </label>
              <input
                type="text"
                id="country"
                {...register('country')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.country && (
                <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900">Date de contact</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail (opțional)
              </label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefon (opțional)
              </label>
              <input
                type="tel"
                id="phone"
                {...register('phone')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Adresă
              </label>
              <AddressAutocomplete
                value={addressValue?.display_name || ''}
                onSelect={(result) => {
                  setValue('address', {
                    display_name: result.display_name,
                    lat: result.lat,
                    lon: result.lon,
                    altitude: 0
                  }, { shouldValidate: true })
                }}
                className="mt-1"
                placeholder="Introduceți adresa..."
              />
              <input
                type="hidden"
                {...register('address.display_name')}
              />
              {errors.address && (
                <div className="mt-1 text-sm text-red-600">
                  <p>Detalii eroare adresă:</p>
                  <pre className="whitespace-pre-wrap">
                    {errors.address.message || 'Adresă invalidă'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Health Insurance */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Asigurare de sănătate</h3>
            <button
              type="button"
              onClick={() => {
                const current = watch('healthInsurance');
                if (current) {
                  setValue('healthInsurance', undefined);
                } else {
                  setValue('healthInsurance', {
                    provider: '',
                    policyNumber: '',
                    coverageDetails: '',
                    validUntil: ''
                  });
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showHealthInsurance ? 'Elimină asigurarea' : 'Adaugă asigurare'}
            </button>
          </div>
          {showHealthInsurance && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="healthInsurance.provider" className="block text-sm font-medium text-gray-700">
                  Furnizor
                </label>
                <input
                  type="text"
                  id="healthInsurance.provider"
                  {...register('healthInsurance.provider')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.healthInsurance?.provider && (
                  <p className="mt-1 text-sm text-red-600">{errors.healthInsurance.provider.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="healthInsurance.policyNumber" className="block text-sm font-medium text-gray-700">
                  Număr poliță
                </label>
                <input
                  type="text"
                  id="healthInsurance.policyNumber"
                  {...register('healthInsurance.policyNumber')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.healthInsurance?.policyNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.healthInsurance.policyNumber.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="healthInsurance.coverageDetails" className="block text-sm font-medium text-gray-700">
                  Detalii acoperire (opțional)
                </label>
                <input
                  type="text"
                  id="healthInsurance.coverageDetails"
                  {...register('healthInsurance.coverageDetails')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="healthInsurance.validUntil" className="block text-sm font-medium text-gray-700">
                  Valabil până la
                </label>
                <input
                  type="date"
                  id="healthInsurance.validUntil"
                  {...register('healthInsurance.validUntil')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.healthInsurance?.validUntil && (
                  <p className="mt-1 text-sm text-red-600">{errors.healthInsurance.validUntil.message}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? 'Se salvează...' : buttonText}
          </Button>
        </div>
      </form>
    </div>
  )
}
