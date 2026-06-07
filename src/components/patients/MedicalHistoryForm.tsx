'use client'

import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { motion } from 'framer-motion'

const medicalHistorySchema = z.object({
  generalHealth: z.object({
    heartConditions: z.enum(['Yes', 'No']),
    heartConditionsDetails: z.string().optional(),
    bloodPressure: z.enum(['High', 'Low', 'None']).optional(),
    lungConditions: z.enum(['Yes', 'No']),
    lungConditionsDetails: z.string().optional(),
    diabetes: z.enum(['Yes', 'No']),
    diabetesDetails: z.string().optional(),
    kidneyLiver: z.enum(['Yes', 'No']),
    kidneyLiverDetails: z.string().optional(),
    bloodDisorders: z.enum(['Yes', 'No']),
    bloodDisordersDetails: z.string().optional(),
    cancer: z.enum(['Yes', 'No']),
    cancerDetails: z.string().optional(),
    boneIssues: z.enum(['Yes', 'No']),
    boneIssuesDetails: z.string().optional(),
    neurological: z.enum(['Yes', 'No']),
    neurologicalDetails: z.string().optional(),
    psychiatric: z.enum(['Yes', 'No']),
    psychiatricDetails: z.string().optional(),
    digestive: z.enum(['Yes', 'No']),
    digestiveDetails: z.string().optional(),
    immune: z.enum(['Yes', 'No']),
    immuneDetails: z.string().optional(),
    bleeding: z.enum(['Yes', 'No']),
    bleedingDetails: z.string().optional(),
  }),
  hospitalization: z.enum(['Yes', 'No']),
  hospitalizationDetails: z.string().optional(),
  bisphosphonates: z.enum(['Yes', 'No']),
  bisphosphonatesDetails: z.string().optional(),
  medications: z.string().optional(),
  bloodThinners: z.enum(['Yes', 'No']),
  bloodThinnersDetails: z.string().optional(),
  hormonalTherapy: z.enum(['Yes', 'No']),
  smoking: z.enum(['Yes', 'No']),
  smokingDetails: z.string().optional(),
  quitSmoking: z.enum(['Yes', 'No']),
  quitSmokingDetails: z.string().optional(),
  alcohol: z.enum(['Yes', 'No']),
  alcoholDetails: z.string().optional(),
  recreationalDrugs: z.enum(['Yes', 'No']),
  recreationalDrugsDetails: z.string().optional(),
  allergies: z.object({
    antibiotics: z.enum(['Yes', 'No']),
    antibioticsDetails: z.string().optional(),
    anesthetics: z.enum(['Yes', 'No']),
    anestheticsDetails: z.string().optional(),
    painkillers: z.enum(['Yes', 'No']),
    painkillersDetails: z.string().optional(),
    materials: z.enum(['Yes', 'No']),
    materialsDetails: z.string().optional(),
    other: z.enum(['Yes', 'No']),
    otherDetails: z.string().optional(),
  }),
  pregnancy: z.enum(['Pregnant', 'Breastfeeding', 'None']),
  pregnancyDetails: z.string().optional(),
  immunocompromised: z.enum(['Yes', 'No']),
  immunocompromisedDetails: z.string().optional(),
  premedication: z.enum(['Yes', 'No']),
  premedicationDetails: z.string().optional(),
  familyHistory: z.object({
    heartDisease: z.enum(['Yes', 'No']),
    diabetes: z.enum(['Yes', 'No']),
    bleedingDisorders: z.enum(['Yes', 'No']),
    osteoporosis: z.enum(['Yes', 'No']),
    psychiatric: z.enum(['Yes', 'No']),
    dentalIssues: z.enum(['Yes', 'No']),
    details: z.string().optional(),
  }),
  consent: z.boolean().refine((val) => val === true, {
    message: 'Trebuie să acceptați termenii',
  }),
})

type MedicalHistoryFormData = z.infer<typeof medicalHistorySchema>

interface MedicalHistoryFormProps {
  onSubmit: (data: MedicalHistoryFormData) => void
  isSubmitting?: boolean
  buttonText?: string
}

