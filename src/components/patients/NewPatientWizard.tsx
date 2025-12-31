'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import PatientForm from './PatientForm'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'

type Step = 'basic' | 'health' | 'dental'

export default function NewPatientWizard() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState<Step>('basic')
  const [formData, setFormData] = useState<any>({})

  // Health Assessment Form Data
  const [healthFormData, setHealthFormData] = useState({
    // Cardiovascular Health
    chestPain: false,
    chestPainReducedActivity: false,
    chestPainWorsening: false,
    chestPainAtRest: false,
    heartAttack: false,
    heartAttackStillSymptoms: false,
    heartAttackLast6Months: false,
    heartMurmur: false,
    heartMurmurDetails: '',
    vascularSurgery6Months: false,
    pacemakerICD: false,
    heartPalpitations: false,
    heartPalpitationsNeedRest: false,
    heartPalpitationsPaleDizzy: false,
    heartFailure: false,
    heartFailureExtraPillows: false,
    heartFailureNightBreathing: false,
    heartFailureNightUrination: false,
    heartFailureSwollenFeet: false,
    acuteRheumatism: false,
    bloodPressure: false,
    bloodPressureValue: '',
    bleedingTendency: false,
    bleedingLongerThan1Hour: false,
    bleedingBruises: false,
    bloodThinners: false,
    bloodThinnersDetails: '',
    lungProblems: false,
    lungProblemsStairs: false,
    lungProblemsDressing: false,
    lungProblemsHyperventilation: false,
    prosthesisLast3Months: false,

    // Specific Conditions
    epilepsy: false,
    cancerLeukemia: false,
    diabetes: false,
    hivAids: false,
    thyroidProblems: false,
    asthma: false,
    kidneyDisease: false,
    liverDisease: false,
    hepatitisA: false,
    hepatitisB: false,
    hepatitisC: false,
    hepatitisD: false,
    otherConditions: '',

    // Lifestyle Questions
    smoking: false,
    smokingAmount: '',
    drinking: false,
    drinkingAmount: '',

    // Pregnancy Questions (for females)
    pregnancy: false,
    pregnancyWeeks: '',
    pregnancyComplications: '',

    // Current Medications
    currentMedications: '',
    allergies: '',

    // Notes
    notes: ''
  })

  const createPatient = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create patient')
      }

      return response.json()
    },
    onSuccess: (data) => {
      router.push(`/dashboard/patients/${data.id}`)
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  const handleStepSubmit = (stepData: any) => {
    if (currentStep === 'basic') {
      setFormData(prev => ({ ...prev, ...stepData }))
      setCurrentStep('health')
    } else if (currentStep === 'health') {
      setFormData(prev => ({ ...prev, medicalHistory: healthFormData }))
      setCurrentStep('dental')
    } else if (currentStep === 'dental') {
      // Submit all data with dental history
      const finalData = {
        ...formData,
        dentalHistory: stepData
      }
      createPatient.mutate(finalData)
    }
  }

  const updateHealthFormData = (updates: Partial<typeof healthFormData>) => {
    setHealthFormData(prev => ({ ...prev, ...updates }))
  }

  const generateMedicalSummary = (formData: typeof healthFormData) => {
    const medicalSummary = []

    // Cardiovascular Health
    if (formData.chestPain) {
      medicalSummary.push("Chest pain during exertion")
      if (formData.chestPainReducedActivity) medicalSummary.push("- Reduced activities due to chest pain")
      if (formData.chestPainWorsening) medicalSummary.push("- Symptoms worsening recently")
      if (formData.chestPainAtRest) medicalSummary.push("- Symptoms also at rest")
    }

    if (formData.heartAttack) {
      medicalSummary.push("Previous heart attack")
      if (formData.heartAttackStillSymptoms) medicalSummary.push("- Still experiencing symptoms")
      if (formData.heartAttackLast6Months) medicalSummary.push("- Heart attack in last 6 months")
    }

    if (formData.heartMurmur) {
      medicalSummary.push(`Heart murmur/valve defect: ${formData.heartMurmurDetails || 'Yes'}`)
    }

    if (formData.vascularSurgery6Months) {
      medicalSummary.push("Vascular surgery in last 6 months")
    }

    if (formData.pacemakerICD) {
      medicalSummary.push("Pacemaker/ICD/stent")
    }

    if (formData.heartPalpitations) {
      medicalSummary.push("Heart palpitations without exertion")
      if (formData.heartPalpitationsNeedRest) medicalSummary.push("- Need to rest during episodes")
      if (formData.heartPalpitationsPaleDizzy) medicalSummary.push("- Become pale/dizzy during episodes")
    }

    if (formData.heartFailure) {
      medicalSummary.push("Heart failure")
      if (formData.heartFailureExtraPillows) medicalSummary.push("- Need extra pillows for breathing")
      if (formData.heartFailureNightBreathing) medicalSummary.push("- Wake up short of breath at night")
      if (formData.heartFailureNightUrination) medicalSummary.push("- Frequent night urination")
      if (formData.heartFailureSwollenFeet) medicalSummary.push("- Swollen feet in evening")
    }

    if (formData.acuteRheumatism) {
      medicalSummary.push("Previous acute rheumatism")
    }

    if (formData.bloodPressure) {
      medicalSummary.push(`Blood pressure: ${formData.bloodPressureValue || 'High/Low'}`)
    }

    // Bleeding Tendency
    if (formData.bleedingTendency) {
      medicalSummary.push("Bleeding tendency")
      if (formData.bleedingLongerThan1Hour) medicalSummary.push("- Bleed longer than 1 hour after procedures")
      if (formData.bleedingBruises) medicalSummary.push("- Unexplained bruising")
      if (formData.bloodThinners) {
        medicalSummary.push(`Blood thinners: ${formData.bloodThinnersDetails || 'Yes'}`)
      }
    }

    // Respiratory Health
    if (formData.lungProblems) {
      medicalSummary.push("Lung problems/persistent cough")
      if (formData.lungProblemsStairs) medicalSummary.push("- Short of breath climbing stairs")
      if (formData.lungProblemsDressing) medicalSummary.push("- Short of breath when dressing")
      if (formData.lungProblemsHyperventilation) medicalSummary.push("- Hyperventilation/fainting episodes")
    }

    if (formData.prosthesisLast3Months) {
      medicalSummary.push("Prosthesis in last 3 months")
    }

    // Specific Conditions
    const conditions = []
    if (formData.epilepsy) conditions.push("Epilepsy")
    if (formData.cancerLeukemia) conditions.push("Cancer/Leukemia")
    if (formData.diabetes) conditions.push("Diabetes")
    if (formData.hivAids) conditions.push("HIV/AIDS")
    if (formData.thyroidProblems) conditions.push("Thyroid problems")
    if (formData.asthma) conditions.push("Asthma")
    if (formData.kidneyDisease) conditions.push("Kidney disease")
    if (formData.liverDisease) conditions.push("Liver disease")
    if (formData.hepatitisA) conditions.push("Hepatitis A")
    if (formData.hepatitisB) conditions.push("Hepatitis B")
    if (formData.hepatitisC) conditions.push("Hepatitis C")
    if (formData.hepatitisD) conditions.push("Hepatitis D")

    if (conditions.length > 0) {
      medicalSummary.push(`Medical conditions: ${conditions.join(', ')}`)
    }

    if (formData.otherConditions) {
      medicalSummary.push(`Other conditions: ${formData.otherConditions}`)
    }

    // Medications and Allergies
    if (formData.currentMedications) {
      medicalSummary.push(`Current medications: ${formData.currentMedications}`)
    }

    if (formData.allergies) {
      medicalSummary.push(`Allergies: ${formData.allergies}`)
    }

    // Lifestyle Questions
    if (formData.smoking) {
      medicalSummary.push(`Smoking: ${formData.smokingAmount || 'Yes'}`)
    }

    if (formData.drinking) {
      medicalSummary.push(`Alcohol consumption: ${formData.drinkingAmount || 'Yes'}`)
    }

    // Pregnancy Questions
    if (formData.pregnancy) {
      medicalSummary.push(`Pregnant: ${formData.pregnancyWeeks ? `${formData.pregnancyWeeks} weeks` : 'Yes'}`)
      if (formData.pregnancyComplications) {
        medicalSummary.push(`Pregnancy complications: ${formData.pregnancyComplications}`)
      }
    }

    return medicalSummary.join('\n')
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <PatientForm
            onSubmit={handleStepSubmit}
            isSubmitting={createPatient.isPending}
            buttonText="Next"
          />
        )
      case 'health':
        return (
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Health Assessment</h2>
                <p className="text-sm text-gray-600 mb-6">Please complete the medical questionnaire</p>
              </div>

              {/* Cardiovascular Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-blue-700">Cardiovascular Health</h4>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="chestPain"
                      checked={healthFormData.chestPain}
                      onChange={(e) => updateHealthFormData({ chestPain: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="chestPain">Do you have chest pain/tightness during exertion?</Label>
                  </div>
                  {healthFormData.chestPain && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="chestPainReducedActivity"
                          checked={healthFormData.chestPainReducedActivity}
                          onChange={(e) => updateHealthFormData({ chestPainReducedActivity: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="chestPainReducedActivity">Have you had to reduce your activities?</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="chestPainWorsening"
                          checked={healthFormData.chestPainWorsening}
                          onChange={(e) => updateHealthFormData({ chestPainWorsening: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="chestPainWorsening">Are your symptoms worsening recently?</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="chestPainAtRest"
                          checked={healthFormData.chestPainAtRest}
                          onChange={(e) => updateHealthFormData({ chestPainAtRest: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="chestPainAtRest">Do you also have symptoms at rest?</Label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="heartAttack"
                      checked={healthFormData.heartAttack}
                      onChange={(e) => updateHealthFormData({ heartAttack: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="heartAttack">Have you had a heart attack?</Label>
                  </div>
                  {healthFormData.heartAttack && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="heartAttackStillSymptoms"
                          checked={healthFormData.heartAttackStillSymptoms}
                          onChange={(e) => updateHealthFormData({ heartAttackStillSymptoms: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="heartAttackStillSymptoms">Do you still experience symptoms?</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="heartAttackLast6Months"
                          checked={healthFormData.heartAttackLast6Months}
                          onChange={(e) => updateHealthFormData({ heartAttackLast6Months: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="heartAttackLast6Months">Have you had a heart attack in the last 6 months?</Label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="heartMurmur"
                      checked={healthFormData.heartMurmur}
                      onChange={(e) => updateHealthFormData({ heartMurmur: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="heartMurmur">Do you have a heart murmur, heart valve defect, or artificial heart valve?</Label>
                  </div>
                  {healthFormData.heartMurmur && (
                    <div className="ml-6">
                      <Label htmlFor="heartMurmurDetails">If yes, which one:</Label>
                      <Input
                        id="heartMurmurDetails"
                        value={healthFormData.heartMurmurDetails}
                        onChange={(e) => updateHealthFormData({ heartMurmurDetails: e.target.value })}
                        placeholder="Details"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="pacemakerICD"
                      checked={healthFormData.pacemakerICD}
                      onChange={(e) => updateHealthFormData({ pacemakerICD: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="pacemakerICD">Do you have a pacemaker/ICD/stent?</Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bloodPressure"
                      checked={healthFormData.bloodPressure}
                      onChange={(e) => updateHealthFormData({ bloodPressure: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="bloodPressure">Do you have low/high blood pressure?</Label>
                  </div>
                  {healthFormData.bloodPressure && (
                    <div className="ml-6">
                      <Label htmlFor="bloodPressureValue">Your blood pressure is:</Label>
                      <Input
                        id="bloodPressureValue"
                        value={healthFormData.bloodPressureValue}
                        onChange={(e) => updateHealthFormData({ bloodPressureValue: e.target.value })}
                        placeholder="e.g., 120/80"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Bleeding Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-blue-700">Bleeding Tendency</h4>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="bleedingTendency"
                      checked={healthFormData.bleedingTendency}
                      onChange={(e) => updateHealthFormData({ bleedingTendency: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="bleedingTendency">Do you have a tendency to bleed?</Label>
                  </div>
                  {healthFormData.bleedingTendency && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="bleedingLongerThan1Hour"
                          checked={healthFormData.bleedingLongerThan1Hour}
                          onChange={(e) => updateHealthFormData({ bleedingLongerThan1Hour: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="bleedingLongerThan1Hour">Do you bleed longer than 1 hour after injury or procedures?</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="bleedingBruises"
                          checked={healthFormData.bleedingBruises}
                          onChange={(e) => updateHealthFormData({ bleedingBruises: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="bleedingBruises">Do you get bruises without any cause?</Label>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="bloodThinners"
                            checked={healthFormData.bloodThinners}
                            onChange={(e) => updateHealthFormData({ bloodThinners: e.target.checked })}
                            className="rounded"
                          />
                          <Label htmlFor="bloodThinners">Do you take blood thinners?</Label>
                        </div>
                        {healthFormData.bloodThinners && (
                          <div className="ml-6">
                            <Label htmlFor="bloodThinnersDetails">If yes, which ones:</Label>
                            <Input
                              id="bloodThinnersDetails"
                              value={healthFormData.bloodThinnersDetails}
                              onChange={(e) => updateHealthFormData({ bloodThinnersDetails: e.target.value })}
                              placeholder="e.g., Warfarin, Aspirin, etc."
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Specific Conditions */}
              <div className="space-y-4">
                <h4 className="font-medium text-blue-700">Specific Conditions</h4>
                <p className="text-sm text-gray-600">Do you suffer from any of the following conditions:</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="epilepsy"
                      checked={healthFormData.epilepsy}
                      onChange={(e) => updateHealthFormData({ epilepsy: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="epilepsy">Epilepsy</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="diabetes"
                      checked={healthFormData.diabetes}
                      onChange={(e) => updateHealthFormData({ diabetes: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="diabetes">Diabetes</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="asthma"
                      checked={healthFormData.asthma}
                      onChange={(e) => updateHealthFormData({ asthma: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="asthma">Asthma</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="cancerLeukemia"
                      checked={healthFormData.cancerLeukemia}
                      onChange={(e) => updateHealthFormData({ cancerLeukemia: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="cancerLeukemia">Cancer/Leukemia</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="otherConditions">Other conditions:</Label>
                  <Textarea
                    id="otherConditions"
                    value={healthFormData.otherConditions}
                    onChange={(e) => updateHealthFormData({ otherConditions: e.target.value })}
                    placeholder="Please specify any other medical conditions"
                    rows={2}
                  />
                </div>
              </div>

              {/* Medications and Allergies */}
              <div className="space-y-4">
                <h4 className="font-medium text-blue-700">Current Medications & Allergies</h4>

                <div>
                  <Label htmlFor="currentMedications">Current Medications</Label>
                  <Textarea
                    id="currentMedications"
                    value={healthFormData.currentMedications}
                    onChange={(e) => updateHealthFormData({ currentMedications: e.target.value })}
                    placeholder="List all current medications with dosages"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={healthFormData.allergies}
                    onChange={(e) => updateHealthFormData({ allergies: e.target.value })}
                    placeholder="Drug allergies, food allergies, latex, etc."
                    rows={2}
                  />
                </div>
              </div>

              {/* Lifestyle Questions */}
              <div className="space-y-4">
                <h4 className="font-medium text-blue-700">Lifestyle Questions</h4>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="smoking"
                      checked={healthFormData.smoking}
                      onChange={(e) => updateHealthFormData({ smoking: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="smoking">Do you smoke?</Label>
                  </div>
                  {healthFormData.smoking && (
                    <div className="ml-6">
                      <Label htmlFor="smokingAmount">Amount:</Label>
                      <Input
                        id="smokingAmount"
                        value={healthFormData.smokingAmount}
                        onChange={(e) => updateHealthFormData({ smokingAmount: e.target.value })}
                        placeholder="e.g., 1 pack/day"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="drinking"
                      checked={healthFormData.drinking}
                      onChange={(e) => updateHealthFormData({ drinking: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="drinking">Do you drink alcohol?</Label>
                  </div>
                  {healthFormData.drinking && (
                    <div className="ml-6">
                      <Label htmlFor="drinkingAmount">Amount:</Label>
                      <Input
                        id="drinkingAmount"
                        value={healthFormData.drinkingAmount}
                        onChange={(e) => updateHealthFormData({ drinkingAmount: e.target.value })}
                        placeholder="e.g., 1 drink/day"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('basic')}
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    // Generate medical summary and update form data
                    const medicalSummary = generateMedicalSummary(healthFormData)
                    updateHealthFormData({ notes: medicalSummary })
                    handleStepSubmit(healthFormData)
                  }}
                  disabled={createPatient.isPending}
                >
                  {createPatient.isPending ? 'Saving...' : 'Next'}
                </Button>
              </div>
            </div>
          </Card>
        )
      case 'dental':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-4">Dental History</h2>
              <p className="text-sm text-gray-600 mb-6">Please provide dental history information</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="previousWork">Previous Dental Work</Label>
                <Textarea
                  id="previousWork"
                  placeholder="Describe any previous dental work, procedures, or treatments"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="currentIssues">Current Dental Issues</Label>
                <Textarea
                  id="currentIssues"
                  placeholder="Describe any current dental problems or concerns"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="oralHygiene">Oral Hygiene Habits</Label>
                <Textarea
                  id="oralHygiene"
                  placeholder="Describe daily oral hygiene routine, brushing frequency, flossing, etc."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('health')}
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  const dentalData = {
                    previousWork: (document.getElementById('previousWork') as HTMLTextAreaElement)?.value || '',
                    currentIssues: (document.getElementById('currentIssues') as HTMLTextAreaElement)?.value || '',
                    oralHygiene: (document.getElementById('oralHygiene') as HTMLTextAreaElement)?.value || ''
                  }
                  handleStepSubmit(dentalData)
                }}
                disabled={createPatient.isPending}
              >
                {createPatient.isPending ? 'Creating Patient...' : 'Create Patient'}
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">New Patient</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new patient to your practice
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'basic' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            1
          </div>
          <div className="ml-2 text-sm font-medium">Basic Information</div>
        </div>
        <div className="flex-1 h-0.5 mx-4 bg-gray-200"></div>
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'health' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            2
          </div>
          <div className="ml-2 text-sm font-medium">Health Assessment</div>
        </div>
        <div className="flex-1 h-0.5 mx-4 bg-gray-200"></div>
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'dental' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            3
          </div>
          <div className="ml-2 text-sm font-medium">Dental History</div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {renderStep()}
    </div>
  )
} 