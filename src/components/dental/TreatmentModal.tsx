'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { C002CheckupModal } from './C002CheckupModal';
import { useTimer } from '@/contexts/TimerContext';

interface DentalCode {
  id: string;
  code: string;
  description: string;
  points?: number;
  rate?: number | string;
  section?: string;
  category?: string;
  isTimeDependent?: boolean;
  timeUnit?: number;
  requiresTooth?: boolean;
  requiresJaw?: boolean;
  requiresSurface?: boolean;
  requiresQuadrant?: boolean;
  maxSurfaces?: number;
  maxRoots?: number;
  isPerElement?: boolean;
  followUpCode?: string;
  basePrice?: number;
  technicalCosts?: number;
  requirements?: {
    notes?: string[];
    conditions?: string[] | { [key: string]: string | string[]; };
    category?: string;
    isTimeDependent?: boolean;
    timeUnit?: number;
    perElement?: boolean;
    perJaw?: boolean;
    perJawHalf?: boolean;
    perSextant?: boolean;
    perQuadrant?: boolean;
    requiresTooth?: boolean;
    requiresJaw?: boolean;
    requiresSurface?: boolean;
    requiresQuadrant?: boolean;
    maxElements?: number;
    minElements?: number;
    maxSurfaces?: number;
    maxRoots?: number;
    oncePerTreatment?: boolean;
    oncePerImplant?: boolean;
    regardlessOfSessions?: boolean;
    separateSession?: boolean;
    sameSession?: boolean;
    withinMonths?: number;
    includes?: string[];
    excludes?: string[];
    includedServices?: string[];
    incompatibleWith?: string[];
    applicableWith?: string[];
    allowedCombinations?: string[];
    forbiddenCombinations?: string[];
    [key: string]: any;
  };
  [key: string]: any;
}

interface TreatmentData {
  id?: string;
  codeId: string;
  code?: DentalCode;
  toothNumber?: number | null;
  jaw?: number | null;
  surface?: string | null;
  quadrant?: number | null;
  timeMultiplier?: number | null;
  surfaces?: number | null;
  roots?: number | null;
  elements?: number | null;
  sessions?: number | null;
  cost?: number | null;
  notes?: string;
  status?: string;
  date?: string;
  // Additional fields for complex requirements
  jawHalf?: number | null;
  sextant?: number | null;
  isFirstElement?: boolean;
  followUpProcedure?: string | null;
  combinedWith?: string[];
  technicalCosts?: number | null;
  materialCosts?: number | null;
  quantity?: number;
  c002Data?: any; // For C002 specific data
  [key: string]: any;
}

interface TreatmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  treatmentData?: any;
  patientAge?: number;
  availableCodes?: DentalCode[];
  quickCode?: DentalCode | null;
  isPaid?: boolean;
  isWLZPatient?: boolean;
  patient?: any;
  onOpenAsaModal?: () => void;
  onOpenPpsModal?: () => void;
  onOpenScreeningRecallModal?: () => void;
  onRefresh?: () => Promise<any>; // Fix type to match refetch
}

// Valid tooth numbers using FDI notation
const PERMANENT_TEETH = [
  18, 17, 16, 15, 14, 13, 12, 11, // Upper right
  28, 27, 26, 25, 24, 23, 22, 21, // Upper left
  38, 37, 36, 35, 34, 33, 32, 31, // Lower left
  48, 47, 46, 45, 44, 43, 42, 41  // Lower right
];
const PRIMARY_TEETH = [
  55, 54, 53, 52, 51, // Upper right
  65, 64, 63, 62, 61, // Upper left
  75, 74, 73, 72, 71, // Lower left
  85, 84, 83, 82, 81  // Lower right
];
const ALL_TEETH = [...PERMANENT_TEETH, ...PRIMARY_TEETH].sort((a, b) => a - b);

