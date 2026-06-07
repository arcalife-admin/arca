'use client'

import React, { useEffect, useState, useCallback } from 'react'
import EmbeddedLink from '@/components/layout/EmbeddedLink'
import { openEmbeddedPatient, useIsEmbedded } from '@/hooks/useIsEmbedded'
import { useRouter, useSearchParams } from 'next/navigation'
import PatientForm from '@/components/patients/PatientForm'
import IntakeStepper, { type StepId } from './IntakeStepper'
import HealthAssessmentStep from './HealthAssessmentStep'
import DocumentFieldsStep from './DocumentFieldsStep'
import {
  loadIntakeDraft,
  saveIntakeDraft,
  patchIntakeDraft,
  clearIntakeDraft,
  type IntakeFlowType,
} from '@/lib/intake/draft'
import { createDefaultHealthFormData } from '@/lib/intake/health-defaults'
import {
  createDefaultDocumentFieldValues,
  prefillDocumentFieldsFromBasic,
} from '@/lib/intake/document-fields'
import { validateIntakeBasic } from '@/lib/intake/validate-basic'
import type { ScanDraftFile } from './ScanPreviewPanel'

type Props = {
  flow: IntakeFlowType
  scans?: ScanDraftFile[]
  compact?: boolean
}

export default function DigitalPatientIntakeWizard({ flow, scans = [], compact }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEmbedded = useIsEmbedded()
  const tabletMode = searchParams.get('mode') === 'tablet'

  const [draftHydrated, setDraftHydrated] = useState(false)
  const [currentStep, setCurrentStep] = useState<StepId>('basic')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [basic, setBasic] = useState<Record<string, unknown>>({})
  const [health, setHealth] = useState(createDefaultHealthFormData())
  const [documentFields, setDocumentFields] = useState(createDefaultDocumentFieldValues())
  const [signatures, setSignatures] = useState<Record<string, string | null>>({})
  const [signedOnPaper, setSignedOnPaper] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const draft = loadIntakeDraft(flow)
    if (draft) {
      setBasic(draft.basic)
      setHealth(draft.health)
      setDocumentFields(draft.documentFields)
      setSignatures(draft.signatures)
      setSignedOnPaper(draft.signedOnPaper)
    }
    setDraftHydrated(true)
  }, [flow])

  const persistDraft = useCallback(() => {
    saveIntakeDraft({
      flow,
      basic,
      health,
      documentFields,
      signatures,
      signedOnPaper,
      updatedAt: new Date().toISOString(),
    })
  }, [flow, basic, health, documentFields, signatures, signedOnPaper])

  useEffect(() => {
    if (!draftHydrated) return
    persistDraft()
  }, [draftHydrated, persistDraft])

  const handleBasicValuesChange = useCallback(
    (data: Record<string, unknown>) => {
      setBasic(data)
      patchIntakeDraft(flow, { basic: data })
    },
    [flow]
  )

  const handleBasicSubmit = (data: Record<string, unknown>) => {
    setBasic(data)
    setDocumentFields((prev) => prefillDocumentFieldsFromBasic(data, prev))
    setCurrentStep('health')
  }

  const finalizeIntake = async () => {
    const basicError = validateIntakeBasic(basic)
    if (basicError) {
      setError(basicError)
      throw new Error(basicError)
    }

    setIsSubmitting(true)
    setError('')
    try {
      const formData = new FormData()
      formData.set('basic', JSON.stringify(basic))
      formData.set(
        'payload',
        JSON.stringify({
          flow,
          tabletMode,
          health,
          documentFields,
          signatures,
          signedOnPaper,
        })
      )
      scans.forEach((scan, i) => {
        formData.set(`scan_${i}`, scan.file)
      })

      const response = await fetch('/api/patients/intake/complete', {
        method: 'POST',
        body: formData,
      })

      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        const zodDetail =
          Array.isArray(body.errors) && body.errors.length > 0
            ? body.errors
                .map((e: { path?: (string | number)[]; message?: string }) =>
                  [e.path?.join('.'), e.message].filter(Boolean).join(': ')
                )
                .join('; ')
            : ''
        const message =
          body.message ||
          body.error ||
          zodDetail ||
          `Nu s-a putut finaliza înregistrarea (${response.status})`
        throw new Error(message)
      }

      const result = body as { id?: string }
      if (!result.id) {
        throw new Error('Serverul nu a returnat un ID de pacient')
      }

      clearIntakeDraft()
      if (isEmbedded) {
        openEmbeddedPatient(result.id)
      } else {
        router.push(`/dashboard/patients/${result.id}`)
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'A apărut o eroare'
      setError(message)
      throw e
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={compact ? 'space-y-4' : 'max-w-4xl mx-auto space-y-6 pt-4'}>
      {!compact && (
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {flow === 'manual' ? 'Introducere date din formulare pe hârtie' : 'Pacient nou — Înregistrare digitală'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {flow === 'manual'
              ? 'Transcrieți formularele completate pe hârtie. Fișa pacientului se creează după finalizarea tuturor pașilor.'
              : 'Tabletă de clinică sau introducere de către recepționist. Fișa pacientului se creează după finalizarea tuturor pașilor.'}
          </p>
          {tabletMode ? (
            <p className="mt-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-md">
              Mod tabletă — predați dispozitivul pacientului pentru pașii pe care îi poate completa singur.{' '}
              <EmbeddedLink
                href="/dashboard/patients/new/digital"
                className="font-medium underline hover:text-blue-900"
              >
                Înapoi la vizualizarea normală
              </EmbeddedLink>
            </p>
          ) : (
            flow === 'digital' && (
              <p className="mt-2 text-sm">
                <EmbeddedLink
                  href="/dashboard/patients/new/digital?mode=tablet"
                  className="text-blue-600 hover:underline"
                >
                  Deschide vizualizarea pentru tabletă
                </EmbeddedLink>
              </p>
            )
          )}
        </div>
      )}

      <IntakeStepper currentStep={currentStep} />

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {currentStep === 'basic' && draftHydrated && (
        <PatientForm
          initialData={basic}
          onValuesChange={(data) => handleBasicValuesChange(data as Record<string, unknown>)}
          onSubmit={handleBasicSubmit}
          buttonText="Următorul"
        />
      )}

      {currentStep === 'health' && (
        <HealthAssessmentStep
          healthFormData={health}
          onChange={(updates) => setHealth((prev) => ({ ...prev, ...updates }))}
          onBack={() => setCurrentStep('basic')}
          onNext={() => setCurrentStep('documents')}
        />
      )}

      {currentStep === 'documents' && (
        <DocumentFieldsStep
          documentFields={documentFields}
          signatures={signatures}
          signedOnPaper={signedOnPaper}
          flow={flow}
          onFieldChange={(id, value) =>
            setDocumentFields((prev) => ({ ...prev, [id]: value }))
          }
          onSignatureChange={(documentId, dataUrl) =>
            setSignatures((prev) => ({ ...prev, [documentId]: dataUrl }))
          }
          onSignedOnPaperChange={(documentId, onPaper) =>
            setSignedOnPaper((prev) => ({ ...prev, [documentId]: onPaper }))
          }
          onBack={() => setCurrentStep('health')}
          onSubmit={finalizeIntake}
          isSubmitting={isSubmitting}
          submitError={error}
        />
      )}
    </div>
  )
}
