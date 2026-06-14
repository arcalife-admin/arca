'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { HealthFormData } from '@/lib/intake/health-defaults'
import { HEALTH_SECTIONS } from '@/lib/intake/field-registry'
import type { Form1YesNoKey, YesNoValue } from '@/lib/intake/form1-questionnaire'
import { ALL_FORM1_YES_NO_QUESTIONS } from '@/lib/intake/form1-questionnaire'
import { appAlert } from '@/lib/app-alert'

type Props = {
  healthFormData: HealthFormData
  onChange: (updates: Partial<HealthFormData>) => void
  onBack: () => void
  onNext: () => void
}

function YesNoGroup({
  questionKey,
  label,
  value,
  hasNotApplicable,
  onChange,
}: {
  questionKey: Form1YesNoKey
  label: string
  value: YesNoValue
  hasNotApplicable?: boolean
  onChange: (updates: Partial<HealthFormData>) => void
}) {
  const setAnswer = (answer: YesNoValue) => {
    onChange({ [questionKey]: value === answer ? '' : answer })
  }

  return (
    <div className="space-y-2 py-2 border-b border-gray-100 last:border-0">
      <p className="text-sm leading-snug">{label}</p>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name={questionKey}
            checked={value === 'yes'}
            onChange={() => setAnswer('yes')}
            className="rounded-full"
          />
          Da
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name={questionKey}
            checked={value === 'no'}
            onChange={() => setAnswer('no')}
            className="rounded-full"
          />
          Nu
        </label>
        {hasNotApplicable && (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name={questionKey}
              checked={value === 'na'}
              onChange={() => setAnswer('na')}
              className="rounded-full"
            />
            Nu este cazul
          </label>
        )}
      </div>
    </div>
  )
}

export default function HealthAssessmentStep({ healthFormData, onChange, onBack, onNext }: Props) {
  const unanswered = HEALTH_SECTIONS.flatMap((s) => s.questions).filter((q) => !healthFormData[q.key])

  const handleNext = () => {
    if (unanswered.length > 0) {
      appAlert('Completați toate întrebările înainte de a continua.', { title: 'Formular incomplet' })
      return
    }
    onNext()
  }

  const selectAllNo = () => {
    const updates = Object.fromEntries(
      ALL_FORM1_YES_NO_QUESTIONS.map((q) => [q.key, 'no' as const])
    ) as Partial<HealthFormData>
    onChange(updates)
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Chestionar medical inițial</h2>
          <Button variant="outline" type="button" size="sm" onClick={selectAllNo}>
            Selectează «Nu» la toate
          </Button>
        </div>

        {HEALTH_SECTIONS.map((section) => (
          <div key={section.id} className="space-y-4">
            {section.title && (
              <h4 className="font-medium text-blue-700">{section.title}</h4>
            )}
            {section.description && (
              <p className="text-sm text-gray-600">{section.description}</p>
            )}

            {(section.textFields || []).map((field) => {
              if (field.showWhen && healthFormData[field.showWhen.questionKey] !== field.showWhen.answer) {
                return null
              }
              const value = healthFormData[field.key]
              return (
                <div key={field.key}>
                  <Label htmlFor={field.key}>{field.label}</Label>
                  {field.multiline ? (
                    <Textarea
                      id={field.key}
                      value={value}
                      onChange={(e) => onChange({ [field.key]: e.target.value })}
                      rows={3}
                    />
                  ) : (
                    <Input
                      id={field.key}
                      value={value}
                      onChange={(e) => onChange({ [field.key]: e.target.value })}
                    />
                  )}
                </div>
              )
            })}

            <div className="space-y-0">
              {section.questions.map((q) => (
                <YesNoGroup
                  key={q.key}
                  questionKey={q.key}
                  label={q.label}
                  value={healthFormData[q.key]}
                  hasNotApplicable={Boolean(q.pdfNa)}
                  onChange={onChange}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-between pt-6">
          <Button variant="outline" type="button" onClick={onBack}>
            Înapoi
          </Button>
          <Button type="button" onClick={handleNext}>
            Următorul
          </Button>
        </div>
      </div>
    </Card>
  )
}
