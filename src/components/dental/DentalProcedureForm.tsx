'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logActivityClient, LOG_ACTIONS, ENTITY_TYPES, LOG_SEVERITY } from '@/lib/activity-logger';

interface DentalCode {
  id: string;
  code: string;
  description: string;
  basePrice: number;
  technicalCosts?: number;
  isTimeDependent: boolean;
  timeUnit?: number;
  requiresTooth: boolean;
  requiresJaw: boolean;
  requiresSurface: boolean;
  maxSurfaces?: number;
  isPerElement: boolean;
  isFirstElement: boolean;
  followUpCode?: string;
  category: string;
  allowedCombinations?: any;
  forbiddenCombinations?: any;
  requirements?: any;
}

interface DentalProcedure {
  id: string;
  codeId: string;
  toothNumber?: number | null;
  jaw?: string | null;
  surface?: string | null;
  timeSpent?: number | null;
  surfaces?: number | null;
  notes?: string;
  cost?: number;
  code?: DentalCode;
  // Any other fields we might need
}

interface DentalProcedureFormProps {
  patientId: string;
  procedure?: DentalProcedure; // If provided, the form acts in "edit" mode
  onSuccess?: () => void;
}

export default function DentalProcedureForm({ patientId, procedure, onSuccess }: DentalProcedureFormProps) {
  const [codes, setCodes] = useState<DentalCode[]>([]);
  const [selectedCode, setSelectedCode] = useState<DentalCode | null>(null);
  const [timeSpent, setTimeSpent] = useState<number>(procedure?.timeSpent || 0);
  const [toothNumber, setToothNumber] = useState<number | null>(procedure?.toothNumber ?? null);
  const [jaw, setJaw] = useState<string | null>(procedure?.jaw ?? null);
  const [surface, setSurface] = useState<string | null>(procedure?.surface ?? null);
  const [surfaces, setSurfaces] = useState<number>(procedure?.surfaces ?? 0);
  const [notes, setNotes] = useState(procedure?.notes || '');
  const [loading, setLoading] = useState(false);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Preset total cost when editing an existing procedure
  useEffect(() => {
    if (procedure?.cost) {
      setTotalCost(procedure.cost);
    }
  }, [procedure]);

  // Fetch dental codes on component mount
  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const response = await fetch('/api/dental-codes');
        const data = await response.json();
        setCodes(data);
        if (procedure) {
          const matched = data.find((c: DentalCode) => c.id === procedure.codeId);
          if (matched) setSelectedCode(matched);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load dental codes',
          variant: 'destructive',
        });
      }
    };
    fetchCodes();
  }, []);

  // Calculate total cost whenever relevant fields change
  useEffect(() => {
    if (!selectedCode) return;

    let cost = selectedCode.basePrice ?? 0;

    // Add technical costs if any
    if (selectedCode.technicalCosts) {
      cost += selectedCode.technicalCosts;
    }

    // Multiply by time units if time-dependent
    if (selectedCode.isTimeDependent && selectedCode.timeUnit && timeSpent > 0) {
      const timeUnits = Math.ceil(timeSpent / selectedCode.timeUnit);
      cost *= timeUnits;
    }

    // Multiply by surfaces if applicable
    if (selectedCode.maxSurfaces && surfaces > 0) {
      cost *= surfaces;
    }

    // If per element, ensure at least one element
    if (selectedCode.isPerElement && toothNumber) {
      cost *= 1; // Base multiplication, could be adjusted based on number of elements
    }

    setTotalCost(cost);
  }, [selectedCode, timeSpent, surfaces, toothNumber]);

  // Validate form based on selected code requirements
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!selectedCode) {
      errors.push('Please select a procedure code');
      return errors;
    }

    if (selectedCode.requiresTooth && !toothNumber) {
      errors.push('Please select a tooth number');
    }

    if (selectedCode.requiresJaw && !jaw) {
      errors.push('Please specify the jaw');
    }

    if (selectedCode.requiresSurface && !surface) {
      errors.push('Please specify the surface');
    }

    if (selectedCode.isTimeDependent && (!timeSpent || timeSpent <= 0)) {
      errors.push('Please enter the time spent');
    }

    if (selectedCode.maxSurfaces && (surfaces <= 0 || surfaces > selectedCode.maxSurfaces)) {
      errors.push(`Number of surfaces must be between 1 and ${selectedCode.maxSurfaces}`);
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setLoading(true);

    try {
      const url = procedure ? `/api/patients/${patientId}/dental-procedures/${procedure.id}` : `/api/patients/${patientId}/dental-procedures`;
      const method = procedure ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          codeId: selectedCode?.id,
          toothNumber: selectedCode?.requiresTooth ? toothNumber : null,
          jaw: selectedCode?.requiresJaw ? jaw : null,
          surface: selectedCode?.requiresSurface ? surface : null,
          timeSpent: selectedCode?.isTimeDependent ? timeSpent : null,
          surfaces: selectedCode?.maxSurfaces ? surfaces : null,
          notes,
          cost: totalCost,
        }),
      });

      if (!response.ok) throw new Error('Failed to save procedure');
      const result = await response.json();

      toast({
        title: 'Success',
        description: 'Procedure saved successfully',
      });

      // Log dental procedure creation/update
      await logActivityClient({
        action: procedure ? LOG_ACTIONS.UPDATE_DENTAL_CHART : LOG_ACTIONS.UPDATE_DENTAL_CHART,
        entityType: ENTITY_TYPES.DENTAL_CHART,
        entityId: procedure?.id || result.id,
        description: `${procedure ? 'Updated' : 'Added'} dental procedure: ${selectedCode?.code} - ${selectedCode?.description}${toothNumber ? ` on tooth ${toothNumber}` : ''}`,
        details: {
          procedureCode: selectedCode?.code,
          procedureDescription: selectedCode?.description,
          toothNumber,
          jaw,
          surface,
          timeSpent,
          surfaces,
          cost: totalCost,
          notes
        },
        page: '/dashboard/patients/[id]',
        patientId: patientId,
        severity: LOG_SEVERITY.INFO
      });

      // Reset form
      setSelectedCode(null);
      setTimeSpent(0);
      setToothNumber(null);
      setJaw(null);
      setSurface(null);
      setSurfaces(0);
      setNotes('');
      setValidationErrors([]);

      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save procedure',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="code">Procedure Code</Label>
          <Select
            value={selectedCode?.id || ''}
            onValueChange={(value) => {
              const code = codes.find(c => c.id === value);
              setSelectedCode(code || null);
              // Reset fields when code changes
              setTimeSpent(0);
              setToothNumber(null);
              setJaw(null);
              setSurface(null);
              setSurfaces(0);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a code" />
            </SelectTrigger>
            <SelectContent>
              {codes.map((code) => (
                <SelectItem key={code.id} value={code.id}>
                  {code.code} - {code.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCode?.requiresTooth && (
          <div>
            <Label htmlFor="toothNumber">Tooth Number</Label>
            <Input
              id="toothNumber"
              type="number"
              min={1}
              max={32}
              value={toothNumber || ''}
              onChange={(e) => setToothNumber(parseInt(e.target.value) || null)}
            />
          </div>
        )}

        {selectedCode?.requiresJaw && (
          <div>
            <Label htmlFor="jaw">Jaw</Label>
            <Select
              value={jaw || ''}
              onValueChange={(value) => setJaw(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select jaw" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upper">Upper</SelectItem>
                <SelectItem value="lower">Lower</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedCode?.requiresSurface && (
          <div>
            <Label htmlFor="surface">Surface</Label>
            <Select
              value={surface || ''}
              onValueChange={(value) => setSurface(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select surface" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="occlusal">Occlusal</SelectItem>
                <SelectItem value="buccal">Buccal</SelectItem>
                <SelectItem value="lingual">Lingual</SelectItem>
                <SelectItem value="mesial">Mesial</SelectItem>
                <SelectItem value="distal">Distal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedCode?.isTimeDependent && (
          <div>
            <Label htmlFor="timeSpent">Time Spent (minutes)</Label>
            <Input
              id="timeSpent"
              type="number"
              min={selectedCode.timeUnit || 1}
              step={selectedCode.timeUnit || 1}
              value={timeSpent}
              onChange={(e) => setTimeSpent(parseInt(e.target.value) || 0)}
            />
            {selectedCode.timeUnit && (
              <span className="text-sm text-gray-500">
                Units of {selectedCode.timeUnit} minutes
              </span>
            )}
          </div>
        )}

        {selectedCode?.maxSurfaces && (
          <div>
            <Label htmlFor="surfaces">Number of Surfaces</Label>
            <Input
              id="surfaces"
              type="number"
              min={1}
              max={selectedCode.maxSurfaces}
              value={surfaces}
              onChange={(e) => setSurfaces(parseInt(e.target.value) || 0)}
            />
          </div>
        )}

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {selectedCode?.requirements?.conditions && (
          <div className="text-sm text-gray-600">
            <h4 className="font-semibold">Requirements:</h4>
            <ul className="list-disc pl-4">
              {selectedCode.requirements.conditions.map((condition: string, index: number) => (
                <li key={index}>{condition}</li>
              ))}
            </ul>
          </div>
        )}

        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="list-disc pl-4">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="pt-2">
          <div className="text-lg font-semibold">
            Total Cost: €{totalCost.toFixed(2)}
          </div>
        </div>

        <Button type="submit" disabled={loading || !selectedCode}>
          {loading ? 'Saving...' : 'Save Procedure'}
        </Button>
      </form>
    </Card>
  );
} 