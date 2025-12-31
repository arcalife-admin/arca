'use client'

import React, { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { motion } from 'framer-motion'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import MedicalHistoryForm from './MedicalHistoryForm'
import DentalHistoryForm from './DentalHistoryForm'

const healthInsuranceSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  policyNumber: z.string().min(1, 'Policy number is required'),
  coverageDetails: z.string().optional(),
  validUntil: z.string().min(1, 'Valid until date is required'),
}).nullable().optional();

const patientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  address: z.object({
    display_name: z.string().min(1, 'Address is required'),
    lat: z.string(),
    lon: z.string(),
    altitude: z.number(),
  }),
  bsn: z.string().min(1, 'BSN is required'),
  country: z.string().default('Netherlands'),
  healthInsurance: healthInsuranceSchema,
  medicalHistory: z.any().optional(),
  dentalHistory: z.any().optional(),
})

type PatientFormData = z.infer<typeof patientSchema>

interface PatientFormProps {
  initialData?: Partial<PatientFormData>
  onSubmit: (data: PatientFormData) => void
  isSubmitting?: boolean
  buttonText?: string
}

export default function PatientForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  buttonText = 'Next'
}: PatientFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<PatientFormData>>(initialData || {})

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      country: 'Netherlands',
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

  const showHealthInsurance = watch('healthInsurance')

  // Ensure healthInsurance is always undefined or a valid object
  React.useEffect(() => {
    const currentValue = watch('healthInsurance');
    if (currentValue === null) {
      setValue('healthInsurance', undefined);
    }
  }, [watch('healthInsurance'), setValue]);

  const handleStepSubmit = (stepData: any) => {
    setFormData(prev => ({ ...prev, ...stepData }))
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1)
    } else {
      onSubmit({ ...formData, ...stepData } as PatientFormData)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= step
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-600'
                }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={`w-24 h-1 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-sm text-gray-600">
        <span>Basic Information</span>
        <span>Medical History</span>
        <span>Dental History</span>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Display all form errors at the top */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-red-800">Form Errors:</h3>
            <div className="mt-2 text-sm text-red-700">
              <ul>
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>{field}: {error?.message?.toString() || 'Invalid value'}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
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
                Last Name
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
                Date of Birth
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
                Gender
              </label>
              <select
                id="gender"
                {...register('gender')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="bsn" className="block text-sm font-medium text-gray-700">
                BSN
              </label>
              <input
                type="text"
                id="bsn"
                {...register('bsn')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              {errors.bsn && (
                <p className="mt-1 text-sm text-red-600">{errors.bsn.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                Country
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
          <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email (Optional)
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
                Phone (Optional)
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
                Address
              </label>
              <AddressAutocomplete
                onSelect={(result) => {
                  setValue('address', {
                    display_name: result.display_name,
                    lat: result.lat,
                    lon: result.lon,
                    altitude: 0
                  }, { shouldValidate: true })
                }}
                className="mt-1"
                placeholder="Enter address..."
              />
              <input
                type="hidden"
                {...register('address.display_name')}
              />
              {errors.address && (
                <div className="mt-1 text-sm text-red-600">
                  <p>Address Error Details:</p>
                  <pre className="whitespace-pre-wrap">
                    {errors.address.message || 'Invalid address'}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Health Insurance */}
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Health Insurance</h3>
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
              {showHealthInsurance ? 'Remove Insurance' : 'Add Insurance'}
            </button>
          </div>
          {showHealthInsurance && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="healthInsurance.provider" className="block text-sm font-medium text-gray-700">
                  Provider
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
                  Policy Number
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
                  Coverage Details (Optional)
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
                  Valid Until
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
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : buttonText}
          </button>
        </div>
      </form>
    </div>
  )
} 