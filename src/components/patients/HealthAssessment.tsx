import React, { useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'

interface HealthAssessmentProps {
  patientId: string
  initialData: {
    asaHistory: Array<{
      id: string
      score: number
      notes: string
      date: string
      createdBy: string
    }>
    ppsHistory: Array<{
      id: string
      quadrant1: number
      quadrant2: number
      quadrant3: number
      quadrant4: number
      treatment: 'NONE' | 'PREVENTIVE' | 'PERIODONTAL'
      notes: string
      date: string
      createdBy: string
    }>
    recallHistory: Array<{
      id: string
      screeningMonths: number
      cleaningMonths: number
      notes: string
      date: string
      createdBy: string
    }>
  }
  onSave: (type: 'asa' | 'pps' | 'recall', data: any) => Promise<void>
}

const ASA_DESCRIPTIONS = {
  1: 'A normal healthy patient',
  2: 'A patient with mild systemic disease',
  3: 'A patient with severe systemic disease',
  4: 'A patient with severe systemic disease that is a constant threat to life'
}

export default function HealthAssessment({
  patientId,
  initialData,
  onSave,
}: HealthAssessmentProps) {
  // ASA State
  const [asaScore, setAsaScore] = useState(1)
  const [asaNotes, setAsaNotes] = useState('')
  const [showAsaHistory, setShowAsaHistory] = useState(false)

  // PPS State
  const [ppsScores, setPpsScores] = useState({
    quadrant1: 1,
    quadrant2: 1,
    quadrant3: 1,
    quadrant4: 1,
  })
  const [ppsTreatment, setPpsTreatment] = useState<'NONE' | 'PREVENTIVE' | 'PERIODONTAL'>('NONE')
  const [ppsNotes, setPpsNotes] = useState('')
  const [showPpsHistory, setShowPpsHistory] = useState(false)

  // Recall State
  const [recallTerms, setRecallTerms] = useState({
    screeningMonths: 6,
    cleaningMonths: 6,
  })
  const [recallNotes, setRecallNotes] = useState('')
  const [showRecallHistory, setShowRecallHistory] = useState(false)

  const handleAsaSave = async () => {
    await onSave('asa', {
      score: asaScore,
      notes: asaNotes,
    })
    setAsaNotes('')
  }

  const handlePpsSave = async () => {
    await onSave('pps', {
      ...ppsScores,
      treatment: ppsTreatment,
      notes: ppsNotes,
    })
    setPpsNotes('')
  }

  const handleRecallSave = async () => {
    await onSave('recall', {
      ...recallTerms,
      notes: recallNotes,
    })
    setRecallNotes('')
  }

  return (
    <div className="space-y-6">
      {/* ASA Score Section */}
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium">ASA Physical Status</h3>
            <p className="text-sm text-gray-500">{ASA_DESCRIPTIONS[asaScore]}</p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={showAsaHistory} onOpenChange={setShowAsaHistory}>
              <DialogTrigger asChild>
                <Button variant="outline">History</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ASA Score History</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {initialData.asaHistory.map((record) => (
                    <Card key={record.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">ASA {record.score}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(record.date).toLocaleDateString()}
                          </p>
                        </div>
                        {record.notes && (
                          <p className="text-sm text-gray-600">{record.notes}</p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Score</Label>
            <Select value={asaScore.toString()} onValueChange={(v) => setAsaScore(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ASA_DESCRIPTIONS).map(([score, description]) => (
                  <SelectItem key={score} value={score}>
                    ASA {score} - {description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={asaNotes} onChange={(e) => setAsaNotes(e.target.value)} />
          </div>
          <Button onClick={handleAsaSave}>Save ASA Score</Button>
        </div>
      </Card>

      {/* PPS Scores Section */}
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium">PPS Scores</h3>
          <div className="flex space-x-2">
            <Dialog open={showPpsHistory} onOpenChange={setShowPpsHistory}>
              <DialogTrigger asChild>
                <Button variant="outline">History</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>PPS History</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {initialData.ppsHistory.map((record) => (
                    <Card key={record.id} className="p-4">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <p>Q1: {record.quadrant1}</p>
                          <p>Q2: {record.quadrant2}</p>
                          <p>Q3: {record.quadrant3}</p>
                          <p>Q4: {record.quadrant4}</p>
                        </div>
                        <p className="text-sm">Treatment: {record.treatment}</p>
                        {record.notes && (
                          <p className="text-sm text-gray-600">{record.notes}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(ppsScores).map(([quadrant, score]) => (
              <div key={quadrant}>
                <Label>Quadrant {quadrant.slice(-1)}</Label>
                <Select
                  value={score.toString()}
                  onValueChange={(v) =>
                    setPpsScores((prev) => ({
                      ...prev,
                      [quadrant]: parseInt(v),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Healthy</SelectItem>
                    <SelectItem value="2">2 - Mild</SelectItem>
                    <SelectItem value="3">3 - Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div>
            <Label>Treatment</Label>
            <Select value={ppsTreatment} onValueChange={(v: any) => setPpsTreatment(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">No Treatment</SelectItem>
                <SelectItem value="PREVENTIVE">Preventive Treatment</SelectItem>
                <SelectItem value="PERIODONTAL">Periodontal Treatment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={ppsNotes} onChange={(e) => setPpsNotes(e.target.value)} />
          </div>
          <Button onClick={handlePpsSave}>Save PPS Scores</Button>
        </div>
      </Card>

      {/* Recall Terms Section */}
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium">Recall Terms</h3>
          <div className="flex space-x-2">
            <Dialog open={showRecallHistory} onOpenChange={setShowRecallHistory}>
              <DialogTrigger asChild>
                <Button variant="outline">History</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Recall Terms History</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {initialData.recallHistory.map((record) => (
                    <Card key={record.id} className="p-4">
                      <div className="space-y-2">
                        <p>Screening: {record.screeningMonths} months</p>
                        <p>Cleaning: {record.cleaningMonths} months</p>
                        {record.notes && (
                          <p className="text-sm text-gray-600">{record.notes}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Screening Recall (months)</Label>
              <Input
                type="number"
                min={1}
                max={24}
                value={recallTerms.screeningMonths}
                onChange={(e) =>
                  setRecallTerms((prev) => ({
                    ...prev,
                    screeningMonths: parseInt(e.target.value) || 6,
                  }))
                }
              />
            </div>
            <div>
              <Label>Cleaning Recall (months)</Label>
              <Input
                type="number"
                min={1}
                max={24}
                value={recallTerms.cleaningMonths}
                onChange={(e) =>
                  setRecallTerms((prev) => ({
                    ...prev,
                    cleaningMonths: parseInt(e.target.value) || 6,
                  }))
                }
              />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={recallNotes} onChange={(e) => setRecallNotes(e.target.value)} />
          </div>
          <Button onClick={handleRecallSave}>Save Recall Terms</Button>
        </div>
      </Card>
    </div>
  )
} 