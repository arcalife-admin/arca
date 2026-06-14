'use client'

type StepId = 'basic' | 'health' | 'documents'

const STEPS: { id: StepId; label: string; number: number }[] = [
  { id: 'basic', label: 'Date de bază', number: 1 },
  { id: 'health', label: 'Chestionar medical', number: 2 },
  { id: 'documents', label: 'Documente și consimțăminte', number: 3 },
]

export default function IntakeStepper({ currentStep }: { currentStep: StepId }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1 min-w-0">
          <div className="flex items-center shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step.id ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step.number}
            </div>
            <div className="ml-2 text-sm font-medium hidden sm:block">{step.label}</div>
          </div>
          {index < STEPS.length - 1 && <div className="flex-1 h-0.5 mx-2 sm:mx-4 bg-gray-200 min-w-[12px]" />}
        </div>
      ))}
    </div>
  )
}

export type { StepId }
