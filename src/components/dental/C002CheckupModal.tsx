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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
  Eye,
  Calendar,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { treatmentTypes } from '@/data/treatmentTypes';
import { getSubsurfacesForMainSurface, mapSubsurfaceToMainSurface, getToothType } from '@/components/dental/DentalChart';

interface DentalCode {
  id: string;
  code: string;
  description: string;
  basePrice?: number;
  [key: string]: any;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  asaHistory: Array<{
    id: string;
    score: number;
    notes: string;
    date: string;
    createdBy: string;
  }>;
  ppsHistory: Array<{
    id: string;
    quadrant1: number;
    quadrant2: number;
    quadrant3: number;
    quadrant4: number;
    treatment: 'NONE' | 'PREVENTIVE' | 'PERIODONTAL';
    notes: string;
    date: string;
    createdBy: string;
  }>;
  screeningRecallHistory: Array<{
    id: string;
    screeningMonths: number;
    notes: string;
    date: string;
    createdBy: string;
  }>;
  carePlan?: {
    careRequest: string;
    careGoal: string;
    policy: string;
  };
}

interface C002CheckupData {
  // Anamnesis
  hasComplaints: boolean;
  complaints: string;
  healthChanges: boolean;
  healthChangesDetails: string;

  // Dental Examination
  cariesFindings: string;
  hygieneLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  parafunctioning: boolean;
  parafunctioningDetails: string;
  mucosalAbnormalities: boolean;
  mucosalAbnormalitiesDetails: string;
  teethWear: boolean;
  teethWearDetails: string;
  otherFindings: string;

  // Policy
  recallTerm: number;
  additionalAppointments: Array<{
    type: string;
    description: string;
    duration: number;
  }>;
  carePlanNotes: string;
  otherNotes: string;

  // Standard treatment data
  codeId: string;
  notes: string;
  cost?: number;
  sessions?: number;
  technicalCosts?: number;
  materialCosts?: number;
  id?: string;
  status?: string;
  date?: string;
}

interface C002CheckupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: C002CheckupData) => Promise<void>;
  patient: Patient;
  c002Code: DentalCode;
  isPaid?: boolean;
  onOpenAsaModal?: () => void;
  onOpenPpsModal?: () => void;
  onOpenScreeningRecallModal?: () => void;
  onRefresh?: () => Promise<any>; // Fix type to match refetch
}

// Surface mapping for dental notation
const SURFACE_MAPPING = {
  'o': 'occlusal',
  'd': 'distal',
  'm': 'mesial',
  'b': 'buccal',
  'l': 'lingual', // always canonical
  'f': 'buccal',
  'p': 'lingual', // treat 'p' as 'lingual' for logic
  'i': 'occlusal',
  'c': 'occlusal'
};

// Filling codes by surface count and material
const FILLING_CODES = {
  1: { amalgam: 'V71', glasionomeer: 'V81', composite: 'V91' },
  2: { amalgam: 'V72', glasionomeer: 'V82', composite: 'V92' },
  3: { amalgam: 'V73', glasionomeer: 'V83', composite: 'V93' },
  4: { amalgam: 'V74', glasionomeer: 'V84', composite: 'V94' }
};

// Helper to map surface for upper/lower jaw
function getCorrectSurfaceName(surface: string, toothNumber: number): string {
  const quadrant = Math.floor(toothNumber / 10);
  // Always use 'lingual' as canonical; only use 'palatal' for display in Q1/Q2
  if (surface === 'lingual' && (quadrant === 1 || quadrant === 2)) return 'palatal';
  // Never map 'palatal' to 'lingual' for logic; only for display
  return surface;
}

