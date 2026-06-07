'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { getDocumentStepSections } from '@/lib/intake/document-fields'
import { INTAKE_DOCUMENTS } from '@/lib/intake/documents'
import {
  isDocumentSectionComplete,
  validateDocumentStep,
} from '@/lib/intake/validate-document-step'
import SignaturePad from './SignaturePad'
import { appAlert } from '@/lib/app-alert'

type Props = {
  documentFields: Record<string, string | boolean>
  signatures: Record<string, string | null>
  signedOnPaper: Record<string, boolean>
  flow: 'digital' | 'manual'
  onFieldChange: (id: string, value: string | boolean) => void
  onSignatureChange: (documentId: string, dataUrl: string | null) => void
  onSignedOnPaperChange: (documentId: string, onPaper: boolean) => void
  onBack: () => void
  onSubmit: () => void | Promise<void>
  isSubmitting: boolean
  submitError?: string
}

export default function DocumentFieldsStep({
  documentFields,
  signatures,
  signedOnPaper,
  flow,
  onFieldChange,
  onSignatureChange,
  onSignedOnPaperChange,
  onBack,
  onSubmit,
  isSubmitting,
  submitError = '',
}: Props) {
  const sections = getDocumentStepSections()
  const [openSection, setOpenSection] = useState(sections[0]?.documentId || 'form2')
  const [validationError, setValidationError] = useState('')

  const showValidationError = (message: string, documentId: string) => {
    setValidationError(message)
    setOpenSection(documentId)
    appAlert(message, { title: 'Formular incomplet' })
  }

  const handleSubmit = async () => {
    setValidationError('')
    const result = validateDocumentStep({ documentFields, signatures, signedOnPaper })
    if (result.ok === false) {
      showValidationError(result.message, result.documentId)
      return
    }

    try {
      await onSubmit()
    } catch {
      /* Parent surfaces submit errors via submitError */
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Documente și consimțăminte</h2>
        <p className="text-sm text-gray-500">
          Deschideți fiecare document, bifați consimțămintele obligatorii și semnați digital sau
          marcați „Semnat pe hârtie” dacă pacientul a semnat pe documentul tipărit.
        </p>

        <div className="space-y-2">
          {sections.map((section) => {
            const isOpen = openSection === section.documentId
            const complete = isDocumentSectionComplete({
              documentId: section.documentId,
              documentFields,
              signatures,
              signedOnPaper,
            })
            return (
              <div key={section.documentId} className="border rounded-md overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-gray-50 hover:bg-gray-100"
                  onClick={() => setOpenSection(isOpen ? '' : section.documentId)}
                >
                  <span className="font-medium text-sm">{section.title}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        complete
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {complete ? 'Complet' : 'De completat'}
                    </span>
                    <span className="text-xs text-gray-500 hidden sm:inline max-w-[200px] truncate">
                      {INTAKE_DOCUMENTS[section.documentId]?.description}
                    </span>
                  </span>
                </button>
                {isOpen && (
                  <div className="p-4 space-y-4 border-t">
                    {section.fields.map((field) => (
                      <div key={field.id}>
                        {field.type === 'checkbox' ? (
                          <label className="flex items-start gap-2">
                            <Checkbox
                              checked={Boolean(documentFields[field.id])}
                              onCheckedChange={(v) => onFieldChange(field.id, Boolean(v))}
                            />
                            <span className="text-sm leading-snug">
                              {field.label}
                              {field.required && <span className="text-red-500"> *</span>}
                            </span>
                          </label>
                        ) : field.type === 'textarea' ? (
                          <div>
                            <Label>
                              {field.label}
                              {field.required && ' *'}
                            </Label>
                            <Textarea
                              value={String(documentFields[field.id] || '')}
                              onChange={(e) => onFieldChange(field.id, e.target.value)}
                              rows={3}
                            />
                          </div>
                        ) : (
                          <div>
                            <Label>
                              {field.label}
                              {field.required && ' *'}
                            </Label>
                            <Input
                              type={field.type === 'date' ? 'date' : 'text'}
                              value={String(documentFields[field.id] || '')}
                              onChange={(e) => onFieldChange(field.id, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="pt-2 border-t space-y-3">
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={Boolean(signedOnPaper[section.documentId])}
                          onCheckedChange={(v) => {
                            onSignedOnPaperChange(section.documentId, Boolean(v))
                            if (v) setValidationError('')
                          }}
                        />
                        Semnat pe hârtie (fără semnătură digitală)
                      </label>
                      {!signedOnPaper[section.documentId] && (
                        <div>
                          <Label className="mb-2 block">
                            Semnătură digitală{flow === 'digital' ? '' : ' (opțional dacă semnat pe hârtie)'}
                          </Label>
                          <SignaturePad
                            value={signatures[section.documentId] ?? null}
                            onChange={(url) => {
                              onSignatureChange(section.documentId, url)
                              if (url) setValidationError('')
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {(validationError || submitError) && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700" role="alert">
            {validationError || submitError}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" type="button" onClick={onBack} disabled={isSubmitting}>
            Înapoi
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Se creează pacientul...' : 'Finalizează înregistrarea'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