export default function MedicalHistoryForm({
  onSubmit,
  isSubmitting = false,
  buttonText = 'Următorul'
}: MedicalHistoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<MedicalHistoryFormData>({
    resolver: zodResolver(medicalHistorySchema),
    defaultValues: {
      consent: false,
    },
  })

  // Watch all general health fields
  const generalHealthFields = watch('generalHealth')
  const allergiesFields = watch('allergies')
  const familyHistoryFields = watch('familyHistory')

  const heartConditions = watch('generalHealth.heartConditions')
  const lungConditions = watch('generalHealth.lungConditions')
  const diabetes = watch('generalHealth.diabetes')
  const kidneyLiver = watch('generalHealth.kidneyLiver')
  const bloodDisorders = watch('generalHealth.bloodDisorders')
  const cancer = watch('generalHealth.cancer')
  const boneIssues = watch('generalHealth.boneIssues')
  const neurological = watch('generalHealth.neurological')
  const psychiatric = watch('generalHealth.psychiatric')
  const digestive = watch('generalHealth.digestive')
  const immune = watch('generalHealth.immune')
  const bleeding = watch('generalHealth.bleeding')

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* General Health */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Stare generală de sănătate</h3>
          <p className="text-sm text-gray-500">
            Ați avut sau vi s-a diagnosticat vreodată:
          </p>

          <div className="space-y-4">
            {/* Heart Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Afecțiuni cardiace, tensiune arterială ridicată/scăzută, accident vascular cerebral, febră reumatică?
              </label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="heartConditionsYes"
                    value="Yes"
                    {...register('generalHealth.heartConditions')}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="heartConditionsYes" className="ml-3 block text-sm text-gray-700">
                    Da
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="heartConditionsNo"
                    value="No"
                    {...register('generalHealth.heartConditions')}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="heartConditionsNo" className="ml-3 block text-sm text-gray-700">
                    Nu
                  </label>
                </div>
              </div>
              {heartConditions === 'Yes' && (
                <div className="mt-2">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Tensiune arterială
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="bloodPressureHigh"
                          value="High"
                          {...register('generalHealth.bloodPressure')}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="bloodPressureHigh" className="ml-2 text-sm text-gray-700">
                          Ridicată
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="bloodPressureLow"
                          value="Low"
                          {...register('generalHealth.bloodPressure')}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="bloodPressureLow" className="ml-2 text-sm text-gray-700">
                          Scăzută
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="bloodPressureNone"
                          value="None"
                          {...register('generalHealth.bloodPressure')}
                          className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="bloodPressureNone" className="ml-2 text-sm text-gray-700">
                          Nune
                        </label>
                      </div>
                    </div>
                  </div>
                  <textarea
                    {...register('generalHealth.heartConditionsDetails')}
                    placeholder="Vă rugăm să explicați"
                    rows={2}
                    className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              )}
            </div>

            {/* Other Conditions */}
            {[
              {
                id: 'lungConditions' as const,
                label: 'Astm, bronșită, boală pulmonară cronică, tuberculoză?',
              },
              {
                id: 'diabetes' as const,
                label: 'Diabet, afecțiuni tiroidiene sau hormonale?',
              },
              {
                id: 'kidneyLiver' as const,
                label: 'Boli renale sau hepatice, hepatită?',
              },
              {
                id: 'bloodDisorders' as const,
                label: 'Afecțiuni hematologice (ex. anemie, hemofilie)?',
              },
              {
                id: 'cancer' as const,
                label: 'Cancer, chimioterapie sau radioterapie?',
              },
              {
                id: 'boneIssues' as const,
                label: 'Osteoporoză, înlocuire articulară, afecțiuni osoase?',
              },
              {
                id: 'neurological' as const,
                label: 'Convulsii, epilepsie, afecțiuni neurologice?',
              },
              {
                id: 'psychiatric' as const,
                label: 'Afecțiuni psihiatrice sau de sănătate mintală?',
              },
              {
                id: 'digestive' as const,
                label: 'Probleme stomacale sau digestive (ulcer, reflux)?',
              },
              {
                id: 'immune' as const,
                label: 'Afecțiuni imunitare, HIV/SIDA sau infecții frecvente?',
              },
              {
                id: 'bleeding' as const,
                label: 'Sângerări excesive sau tendință la vânătăi?',
              },
            ].map((condition) => (
              <div key={condition.id}>
                <label className="block text-sm font-medium text-gray-700">
                  {condition.label}
                </label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`${condition.id}Yes`}
                      value="Yes"
                      {...register(`generalHealth.${condition.id}`)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`${condition.id}Yes`} className="ml-3 block text-sm text-gray-700">
                      Da
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`${condition.id}No`}
                      value="No"
                      {...register(`generalHealth.${condition.id}`)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`${condition.id}No`} className="ml-3 block text-sm text-gray-700">
                      Nu
                    </label>
                  </div>
                </div>
                {generalHealthFields?.[condition.id] === 'Yes' && (
                  <div className="mt-2">
                    <textarea
                      {...register(`generalHealth.${condition.id}Details`)}
                      placeholder="Vă rugăm să explicați"
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hospitalization */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Spitalizare</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ați fost spitalizat sau ați avut intervenții chirurgicale în ultimii 5 ani?
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="hospitalizationYes"
                  value="Yes"
                  {...register('hospitalization')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hospitalizationYes" className="ml-3 block text-sm text-gray-700">
                  Da
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="hospitalizationNo"
                  value="No"
                  {...register('hospitalization')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hospitalizationNo" className="ml-3 block text-sm text-gray-700">
                  Nu
                </label>
              </div>
            </div>
            {watch('hospitalization') === 'Yes' && (
              <div className="mt-2">
                <textarea
                  {...register('hospitalizationDetails')}
                  placeholder="Vă rugăm să explicați"
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Bisphosphonates */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Bifosfonați</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ați folosit vreodată bifosfonați (ex. Fosamax, Aclasta)?
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="bisphosphonatesYes"
                  value="Yes"
                  {...register('bisphosphonates')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="bisphosphonatesYes" className="ml-3 block text-sm text-gray-700">
                  Da
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="bisphosphonatesNo"
                  value="No"
                  {...register('bisphosphonates')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="bisphosphonatesNo" className="ml-3 block text-sm text-gray-700">
                  Nu
                </label>
              </div>
            </div>
            {watch('bisphosphonates') === 'Yes' && (
              <div className="mt-2">
                <textarea
                  {...register('bisphosphonatesDetails')}
                  placeholder="Denumirea medicamentului și durata"
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Medications & Lifestyle */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Medicație și stil de viață</h3>

          {/* Current Medications */}
          <div>
            <label htmlFor="medications" className="block text-sm font-medium text-gray-700">
              Enumerați toate medicamentele curente (inclusiv suplimentele):
            </label>
            <textarea
              id="medications"
              rows={3}
              {...register('medications')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Blood Thinners */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Luați anticoagulante (ex. aspirină, warfarină)?
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="bloodThinnersYes"
                  value="Yes"
                  {...register('bloodThinners')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="bloodThinnersYes" className="ml-3 block text-sm text-gray-700">
                  Da
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="bloodThinnersNo"
                  value="No"
                  {...register('bloodThinners')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="bloodThinnersNo" className="ml-3 block text-sm text-gray-700">
                  Nu
                </label>
              </div>
            </div>
            {watch('bloodThinners') === 'Yes' && (
              <div className="mt-2">
                <input
                  type="text"
                  {...register('bloodThinnersDetails')}
                  placeholder="Denumire"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>

          {/* Hormonal Therapy */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Urmați terapie hormonală sau contracepție?
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="hormonalTherapyYes"
                  value="Yes"
                  {...register('hormonalTherapy')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hormonalTherapyYes" className="ml-3 block text-sm text-gray-700">
                  Da
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="hormonalTherapyNo"
                  value="No"
                  {...register('hormonalTherapy')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="hormonalTherapyNo" className="ml-3 block text-sm text-gray-700">
                  Nu
                </label>
              </div>
            </div>
          </div>

          {/* Smoking */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fumați sau folosiți dispozitive de vaping?
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="smokingYes"
                  value="Yes"
                  {...register('smoking')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="smokingYes" className="ml-3 block text-sm text-gray-700">
                  Da
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="smokingNo"
                  value="No"
                  {...register('smoking')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="smokingNo" className="ml-3 block text-sm text-gray-700">
                  Nu
                </label>
              </div>
            </div>
            {watch('smoking') === 'Yes' && (
              <div className="mt-2">
                <input
                  type="text"
                  {...register('smokingDetails')}
                  placeholder="Cât de des"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>

          {/* Quit Smoking */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ați renunțat la fumat?
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="quitSmokingYes"
                  value="Yes"
                  {...register('quitSmoking')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="quitSmokingYes" className="ml-3 block text-sm text-gray-700">
                  Da
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="quitSmokingNo"
                  value="No"
                  {...register('quitSmoking')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="quitSmokingNo" className="ml-3 block text-sm text-gray-700">
                  Nu
                </label>
              </div>
            </div>
            {watch('quitSmoking') === 'Yes' && (
              <div className="mt-2">
                <input
                  type="text"
                  {...register('quitSmokingDetails')}
                  placeholder="Când"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>

          {/* Alcohol */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Consumați alcool?
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="alcoholYes"
                  value="Yes"
                  {...register('alcohol')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="alcoholYes" className="ml-3 block text-sm text-gray-700">
                  Da
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="alcoholNo"
                  value="No"
                  {...register('alcohol')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="alcoholNo" className="ml-3 block text-sm text-gray-700">
                  Nu
                </label>
              </div>
            </div>
            {watch('alcohol') === 'Yes' && (
              <div className="mt-2">
                <input
                  type="text"
                  {...register('alcoholDetails')}
                  placeholder="Câte pe săptămână"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>

          {/* Recreational Drugs */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Folosiți droguri recreaționale?
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="recreationalDrugsYes"
                  value="Yes"
                  {...register('recreationalDrugs')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="recreationalDrugsYes" className="ml-3 block text-sm text-gray-700">
                  Da
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="recreationalDrugsNo"
                  value="No"
                  {...register('recreationalDrugs')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="recreationalDrugsNo" className="ml-3 block text-sm text-gray-700">
                  Nu
                </label>
              </div>
            </div>
            {watch('recreationalDrugs') === 'Yes' && (
              <div className="mt-2">
                <input
                  type="text"
                  {...register('recreationalDrugsDetails')}
                  placeholder="Care"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Allergies */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Alergii și reacții</h3>
          <p className="text-sm text-gray-500">
            Sunteți alergic sau ați avut reacții la:
          </p>

          <div className="space-y-4">
            {[
              {
                id: 'antibiotics' as const,
                label: 'Antibiotice (ex. penicilină)?',
              },
              {
                id: 'anesthetics' as const,
                label: 'Anestezice locale (ex. lidocaină)?',
              },
              {
                id: 'painkillers' as const,
                label: 'Aspirină, ibuprofen sau narcotice?',
              },
              {
                id: 'materials' as const,
                label: 'Latex, metale, acrilice, iod?',
              },
              {
                id: 'other' as const,
                label: 'Alimente, animale, polen, altele?',
              },
            ].map((allergy) => (
              <div key={allergy.id}>
                <label className="block text-sm font-medium text-gray-700">
                  {allergy.label}
                </label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`${allergy.id}Yes`}
                      value="Yes"
                      {...register(`allergies.${allergy.id}`)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`${allergy.id}Yes`} className="ml-3 block text-sm text-gray-700">
                      Da
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`${allergy.id}No`}
                      value="No"
                      {...register(`allergies.${allergy.id}`)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`${allergy.id}No`} className="ml-3 block text-sm text-gray-700">
                      Nu
                    </label>
                  </div>
                </div>
                {allergiesFields?.[allergy.id] === 'Yes' && (
                  <div className="mt-2">
                    <textarea
                      {...register(`allergies.${allergy.id}Details`)}
                      placeholder="Vă rugăm să explicați"
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Special Considerations */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Considerații speciale</h3>

          {/* Pregnancy */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sunteți în prezent însărcinată sau alăptați?
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="pregnancyPregnant"
                  value="Pregnant"
                  {...register('pregnancy')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="pregnancyPregnant" className="ml-3 block text-sm text-gray-700">
                  Însărcinată
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="pregnancyBreastfeeding"
                  value="Breastfeeding"
                  {...register('pregnancy')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="pregnancyBreastfeeding" className="ml-3 block text-sm text-gray-700">
                  Alăptare
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="pregnancyNone"
                  value="None"
                  {...register('pregnancy')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="pregnancyNone" className="ml-3 block text-sm text-gray-700">
                  Niciuna
                </label>
              </div>
            </div>
            {watch('pregnancy') === 'Pregnant' && (
              <div className="mt-2">
                <input
                  type="text"
                  {...register('pregnancyDetails')}
                  placeholder="Săptămână"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>

          {/* Immunocompromised */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Aveți imunodeficiență sau luați medicamente imunosupresoare?
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="immunocompromisedYes"
                  value="Yes"
                  {...register('immunocompromised')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="immunocompromisedYes" className="ml-3 block text-sm text-gray-700">
                  Da
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="immunocompromisedNo"
                  value="No"
                  {...register('immunocompromised')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="immunocompromisedNo" className="ml-3 block text-sm text-gray-700">
                  Nu
                </label>
              </div>
            </div>
            {watch('immunocompromised') === 'Yes' && (
              <div className="mt-2">
                <textarea
                  {...register('immunocompromisedDetails')}
                  placeholder="Vă rugăm să explicați"
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>

          {/* Premedication */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Aveți o afecțiune care necesită premedicație antibiotică înainte de tratamentul dentar (ex. valvă cardiacă artificială)?
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="premedicationYes"
                  value="Yes"
                  {...register('premedication')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="premedicationYes" className="ml-3 block text-sm text-gray-700">
                  Da
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="premedicationNo"
                  value="No"
                  {...register('premedication')}
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="premedicationNo" className="ml-3 block text-sm text-gray-700">
                  Nu
                </label>
              </div>
            </div>
            {watch('premedication') === 'Yes' && (
              <div className="mt-2">
                <input
                  type="text"
                  {...register('premedicationDetails')}
                  placeholder="Prescriptor și doză"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Family History */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Istoric medical familial</h3>
          <p className="text-sm text-gray-500">
            Rudele apropiate (părinți/frate/soră) au istoric de:
          </p>

          <div className="space-y-4">
            {[
              {
                id: 'heartDisease' as const,
                label: 'Boli cardiace, accident vascular cerebral',
              },
              {
                id: 'diabetes' as const,
                label: 'Diabet sau afecțiuni tiroidiene',
              },
              {
                id: 'bleedingDisorders' as const,
                label: 'Afecțiuni de sângerare/coagulare',
              },
              {
                id: 'osteoporosis' as const,
                label: 'Osteoporoză',
              },
              {
                id: 'psychiatric' as const,
                label: 'Afecțiuni psihiatrice',
              },
              {
                id: 'dentalIssues' as const,
                label: 'Anomalii maxilo-dentare sau tratament ortodontic',
              },
            ].map((condition) => (
              <div key={condition.id}>
                <label className="block text-sm font-medium text-gray-700">
                  {condition.label}
                </label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`${condition.id}Yes`}
                      value="Yes"
                      {...register(`familyHistory.${condition.id}`)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`${condition.id}Yes`} className="ml-3 block text-sm text-gray-700">
                      Da
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={`${condition.id}No`}
                      value="No"
                      {...register(`familyHistory.${condition.id}`)}
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`${condition.id}No`} className="ml-3 block text-sm text-gray-700">
                      Nu
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label htmlFor="familyHistoryDetails" className="block text-sm font-medium text-gray-700">
              Detalii suplimentare despre istoricul familial:
            </label>
            <textarea
              id="familyHistoryDetails"
              rows={3}
              {...register('familyHistory.details')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Consent */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Consimțământ și declarație</h3>
          <p className="text-sm text-gray-700">
            Confirm că informațiile de mai sus sunt corecte și complete, conform cunoștințelor mele. Mă angajez să informez cabinetul dentar despre orice modificare a stării de sănătate sau a medicației. Îmi dau acordul ca medicul dentist să contacteze medicul de familie sau specialistul, dacă este necesar pentru un tratament în siguranță.
          </p>
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id="consent"
                {...register('consent')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="consent" className="font-medium text-gray-700">
                Accept termenii de mai sus
              </label>
              {errors.consent && (
                <p className="mt-1 text-sm text-red-600">{errors.consent.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Se salvează...' : buttonText}
          </button>
        </div>
      </form>
    </div>
  )
} 