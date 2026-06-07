'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logActivityClient, LOG_ACTIONS, ENTITY_TYPES, LOG_SEVERITY } from '@/lib/activity-logger';
import {
  applyCodeDefaults,
  getAnesthesiaFromCode,
  getProcedureTypeFromCode,
  resolveFormDefaults,
} from '@/lib/surgical-code-defaults';
import { fromLeiToStored, toLei } from '@/lib/procedure-currency';
import { useEurToRonRate } from '@/hooks/useEurToRonRate';
import { ProcedurePriceDisplay } from '@/components/ProcedurePriceDisplay';

interface SurgicalProcedureCode {
  id: string;
  code: string;
  description: string;
  price?: number | null;
  currency?: string;
  category: string;
  duration?: number | null;
  requirements?: {
    bodyArea?: string;
    procedureType?: string;
    anesthesiaType?: string;
  };
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
  status?: string;
  code?: SurgicalProcedureCode;
}

interface SurgicalProcedureFormProps {
  patientId: string;
  procedure?: SurgicalProcedure;
  initialCode?: SurgicalProcedureCode;
  status?: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
  onSuccess?: () => void;
  onCancel?: () => void;
}

const BODY_AREAS = [
  { value: 'face', label: 'Față' },
  { value: 'breast', label: 'Sân' },
  { value: 'body', label: 'Corp' },
  { value: 'other', label: 'Altele' },
];

const ANESTHESIA_TYPES = [
  { value: 'local', label: 'Anestezie locală' },
  { value: 'general', label: 'Anestezie generală' },
  { value: 'sedation', label: 'Sedare' },
  { value: 'none', label: 'Fără anestezie' },
];

