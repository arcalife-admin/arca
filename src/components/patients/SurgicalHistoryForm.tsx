'use client'

import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { motion } from 'framer-motion'

const surgicalHistorySchema = z.object({
  previousSurgeries: z.string().min(1, 'Previous surgical history is required'),
  currentConcerns: z.object({
    aesthetic: z.enum(['Yes', 'No']),
    functional: z.enum(['Yes', 'No']),
    pain: z.enum(['Yes', 'No']),
    scarring: z.enum(['Yes', 'No']),
    asymmetry: z.enum(['Yes', 'No']),
    dissatisfaction: z.enum(['Yes', 'No']),
  }),
  medicalHistory: z.object({
    allergies: z.string().min(1, 'Allergy information is required'),
    medications: z.string().min(1, 'Current medications are required'),
    smoking: z.string().min(1, 'Smoking status is required'),
    previousAnesthesia: z.string().min(1, 'Previous anesthesia history is required'),
  }),
})

type SurgicalHistoryFormData = z.infer<typeof surgicalHistorySchema>

type CurrentConcernField = 'aesthetic' | 'functional' | 'pain' | 'scarring' | 'asymmetry' | 'dissatisfaction';

interface SurgicalHistoryFormProps {
  onSubmit: (data: SurgicalHistoryFormData) => void
  isSubmitting?: boolean
  buttonText?: string
}

export default function SurgicalHistoryForm({
  onSubmit,
  isSubmitting = false,
  buttonText = 'Save'
}: SurgicalHistoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SurgicalHistoryFormData>({
    resolver: zodResolver(surgicalHistorySchema),
  })

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Surgical History</h3>

          {/* Previous Surgeries */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Previous Surgeries & Procedures
            </label>
            <textarea
              {...register('previousSurgeries')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Describe any previous surgical procedures, cosmetic treatments, or medical interventions"
            />
            {errors.previousSurgeries && (
              <p className="mt-1 text-sm text-red-600">{errors.previousSurgeries.message}</p>
            )}
          </div>

          {/* Current Concerns */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Current Concerns</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { id: 'aesthetic' as CurrentConcernField, label: 'Aesthetic concerns' },
                { id: 'functional' as CurrentConcernField, label: 'Functional issues' },
                { id: 'pain' as CurrentConcernField, label: 'Pain or discomfort' },
                { id: 'scarring' as CurrentConcernField, label: 'Scarring concerns' },
                { id: 'asymmetry' as CurrentConcernField, label: 'Asymmetry' },
                { id: 'dissatisfaction' as CurrentConcernField, label: 'Dissatisfaction with appearance' },
              ].map(({ id, label }) => (
                <div key={id}>
                  <label className="block text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id={`${id}Yes`}
                        value="Yes"
                        {...register(`currentConcerns.${id}` as const)}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`${id}Yes`} className="ml-3 block text-sm text-gray-700">
                        Yes
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id={`${id}No`}
                        value="No"
                        {...register(`currentConcerns.${id}` as const)}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`${id}No`} className="ml-3 block text-sm text-gray-700">
                        No
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medical History */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Medical History</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Allergies
                </label>
                <input
                  type="text"
                  {...register('medicalHistory.allergies')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Latex, Penicillin, None"
                />
                {errors.medicalHistory?.allergies && (
                  <p className="mt-1 text-sm text-red-600">{errors.medicalHistory.allergies.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Medications
                </label>
                <input
                  type="text"
                  {...register('medicalHistory.medications')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Blood thinners, None"
                />
                {errors.medicalHistory?.medications && (
                  <p className="mt-1 text-sm text-red-600">{errors.medicalHistory.medications.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Smoking Status
                </label>
                <input
                  type="text"
                  {...register('medicalHistory.smoking')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Non-smoker, Former smoker, Current smoker"
                />
                {errors.medicalHistory?.smoking && (
                  <p className="mt-1 text-sm text-red-600">{errors.medicalHistory.smoking.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Previous Anesthesia Experience
                </label>
                <input
                  type="text"
                  {...register('medicalHistory.previousAnesthesia')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., No complications, Nausea, etc."
                />
                {errors.medicalHistory?.previousAnesthesia && (
                  <p className="mt-1 text-sm text-red-600">{errors.medicalHistory.previousAnesthesia.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : buttonText}
          </button>
        </div>
      </form>
    </div>
  )
}