// Surface options
const SURFACE_OPTIONS = [
  { value: 'occlusal', label: 'Occlusal (O)' },
  { value: 'mesial', label: 'Mesial (M)' },
  { value: 'distal', label: 'Distal (D)' },
  { value: 'buccal', label: 'Buccal/Facial (B/F)' },
  { value: 'lingual', label: 'Lingual/Palatal (L/P)' },
  { value: 'incisal', label: 'Incisal (I)' },
  { value: 'cervical', label: 'Cervical (C)' },
];

export function TreatmentModal({
  isOpen,
  onClose,
  onSave,
  treatmentData,
  patientAge = 18,
  availableCodes = [],
  quickCode = null,
  isPaid = false,
  isWLZPatient = false,
  patient,
  onOpenAsaModal,
  onOpenPpsModal,
  onOpenScreeningRecallModal,
  onRefresh
}: TreatmentModalProps) {
  const [formData, setFormData] = useState<TreatmentData>({
    codeId: '',
    notes: '',
    toothNumber: null,
    jaw: null,
    surface: '',
    quadrant: null,
    timeMultiplier: 1,
    surfaces: null,
    roots: null,
    elements: null,
    sessions: 1,
    jawHalf: null,
    sextant: null,
    technicalCosts: 0,
    materialCosts: 0,
    cost: 0
  });
  const [selectedCode, setSelectedCode] = useState<DentalCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [calculatedCost, setCalculatedCost] = useState<number>(0);
  const [showCodeInfo, setShowCodeInfo] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const sessionsRef = useRef<HTMLInputElement>(null);
  const [showCostDetails, setShowCostDetails] = useState(false);

  // C002 modal state
  const [showC002Modal, setShowC002Modal] = useState(false);

  // Timer context for M03 auto-calculation
  const { time: timerTime, isRunning: timerIsRunning } = useTimer();

  // Initialize form data
  useEffect(() => {
    if (treatmentData) {
      // Editing mode - prefill with existing data
      setFormData({
        ...treatmentData,
        // Map quantity to sessions for display in the form
        sessions: treatmentData.quantity || treatmentData.sessions
      });
      if (treatmentData.code) {
        setSelectedCode(treatmentData.code);
      }
    } else if (quickCode) {
      // Quick-add mode - prefill with selected code
      setFormData({
        codeId: quickCode.id,
        notes: '',
        timeMultiplier: 1,
        sessions: 1,
        technicalCosts: 0,
        materialCosts: 0,
        cost: 0
      });
      setSelectedCode(quickCode);
    } else {
      // New treatment mode - empty form with defaults
      setFormData({
        codeId: '',
        notes: '',
        timeMultiplier: 1,
        sessions: 1,
        technicalCosts: 0,
        materialCosts: 0,
        cost: 0
      });
      setSelectedCode(null);
    }
  }, [treatmentData, quickCode, isOpen]);

  // Auto-focus sessions field when modal opens and no tooth number is specified
  useEffect(() => {
    if (isOpen && !formData.toothNumber && selectedCode && (selectedCode.isTimeDependent || selectedCode.requirements?.isTimeDependent) && sessionsRef.current) {
      // Small delay to ensure the modal is fully rendered
      const timer = setTimeout(() => {
        sessionsRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, formData.toothNumber, selectedCode]);

  // Find selected code from available codes
  useEffect(() => {
    if (formData.codeId && availableCodes.length > 0) {
      const code = availableCodes.find(c => c.id === formData.codeId);
      if (code) {
        setSelectedCode(code);
      }
    }
  }, [formData.codeId, availableCodes]);

  // Auto-calculate sessions for M03 codes when timer is paused
  useEffect(() => {
    if (selectedCode?.code === 'M03' && !timerIsRunning && timerTime > 0) {
      // Timer is paused and has time - calculate sessions based on 5-minute units
      const minutes = Math.floor(timerTime / 60);
      const seconds = timerTime % 60;
      const totalMinutes = minutes + (seconds / 60);

      // Round to nearest 5-minute unit as per M03 requirements
      const roundedMinutes = Math.round(totalMinutes / 5) * 5;
      const calculatedSessions = Math.max(1, Math.ceil(roundedMinutes / 5));

      // Only update if we don't have a tooth number (since sessions are only relevant for non-tooth-specific treatments)
      // and if the calculated sessions are different from current sessions to avoid unnecessary updates
      if (!formData.toothNumber && formData.sessions !== calculatedSessions) {
        setFormData(prev => ({
          ...prev,
          sessions: calculatedSessions,
          timeMultiplier: calculatedSessions
        }));
      }
    }
  }, [selectedCode, timerIsRunning, timerTime, formData.toothNumber, formData.sessions]);

  // Calculate cost based on selected code and form inputs
  useEffect(() => {
    if (!selectedCode) {
      setCalculatedCost(0);
      return;
    }

    // For WLZ patients, only U35 code has a cost, all others are 0
    if (isWLZPatient && selectedCode.code !== 'U35') {
      setCalculatedCost(0);
      return;
    }

    let cost = 0;

    // Start with base rate/price
    if (typeof selectedCode.rate === 'number') {
      cost = selectedCode.rate;
    } else if (selectedCode.basePrice) {
      cost = selectedCode.basePrice;
    } else if (selectedCode.points) {
      cost = selectedCode.points * 7.59; // Convert points to euros (rate from m-codes)
    }

    // Add technical costs
    if (selectedCode.technicalCosts) {
      cost += selectedCode.technicalCosts;
    }
    if (formData.technicalCosts) {
      cost += formData.technicalCosts;
    }

    // Time-dependent multiplier
    if ((selectedCode.isTimeDependent || selectedCode.requirements?.isTimeDependent) && formData.timeMultiplier) {
      cost *= formData.timeMultiplier;
    }

    // Per element multiplier
    if ((selectedCode.isPerElement || selectedCode.requirements?.perElement) && formData.elements) {
      cost *= formData.elements;
    }

    // Surface multiplier
    if (selectedCode.maxSurfaces && formData.surfaces) {
      cost *= formData.surfaces;
    }

    // Root multiplier  
    if (selectedCode.maxRoots && formData.roots) {
      cost *= formData.roots;
    }

    // Session multiplier
    if (formData.sessions && formData.sessions > 1) {
      cost *= formData.sessions;
    }

    setCalculatedCost(Math.round(cost * 100) / 100);
  }, [selectedCode, formData, isWLZPatient]);



  // Check if C002 is selected and show enhanced modal
  useEffect(() => {
    if (selectedCode?.code === 'C002' && patient && !showC002Modal) {
      setShowC002Modal(true);
    }
    // If C002 is not selected, ensure modal is closed
    if (selectedCode?.code !== 'C002' && showC002Modal) {
      setShowC002Modal(false);
    }
  }, [selectedCode, patient, showC002Modal]);

  // Handle C002 modal close
  const handleC002Close = () => {
    setShowC002Modal(false);
    // Reset to previous code or empty if C002 was selected
    if (selectedCode?.code === 'C002') {
      setSelectedCode(null);
      setFormData(prev => ({ ...prev, codeId: '' }));
    }
    onClose(); // Also close the TreatmentModal
  };

  // Handle C002 save
  const handleC002Save = async (c002Data: any) => {
    try {
      // Convert C002 data to standard treatment data format
      const treatmentData = {
        ...formData,
        codeId: c002Data.codeId,
        notes: c002Data.notes,
        cost: c002Data.cost,
        sessions: c002Data.sessions,
        technicalCosts: c002Data.technicalCosts,
        materialCosts: c002Data.materialCosts,
        // Add C002-specific data as notes or custom fields
        c002Data: c002Data,
        // Explicitly set status to IN_PROGRESS for C002 to prevent it from appearing in plan tab
        status: 'IN_PROGRESS'
      };

      await onSave(treatmentData);
      setShowC002Modal(false);
    } catch (error) {
      console.error('Error saving C002 data:', error);
      throw error;
    }
  };

  // Get jaw options based on patient age
  const getJawOptions = () => {
    const baseOptions = [
      { value: 1, label: 'Upper Right (1)' },
      { value: 2, label: 'Upper Left (2)' },
      { value: 3, label: 'Lower Left (3)' },
      { value: 4, label: 'Lower Right (4)' }
    ];

    if (patientAge < 12) {
      return [
        ...baseOptions,
        { value: 5, label: 'Upper Right Primary (5)' },
        { value: 6, label: 'Upper Left Primary (6)' },
        { value: 7, label: 'Lower Left Primary (7)' },
        { value: 8, label: 'Lower Right Primary (8)' }
      ];
    }

    return baseOptions;
  };

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!selectedCode) {
      errors.push('Please select a treatment code');
      return errors;
    }

    // Check tooth requirement
    if ((selectedCode.requiresTooth || selectedCode.requirements?.requiresTooth) && !formData.toothNumber) {
      errors.push('Tooth number is required for this treatment');
    }

    // Check jaw requirement
    if ((selectedCode.requiresJaw || selectedCode.requirements?.requiresJaw) && !formData.jaw) {
      errors.push('Jaw selection is required for this treatment');
    }

    // Check surface requirement
    if ((selectedCode.requiresSurface || selectedCode.requirements?.requiresSurface) && !formData.surface) {
      errors.push('Surface selection is required for this treatment');
    }

    // Check quadrant requirement
    if ((selectedCode.requiresQuadrant || selectedCode.requirements?.requiresQuadrant) && !formData.quadrant) {
      errors.push('Quadrant selection is required for this treatment');
    }

    // Check time-dependent requirement
    if ((selectedCode.isTimeDependent || selectedCode.requirements?.isTimeDependent) && !formData.timeMultiplier) {
      errors.push('Time multiplier is required for this time-dependent treatment');
    }

    // Check sessions requirement
    if (!formData.toothNumber && !formData.sessions) {
      errors.push('Number of sessions is required');
    }

    // Check max surfaces
    if (selectedCode.maxSurfaces && formData.surfaces && formData.surfaces > selectedCode.maxSurfaces) {
      errors.push(`Maximum ${selectedCode.maxSurfaces} surfaces allowed for this treatment`);
    }

    // Check max roots
    if (selectedCode.maxRoots && formData.roots && formData.roots > selectedCode.maxRoots) {
      errors.push(`Maximum ${selectedCode.maxRoots} roots allowed for this treatment`);
    }

    // Check min/max elements
    if (selectedCode.requirements?.minElements && formData.elements && formData.elements < selectedCode.requirements.minElements) {
      errors.push(`Minimum ${selectedCode.requirements.minElements} elements required for this treatment`);
    }
    if (selectedCode.requirements?.maxElements && formData.elements && formData.elements > selectedCode.requirements.maxElements) {
      errors.push(`Maximum ${selectedCode.requirements.maxElements} elements allowed for this treatment`);
    }

    // Check tooth number validity
    if (formData.toothNumber && !ALL_TEETH.includes(formData.toothNumber)) {
      errors.push('Invalid tooth number. Please enter a valid permanent (11-18, 21-28, 31-38, 41-48) or primary (51-55, 61-65, 71-75, 81-85) tooth number');
    }

    return errors;
  };

  // Handle form submission
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
      const dataToSave = {
        ...formData,
        cost: formData.cost || calculatedCost,
        quantity: formData.sessions,
        code: selectedCode
      };

      await onSave(dataToSave);
      toast.success('Treatment saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving treatment:', error);
      toast.error('Failed to save treatment');
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle code selection
  const handleCodeChange = (codeId: string) => {
    const code = availableCodes.find(c => c.id === codeId);
    setSelectedCode(code || null);
    setFormData(prev => ({
      ...prev,
      codeId,
      // Reset dependent fields when code changes
      toothNumber: null,
      jaw: null,
      surface: null,
      quadrant: null,
      timeMultiplier: code?.timeUnit ? 1 : null,
      surfaces: null,
      roots: null,
      elements: null,
      sessions: 1,
      jawHalf: null,
      sextant: null,
      isFirstElement: false,
      followUpProcedure: null,
      combinedWith: [],
      technicalCosts: null,
      materialCosts: null
    }));
  };

  return (
    <>
      <Dialog open={isOpen && !showC002Modal} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {treatmentData ? 'Edit Treatment' : 'Add Treatment'}
              {isPaid && <Badge className="ml-2 bg-green-600">PAID</Badge>}
            </DialogTitle>
            <DialogDescription>
              {isPaid
                ? 'This procedure has been paid. Only notes can be edited.'
                : treatmentData
                  ? 'Modify the treatment details below'
                  : 'Enter treatment details.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* WLZ Patient Warning */}
            {isWLZPatient && (
              <Card className="p-4 bg-purple-50 border-purple-200">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-600">WLZ Patient</Badge>
                      <span className="text-sm font-medium text-purple-900">
                        Long-term Care Act Rules Apply
                      </span>
                    </div>
                    <p className="text-sm text-purple-700">
                      This patient is under the Long-term Care Act. All treatment costs will automatically be set to €0,
                      except for U35 time units which can have their default cost. You will be prompted to add appropriate
                      U35 time units after saving this treatment.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* For paid procedures, only show notes section */}
            {isPaid ? (
              <div className="space-y-4">
                {/* Show code info for context */}
                {selectedCode && (
                  <Card className="bg-green-50">
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-600">{selectedCode.code}</Badge>
                        <p className="font-medium text-green-900">{selectedCode.description}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Notes Section */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Personal Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                    placeholder="Add any personal notes about this treatment..."
                    rows={4}
                    ref={notesRef}
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Normal form for unpaid procedures */}
                {/* Selected Code Info */}
                {selectedCode && (
                  <Card className="bg-blue-50">
                    {/* Collapsible Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => setShowCodeInfo(!showCodeInfo)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Badge className="bg-blue-600">{selectedCode.code}</Badge>
                          <div className="flex-1">
                            <p className="font-medium text-blue-900">{selectedCode.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-blue-800">
                          <Info className="h-4 w-4" />
                          <span>Details</span>
                          {showCodeInfo ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {showCodeInfo && (
                      <div className="px-4 pb-4 space-y-2 border-t border-blue-200">
                        {/* Code Details */}
                        <div className="mt-2 space-y-1">
                          {selectedCode.section && (
                            <p className="text-sm text-blue-700">Section: {selectedCode.section}</p>
                          )}
                          {selectedCode.category && (
                            <p className="text-sm text-blue-700">Category: {selectedCode.category}</p>
                          )}
                        </div>

                        {/* Requirements info */}
                        {selectedCode.requirements?.notes && (
                          <div className="mt-2">
                            <div className="flex items-center gap-1 text-sm font-medium text-blue-800">
                              <Info className="h-4 w-4" />
                              Requirements:
                            </div>
                            <ul className="list-disc list-inside text-sm text-blue-700 ml-5">
                              {selectedCode.requirements.notes.map((note, idx) => (
                                <li key={idx}>{note}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Includes/Excludes */}
                        {selectedCode.requirements?.includes && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-green-800">Includes:</p>
                            <ul className="list-disc list-inside text-sm text-green-700 ml-4">
                              {selectedCode.requirements.includes.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedCode.requirements?.excludes && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-red-800">Excludes:</p>
                            <ul className="list-disc list-inside text-sm text-red-700 ml-4">
                              {selectedCode.requirements.excludes.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )}

                {selectedCode && (
                  <>
                    {/* Only show separator and Required Fields Section if there are required fields */}
                    {((selectedCode.requiresTooth || selectedCode.requirements?.requiresTooth) ||
                      (selectedCode.requiresJaw || selectedCode.requirements?.requiresJaw) ||
                      (selectedCode.requiresSurface || selectedCode.requirements?.requiresSurface) ||
                      (selectedCode.requiresQuadrant || selectedCode.requirements?.requiresQuadrant) ||
                      (selectedCode.isTimeDependent || selectedCode.requirements?.isTimeDependent)) && (
                        <>
                          <Separator />
                          {/* Required Fields Section */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Tooth Number */}
                            {(selectedCode.requiresTooth || selectedCode.requirements?.requiresTooth) && (
                              <div className="space-y-2">
                                <Label htmlFor="toothNumber">Tooth Number *</Label>
                                <Input
                                  id="toothNumber"
                                  type="number"
                                  value={formData.toothNumber?.toString() || ''}
                                  onChange={(e) => updateFormData('toothNumber', e.target.value ? parseInt(e.target.value) : null)}
                                  placeholder="Enter tooth number"
                                />
                              </div>
                            )}

                            {/* Jaw Selection */}
                            {(selectedCode.requiresJaw || selectedCode.requirements?.requiresJaw) && (
                              <div className="space-y-2">
                                <Label htmlFor="jaw">Jaw *</Label>
                                <Select
                                  value={formData.jaw?.toString() || ''}
                                  onValueChange={(value) => updateFormData('jaw', parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select jaw" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getJawOptions().map((option) => (
                                      <SelectItem key={option.value} value={option.value.toString()}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Surface Selection */}
                            {(selectedCode.requiresSurface || selectedCode.requirements?.requiresSurface) && (
                              <div className="space-y-2">
                                <Label htmlFor="surface">Surface *</Label>
                                <Select
                                  value={formData.surface || ''}
                                  onValueChange={(value) => updateFormData('surface', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select surface" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SURFACE_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Quadrant Selection */}
                            {(selectedCode.requiresQuadrant || selectedCode.requirements?.requiresQuadrant) && (
                              <div className="space-y-2">
                                <Label htmlFor="quadrant">Quadrant *</Label>
                                <Select
                                  value={formData.quadrant?.toString() || ''}
                                  onValueChange={(value) => updateFormData('quadrant', parseInt(value))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select quadrant" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">Upper Right (1)</SelectItem>
                                    <SelectItem value="2">Upper Left (2)</SelectItem>
                                    <SelectItem value="3">Lower Left (3)</SelectItem>
                                    <SelectItem value="4">Lower Right (4)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {/* Time-dependent fields */}
                            {(selectedCode.isTimeDependent || selectedCode.requirements?.isTimeDependent) && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="timeMultiplier">
                                    Time Multiplier *
                                    {selectedCode.timeUnit && (
                                      <span className="text-sm text-gray-500 font-normal">
                                        (units of {selectedCode.timeUnit} minutes)
                                      </span>
                                    )}
                                    {selectedCode.code === 'M03' && !timerIsRunning && timerTime > 0 && (
                                      <span className="text-sm text-blue-600 font-normal ml-2">
                                        (auto-calculated from timer)
                                      </span>
                                    )}
                                  </Label>
                                  <Input
                                    id="timeMultiplier"
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={formData.timeMultiplier || ''}
                                    onChange={(e) => updateFormData('timeMultiplier', parseInt(e.target.value) || null)}
                                    placeholder={`Number of ${selectedCode.timeUnit || 5}-minute units`}
                                    className={selectedCode.code === 'M03' && !timerIsRunning && timerTime > 0 ? 'border-blue-300 bg-blue-50' : ''}
                                  />
                                  {selectedCode.code === 'M03' && !timerIsRunning && timerTime > 0 && (
                                    <p className="text-xs text-blue-600">
                                      ⏱️ Time multiplier auto-calculated from paused timer. Rounded to nearest 5-minute unit per M03 requirements.
                                    </p>
                                  )}
                                </div>

                                {!formData.toothNumber && (
                                  <div className="space-y-2">
                                    <Label htmlFor="sessions">
                                      Number of Sessions
                                      {selectedCode?.code === 'M03' && !timerIsRunning && timerTime > 0 && (
                                        <span className="text-sm text-blue-600 font-normal ml-2">
                                          (auto-calculated from timer: {Math.floor(timerTime / 60)}:{String(timerTime % 60).padStart(2, '0')})
                                        </span>
                                      )}
                                    </Label>
                                    <Input
                                      id="sessions"
                                      type="number"
                                      min={1}
                                      value={formData.sessions || ''}
                                      onChange={(e) => updateFormData('sessions', parseInt(e.target.value) || null)}
                                      ref={sessionsRef}
                                      className={selectedCode?.code === 'M03' && !timerIsRunning && timerTime > 0 ? 'border-blue-300 bg-blue-50' : ''}
                                    />
                                    {selectedCode?.code === 'M03' && !timerIsRunning && timerTime > 0 && (
                                      <p className="text-xs text-blue-600">
                                        ⏱️ Sessions auto-calculated from paused timer. Rounded to nearest 5-minute unit per M03 requirements.
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}

                    {/* Optional Fields Section */}
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                      {/* Surfaces */}
                      {selectedCode.maxSurfaces && (
                        <div className="space-y-2">
                          <Label htmlFor="surfaces">
                            Number of Surfaces (max {selectedCode.maxSurfaces})
                          </Label>
                          <Input
                            id="surfaces"
                            type="number"
                            min={1}
                            max={selectedCode.maxSurfaces}
                            value={formData.surfaces || ''}
                            onChange={(e) => updateFormData('surfaces', parseInt(e.target.value) || null)}
                          />
                        </div>
                      )}

                      {/* Roots */}
                      {selectedCode.maxRoots && (
                        <div className="space-y-2">
                          <Label htmlFor="roots">
                            Number of Roots (max {selectedCode.maxRoots})
                          </Label>
                          <Input
                            id="roots"
                            type="number"
                            min={1}
                            max={selectedCode.maxRoots}
                            value={formData.roots || ''}
                            onChange={(e) => updateFormData('roots', parseInt(e.target.value) || null)}
                          />
                        </div>
                      )}

                      {/* Elements - only show if no tooth number specified */}
                      {!formData.toothNumber && (selectedCode.isPerElement || selectedCode.requirements?.perElement ||
                        selectedCode.requirements?.minElements || selectedCode.requirements?.maxElements) && (
                          <div className="space-y-2">
                            <Label htmlFor="elements">
                              Number of Elements
                              {selectedCode.requirements?.minElements && ` (min ${selectedCode.requirements.minElements})`}
                              {selectedCode.requirements?.maxElements && ` (max ${selectedCode.requirements.maxElements})`}
                            </Label>
                            <Input
                              id="elements"
                              type="number"
                              min={selectedCode.requirements?.minElements || 1}
                              max={selectedCode.requirements?.maxElements || undefined}
                              value={formData.elements || ''}
                              onChange={(e) => updateFormData('elements', parseInt(e.target.value) || null)}
                            />
                          </div>
                        )}



                      {/* Jaw Half */}
                      {(selectedCode.requirements?.perJawHalf) && (
                        <div className="space-y-2">
                          <Label htmlFor="jawHalf">Jaw Half</Label>
                          <Select
                            value={formData.jawHalf?.toString() || ''}
                            onValueChange={(value) => updateFormData('jawHalf', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select jaw half" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Upper Right</SelectItem>
                              <SelectItem value="2">Upper Left</SelectItem>
                              <SelectItem value="3">Lower Left</SelectItem>
                              <SelectItem value="4">Lower Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Sextant */}
                      {(selectedCode.requirements?.perSextant) && (
                        <div className="space-y-2">
                          <Label htmlFor="sextant">Sextant</Label>
                          <Select
                            value={formData.sextant?.toString() || ''}
                            onValueChange={(value) => updateFormData('sextant', parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select sextant" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Upper Right (1)</SelectItem>
                              <SelectItem value="2">Upper Anterior (2)</SelectItem>
                              <SelectItem value="3">Upper Left (3)</SelectItem>
                              <SelectItem value="4">Lower Left (4)</SelectItem>
                              <SelectItem value="5">Lower Anterior (5)</SelectItem>
                              <SelectItem value="6">Lower Right (6)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>



                    {/* Notes Section */}
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="notes">Personal Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes || ''}
                        onChange={(e) => updateFormData('notes', e.target.value)}
                        placeholder="Add any personal notes about this treatment..."
                        rows={4}
                        className="resize-y min-h-[100px]"
                        ref={notesRef}
                        onKeyDown={(e) => {
                          // Prevent modal from closing on Enter
                          e.stopPropagation();
                        }}
                      />
                    </div>
                  </>
                )}

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <Card className="p-4 bg-red-50 border-red-200">
                    <h4 className="text-red-800 font-medium mb-2">Please fix the following errors:</h4>
                    <ul className="list-disc list-inside text-red-700 space-y-1">
                      {validationErrors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Cost Summary */}
                {selectedCode && (
                  <Card className={`p-4 ${isWLZPatient && selectedCode.code !== 'U35' ? 'bg-purple-50 border-purple-200' : 'bg-green-50 border-green-200'}`}>
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => setShowCostDetails(!showCostDetails)}
                    >
                      <div className="flex items-center gap-2">
                        {showCostDetails ? (
                          <ChevronUp className={`h-4 w-4 ${isWLZPatient && selectedCode.code !== 'U35' ? 'text-purple-800' : 'text-green-800'}`} />
                        ) : (
                          <ChevronDown className={`h-4 w-4 ${isWLZPatient && selectedCode.code !== 'U35' ? 'text-purple-800' : 'text-green-800'}`} />
                        )}
                        <h4 className={`font-medium ${isWLZPatient && selectedCode.code !== 'U35' ? 'text-purple-800' : 'text-green-800'}`}>
                          Total Cost
                        </h4>
                      </div>
                      <p className={`text-2xl font-bold ${isWLZPatient && selectedCode.code !== 'U35' ? 'text-purple-900' : 'text-green-900'}`}>
                        €{(formData.cost || calculatedCost).toFixed(2)}
                      </p>
                    </div>

                    {/* Collapsible Cost Details */}
                    {showCostDetails && (
                      <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="technicalCosts">Technical Costs (€)</Label>
                            <Input
                              id="technicalCosts"
                              type="number"
                              step={0.01}
                              min={0}
                              value={formData.technicalCosts || ''}
                              onChange={(e) => updateFormData('technicalCosts', parseFloat(e.target.value) || null)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="materialCosts">Material Costs (€)</Label>
                            <Input
                              id="materialCosts"
                              type="number"
                              step={0.01}
                              min={0}
                              value={formData.materialCosts || ''}
                              onChange={(e) => updateFormData('materialCosts', parseFloat(e.target.value) || null)}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="cost">Custom Total Cost (€)</Label>
                            <Input
                              id="cost"
                              type="number"
                              step={0.01}
                              min={0}
                              value={formData.cost || ''}
                              onChange={(e) => updateFormData('cost', parseFloat(e.target.value) || null)}
                              placeholder={`Calculated: €${calculatedCost.toFixed(2)}`}
                            />
                            <p className="text-sm text-gray-500">
                              Leave empty to use calculated cost: €{calculatedCost.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {isWLZPatient && selectedCode.code !== 'U35' && (
                      <p className="text-sm text-purple-700 mt-1">
                        Cost set to €0 due to Long-term Care Act (WLZ) rules
                      </p>
                    )}
                    {formData.cost !== calculatedCost && !isWLZPatient && (
                      <p className="text-sm text-green-700 mt-1">
                        Calculated cost: €{calculatedCost.toFixed(2)} (overridden)
                      </p>
                    )}
                  </Card>
                )}
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || (!selectedCode && !isPaid)}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPaid ? 'Update Notes' : treatmentData ? 'Update Treatment' : 'Add Treatment'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* C002 Enhanced Modal */}
      {selectedCode?.code === 'C002' && patient && (
        <C002CheckupModal
          isOpen={showC002Modal}
          onClose={handleC002Close}
          onSave={handleC002Save}
          patient={patient}
          c002Code={selectedCode}
          isPaid={isPaid}
          onOpenAsaModal={onOpenAsaModal}
          onOpenPpsModal={onOpenPpsModal}
          onOpenScreeningRecallModal={onOpenScreeningRecallModal}
          onRefresh={onRefresh}
        />
      )}
    </>
  );
} 