export default function SurgicalProcedureForm({
  patientId,
  procedure,
  initialCode,
  status = 'PENDING',
  onSuccess,
  onCancel,
}: SurgicalProcedureFormProps) {
  const rate = useEurToRonRate();
  const [codes, setCodes] = useState<SurgicalProcedureCode[]>([]);
  const [selectedCode, setSelectedCode] = useState<SurgicalProcedureCode | null>(
    initialCode ?? procedure?.code ?? null
  );
  const [bodyArea, setBodyArea] = useState<string | null>(() =>
    resolveFormDefaults(procedure, initialCode).bodyArea
  );
  const [anesthesiaType, setAnesthesiaType] = useState<string | null>(() =>
    resolveFormDefaults(procedure, initialCode).anesthesiaType
  );
  const [quantity, setQuantity] = useState<number>(procedure?.quantity || 1);
  const [notes, setNotes] = useState(procedure?.notes || '');
  const [loading, setLoading] = useState(false);
  const [totalCostLei, setTotalCostLei] = useState<number>(0);
  const [costManuallyEdited, setCostManuallyEdited] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [userPriceMap, setUserPriceMap] = useState<Map<string, number>>(new Map());

  const isModalMode = !!initialCode || !!procedure;
  const hideAnesthesia = selectedCode
    ? getAnesthesiaFromCode(selectedCode) === 'none' ||
      getProcedureTypeFromCode(selectedCode) === 'injection' ||
      getProcedureTypeFromCode(selectedCode) === 'other'
    : false;

  const getUnitPrice = useCallback(
    (code: SurgicalProcedureCode): number => {
      if (userPriceMap.has(code.id)) return userPriceMap.get(code.id)!;
      return code.price ?? 0;
    },
    [userPriceMap]
  );

  const getCurrency = (code: SurgicalProcedureCode): string => code.currency ?? 'EUR';

  const recalculateCost = useCallback(
    (code: SurgicalProcedureCode, qty: number) => {
      if (!costManuallyEdited) {
        const stored = getUnitPrice(code) * qty;
        setTotalCostLei(Math.round(toLei(stored, getCurrency(code), rate)));
      }
    },
    [costManuallyEdited, getUnitPrice, rate]
  );

  useEffect(() => {
    const fetchUserPrices = async () => {
      try {
        const response = await fetch('/api/users/me/procedure-prices');
        if (!response.ok) return;
        const data = await response.json();
        const map = new Map<string, number>();
        for (const item of data) {
          map.set(item.codeId, item.effectivePrice ?? item.catalogPrice ?? 0);
        }
        setUserPriceMap(map);
      } catch {
        // Non-critical — fall back to catalog prices
      }
    };
    fetchUserPrices();
  }, []);

  useEffect(() => {
    if (initialCode) return;
    const fetchCodes = async () => {
      try {
        const response = await fetch('/api/surgical-procedure-codes');
        const data = await response.json();
        setCodes(data);
        if (procedure) {
          const matched = data.find((c: SurgicalProcedureCode) => c.id === procedure.codeId);
          if (matched) setSelectedCode(matched);
        }
      } catch {
        toast({
          title: 'Eroare',
          description: 'Încărcarea codurilor de procedură chirurgicală a eșuat',
          variant: 'destructive',
        });
      }
    };
    fetchCodes();
  }, [procedure, initialCode]);

  useEffect(() => {
    if (!initialCode) return;
    setSelectedCode(initialCode);
    const defaults = applyCodeDefaults(initialCode);
    setBodyArea(defaults.bodyArea);
    setAnesthesiaType(defaults.anesthesiaType);
  }, [initialCode?.id]);

  useEffect(() => {
    if (initialCode || !procedure?.code) return;
    if (procedure.bodyArea && procedure.anesthesiaType) return;
    const defaults = applyCodeDefaults(procedure.code);
    if (!procedure.bodyArea) setBodyArea(defaults.bodyArea);
    if (!procedure.anesthesiaType) setAnesthesiaType(defaults.anesthesiaType);
  }, [procedure, initialCode]);

  useEffect(() => {
    if (selectedCode && !procedure) {
      recalculateCost(selectedCode, quantity);
    }
  }, [selectedCode, quantity, userPriceMap, procedure, recalculateCost]);

  useEffect(() => {
    if (procedure?.cost !== undefined && procedure.cost !== null && procedure.code) {
      setTotalCostLei(Math.round(toLei(procedure.cost, getCurrency(procedure.code), rate)));
      setCostManuallyEdited(true);
    }
  }, [procedure, rate]);

  const handleCodeChange = (code: SurgicalProcedureCode) => {
    setSelectedCode(code);
    const defaults = applyCodeDefaults(code);
    setBodyArea(defaults.bodyArea);
    setAnesthesiaType(defaults.anesthesiaType);
    setQuantity(1);
    setCostManuallyEdited(false);
    recalculateCost(code, 1);
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!selectedCode) {
      errors.push('Selectați un cod de procedură');
      return errors;
    }
    if (quantity <= 0) {
      errors.push('Cantitatea trebuie să fie mai mare decât 0');
    }
    if (totalCostLei < 0) {
      errors.push('Costul nu poate fi negativ');
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

    const currency = selectedCode ? getCurrency(selectedCode) : 'EUR';
    const storedCost = fromLeiToStored(totalCostLei, currency, rate);

    try {
      const url = procedure
        ? `/api/patients/${patientId}/surgical-procedures/${procedure.id}`
        : `/api/patients/${patientId}/surgical-procedures`;
      const method = procedure ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codeId: selectedCode?.id,
          date: new Date().toISOString(),
          bodyArea: bodyArea || null,
          procedureType: selectedCode ? getProcedureTypeFromCode(selectedCode) : null,
          anesthesiaType: hideAnesthesia
            ? (selectedCode ? getAnesthesiaFromCode(selectedCode) ?? 'none' : 'none')
            : (anesthesiaType || null),
          quantity,
          notes,
          cost: storedCost,
          status: procedure?.status ?? status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Salvarea procedurii a eșuat');
      }

      const result = await response.json();
      const savedId = procedure?.id || result.procedure?.id || result.id;

      toast({
        title: 'Succes',
        description: 'Procedura chirurgicală a fost salvată cu succes',
      });

      await logActivityClient({
        action: procedure ? LOG_ACTIONS.UPDATE_SURGICAL_PROCEDURE : LOG_ACTIONS.CREATE_SURGICAL_PROCEDURE,
        entityType: ENTITY_TYPES.SURGICAL_PROCEDURE,
        entityId: savedId,
        description: `${procedure ? 'Procedură chirurgicală actualizată' : 'Procedură chirurgicală adăugată'}: ${selectedCode?.code} - ${selectedCode?.description}`,
        details: {
          procedureCode: selectedCode?.code,
          procedureDescription: selectedCode?.description,
          bodyArea,
          procedureType: selectedCode ? getProcedureTypeFromCode(selectedCode) : null,
          anesthesiaType: hideAnesthesia
            ? (selectedCode ? getAnesthesiaFromCode(selectedCode) ?? 'none' : 'none')
            : anesthesiaType,
          quantity,
          cost: storedCost,
          notes,
        },
        page: '/dashboard/patients/[id]',
        patientId,
        severity: LOG_SEVERITY.INFO,
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: 'Eroare',
        description: error instanceof Error ? error.message : 'Salvarea procedurii a eșuat',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const unitPriceStored = selectedCode ? getUnitPrice(selectedCode) : 0;

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {selectedCode && isModalMode ? (
          <div className="rounded-md bg-gray-50 px-3 py-2">
            <div className="font-medium">{selectedCode.code}</div>
            <div className="text-sm text-gray-600">{selectedCode.description}</div>
          </div>
        ) : (
          <div>
            <Label htmlFor="code">Cod procedură</Label>
            <Select
              value={selectedCode?.id || ''}
              onValueChange={(value) => {
                const code = codes.find((c) => c.id === value);
                if (code) handleCodeChange(code);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectați un cod de procedură" />
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
        )}

        <div>
          <Label htmlFor="bodyArea">Zonă corporală</Label>
          <Select
            key={`body-${selectedCode?.id ?? 'none'}-${bodyArea ?? 'unset'}`}
            value={bodyArea ?? undefined}
            onValueChange={(value) => setBodyArea(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selectați zona corporală" />
            </SelectTrigger>
            <SelectContent>
              {BODY_AREAS.map((area) => (
                <SelectItem key={area.value} value={area.value}>
                  {area.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!hideAnesthesia && (
          <div>
            <Label htmlFor="anesthesiaType">Tip anestezie</Label>
            <Select
              key={`anes-${selectedCode?.id ?? 'none'}-${anesthesiaType ?? 'unset'}`}
              value={anesthesiaType ?? undefined}
              onValueChange={(value) => setAnesthesiaType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectați tipul de anestezie" />
              </SelectTrigger>
              <SelectContent>
                {ANESTHESIA_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="quantity">Cantitate</Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => {
              const qty = parseInt(e.target.value) || 1;
              setQuantity(qty);
              if (selectedCode) recalculateCost(selectedCode, qty);
            }}
          />
        </div>

        <div>
          <Label htmlFor="notes">Notițe</Label>
          <Input
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notițe suplimentare despre procedură"
          />
        </div>

        <div>
          <Label htmlFor="totalCostLei">Cost total (lei)</Label>
          <Input
            id="totalCostLei"
            type="number"
            min={0}
            step={1}
            value={totalCostLei}
            onChange={(e) => {
              setCostManuallyEdited(true);
              setTotalCostLei(parseFloat(e.target.value) || 0);
            }}
          />
          {selectedCode && !costManuallyEdited && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 flex-wrap">
              Completat automat din prețul dvs. implicit (
              <ProcedurePriceDisplay
                amount={unitPriceStored * quantity}
                currency={getCurrency(selectedCode)}
                rate={rate}
                className="text-xs"
              />
              )
            </p>
          )}
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

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={loading || !selectedCode}>
            {loading ? 'Se salvează...' : procedure ? 'Actualizează procedura' : 'Salvează procedura'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Anulare
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