export function C002CheckupModal({
  isOpen,
  onClose,
  onSave,
  patient,
  c002Code,
  isPaid = false,
  onOpenAsaModal,
  onOpenPpsModal,
  onOpenScreeningRecallModal,
  onRefresh
}: C002CheckupModalProps) {
  const [formData, setFormData] = useState<C002CheckupData>({
    hasComplaints: false,
    complaints: '',
    healthChanges: false,
    healthChangesDetails: '',
    cariesFindings: '',
    hygieneLevel: 'GOOD',
    parafunctioning: false,
    parafunctioningDetails: '',
    mucosalAbnormalities: false,
    mucosalAbnormalitiesDetails: '',
    teethWear: false,
    teethWearDetails: '',
    otherFindings: '',
    recallTerm: 6,
    additionalAppointments: [],
    carePlanNotes: '',
    otherNotes: '',
    codeId: c002Code.id,
    notes: '',
    sessions: 1,
    technicalCosts: 0,
    materialCosts: 0
  });

  const [loading, setLoading] = useState(false);
  const [showTreatmentDetails, setShowTreatmentDetails] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [fillingInput, setFillingInput] = useState('');
  const [fillingMaterial, setFillingMaterial] = useState<'composite' | 'glasionomeer' | 'amalgam'>('composite');
  const [fillingAnesthesia, setFillingAnesthesia] = useState(false);
  const [fillingC022, setFillingC022] = useState(false);
  const [allDetectedFillings, setAllDetectedFillings] = useState<any[]>([]);
  const [showAsaSubModal, setShowAsaSubModal] = useState(false);
  const [showPpsSubModal, setShowPpsSubModal] = useState(false);
  const [showRecallSubModal, setShowRecallSubModal] = useState(false);
  const [showFillingModal, setShowFillingModal] = useState(false);

  // Add state for temporary values that will be shown in buttons
  const [tempAsaData, setTempAsaData] = useState<{ score: number | null; notes: string } | null>(null);
  const [tempPpsData, setTempPpsData] = useState<{ scores: number[] | null; treatment: string; notes: string } | null>(null);
  const [tempRecallData, setTempRecallData] = useState<{ months: number; notes: string } | null>(null);

  // Refs for auto-focus
  const complaintsRef = useRef<HTMLTextAreaElement>(null);
  const healthChangesRef = useRef<HTMLTextAreaElement>(null);
  const parafunctioningRef = useRef<HTMLTextAreaElement>(null);
  const mucosalAbnormalitiesRef = useRef<HTMLTextAreaElement>(null);
  const teethWearRef = useRef<HTMLTextAreaElement>(null);

  // Get latest ASA data for hover tooltip (prioritize temp data)
  const getLatestAsaData = () => {
    if (tempAsaData) {
      return {
        score: tempAsaData.score,
        date: 'Pending',
        notes: tempAsaData.notes
      };
    }
    if (!patient?.asaHistory || patient.asaHistory.length === 0) {
      return { score: null, date: null, notes: null };
    }
    const latest = patient.asaHistory.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    return {
      score: latest.score,
      date: new Date(latest.date).toLocaleDateString(),
      notes: latest.notes
    };
  };

  // Get latest PPS data for hover tooltip (prioritize temp data)
  const getLatestPpsData = () => {
    if (tempPpsData) {
      return {
        scores: tempPpsData.scores,
        date: 'Pending',
        notes: tempPpsData.notes
      };
    }
    if (!patient?.ppsHistory || patient.ppsHistory.length === 0) {
      return { scores: null, date: null, notes: null };
    }
    const latest = patient.ppsHistory.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    return {
      scores: [latest.quadrant1, latest.quadrant2, latest.quadrant3, latest.quadrant4],
      date: new Date(latest.date).toLocaleDateString(),
      notes: latest.notes
    };
  };

  // Get latest recall term for default value (prioritize temp data)
  const getLatestRecallTerm = () => {
    if (tempRecallData) {
      return tempRecallData.months;
    }
    if (!patient?.screeningRecallHistory || patient.screeningRecallHistory.length === 0) {
      return 6; // Default 6 months
    }
    const latest = patient.screeningRecallHistory.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    return latest.screeningMonths;
  };

  // Parse filling notation like "17dob" -> tooth 17, surfaces d,o,b
  const parseFillingNotation = (input: string) => {
    const match = input.match(/^(\d{1,2})([dobmlipfc]+)$/i);
    if (!match) return null;

    const [, toothNumber, surfaceString] = match;
    const tooth = parseInt(toothNumber);

    // Validate tooth number (FDI notation)
    const validTeeth = [
      ...Array.from({ length: 8 }, (_, i) => 11 + i), // 11-18
      ...Array.from({ length: 8 }, (_, i) => 21 + i), // 21-28  
      ...Array.from({ length: 8 }, (_, i) => 31 + i), // 31-38
      ...Array.from({ length: 8 }, (_, i) => 41 + i), // 41-48
      ...Array.from({ length: 5 }, (_, i) => 51 + i), // 51-55
      ...Array.from({ length: 5 }, (_, i) => 61 + i), // 61-65
      ...Array.from({ length: 5 }, (_, i) => 71 + i), // 71-75
      ...Array.from({ length: 5 }, (_, i) => 81 + i), // 81-85
    ];

    if (!validTeeth.includes(tooth)) return null;

    // Parse surfaces as canonical
    let surfaces = [...surfaceString.toLowerCase()]
      .map(s => SURFACE_MAPPING[s])
      .filter(Boolean);

    // Quadrant-specific swaps
    const quadrant = Math.floor(tooth / 10);
    const toothType = getToothType(tooth);
    if (quadrant === 2) {
      if (toothType === 'molar') {
        // Swap buccal <-> lingual, mesial <-> distal for molars
        surfaces = surfaces.map(s => {
          if (s === 'buccal') return 'lingual';
          if (s === 'lingual') return 'buccal';
          if (s === 'mesial') return 'distal';
          if (s === 'distal') return 'mesial';
          return s;
        });
      } else {
        // For non-molars, do NOT swap buccal/lingual or mesial/distal
        // (leave surfaces as parsed)
      }
    } else if (quadrant === 3) {
      // Swap mesial <-> distal only for molars
      surfaces = surfaces.map(s => {
        if (toothType === 'molar') {
          if (s === 'mesial') return 'distal';
          if (s === 'distal') return 'mesial';
        }
        return s;
      });
    }

    return {
      tooth,
      surfaces,
      surfaceCount: surfaces.length
    };
  };

  // Get filling code based on surface count and material
  const getFillingCode = async (surfaceCount: number, material: string = 'composite') => {
    const maxSurfaces = Math.min(surfaceCount, 4);
    const codeKey = FILLING_CODES[maxSurfaces]?.[material] || FILLING_CODES[maxSurfaces]?.composite;

    if (!codeKey) return null;

    try {
      const response = await fetch(`/api/dental-codes?search=${codeKey}`);
      const data = await response.json();
      return data.find((code: DentalCode) => code.code === codeKey);
    } catch {
      return null;
    }
  };

  // Create dental procedure
  const createDentalProcedure = async (patientId: string, codeId: string, toothNumber: number, notes: string, status: string = 'PENDING', subSurfaces?: string[], fillingMaterial?: string) => {
    await fetch(`/api/patients/${patientId}/dental-procedures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codeId,
        toothNumber,
        notes,
        status,
        date: new Date().toISOString().split('T')[0],
        subSurfaces: subSurfaces || [],
        fillingMaterial: fillingMaterial || 'composite',
      }),
    });
  };

  // Initialize form with latest data
  useEffect(() => {
    if (isOpen) {
      const latestRecall = getLatestRecallTerm();
      setFormData(prev => ({
        ...prev,
        recallTerm: latestRecall
      }));

      // Reset temporary data when modal opens
      setTempAsaData(null);
      setTempPpsData(null);
      setTempRecallData(null);
    }
  }, [isOpen, patient]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save temporary data permanently if it exists
      if (tempAsaData) {
        try {
          await fetch(`/api/patients/${patient.id}/asa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: tempAsaData.score, notes: tempAsaData.notes })
          });
        } catch (e) {
          console.warn('Failed to save ASA data:', e);
        }
      }

      if (tempPpsData) {
        try {
          await fetch(`/api/patients/${patient.id}/pps`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quadrant1: tempPpsData.scores![0],
              quadrant2: tempPpsData.scores![1],
              quadrant3: tempPpsData.scores![2],
              quadrant4: tempPpsData.scores![3],
              treatment: tempPpsData.treatment as 'NONE' | 'PREVENTIVE' | 'PERIODONTAL',
              notes: tempPpsData.notes
            })
          });
        } catch (e) {
          console.warn('Failed to save PPS data:', e);
        }
      }

      if (tempRecallData) {
        try {
          await fetch(`/api/patients/${patient.id}/screening-recall`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ screeningMonths: tempRecallData.months, notes: tempRecallData.notes })
          });
        } catch (e) {
          console.warn('Failed to save recall data:', e);
        }
      }

      // Create clean notes from form data
      const notes = [
        formData.hasComplaints && formData.complaints ? `Complaints: ${formData.complaints}` : null,
        formData.healthChanges && formData.healthChangesDetails ? `Health changes: ${formData.healthChangesDetails}` : null,
        formData.cariesFindings ? `Caries findings: ${formData.cariesFindings}` : null,
        formData.hygieneLevel !== 'GOOD' ? `Hygiene level: ${formData.hygieneLevel}` : null,
        formData.parafunctioning && formData.parafunctioningDetails ? `Parafunctioning: ${formData.parafunctioningDetails}` : null,
        formData.mucosalAbnormalities && formData.mucosalAbnormalitiesDetails ? `Mucosal abnormalities: ${formData.mucosalAbnormalitiesDetails}` : null,
        formData.teethWear && formData.teethWearDetails ? `Teeth wear: ${formData.teethWearDetails}` : null,
        formData.otherFindings ? `Other findings: ${formData.otherFindings}` : null,
        formData.carePlanNotes ? `Care plan notes: ${formData.carePlanNotes}` : null,
        formData.otherNotes ? `Other notes: ${formData.otherNotes}` : null
      ].filter(Boolean).join('; ');

      // Clean up form data for C002 procedure
      const cleanFormData = {
        ...formData,
        notes: notes
      };

      // Remove recallTerm from C002 POST to avoid overwriting recall history
      const { recallTerm, ...c002Data } = cleanFormData;

      // Instead of saving to the backend, just call onSave with the cleaned data
      await onSave(c002Data as C002CheckupData);

      // Clear temporary data after successful save
      setTempAsaData(null);
      setTempPpsData(null);
      setTempRecallData(null);

      // Refresh patient data to show updated ASA, PPS, and Recall values
      if (onRefresh) {
        try {
          await onRefresh();
        } catch (error) {
          console.warn('Failed to refresh patient data:', error);
        }
      }

      toast.success('C002 checkup saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving C002 checkup:', error);
      toast.error('Failed to save checkup');
    } finally {
      setLoading(false);
    }
  };

  // Update form data
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle caries findings input
  const handleCariesFindingsChange = (value: string) => {
    setFormData(prev => ({ ...prev, cariesFindings: value }));

    // Parse all filling notations in the input
    const allFillings = parseAllFillings(value);
    setAllDetectedFillings(allFillings);
  };

  // Parse all filling notations in caries findings
  const parseAllFillings = (findings: string) => {
    const parts = findings.split(/[,\s]+/);
    const fillings: any[] = [];

    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed) {
        const fillingMatch = parseFillingNotation(trimmed);
        if (fillingMatch) {
          fillings.push(fillingMatch);
        }
      }
    });

    return fillings;
  };

  const getFillingNote = (tooth: number, mainSurfaces: string[]) => {
    const surfaceMap: Record<string, string> = {
      occlusal: 'o',
      distal: 'd',
      mesial: 'm',
      buccal: 'b',
      palatal: 'l',
      lingual: 'l',
    };
    // Remove duplicates, preserve order
    const codes = mainSurfaces.map(s => surfaceMap[s] || s[0]).join('');
    return `${tooth}${codes}`;
  };

  // Handle filling creation
  const handleCreateFilling = async () => {
    if (!allDetectedFillings || allDetectedFillings.length === 0) return;
    setLoading(true);
    try {
      for (const filling of allDetectedFillings) {
        let allSubsurfaces: string[] = [];
        for (const mainSurface of filling.surfaces) {
          allSubsurfaces.push(...getSubsurfacesForMainSurface(mainSurface, filling.tooth));
        }
        const uniqueSubsurfaces = [...new Set(allSubsurfaces)];
        // Derive main surfaces from uniqueSubsurfaces
        const mainSurfaces = Array.from(new Set(uniqueSubsurfaces.map(subsurface => getCorrectSurfaceName(mapSubsurfaceToMainSurface(subsurface, filling.tooth), filling.tooth))));
        const fillingCode = await getFillingCode(filling.surfaceCount, fillingMaterial);
        if (fillingCode) {
          const materialDisplay = fillingMaterial === 'glasionomeer' ? 'glass ionomer' : fillingMaterial;
          const fillingNotes = getFillingNote(filling.tooth, mainSurfaces);
          await createDentalProcedure(patient.id, fillingCode.id, filling.tooth, fillingNotes, 'PENDING', uniqueSubsurfaces, fillingMaterial);
          // Add anesthesia if selected (applies to all for now)
          if (fillingAnesthesia) {
            try {
              const response = await fetch('/api/dental-codes?search=A10');
              const data = await response.json();
              const anesthesiaCode = data.find((code: DentalCode) => code.code === 'A10');
              if (anesthesiaCode) {
                const anesthesiaNotes = `Local anesthesia for tooth ${filling.tooth}`;
                await createDentalProcedure(patient.id, anesthesiaCode.id, filling.tooth, anesthesiaNotes, 'PENDING', uniqueSubsurfaces);
              }
            } catch (error) {
              console.error('Error creating anesthesia procedure:', error);
            }
          }
          // Add C022 if selected (applies to all for now)
          if (fillingC022) {
            try {
              const response = await fetch('/api/dental-codes?search=C022');
              const data = await response.json();
              const c022Code = data.find((code: DentalCode) => code.code === 'C022');
              if (c022Code) {
                await createDentalProcedure(patient.id, c022Code.id, filling.tooth, 'C022', 'PENDING', uniqueSubsurfaces);
              }
            } catch (error) {
              console.error('Error creating C022 procedure:', error);
            }
          }
        }
      }
      toast.success(`Added ${allDetectedFillings.length} fillings to treatment plan`);
      setFillingMaterial('composite');
      setFillingAnesthesia(false);
      setFillingC022(false);
      setAllDetectedFillings([]);
      setShowFillingModal(false); // Close filling modal after successful addition
      // Trigger refresh of procedures
      if (onRefresh) {
        try {
          await onRefresh();
        } catch (error) {
          console.warn('Failed to refresh patient data after filling:', error);
        }
      }
    } catch (error) {
      toast.error('Failed to create fillings');
    } finally {
      setLoading(false);
    }
  };

  // Add appointment to list
  const addAppointment = () => {
    setFormData(prev => ({
      ...prev,
      additionalAppointments: [
        ...prev.additionalAppointments,
        {
          type: '',
          description: '',
          duration: 30, // Always present
        }
      ]
    }));
  };

  // Update appointment
  const updateAppointment = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      additionalAppointments: prev.additionalAppointments.map((app, i) =>
        i === index ? { ...app, [field]: value } : app
      )
    }));
  };

  // Remove appointment
  const removeAppointment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalAppointments: prev.additionalAppointments.filter((_, i) => i !== index)
    }));
  };

  // Auto-focus textboxes when checkboxes are checked
  useEffect(() => {
    if (formData.hasComplaints && complaintsRef.current) {
      complaintsRef.current.focus();
    }
  }, [formData.hasComplaints]);

  useEffect(() => {
    if (formData.healthChanges && healthChangesRef.current) {
      healthChangesRef.current.focus();
    }
  }, [formData.healthChanges]);

  useEffect(() => {
    if (formData.parafunctioning && parafunctioningRef.current) {
      parafunctioningRef.current.focus();
    }
  }, [formData.parafunctioning]);

  useEffect(() => {
    if (formData.mucosalAbnormalities && mucosalAbnormalitiesRef.current) {
      mucosalAbnormalitiesRef.current.focus();
    }
  }, [formData.mucosalAbnormalities]);

  useEffect(() => {
    if (formData.teethWear && teethWearRef.current) {
      teethWearRef.current.focus();
    }
  }, [formData.teethWear]);

  const latestAsa = getLatestAsaData();
  const latestPps = getLatestPpsData();

  // Add state for PPS quadrants, ASA, recall, and notes toggle
  const [asaScore, setAsaScore] = useState('');
  const [asaNotes, setAsaNotes] = useState('');
  const [ppsQuadrant1, setPpsQuadrant1] = useState(1);
  const [ppsQuadrant2, setPpsQuadrant2] = useState(1);
  const [ppsQuadrant3, setPpsQuadrant3] = useState(1);
  const [ppsQuadrant4, setPpsQuadrant4] = useState(1);
  const [ppsTreatment, setPpsTreatment] = useState<'NONE' | 'PREVENTIVE' | 'PERIODONTAL'>('NONE');
  const [ppsNotes, setPpsNotes] = useState('');
  const [recallTerm, setRecallTerm] = useState(6);
  const [recallNotes, setRecallNotes] = useState('');
  const [showRecallNotes, setShowRecallNotes] = useState(false);

  // Prefill ASA, PPS, Recall when submodals open
  useEffect(() => {
    if (showAsaSubModal) {
      const latest = patient.asaHistory?.[0]?.score;
      setAsaScore(latest ? String(latest) : '');
      setAsaNotes(patient.asaHistory?.[0]?.notes || '');
    }
  }, [showAsaSubModal, patient]);

  useEffect(() => {
    if (showPpsSubModal) {
      const latest = patient.ppsHistory?.[0];
      setPpsQuadrant1(latest?.quadrant1 ?? 1);
      setPpsQuadrant2(latest?.quadrant2 ?? 1);
      setPpsQuadrant3(latest?.quadrant3 ?? 1);
      setPpsQuadrant4(latest?.quadrant4 ?? 1);
      setPpsTreatment(latest?.treatment || 'NONE');
      setPpsNotes(latest?.notes || '');
    }
  }, [showPpsSubModal, patient]);

  useEffect(() => {
    if (showRecallSubModal) {
      const latest = patient.screeningRecallHistory?.[0];
      setRecallTerm(latest?.screeningMonths ?? 6);
      setRecallNotes(latest?.notes || '');
      setShowRecallNotes(false);
    }
  }, [showRecallSubModal, patient]);

  const handleAsaSubmit = async () => {
    setLoading(true);
    try {
      // Store temporary data instead of saving immediately
      setTempAsaData({ score: Number(asaScore), notes: asaNotes });
      toast.success('ASA score updated (will be saved with C002)');
      setShowAsaSubModal(false);
    } catch (e) {
      toast.error('Failed to update ASA');
    } finally {
      setLoading(false);
    }
  };
  const handlePpsSubmit = async () => {
    setLoading(true);
    try {
      // Store temporary data instead of saving immediately
      setTempPpsData({
        scores: [ppsQuadrant1, ppsQuadrant2, ppsQuadrant3, ppsQuadrant4],
        treatment: ppsTreatment,
        notes: ppsNotes
      });
      toast.success('PPS assessment updated (will be saved with C002)');
      setShowPpsSubModal(false);
    } catch (e) {
      toast.error('Failed to update PPS');
    } finally {
      setLoading(false);
    }
  };
  const handleRecallSubmit = async () => {
    setLoading(true);
    try {
      // Store temporary data instead of saving immediately
      setTempRecallData({ months: recallTerm, notes: recallNotes });

      // Update formData.recallTerm to match the submodal value
      updateFormData('recallTerm', recallTerm);

      toast.success('Screening recall updated (will be saved with C002)');
      setShowRecallSubModal(false);
    } catch (e) {
      toast.error('Failed to update recall');
    } finally {
      setLoading(false);
    }
  };

  // Add new state for per-filling options
  const [fillingOptions, setFillingOptions] = useState<any[]>([]);

  // Update fillingOptions whenever allDetectedFillings changes
  useEffect(() => {
    setFillingOptions(
      allDetectedFillings.map((filling, idx) => fillingOptions[idx] || {
        material: 'composite',
        anesthesia: false,
        c022: false,
      })
    );
    // eslint-disable-next-line
  }, [allDetectedFillings.length]);

  // Update per-filling option
  const updateFillingOption = (idx: number, field: string, value: any) => {
    setFillingOptions(opts => opts.map((opt, i) => i === idx ? { ...opt, [field]: value } : opt));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-blue-500 shadow-2xl"
          hideCloseButton={showAsaSubModal || showPpsSubModal || showRecallSubModal}
        >
          {showAsaSubModal ? (
            <>
              <DialogHeader>
                <DialogTitle>ASA Assessment</DialogTitle>
                <DialogDescription>
                  Record the latest ASA (American Society of Anesthesiologists) score for {patient.firstName} {patient.lastName}.
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>ASA Score</Label>
                  <Select
                    value={asaScore}
                    onValueChange={setAsaScore}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select ASA score" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">ASA 1</SelectItem>
                      <SelectItem value="2">ASA 2</SelectItem>
                      <SelectItem value="3">ASA 3</SelectItem>
                      <SelectItem value="4">ASA 4</SelectItem>
                      <SelectItem value="5">ASA 5</SelectItem>
                      <SelectItem value="6">ASA 6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={asaNotes}
                    onChange={(e) => setAsaNotes(e.target.value)}
                    placeholder="Any additional notes for the ASA assessment..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAsaSubModal(false);
                  }}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleAsaSubmit} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save ASA
                  </Button>
                </div>
              </div>
            </>
          ) : showPpsSubModal ? (
            <>
              <DialogHeader>
                <DialogTitle>PPS Assessment</DialogTitle>
                <DialogDescription>
                  Record the latest PPS (Perioperative Predictive Score) for {patient.firstName} {patient.lastName}.
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
                  <div className="space-y-2">
                    <Label>Q1</Label>
                    <Input
                      type="number"
                      min={0}
                      max={3}
                      value={ppsQuadrant1}
                      onChange={e => {
                        const value = Number(e.target.value);
                        if (e.target.value === '' || (value >= 0 && value <= 3)) {
                          setPpsQuadrant1(value || null);
                        }
                      }}
                      onKeyDown={e => {
                        // Allow: backspace, delete, tab, escape, enter, and navigation keys
                        if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode)) {
                          return;
                        }
                        // Allow only 0-3
                        if (!/[0-3]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      tabIndex={1}
                      autoFocus={true}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Q2</Label>
                    <Input
                      type="number"
                      min={0}
                      max={3}
                      value={ppsQuadrant2}
                      onChange={e => {
                        const value = Number(e.target.value);
                        if (e.target.value === '' || (value >= 0 && value <= 3)) {
                          setPpsQuadrant2(value || null);
                        }
                      }}
                      onKeyDown={e => {
                        // Allow: backspace, delete, tab, escape, enter, and navigation keys
                        if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode)) {
                          return;
                        }
                        // Allow only 0-3
                        if (!/[0-3]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      tabIndex={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Q4</Label>
                    <Input
                      type="number"
                      min={0}
                      max={3}
                      value={ppsQuadrant4}
                      onChange={e => {
                        const value = Number(e.target.value);
                        if (e.target.value === '' || (value >= 0 && value <= 3)) {
                          setPpsQuadrant4(value || null);
                        }
                      }}
                      onKeyDown={e => {
                        // Allow: backspace, delete, tab, escape, enter, and navigation keys
                        if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode)) {
                          return;
                        }
                        // Allow only 0-3
                        if (!/[0-3]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      tabIndex={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Q3</Label>
                    <Input
                      type="number"
                      min={0}
                      max={3}
                      value={ppsQuadrant3}
                      onChange={e => {
                        const value = Number(e.target.value);
                        if (e.target.value === '' || (value >= 0 && value <= 3)) {
                          setPpsQuadrant3(value || null);
                        }
                      }}
                      onKeyDown={e => {
                        // Allow: backspace, delete, tab, escape, enter, and navigation keys
                        if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(e.keyCode)) {
                          return;
                        }
                        // Allow only 0-3
                        if (!/[0-3]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      tabIndex={3}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Recommended Treatment</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="pps-treatment-none"
                        name="pps-treatment"
                        value="NONE"
                        checked={ppsTreatment === 'NONE'}
                        onChange={(e) => setPpsTreatment(e.target.value as 'NONE' | 'PREVENTIVE' | 'PERIODONTAL')}
                        className="rounded"
                      />
                      <Label htmlFor="pps-treatment-none">No further treatment necessary</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="pps-treatment-preventive"
                        name="pps-treatment"
                        value="PREVENTIVE"
                        checked={ppsTreatment === 'PREVENTIVE'}
                        onChange={(e) => setPpsTreatment(e.target.value as 'NONE' | 'PREVENTIVE' | 'PERIODONTAL')}
                        className="rounded"
                      />
                      <Label htmlFor="pps-treatment-preventive">Preventive treatment</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="pps-treatment-periodontal"
                        name="pps-treatment"
                        value="PERIODONTAL"
                        checked={ppsTreatment === 'PERIODONTAL'}
                        onChange={(e) => setPpsTreatment(e.target.value as 'NONE' | 'PREVENTIVE' | 'PERIODONTAL')}
                        className="rounded"
                      />
                      <Label htmlFor="pps-treatment-periodontal">Periodontal treatment</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={ppsNotes}
                    onChange={e => setPpsNotes(e.target.value)}
                    placeholder="Any additional notes for the PPS assessment..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={e => { e.preventDefault(); e.stopPropagation(); setShowPpsSubModal(false); }}>Cancel</Button>
                  <Button type="button" onClick={handlePpsSubmit} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save PPS</Button>
                </div>
              </div>
            </>
          ) : showRecallSubModal ? (
            <>
              <DialogHeader>
                <DialogTitle>Screening Recall</DialogTitle>
                <DialogDescription>
                  Record the latest screening recall period for {patient.firstName} {patient.lastName}.
                </DialogDescription>
              </DialogHeader>

              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Screening Recall (Months)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={recallTerm}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      setRecallTerm(newValue || null);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowRecallNotes(v => !v)}>
                    {showRecallNotes ? 'Hide Notes' : 'Show Notes'}
                  </Button>
                  {showRecallNotes && (
                    <Textarea
                      value={recallNotes}
                      onChange={e => setRecallNotes(e.target.value)}
                      placeholder="Any additional notes for the screening recall..."
                      rows={3}
                    />
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={e => { e.preventDefault(); e.stopPropagation(); setShowRecallSubModal(false); }}>Cancel</Button>
                  <Button type="button" onClick={handleRecallSubmit} disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Screening Recall</Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600">{c002Code.code}</Badge>
                    <DialogTitle className="text-lg font-semibold">Periodic Checkup Consultation</DialogTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTreatmentDetails(!showTreatmentDetails)}
                    className="flex items-center gap-1"
                  >
                    <span className="text-xs">Treatment Details</span>
                    {showTreatmentDetails ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <DialogDescription>
                  Comprehensive dental checkup with anamnesis, examination, and policy planning
                </DialogDescription>
              </DialogHeader>

              {/* Treatment Details (Hidden by default) */}
              {showTreatmentDetails && (
                <div className="p-4 bg-gray-50 rounded-lg mb-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Sessions</Label>
                      <Input
                        type="number"
                        min={1}
                        value={formData.sessions || ''}
                        onChange={(e) => updateFormData('sessions', parseInt(e.target.value) || null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Technical Costs (€)</Label>
                      <Input
                        type="number"
                        step={0.01}
                        min={0}
                        value={formData.technicalCosts || ''}
                        onChange={(e) => updateFormData('technicalCosts', parseFloat(e.target.value) || null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Material Costs (€)</Label>
                      <Input
                        type="number"
                        step={0.01}
                        min={0}
                        value={formData.materialCosts || ''}
                        onChange={(e) => updateFormData('materialCosts', parseFloat(e.target.value) || null)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Personal Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => updateFormData('notes', e.target.value)}
                      placeholder="Any additional personal notes..."
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Quick Actions Bar */}
                <div className="sticky top-0 z-10 flex items-center gap-2 p-3 bg-blue-50 rounded-lg border-b border-blue-200">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowAsaSubModal(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          ASA: {latestAsa.score || 'N/A'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={-90} alignOffset={60} align="start" collisionPadding={16}>
                        <div className="space-y-1">
                          <p className="font-medium">Last ASA Assessment</p>
                          <p className="text-sm">Score: {latestAsa.score || 'N/A'}</p>
                          <p className="text-sm">Date: {latestAsa.date || 'N/A'}</p>
                          {latestAsa.notes && (
                            <p className="text-sm mt-1">{latestAsa.notes}</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowPpsSubModal(true);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          PPS: {latestPps.scores ? latestPps.scores.join('-') : 'N/A'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={-90} alignOffset={60} align="start" collisionPadding={16}>
                        <div className="space-y-1">
                          <p className="font-medium">Last PPS Assessment</p>
                          <p className="text-sm">Scores: {latestPps.scores ? latestPps.scores.join('-') : 'N/A'}</p>
                          <p className="text-sm">Date: {latestPps.date || 'N/A'}</p>
                          {latestPps.notes && (
                            <p className="text-sm mt-1">{latestPps.notes}</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowRecallSubModal(true);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Calendar className="h-4 w-4" />
                    Recall: {formData.recallTerm} months
                  </Button>
                </div>

                {/* A = Anamnesis Section */}
                <Card className="border-2 border-blue-200">
                  <div className="p-4 bg-blue-50">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600">A</Badge>
                      <h3 className="font-semibold">Anamnesis</h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Complaints */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="hasComplaints"
                          checked={formData.hasComplaints}
                          onCheckedChange={(checked) => updateFormData('hasComplaints', checked)}
                        />
                        <Label htmlFor="hasComplaints" className="font-medium">
                          Patient has complaints/pains/questions/wishes?
                        </Label>
                      </div>
                      {formData.hasComplaints && (
                        <Textarea
                          ref={complaintsRef}
                          value={formData.complaints}
                          onChange={(e) => updateFormData('complaints', e.target.value)}
                          placeholder="Describe patient complaints..."
                          rows={2}
                        />
                      )}
                    </div>

                    {/* Health Changes */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="healthChanges"
                          checked={formData.healthChanges}
                          onCheckedChange={(checked) => updateFormData('healthChanges', checked)}
                        />
                        <Label htmlFor="healthChanges" className="font-medium">
                          Changes in health since last visit?
                        </Label>
                      </div>
                      {formData.healthChanges && (
                        <Textarea
                          ref={healthChangesRef}
                          value={formData.healthChangesDetails}
                          onChange={(e) => updateFormData('healthChangesDetails', e.target.value)}
                          placeholder="Describe health changes..."
                          rows={2}
                        />
                      )}
                    </div>
                  </div>
                </Card>

                {/* O = Dental Examination Section */}
                <Card className="border-2 border-green-200">
                  <div className="p-4 bg-green-50">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600">O</Badge>
                      <h3 className="font-semibold">Dental Examination</h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Caries */}
                    <div className="space-y-2">
                      <Label className="font-medium">Caries Findings</Label>
                      <div className="relative">
                        <Textarea
                          value={formData.cariesFindings}
                          onChange={(e) => handleCariesFindingsChange(e.target.value)}
                          placeholder="New/progressed caries findings... (e.g., 17d, 14dob, 22mo)"
                          rows={2}
                        />
                        {allDetectedFillings.length > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setShowFillingModal(true)}
                            className="absolute right-2 top-2 h-6 w-6 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Hygiene Level */}
                    <div className="space-y-2">
                      <Label className="font-medium">Dental Hygiene Level</Label>
                      <Select
                        value={formData.hygieneLevel}
                        onValueChange={(value: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR') => {
                          updateFormData('hygieneLevel', value);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select hygiene level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EXCELLENT">Excellent</SelectItem>
                          <SelectItem value="GOOD">Good</SelectItem>
                          <SelectItem value="FAIR">Fair</SelectItem>
                          <SelectItem value="POOR">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Parafunctioning */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="parafunctioning"
                          checked={formData.parafunctioning}
                          onCheckedChange={(checked) => updateFormData('parafunctioning', checked)}
                        />
                        <Label htmlFor="parafunctioning" className="font-medium">
                          Parafunctioning (bruxism, clenching, etc.)
                        </Label>
                      </div>
                      {formData.parafunctioning && (
                        <Textarea
                          ref={parafunctioningRef}
                          value={formData.parafunctioningDetails}
                          onChange={(e) => updateFormData('parafunctioningDetails', e.target.value)}
                          placeholder="Describe parafunctioning..."
                          rows={2}
                        />
                      )}
                    </div>

                    {/* Mucosal Abnormalities */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="mucosalAbnormalities"
                          checked={formData.mucosalAbnormalities}
                          onCheckedChange={(checked) => updateFormData('mucosalAbnormalities', checked)}
                        />
                        <Label htmlFor="mucosalAbnormalities" className="font-medium">
                          Mucosal abnormalities
                        </Label>
                      </div>
                      {formData.mucosalAbnormalities && (
                        <Textarea
                          ref={mucosalAbnormalitiesRef}
                          value={formData.mucosalAbnormalitiesDetails}
                          onChange={(e) => updateFormData('mucosalAbnormalitiesDetails', e.target.value)}
                          placeholder="Describe mucosal abnormalities..."
                          rows={2}
                        />
                      )}
                    </div>

                    {/* Teeth Wear */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="teethWear"
                          checked={formData.teethWear}
                          onCheckedChange={(checked) => updateFormData('teethWear', checked)}
                        />
                        <Label htmlFor="teethWear" className="font-medium">
                          Teeth wear
                        </Label>
                      </div>
                      {formData.teethWear && (
                        <Textarea
                          ref={teethWearRef}
                          value={formData.teethWearDetails}
                          onChange={(e) => updateFormData('teethWearDetails', e.target.value)}
                          placeholder="Describe teeth wear..."
                          rows={2}
                        />
                      )}
                    </div>

                    {/* Other Findings */}
                    <div className="space-y-2">
                      <Label className="font-medium">Other Findings</Label>
                      <Textarea
                        value={formData.otherFindings}
                        onChange={(e) => updateFormData('otherFindings', e.target.value)}
                        placeholder="Any other interesting findings..."
                        rows={3}
                      />
                    </div>
                  </div>
                </Card>

                {/* B = Policy Section */}
                <Card className="border-2 border-purple-200">
                  <div className="p-4 bg-purple-50">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-600">B</Badge>
                      <h3 className="font-semibold">Policy</h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Additional Appointments */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Additional Appointments</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAppointmentModal(true)}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Add Appointment
                        </Button>
                      </div>

                      {formData.additionalAppointments.map((appointment, index) => (
                        <div key={index} className="p-3 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Appointment {index + 1}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeAppointment(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Select
                              value={appointment.type}
                              onValueChange={(value) => {
                                const selectedTreatmentType = treatmentTypes.find(t => t.id === value);
                                if (selectedTreatmentType) {
                                  updateAppointment(index, 'type', selectedTreatmentType.id);
                                }
                              }}
                            >
                              <SelectTrigger>
                                <span className="flex items-center gap-2">
                                  {appointment.type && (
                                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: treatmentTypes.find(t => t.id === appointment.type)?.color }} />
                                  )}
                                  {appointment.type ? treatmentTypes.find(t => t.id === appointment.type)?.name : 'Select treatment type'}
                                </span>
                              </SelectTrigger>
                              <SelectContent>
                                {treatmentTypes.map(t => (
                                  <SelectItem key={t.id} value={t.id}>
                                    <span className="flex items-center gap-2">
                                      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: t.color }} />
                                      {t.name}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Input
                              value={appointment.description || ''}
                              onChange={(e) => updateAppointment(index, 'description', e.target.value)}
                              placeholder="Description"
                            />

                            <Input
                              value={typeof appointment.duration === 'number' ? appointment.duration : 30}
                              className="pointer-events-none"
                              placeholder="Duration"
                              disabled
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Care Plan Notes */}
                    <div className="space-y-2">
                      <Label className="font-medium">Care Plan Notes</Label>
                      <Textarea
                        value={formData.carePlanNotes}
                        onChange={(e) => updateFormData('carePlanNotes', e.target.value)}
                        placeholder="Notes for short-term care plan..."
                        rows={2}
                      />
                    </div>

                    {/* Other Notes */}
                    <div className="space-y-2">
                      <Label className="font-medium">Other Notes</Label>
                      <Textarea
                        value={formData.otherNotes}
                        onChange={(e) => updateFormData('otherNotes', e.target.value)}
                        placeholder="Any other notes for patient or staff..."
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPaid ? 'Update Notes' : 'Save C002 Checkup'}
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Filling Modal */}
          <Dialog open={showFillingModal} onOpenChange={() => setShowFillingModal(false)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Filling</DialogTitle>
                <DialogDescription>
                  {allDetectedFillings.length} filling{allDetectedFillings.length > 1 ? 's' : ''} detected
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {allDetectedFillings.map((filling, idx) => (
                  <div key={idx} className="border rounded p-2 mb-2">
                    <div className="font-medium mb-1">Tooth {filling.tooth}, {filling.surfaces.join(', ')}</div>
                    <div className="flex gap-2 items-center mb-1">
                      <Label className="w-20">Material</Label>
                      <Select value={fillingOptions[idx]?.material || 'composite'} onValueChange={v => updateFillingOption(idx, 'material', v)}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="composite">Composite</SelectItem>
                          <SelectItem value="glasionomeer">Glass Ionomer</SelectItem>
                          <SelectItem value="amalgam">Amalgam</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <Checkbox id={`anesthesia-${idx}`} checked={!!fillingOptions[idx]?.anesthesia} onCheckedChange={checked => updateFillingOption(idx, 'anesthesia', checked === true)} />
                        <Label htmlFor={`anesthesia-${idx}`}>A10</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id={`c022-${idx}`} checked={!!fillingOptions[idx]?.c022} onCheckedChange={checked => updateFillingOption(idx, 'c022', checked === true)} />
                        <Label htmlFor={`c022-${idx}`}>C022</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFillingModal(false);
                }}>
                  Cancel
                </Button>
                <Button type="button" onClick={async () => {
                  setLoading(true);
                  try {
                    for (let idx = 0; idx < allDetectedFillings.length; idx++) {
                      const filling = allDetectedFillings[idx];
                      const opts = fillingOptions[idx] || {};
                      let allSubsurfaces = [];
                      for (const mainSurface of filling.surfaces) {
                        allSubsurfaces.push(...getSubsurfacesForMainSurface(mainSurface, filling.tooth));
                      }
                      const uniqueSubsurfaces = [...new Set(allSubsurfaces)];
                      // Derive main surfaces from uniqueSubsurfaces
                      const mainSurfaces = Array.from(new Set(uniqueSubsurfaces.map(subsurface => getCorrectSurfaceName(mapSubsurfaceToMainSurface(subsurface, filling.tooth), filling.tooth))));
                      const fillingCode = await getFillingCode(filling.surfaceCount, opts.material || 'composite');
                      if (fillingCode) {
                        const materialDisplay = opts.material === 'glasionomeer' ? 'glass ionomer' : opts.material;
                        const fillingNotes = getFillingNote(filling.tooth, mainSurfaces);
                        const payload = {
                          codeId: fillingCode.id,
                          toothNumber: filling.tooth,
                          notes: fillingNotes,
                          status: 'PENDING',
                          subSurfaces: uniqueSubsurfaces,
                          fillingMaterial: opts.material,
                          date: new Date().toISOString().split('T')[0]
                        };
                        await fetch(`/api/patients/${patient.id}/dental-procedures`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(payload)
                        });
                        // Additional codes
                        if (opts.anesthesia) {
                          const response = await fetch('/api/dental-codes?search=A10');
                          const data = await response.json();
                          const anesthesiaCode = data.find((code: DentalCode) => code.code === 'A10');
                          if (anesthesiaCode) {
                            // DO NOT include fillingMaterial here
                            const anesthesiaPayload = {
                              codeId: anesthesiaCode.id,
                              toothNumber: filling.tooth,
                              notes: `Local anesthesia`,
                              status: 'PENDING',
                              subSurfaces: uniqueSubsurfaces,
                              date: new Date().toISOString().split('T')[0]
                            };
                            await fetch(`/api/patients/${patient.id}/dental-procedures`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(anesthesiaPayload)
                            });
                          }
                        }
                        if (opts.c022) {
                          const response = await fetch('/api/dental-codes?search=C022');
                          const data = await response.json();
                          const c022Code = data.find((code: DentalCode) => code.code === 'C022');
                          if (c022Code) {
                            // DO NOT include fillingMaterial here
                            const c022Payload = {
                              codeId: c022Code.id,
                              toothNumber: filling.tooth,
                              notes: 'C022',
                              status: 'PENDING',
                              subSurfaces: uniqueSubsurfaces,
                              date: new Date().toISOString().split('T')[0]
                            };
                            await fetch(`/api/patients/${patient.id}/dental-procedures`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(c022Payload)
                            });
                          }
                        }
                      }
                    }
                    toast.success(`Added ${allDetectedFillings.length} fillings to treatment plan`);
                    setShowFillingModal(false);
                    setFillingMaterial('composite');
                    setFillingAnesthesia(false);
                    setFillingC022(false);
                    setAllDetectedFillings([]);
                    // Trigger refresh of procedures to update dental chart
                    if (onRefresh) {
                      try {
                        await onRefresh();
                      } catch (error) {
                        console.warn('Failed to refresh patient data after filling:', error);
                      }
                    }
                  } catch (error) {
                    toast.error('Failed to create fillings');
                  } finally {
                    setLoading(false);
                  }
                }} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Filling
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Appointment Modal */}
          <Dialog open={showAppointmentModal} onOpenChange={() => setShowAppointmentModal(false)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Pending Appointment</DialogTitle>
                <DialogDescription>
                  Create a pending appointment for {patient.firstName} {patient.lastName}
                </DialogDescription>
              </DialogHeader>

              <AddPendingAppointmentSubmodal
                onAdd={(appointment) => {
                  setFormData(prev => ({
                    ...prev,
                    additionalAppointments: [...prev.additionalAppointments, appointment]
                  }));
                  setShowAppointmentModal(false);
                }}
                onCancel={() => setShowAppointmentModal(false)}
              />
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Add this component at the bottom of the file (before export if needed)
function AddPendingAppointmentSubmodal({ onAdd, onCancel }: { onAdd: (appointment: any) => void, onCancel: () => void }) {
  const [selectedType, setSelectedType] = React.useState<string>('');
  const [duration, setDuration] = React.useState<number>(30);
  const [description, setDescription] = React.useState<string>('');

  React.useEffect(() => {
    const found = treatmentTypes.find(t => t.id === selectedType);
    if (found) setDuration(found.duration);
  }, [selectedType]);

  const selectedTypeObj = treatmentTypes.find(t => t.id === selectedType);

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        if (!selectedTypeObj) return;
        onAdd({
          type: selectedTypeObj.id,
          duration,
          description,
          status: 'PENDING',
        });
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label>Treatment Type</Label>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger>
            <span className="flex items-center gap-2">
              {selectedTypeObj && (
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: selectedTypeObj.color }} />
              )}
              {selectedTypeObj ? selectedTypeObj.name : 'Select treatment type'}
            </span>
          </SelectTrigger>
          <SelectContent>
            {treatmentTypes.map(t => (
              <SelectItem key={t.id} value={t.id}>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: t.color }} />
                  {t.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Duration (minutes)</Label>
        <Input
          type="number"
          min={5}
          step={5}
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description"
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!selectedTypeObj}>
          Add Appointment
        </Button>
      </div>
    </form>
  );
} 