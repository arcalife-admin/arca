'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logActivityClient, LOG_ACTIONS, ENTITY_TYPES, LOG_SEVERITY } from '@/lib/activity-logger';

interface SurgicalProcedureCode {
  id: string;
  code: string;
  description: string;
  price?: number | null;
  category: string;
  duration?: number | null;
  requirements?: any;
}

interface SurgicalProcedure {
  id: string;
  codeId: string;
  bodyArea?: string | null;
  procedureType?: string | null;
  anesthesiaType?: string | null;
  notes?: string;
  cost?: number;
  quantity?: number;
  code?: SurgicalProcedureCode;
}

interface SurgicalProcedureFormProps {
  patientId: string;
  procedure?: SurgicalProcedure; // If provided, the form acts in "edit" mode
  onSuccess?: () => void;
}

const BODY_AREAS = [
  { value: 'face', label: 'Face' },
  { value: 'breast', label: 'Breast' },
  { value: 'body', label: 'Body' },
  { value: 'other', label: 'Other' },
];

const PROCEDURE_TYPES = [
  { value: 'rhinoplasty', label: 'Rhinoplasty' },
  { value: 'blepharoplasty', label: 'Blepharoplasty' },
  { value: 'otoplasty', label: 'Otoplasty' },
  { value: 'face_lift', label: 'Face Lift' },
  { value: 'breast_implant', label: 'Breast Implant' },
  { value: 'breast_lift', label: 'Breast Lift' },
  { value: 'gynecomastia', label: 'Gynecomastia' },
  { value: 'liposuction', label: 'Liposuction' },
  { value: 'abdominoplasty', label: 'Abdominoplasty' },
  { value: 'labiaplasty', label: 'Labiaplasty' },
  { value: 'injection', label: 'Injection (Hyaluronic Acid)' },
  { value: 'other', label: 'Other' },
];

const ANESTHESIA_TYPES = [
  { value: 'local', label: 'Local Anesthesia' },
  { value: 'general', label: 'General Anesthesia' },
  { value: 'sedation', label: 'Sedation' },
  { value: 'none', label: 'None' },
];

export default function SurgicalProcedureForm({ patientId, procedure, onSuccess }: SurgicalProcedureFormProps) {
  const [codes, setCodes] = useState<SurgicalProcedureCode[]>([]);
  const [selectedCode, setSelectedCode] = useState<SurgicalProcedureCode | null>(null);
  const [bodyArea, setBodyArea] = useState<string | null>(procedure?.bodyArea ?? null);
  const [procedureType, setProcedureType] = useState<string | null>(procedure?.procedureType ?? null);
  const [anesthesiaType, setAnesthesiaType] = useState<string | null>(procedure?.anesthesiaType ?? null);
  const [quantity, setQuantity] = useState<number>(procedure?.quantity || 1);
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

  // Fetch surgical procedure codes on component mount
  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const response = await fetch('/api/surgical-procedure-codes');
        const data = await response.json();
        setCodes(data);
        if (procedure) {
          const matched = data.find((c: SurgicalProcedureCode) => c.id === procedure.codeId);
          if (matched) setSelectedCode(matched);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load surgical procedure codes',
          variant: 'destructive',
        });
      }
    };
    fetchCodes();
  }, [procedure]);

  // Calculate total cost whenever relevant fields change
  useEffect(() => {
    if (!selectedCode) return;

    let cost = selectedCode.price ?? 0;
    
    // Multiply by quantity
    cost *= quantity;

    setTotalCost(cost);
  }, [selectedCode, quantity]);

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!selectedCode) {
      errors.push('Please select a procedure code');
      return errors;
    }

    if (quantity <= 0) {
      errors.push('Quantity must be greater than 0');
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
      const url = procedure ? `/api/patients/${patientId}/surgical-procedures/${procedure.id}` : `/api/patients/${patientId}/surgical-procedures`;
      const method = procedure ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          codeId: selectedCode?.id,
          date: new Date().toISOString(),
          bodyArea: bodyArea || null,
          procedureType: procedureType || null,
          anesthesiaType: anesthesiaType || null,
          quantity,
          notes,
          cost: totalCost,
          status: 'PENDING',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save procedure');
      }
      
      const result = await response.json();

      toast({
        title: 'Success',
        description: 'Surgical procedure saved successfully',
      });

      // Log surgical procedure creation/update
      await logActivityClient({
        action: procedure ? LOG_ACTIONS.UPDATE_SURGICAL_PROCEDURE : LOG_ACTIONS.CREATE_SURGICAL_PROCEDURE,
        entityType: ENTITY_TYPES.SURGICAL_PROCEDURE,
        entityId: procedure?.id || result.procedure?.id,
        description: `${procedure ? 'Updated' : 'Added'} surgical procedure: ${selectedCode?.code} - ${selectedCode?.description}`,
        details: {
          procedureCode: selectedCode?.code,
          procedureDescription: selectedCode?.description,
          bodyArea,
          procedureType,
          anesthesiaType,
          quantity,
          cost: totalCost,
          notes
        },
        page: '/dashboard/patients/[id]',
        patientId: patientId,
        severity: LOG_SEVERITY.INFO
      });

      // Reset form
      setSelectedCode(null);
      setBodyArea(null);
      setProcedureType(null);
      setAnesthesiaType(null);
      setQuantity(1);
      setNotes('');
      setValidationErrors([]);

      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save procedure',
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
              setBodyArea(null);
              setProcedureType(null);
              setAnesthesiaType(null);
              setQuantity(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a procedure code" />
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

        <div>
          <Label htmlFor="bodyArea">Body Area</Label>
          <Select
            value={bodyArea || 'none'}
            onValueChange={(value) => setBodyArea(value === 'none' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select body area" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {BODY_AREAS.map((area) => (
                <SelectItem key={area.value} value={area.value}>
                  {area.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="procedureType">Procedure Type</Label>
          <Select
            value={procedureType || 'none'}
            onValueChange={(value) => setProcedureType(value === 'none' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select procedure type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {PROCEDURE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="anesthesiaType">Anesthesia Type</Label>
          <Select
            value={anesthesiaType || 'none'}
            onValueChange={(value) => setAnesthesiaType(value === 'none' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select anesthesia type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {ANESTHESIA_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes about the procedure"
          />
        </div>

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
          {loading ? 'Saving...' : procedure ? 'Update Procedure' : 'Save Procedure'}
        </Button>
      </form>
    </Card>
  );
}

