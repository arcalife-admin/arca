'use client'

import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { motion } from 'framer-motion'

const dentalHistorySchema = z.object({
  previousWork: z.string().min(1, 'Previous dental work is required'),
  currentIssues: z.object({
    pain: z.enum(['Yes', 'No']),
    bleeding: z.enum(['Yes', 'No']),
    dryMouth: z.enum(['Yes', 'No']),
    grinding: z.enum(['Yes', 'No']),
    badBreath: z.enum(['Yes', 'No']),
    mouthSores: z.enum(['Yes', 'No']),
    sensitivity: z.enum(['Yes', 'No']),
    sleepIssues: z.enum(['Yes', 'No']),
  }),
  oralHygiene: z.object({
    brushing: z.string().min(1, 'Brushing frequency is required'),
    flossing: z.string().min(1, 'Flossing frequency is required'),
    mouthwash: z.string().min(1, 'Mouthwash usage is required'),
    lastCleaning: z.string().min(1, 'Last cleaning date is required'),
  }),
})

type DentalHistoryFormData = z.infer<typeof dentalHistorySchema>

type CurrentIssueField = 'pain' | 'sensitivity' | 'bleeding' | 'badBreath' | 'dryMouth' | 'grinding' | 'sleepIssues' | 'mouthSores';

interface DentalHistoryFormProps {
  onSubmit: (data: DentalHistoryFormData) => void
  isSubmitting?: boolean
  buttonText?: string
}

export default function DentalHistoryForm({
  onSubmit,
  isSubmitting = false,
  buttonText = 'Save'
}: DentalHistoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DentalHistoryFormData>({
    resolver: zodResolver(dentalHistorySchema),
  })

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Dental History</h3>

          {/* Previous Dental Work */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Previous Dental Work
            </label>
            <textarea
              {...register('previousWork')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Describe any previous dental work, treatments, or surgeries"
            />
            {errors.previousWork && (
              <p className="mt-1 text-sm text-red-600">{errors.previousWork.message}</p>
            )}
          </div>

          {/* Current Issues */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Current Issues</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { id: 'pain' as CurrentIssueField, label: 'Pain or discomfort' },
                { id: 'sensitivity' as CurrentIssueField, label: 'Sensitivity to hot/cold' },
                { id: 'bleeding' as CurrentIssueField, label: 'Bleeding gums' },
                { id: 'badBreath' as CurrentIssueField, label: 'Bad breath' },
                { id: 'dryMouth' as CurrentIssueField, label: 'Dry mouth' },
                { id: 'grinding' as CurrentIssueField, label: 'Teeth grinding' },
                { id: 'sleepIssues' as CurrentIssueField, label: 'Sleep issues' },
                { id: 'mouthSores' as CurrentIssueField, label: 'Mouth sores' },
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
                        {...register(`currentIssues.${id}` as const)}
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
                        {...register(`currentIssues.${id}` as const)}
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

          {/* Oral Hygiene */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Oral Hygiene</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Brushing Frequency
                </label>
                <input
                  type="text"
                  {...register('oralHygiene.brushing')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Twice daily"
                />
                {errors.oralHygiene?.brushing && (
                  <p className="mt-1 text-sm text-red-600">{errors.oralHygiene.brushing.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Flossing Frequency
                </label>
                <input
                  type="text"
                  {...register('oralHygiene.flossing')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Daily"
                />
                {errors.oralHygiene?.flossing && (
                  <p className="mt-1 text-sm text-red-600">{errors.oralHygiene.flossing.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mouthwash Usage
                </label>
                <input
                  type="text"
                  {...register('oralHygiene.mouthwash')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Daily"
                />
                {errors.oralHygiene?.mouthwash && (
                  <p className="mt-1 text-sm text-red-600">{errors.oralHygiene.mouthwash.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Dental Cleaning
                </label>
                <input
                  type="text"
                  {...register('oralHygiene.lastCleaning')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., 6 months ago"
                />
                {errors.oralHygiene?.lastCleaning && (
                  <p className="mt-1 text-sm text-red-600">{errors.oralHygiene.lastCleaning.message}</p>
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