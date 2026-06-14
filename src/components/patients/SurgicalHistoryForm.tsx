'use client'

import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

const surgicalHistorySchema = z.object({
  previousSurgeries: z.string().min(1, 'Istoricul chirurgical anterior este obligatoriu'),
  currentConcerns: z.object({
    aesthetic: z.enum(['Yes', 'No']),
    functional: z.enum(['Yes', 'No']),
    pain: z.enum(['Yes', 'No']),
    scarring: z.enum(['Yes', 'No']),
    asymmetry: z.enum(['Yes', 'No']),
    dissatisfaction: z.enum(['Yes', 'No']),
  }),
  medicalHistory: z.object({
    allergies: z.string().min(1, 'Informațiile despre alergii sunt obligatorii'),
    medications: z.string().min(1, 'Medicația curentă este obligatorie'),
    smoking: z.string().min(1, 'Statusul privind fumatul este obligatoriu'),
    previousAnesthesia: z.string().min(1, 'Istoricul anesteziei este obligatoriu'),
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
  buttonText = 'Salvează'
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
          <h3 className="text-lg font-medium text-gray-900">Istoric chirurgical</h3>

          {/* Previous Surgeries */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Intervenții chirurgicale și proceduri anterioare
            </label>
            <textarea
              {...register('previousSurgeries')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Descrieți orice intervenții chirurgicale, tratamente estetice sau intervenții medicale anterioare"
            />
            {errors.previousSurgeries && (
              <p className="mt-1 text-sm text-red-600">{errors.previousSurgeries.message}</p>
            )}
          </div>

          {/* Current Concerns */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Preocupări actuale</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { id: 'aesthetic' as CurrentConcernField, label: 'Preocupări estetice' },
                { id: 'functional' as CurrentConcernField, label: 'Probleme funcționale' },
                { id: 'pain' as CurrentConcernField, label: 'Durere sau disconfort' },
                { id: 'scarring' as CurrentConcernField, label: 'Preocupări legate de cicatrici' },
                { id: 'asymmetry' as CurrentConcernField, label: 'Asimetrie' },
                { id: 'dissatisfaction' as CurrentConcernField, label: 'Nemulțumire față de aspect' },
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
                        Da
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
                        Nu
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medical History */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Istoric medical</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Alergii
                </label>
                <input
                  type="text"
                  {...register('medicalHistory.allergies')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="ex. Latex, Penicillin, Niciuna"
                />
                {errors.medicalHistory?.allergies && (
                  <p className="mt-1 text-sm text-red-600">{errors.medicalHistory.allergies.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Medicație curentă
                </label>
                <input
                  type="text"
                  {...register('medicalHistory.medications')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="ex. Anticoagulante, Niciuna"
                />
                {errors.medicalHistory?.medications && (
                  <p className="mt-1 text-sm text-red-600">{errors.medicalHistory.medications.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status fumat
                </label>
                <input
                  type="text"
                  {...register('medicalHistory.smoking')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="ex. Nefumător, Fost fumător, Fumător activ"
                />
                {errors.medicalHistory?.smoking && (
                  <p className="mt-1 text-sm text-red-600">{errors.medicalHistory.smoking.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Experiență anterioară cu anestezia
                </label>
                <input
                  type="text"
                  {...register('medicalHistory.previousAnesthesia')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="ex. Fără complicații, Greață etc."
                />
                {errors.medicalHistory?.previousAnesthesia && (
                  <p className="mt-1 text-sm text-red-600">{errors.medicalHistory.previousAnesthesia.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Se salvează...' : buttonText}
          </Button>
        </div>
      </form>
    </div>
  )
}
