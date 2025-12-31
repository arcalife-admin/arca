import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Edit, Trash2, Plus, Calendar, Euro, ChevronDown, ChevronUp, CreditCard, FileText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { TreatmentModal } from '@/components/dental/TreatmentModal'
import { PaymentModal } from '@/components/patients/PaymentModal'
import { BudgetModal } from '@/components/patients/BudgetModal'

interface DentalCode {
  id: string;
  code: string;
  description: string;
  points: number | null;
  rate: number | null;
  category: string;
}

interface DentalProcedure {
  id: string;
  patientId: string;
  codeId: string;
  date: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  code: DentalCode;
  practitioner?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  toothNumber?: number;
  quantity?: number;
  // Payment fields
  isPaid?: boolean;
  paymentAmount?: number;
  paymentMethod?: 'CASH' | 'CARD';
  paidAt?: string;
  invoiceEmail?: boolean;
  invoicePrinted?: boolean;
  // Cost fields
  cost?: number;
}

interface ShopPurchase {
  id: string;
  patientId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  notes?: string;
  isPaid: boolean;
  paymentMethod?: 'CASH' | 'CARD';
  paidAt?: string;
  product: {
    id: string;
    name: string;
    description?: string;
    category?: string;
  };
  createdAt: string;
}

interface Patient {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: {
    display_name: string;
  };
}

interface Organization {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

interface TreatmentPlanProps {
  patientId: string;
  procedures: DentalProcedure[];
  onProcedureAdded: () => void;
  onProcedureUpdated: () => void;
  onProcedureDeleted: () => void;
  activeTab: 'history' | 'current' | 'plan';
  onTabChange: (tab: 'history' | 'current' | 'plan') => void;
  pendingProcedureId?: string | null;
  onPendingHandled?: () => void;
  patientAge?: number; // For determining jaw options
  patient?: Patient; // For budget generation
  organization?: Organization; // For budget generation
  onEmailBudget?: (pdfBlob: Blob, filename: string) => void; // For email integration
  onOpenAsaModal?: () => void;
  onOpenPpsModal?: () => void;
  onOpenScreeningRecallModal?: () => void;
  onRefresh?: () => Promise<any>; // Fix type to match refetch
}

export function TreatmentPlan({
  patientId,
  procedures,
  onProcedureAdded,
  onProcedureUpdated,
  onProcedureDeleted,
  activeTab,
  onTabChange,
  pendingProcedureId,
  onPendingHandled,
  patientAge = 18,
  patient,
  organization,
  onEmailBudget,
  onOpenAsaModal,
  onOpenPpsModal,
  onOpenScreeningRecallModal,
  onRefresh
}: TreatmentPlanProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<DentalProcedure | null>(null);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const [availableCodes, setAvailableCodes] = useState<DentalCode[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [proceduresToPay, setProceduresToPay] = useState<DentalProcedure[]>([]);

  // Undo stack to support Ctrl+Z restore
  const [undoStack, setUndoStack] = useState<DentalProcedure[][]>([]);

  // State for tracking expanded procedure groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // State for tracking disabled teeth dropdown expansion
  const [disabledTeethExpanded, setDisabledTeethExpanded] = useState(false);

  // Shop purchases state
  const [shopPurchases, setShopPurchases] = useState<ShopPurchase[]>([]);

  // Budget modal state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);

  // Fetch available dental codes
  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const response = await fetch('/api/dental-codes');
        const data = await response.json();
        setAvailableCodes(data);
      } catch (error) {
        console.error('Failed to load dental codes:', error);
        toast.error('Failed to load dental codes');
      }
    };
    fetchCodes();
  }, []);

  // Load shop purchases
  useEffect(() => {
    const loadShopPurchases = async () => {
      try {
        const response = await fetch(`/api/patients/${patientId}/shop-purchases`);
        if (response.ok) {
          const data = await response.json();
          setShopPurchases(data);
        }
      } catch (error) {
        console.error('Failed to load shop purchases:', error);
      }
    };

    if (patientId) {
      loadShopPurchases();
    }
  }, [patientId, procedures]);

  // Helper: visible procedures based on active tab
  const visibleProcedures = activeTab === 'history' ?
    procedures.filter(p => p.status === 'COMPLETED' || p.code.code === 'DISABLED') :
    activeTab === 'current' ?
      procedures.filter(p => p.status === 'IN_PROGRESS' && p.code.code !== 'DISABLED') :
      procedures.filter(p => p.status === 'PENDING' && p.code.code !== 'DISABLED');

  // Separate disabled teeth procedures for history tab
  const disabledTeethProcedures = activeTab === 'history' ?
    visibleProcedures.filter(p => p.code.code === 'DISABLED') : [];
  const regularProcedures = activeTab === 'history' ?
    visibleProcedures.filter(p => p.code.code !== 'DISABLED') : visibleProcedures;

  // Shop purchases are shown in current tab (paid purchases)
  const visibleShopPurchases: ShopPurchase[] = [];


  // Helper function to get all related procedures for a given procedure
  const getRelatedProcedureIds = (procedureId: string): string[] => {
    const procedureGroups = groupProcedures(visibleProcedures, activeTab);

    for (const group of procedureGroups) {
      if (group.isGroup) {
        // Check if this procedure is the main procedure
        if (group.mainProcedure.id === procedureId) {
          return group.relatedProcedures.map(p => p.id);
        }
        // Check if this procedure is one of the related procedures
        if (group.relatedProcedures.some(p => p.id === procedureId)) {
          return [group.mainProcedure.id, ...group.relatedProcedures.map(p => p.id)];
        }
      }
    }
    return [];
  };

  // Helper function to check if a procedure is a main procedure in a group
  const isMainProcedureInGroup = (procedureId: string): boolean => {
    const procedureGroups = groupProcedures(visibleProcedures, activeTab);
    return procedureGroups.some(group =>
      group.isGroup && group.mainProcedure.id === procedureId
    );
  };

  const isSelected = (id: string) => selectedProcedures.includes(id);

  const toggleSelect = (id: string) => {
    setSelectedProcedures(prev => {
      const isCurrentlySelected = prev.includes(id);
      const relatedIds = getRelatedProcedureIds(id);

      if (isCurrentlySelected) {
        // Deselecting - remove this procedure and its related procedures
        if (isMainProcedureInGroup(id)) {
          // If deselecting main procedure, deselect all related ones too
          return prev.filter(selectedId =>
            selectedId !== id && !relatedIds.includes(selectedId)
          );
        } else {
          // If deselecting a related procedure, only deselect that one
          return prev.filter(selectedId => selectedId !== id);
        }
      } else {
        // Selecting - add this procedure and related ones if it's a main procedure
        if (isMainProcedureInGroup(id)) {
          // If selecting main procedure, select all related ones too
          return Array.from(new Set([...prev, id, ...relatedIds]));
        } else {
          // If selecting a related procedure, only select that one
          return [...prev, id];
        }
      }
    });
  };

  const clearSelection = () => setSelectedProcedures([]);

  // Payment functions
  const handlePaySelected = () => {
    const selected = visibleProcedures.filter(p =>
      selectedProcedures.includes(p.id) && !p.isPaid && p.code.rate && p.code.rate > 0
    );

    if (selected.length === 0) {
      toast.error('Please select unpaid procedures with valid pricing');
      return;
    }

    setProceduresToPay(selected);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    // Refresh procedures to show updated payment status
    onProcedureUpdated();
    clearSelection();
    setShowPaymentModal(false);
    setProceduresToPay([]);
  };

  // Helper function to check if a procedure can be paid
  const canBePaid = (procedure: DentalProcedure) => {
    return !procedure.isPaid && procedure.code.rate && procedure.code.rate > 0;
  };

  // Get selected procedures that can be paid
  const selectedPayableProcedures = visibleProcedures.filter(p =>
    selectedProcedures.includes(p.id) && canBePaid(p)
  );

  const selectedPayableAmount = selectedPayableProcedures.reduce((sum, proc) =>
    sum + ((proc.code.rate || 0) * (proc.quantity || 1)), 0
  );

  // Select-all logic for current tab - considers all procedures including grouped ones
  const allSelected = visibleProcedures.length > 0 && visibleProcedures.every(p => selectedProcedures.includes(p.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      // Deselect only those currently visible
      setSelectedProcedures(prev => prev.filter(id => !visibleProcedures.some(p => p.id === id)));
    } else {
      // Add all visible ids to selection (including all procedures in groups)
      setSelectedProcedures(prev => Array.from(new Set([...prev, ...visibleProcedures.map(p => p.id)])));
    }
  };

  // Clear selection when switching tabs
  useEffect(() => {
    clearSelection();
  }, [activeTab]);

  // Debug: Track when procedures change
  useEffect(() => {
    procedures.forEach(p => {
    });
  }, [procedures, activeTab]);

  // Scroll to bottom when procedures change (showing latest)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [procedures, activeTab]);

  // Handle pending procedure (just added via quick-add)
  // For history tab we do NOT open the edit modal – the item should just be added silently.
  useEffect(() => {
    if (pendingProcedureId && procedures.length) {
      const newly = procedures.find(p => p.id === pendingProcedureId);
      if (newly) {
        if (activeTab === 'history') {
          // For history tab, just mark as handled without opening modal
          onPendingHandled && onPendingHandled();
        } else {
          // For other tabs, open the edit modal
          setSelectedProcedure(newly);
          setShowEditModal(true);
          onPendingHandled && onPendingHandled();
        }
      }
    }
  }, [pendingProcedureId, procedures, activeTab]);

  // Handle saving new treatment
  const handleSaveNewTreatment = async (treatmentData: any) => {
    try {
      const response = await fetch(`/api/patients/${patientId}/dental-procedures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          codeId: treatmentData.codeId,
          toothNumber: treatmentData.toothNumber,
          jaw: treatmentData.jaw,
          surface: treatmentData.surface,
          quadrant: treatmentData.quadrant,
          timeMultiplier: treatmentData.timeMultiplier,
          surfaces: treatmentData.surfaces,
          roots: treatmentData.roots,
          elements: treatmentData.elements,
          sessions: treatmentData.sessions,
          jawHalf: treatmentData.jawHalf,
          sextant: treatmentData.sextant,
          technicalCosts: treatmentData.technicalCosts,
          materialCosts: treatmentData.materialCosts,
          cost: treatmentData.cost,
          notes: treatmentData.notes,
          status: activeTab === 'history' ? 'COMPLETED' : activeTab === 'current' ? 'IN_PROGRESS' : 'PENDING',
          date: new Date().toISOString().split('T')[0]
        }),
      });

      const result = await response.json();
      if (result && result.procedure && result.procedure.id) {
        setUndoStack(prev => [...prev, [result.procedure]]);
      }

      onProcedureAdded();
    } catch (error) {
      console.error('Error saving treatment:', error);
      throw error;
    }
  };

  // Handle updating existing treatment
  const handleUpdateTreatment = async (treatmentData: any) => {
    if (!selectedProcedure) return;

    try {
      const response = await fetch(`/api/patients/${patientId}/dental-procedures/${selectedProcedure.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...treatmentData,
        }),
      });

      if (!response.ok) throw new Error('Failed to update treatment');

      const result = await response.json();
      if (result && result.id) {
        setUndoStack(prev => [...prev, [result]]);
      }

      setSelectedProcedure(null);
      onProcedureUpdated();
    } catch (error) {
      console.error('Error updating treatment:', error);
      throw error;
    }
  };

  const performDelete = async (proceduresToDelete: DentalProcedure[]) => {
    if (proceduresToDelete.length === 0) return;

    // Push to undo stack
    setUndoStack(prev => [...prev, proceduresToDelete]);

    try {
      // Delete procedures from database
      await Promise.all(
        proceduresToDelete.map(p => fetch(`/api/patients/${patientId}/dental-procedures/${p.id}`, { method: 'DELETE' }))
      );

      // Clean up dental chart visual data for procedures that have tooth/surface information
      const proceduresWithToothData = proceduresToDelete.filter(p =>
        p.toothNumber && (
          p.code?.code === 'DISABLED' || // Disabled procedures
          p.notes?.includes('surface') ||
          p.code?.code?.startsWith('V') ||
          p.code?.code?.startsWith('R') || // All crown/bridge codes
          p.code?.code?.startsWith('H') || // All extraction codes (H11, H35, H33, H34, H21, H26)
          p.code?.code?.startsWith('T') || // All scaling codes (T021, T022)
          p.notes?.includes('crown') ||
          p.notes?.includes('bridge') ||
          p.notes?.includes('abutment') ||
          p.notes?.includes('pontic') ||
          p.notes?.includes('extraction') ||
          p.notes?.includes('Trekken') ||
          p.notes?.includes('Moeizaam') ||
          p.notes?.includes('Hemisectie') ||
          p.notes?.includes('Vrijleggen') ||
          p.notes?.includes('scaling')
        )
      );

      if (proceduresWithToothData.length > 0) {
        try {
          // Get current dental data
          const dentalResponse = await fetch(`/api/patients/${patientId}/dental`);
          if (dentalResponse.ok) {
            const dentalData = await dentalResponse.json();
            const currentChart = dentalData.dentalChart || { teeth: {}, toothTypes: {} };

            // Clean up visual data for deleted procedures
            const updatedChart = { ...currentChart };

            proceduresWithToothData.forEach(procedure => {
              const toothNumber = procedure.toothNumber;
              if (toothNumber && updatedChart.teeth[toothNumber]) {
                const toothData = updatedChart.teeth[toothNumber];
                // Remove procedures from the tooth's procedure list
                if (toothData.procedures) {
                  toothData.procedures = toothData.procedures.filter(proc => {
                    // Remove procedures that match the deleted procedure type (filling variants)
                    if (procedure.code?.code?.startsWith('V')) {
                      return !(proc.type && proc.type.startsWith('filling'));
                    }
                    return true;
                  });
                }
                // Clean up surface and zone data for filling procedures
                if (procedure.code?.code?.startsWith('V')) {
                  let surfacesToRemove = [];
                  // Extract surfaces from notes (e.g., (mesial, distal, occlusal))
                  const surfaceMatch = procedure.notes?.match(/\(([^)]+)\)/);
                  if (surfaceMatch) {
                    surfacesToRemove = surfaceMatch[1].split(',').map(s => s.trim().toLowerCase());
                  } else {
                    // Fallback: look for common surface names in notes
                    const surfaceWords = ['mesial', 'distal', 'occlusal', 'buccal', 'lingual', 'palatal', 'incisal'];
                    surfaceWords.forEach(surface => {
                      if (procedure.notes?.toLowerCase().includes(surface)) {
                        surfacesToRemove.push(surface);
                      }
                    });
                  }
                  // Remove from both surfaces and zones
                  surfacesToRemove.forEach(surface => {
                    const surfaceVariations = [surface, surface.charAt(0)];
                    surfaceVariations.forEach(variant => {
                      if (toothData.surfaces && toothData.surfaces[variant] &&
                        typeof toothData.surfaces[variant] === 'string' &&
                        toothData.surfaces[variant].startsWith('filling')) {
                        delete toothData.surfaces[variant];
                      }
                      if (toothData.zones && toothData.zones[variant] &&
                        typeof toothData.zones[variant] === 'string' &&
                        toothData.zones[variant].startsWith('filling')) {
                        delete toothData.zones[variant];
                      }
                    });
                  });
                }
                // Clean up crown and bridge procedures (wholeTooth data)
                if ((procedure.code?.code?.startsWith('R') ||
                  procedure.notes?.includes('crown') ||
                  procedure.notes?.includes('bridge') ||
                  procedure.notes?.includes('abutment') ||
                  procedure.notes?.includes('pontic')) && toothData.wholeTooth) {

                  // If this is a bridge procedure, check if we need to clean up the entire bridge
                  if (procedure.notes?.includes('bridge')) {
                    const bridgeIdMatch = procedure.notes?.match(/bridge[- ]([^\s]+)/i);
                    if (bridgeIdMatch) {
                      const bridgeId = bridgeIdMatch[1];

                      // Clean up all teeth in the same bridge
                      Object.entries(updatedChart.teeth).forEach(([fdi, status]) => {
                        if ((status as any)?.wholeTooth?.bridgeId === bridgeId) {
                          const wasPontic = (status as any)?.wholeTooth?.role === 'pontic';
                          const originalState = (status as any)?.wholeTooth?.originalState;

                          // Remove bridge data
                          delete (status as any).wholeTooth;

                          // For pontics, restore the original state
                          if (wasPontic) {
                            if (originalState === 'disabled') {
                              (status as any).isDisabled = true;
                            } else if (originalState === 'extraction') {
                              (status as any).wholeTooth = 'extraction';
                            }
                            // If originalState was 'missing', just leave it empty
                          }

                          // Clean up empty tooth data
                          if ((!(status as any).procedures || (status as any).procedures.length === 0) &&
                            (!(status as any).surfaces || Object.keys((status as any).surfaces || {}).length === 0) &&
                            !(status as any).wholeTooth &&
                            !(status as any).isDisabled) {
                            delete updatedChart.teeth[parseInt(fdi)];
                          }
                        }
                      });
                    }
                  } else if (typeof toothData.wholeTooth === 'object' && toothData.wholeTooth.type === 'crown') {
                    // Single crown procedure removal
                    delete toothData.wholeTooth;
                  }
                }

                // Clean up extraction procedures (wholeTooth data)
                if ((procedure.code?.code?.startsWith('H') ||
                  procedure.notes?.includes('extraction') ||
                  procedure.notes?.includes('Trekken') ||
                  procedure.notes?.includes('Moeizaam') ||
                  procedure.notes?.includes('Hemisectie') ||
                  procedure.notes?.includes('Vrijleggen')) && toothData.wholeTooth === 'extraction') {

                  // Remove extraction marking from tooth
                  delete toothData.wholeTooth;
                }

                // Clean up disabled procedures
                if (procedure.code?.code === 'DISABLED') {
                  // Remove disabled state and all disabled zones
                  delete toothData.isDisabled;
                  if (toothData.zones) {
                    Object.keys(toothData.zones).forEach(zone => {
                      if (toothData.zones[zone] === 'disabled') {
                        delete toothData.zones[zone];
                      }
                    });
                  }
                }

                // Clean up sealing procedures (occlusal surface data)
                if ((procedure.code?.code === 'V30' || procedure.code?.code === 'V35' ||
                  procedure.notes?.includes('Fissuurlak') ||
                  procedure.notes?.includes('fissuurlak')) && toothData.surfaces) {

                  // Remove sealing from occlusal surface (handles both old 'sealing' and new 'sealing-status' formats)
                  if (toothData.surfaces['occlusal'] === 'sealing' ||
                    (typeof toothData.surfaces['occlusal'] === 'string' && toothData.surfaces['occlusal'].startsWith('sealing'))) {
                    delete toothData.surfaces['occlusal'];
                  }
                }

                // Remove tooth data if no procedures, surfaces, zones, wholeTooth, or isDisabled remain
                if (
                  (!toothData.procedures || toothData.procedures.length === 0) &&
                  (!toothData.surfaces || Object.keys(toothData.surfaces).length === 0) &&
                  (!toothData.zones || Object.keys(toothData.zones).length === 0) &&
                  !toothData.wholeTooth &&
                  !toothData.isDisabled
                ) {
                  delete updatedChart.teeth[toothNumber];
                }
              }
            });

            // Update dental chart data
            await fetch(`/api/patients/${patientId}/dental`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ dentalChart: updatedChart })
            });

            // COMPREHENSIVE CLEANUP: Remove ALL visual bridge/crown data for teeth with no procedures
            // Fetch the updated procedures list to see what's actually left in the database
            const updatedProceduresResponse = await fetch(`/api/patients/${patientId}/dental-procedures`);
            if (updatedProceduresResponse.ok) {
              const remainingProcedures = await updatedProceduresResponse.json();

              // For each tooth that has bridge/crown visual data, check if there are actual procedures
              Object.entries(updatedChart.teeth).forEach(([fdi, toothData]) => {
                const toothNumber = parseInt(fdi);
                const toothStatus = toothData as any;

                // If this tooth has crown/bridge visual data
                if (toothStatus?.wholeTooth?.type === 'crown') {
                  // Check if there are any remaining procedures for this tooth that justify the crown/bridge
                  const hasRemainingCrownProcedures = remainingProcedures.some((proc: any) =>
                    proc.toothNumber === toothNumber && (
                      proc.code?.code?.startsWith('R') ||
                      proc.notes?.includes('crown') ||
                      proc.notes?.includes('bridge') ||
                      proc.notes?.includes('abutment') ||
                      proc.notes?.includes('pontic')
                    )
                  );

                  // If no procedures justify this crown/bridge, remove it and restore original state
                  if (!hasRemainingCrownProcedures) {
                    const wasPontic = toothStatus.wholeTooth.role === 'pontic';
                    const originalState = toothStatus.wholeTooth.originalState;

                    // Remove the crown/bridge visual data
                    delete toothStatus.wholeTooth;

                    // Restore original state for pontics
                    if (wasPontic) {
                      if (originalState === 'disabled') {
                        toothStatus.isDisabled = true;
                      } else if (originalState === 'extraction') {
                        toothStatus.wholeTooth = 'extraction';
                      }
                      // If originalState was 'missing', just leave it empty
                    }

                    // Clean up empty tooth data
                    if ((!toothStatus.procedures || toothStatus.procedures.length === 0) &&
                      (!toothStatus.surfaces || Object.keys(toothStatus.surfaces).length === 0) &&
                      !toothStatus.wholeTooth &&
                      !toothStatus.isDisabled) {
                      delete updatedChart.teeth[toothNumber];
                    }
                  }
                }

                // If this tooth has extraction visual data
                if (toothStatus?.wholeTooth === 'extraction') {
                  // Check if there are any remaining extraction procedures for this tooth
                  const hasRemainingExtractionProcedures = remainingProcedures.some((proc: any) =>
                    proc.toothNumber === toothNumber && (
                      proc.code?.code?.startsWith('H') ||
                      proc.notes?.includes('extraction') ||
                      proc.notes?.includes('Trekken') ||
                      proc.notes?.includes('Moeizaam') ||
                      proc.notes?.includes('Hemisectie') ||
                      proc.notes?.includes('Vrijleggen')
                    )
                  );

                  // If no procedures justify this extraction marking, remove it
                  if (!hasRemainingExtractionProcedures) {
                    delete toothStatus.wholeTooth;

                    // Clean up empty tooth data
                    if ((!toothStatus.procedures || toothStatus.procedures.length === 0) &&
                      (!toothStatus.surfaces || Object.keys(toothStatus.surfaces).length === 0) &&
                      !toothStatus.wholeTooth &&
                      !toothStatus.isDisabled) {
                      delete updatedChart.teeth[toothNumber];
                    }
                  }
                }

                // If this tooth has sealing markings (handles both old 'sealing' and new 'sealing-status' formats)
                const occlusalSurface = toothStatus?.surfaces?.occlusal;
                if (occlusalSurface === 'sealing' ||
                  (typeof occlusalSurface === 'string' && occlusalSurface.startsWith('sealing'))) {
                  // Check if there are any remaining sealing procedures for this tooth
                  const hasRemainingSealingProcedures = remainingProcedures.some((proc: any) =>
                    proc.toothNumber === toothNumber && (
                      proc.code?.code === 'V30' ||
                      proc.code?.code === 'V35' ||
                      proc.notes?.includes('Fissuurlak') ||
                      proc.notes?.includes('fissuurlak')
                    )
                  );

                  // If no sealing procedures remain, remove the sealing marking
                  if (!hasRemainingSealingProcedures) {
                    delete toothStatus.surfaces.occlusal;

                    // Clean up empty surfaces object
                    if (Object.keys(toothStatus.surfaces || {}).length === 0) {
                      delete toothStatus.surfaces;
                    }

                    // Clean up empty tooth data
                    if ((!toothStatus.procedures || toothStatus.procedures.length === 0) &&
                      (!toothStatus.surfaces || Object.keys(toothStatus.surfaces || {}).length === 0) &&
                      !toothStatus.wholeTooth &&
                      !toothStatus.isDisabled) {
                      delete updatedChart.teeth[toothNumber];
                    }
                  }
                }
              });

              // Save the cleaned chart again
              await fetch(`/api/patients/${patientId}/dental`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dentalChart: updatedChart })
              });
            }
          }
        } catch (error) {
          console.error('Error cleaning up dental chart data:', error);
          // Don't fail the whole deletion if chart cleanup fails
        }
      }

      toast.success(`${proceduresToDelete.length} procedure${proceduresToDelete.length > 1 ? 's' : ''} deleted`);
      clearSelection();
      onProcedureDeleted();

      // Force multiple refreshes to ensure chart cleanup is complete
      setTimeout(() => {
        onProcedureDeleted();
      }, 100);

      setTimeout(() => {
        onProcedureDeleted();
      }, 500);
    } catch (e) {
      toast.error('Failed to delete procedure(s)');
    }
  };

  const handleDeleteProcedure = (procedure: DentalProcedure) => {
    if (selectedProcedures.length > 1 && selectedProcedures.includes(procedure.id)) {
      const procs = procedures.filter(p => selectedProcedures.includes(p.id));
      performDelete(procs);
    } else {
      // Check if this is a bridge procedure
      if (procedure.notes?.includes('bridge')) {
        // Extract bridge ID from the notes - handle multiple formats
        const bridgeIdMatch = procedure.notes?.match(/bridge[- ]([^\s]+)/i) ||
          procedure.notes?.match(/BRIDGE-bridge-([^\s]+)/i) ||
          procedure.notes?.match(/BRIDGE-bridge-bridge-([^\s]+)/i);
        if (bridgeIdMatch) {
          const bridgeId = bridgeIdMatch[1];

          // Find all procedures that belong to the same bridge
          const bridgeProcedures = procedures.filter(p =>
            p.notes?.includes(`bridge-${bridgeId}`) ||
            p.notes?.includes(`bridge ${bridgeId}`) ||
            p.notes?.includes(`BRIDGE-${bridgeId}`) ||
            p.notes?.includes(`BRIDGE-bridge-${bridgeId}`) ||
            p.notes?.includes(`BRIDGE-bridge-bridge-${bridgeId}`)
          );

          if (bridgeProcedures.length > 1) {
            // Delete all bridge procedures together
            performDelete(bridgeProcedures);
            return;
          }
        }
      }

      // For non-bridge procedures or single bridge procedures, delete normally
      performDelete([procedure]);
    }
  };

  // Undo via Ctrl+Z
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        const last = undoStack.pop();
        if (last && last.length) {
          setUndoStack(prev => prev.slice(0, -1));
          Promise.all(
            last.map(p =>
              fetch('/api/dental-procedures/undo', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-entity-id': p.id
                }
              })
                .then(async res => {
                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    if (err && err.code) {
                      if (err.code === 'NO_LOG') toast.error('Nothing to undo.');
                      else if (err.code === 'NO_BACKUP_DELETE' || err.code === 'NO_BACKUP_EDIT') toast.error('Cannot restore, backup missing.');
                      else if (err.code === 'PROCEDURE_NOT_FOUND') toast.error('Procedure not found for undo.');
                      else if (err.code === 'UNAUTHORIZED') toast.error('You are not authorized to undo.');
                      else toast.error(err.error || 'Failed to undo');
                    } else {
                      toast.error('Failed to undo');
                    }
                    throw new Error(err.error || 'Failed to undo');
                  }
                  return res.json();
                })
            )
          )
            .then(() => {
              toast.success('Undo successful');
              onProcedureAdded();
            })
            .catch((error) => {
              console.error('Error during undo:', error);
            });
        }
      }

      // CTRL+Y handler for redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        fetch('/api/dental-procedures/redo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              if (err && err.code) {
                if (err.code === 'NO_UNDO_LOG') toast.error('Nothing to redo.');
                else if (err.code === 'ALREADY_PROCESSED') {
                  // This is expected when multiple requests arrive - just refresh the UI
                  toast.success('Redo completed');
                  onProcedureAdded(); // Refresh the procedures list
                }
                else if (err.code === 'NO_ORIGINAL_DATA') toast.error('Cannot redo, original data missing.');
                else if (err.code === 'PROCEDURE_NOT_FOUND') toast.error('Procedure not found for redo.');
                else if (err.code === 'UNAUTHORIZED') toast.error('You are not authorized to redo.');
                else toast.error(err.error || 'Failed to redo');
              } else {
                toast.error('Failed to redo');
              }
              throw new Error(err.error || 'Failed to redo');
            }
            return res.json();
          })
          .then(() => {
            toast.success('Redo successful');
            onProcedureAdded(); // Refresh the procedures list
          })
          .catch((error) => {
            console.error('Error during redo:', error);
          });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undoStack, patientId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return '--';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Helper to determine cost taking into account WLZ overrides
  const getProcedureCost = (procedure: DentalProcedure) => {
    if (typeof (procedure as any).cost === 'number') {
      return (procedure as any).cost;
    }
    return (procedure.code.rate || 0) * (procedure.quantity || 1);
  };

  const calculateTotalCost = (status: 'COMPLETED' | 'PENDING' | 'IN_PROGRESS' | 'CANCELLED') => {
    return procedures
      .filter(p => p.status === status && !p.isPaid) // Exclude paid procedures from total
      .reduce((total, procedure) => total + getProcedureCost(procedure), 0);
  };

  // Group related procedures (A10 anesthesia and C022 with main procedures, and crown procedures with related codes)
  const groupProcedures = (procedureList: DentalProcedure[], tabContext: 'history' | 'current' | 'plan') => {
    const groups: Array<{
      id: string;
      mainProcedure: DentalProcedure;
      relatedProcedures: DentalProcedure[];
      isGroup: boolean;
    }> = [];

    const processedIds = new Set<string>();

    // Sort by creation time to group procedures created together
    const sortedProcedures = [...procedureList].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // First pass: Group bridge procedures and their related codes
    const bridgeGroups = new Map<string, { main: DentalProcedure | null; others: DentalProcedure[] }>();

    sortedProcedures.forEach(procedure => {
      if (processedIds.has(procedure.id)) return;

      // More robust regex to capture bridge- followed by numbers
      const bridgeIdMatch = procedure.notes?.match(/(bridge-\d+)/i);
      const isBridgeProcedure = bridgeIdMatch || procedure.notes?.toLowerCase().includes('bridge');
      const bridgeId = bridgeIdMatch ? bridgeIdMatch[1] : null;

      if (isBridgeProcedure && bridgeId) {
        if (!bridgeGroups.has(bridgeId)) {
          bridgeGroups.set(bridgeId, { main: null, others: [] });
        }
        const groupEntry = bridgeGroups.get(bridgeId)!;

        if (procedure.notes?.startsWith('MAIN:')) {
          // If multiple MAIN procedures for the same bridgeId, take the first one encountered
          if (!groupEntry.main) {
            groupEntry.main = procedure;
          } else {
            groupEntry.others.push(procedure); // Treat subsequent MAIN as others
          }
        } else {
          groupEntry.others.push(procedure);
        }
        processedIds.add(procedure.id);
      }
    });

    // Create bridge groups from the collected data and sort them by main procedure creation time
    const bridgeGroupEntries = Array.from(bridgeGroups.entries()).map(([bridgeId, groupEntry]) => ({
      bridgeId,
      groupEntry,
      mainProcedure: groupEntry.main,
      creationTime: groupEntry.main ? new Date(groupEntry.main.createdAt).getTime() : 0
    }));

    // Sort bridge groups by their main procedure's creation time to maintain chronological order
    bridgeGroupEntries.sort((a, b) => a.creationTime - b.creationTime);

    bridgeGroupEntries.forEach(({ bridgeId, groupEntry }) => {
      if (groupEntry.main) {
        const mainProcedure = groupEntry.main;
        const relatedProcedures = [...groupEntry.others]; // Start with other bridge-related procedures

        // Note: Additional codes (A10, C022, R14, R49) are now included in the main procedure notes
        // so we don't need to look for separate procedures for these codes

        groups.push({
          id: `bridge-${bridgeId}`,
          mainProcedure,
          relatedProcedures,
          isGroup: true
        });
      } else if (groupEntry.others.length > 0) {
        // Fallback if no explicit MAIN procedure was found for a bridge
        const [first, ...rest] = groupEntry.others;
        groups.push({
          id: `bridge-${bridgeId}`,
          mainProcedure: first,
          relatedProcedures: rest,
          isGroup: true
        });
      }
    });

    // Second pass: Group remaining procedures (non-bridge or those not grouped in first pass)
    sortedProcedures.forEach(procedure => {
      if (processedIds.has(procedure.id)) return;

      // Check if this is a main procedure (V-codes except V35, crown codes, or other non A10/C022/R14/H21/H26 codes)
      // V35 can be a main procedure if there's no V30 in the same tab
      const isV35 = procedure.code.code === 'V35';
      const isMainProcedure = !['A10', 'C022', 'R14', 'H21', 'H26'].includes(procedure.code.code) &&
        !procedure.notes?.startsWith('BRIDGE-'); // Exclude bridge related procedures that might not have been grouped

      if (isMainProcedure) {
        const relatedProcedures: DentalProcedure[] = [];

        // Find related procedures (A10, C022, R14, H21, H26, V35)
        sortedProcedures.forEach(p => {
          if (p.id !== procedure.id && !processedIds.has(p.id)) {
            // Check if related by tooth number and creation time (within a small window)
            const isRelatedByTime = Math.abs(new Date(p.createdAt).getTime() - new Date(procedure.createdAt).getTime()) < 5000; // 5 seconds
            const isRelatedByTooth = p.toothNumber === procedure.toothNumber;

            if (isRelatedByTime && isRelatedByTooth && ['A10', 'C022', 'R14', 'H21', 'H26', 'V35'].includes(p.code.code)) {
              relatedProcedures.push(p);
              processedIds.add(p.id);
            }
          }
        });

        // Special handling for V30: also group V35 procedures from the same day and same tab context
        if (procedure.code.code === 'V30') {
          const today = new Date(procedure.date).toISOString().split('T')[0];

          sortedProcedures.forEach(p => {
            if (p.id !== procedure.id && !processedIds.has(p.id) && p.code.code === 'V35') {
              const procedureDate = new Date(p.date).toISOString().split('T')[0];
              // Only group V35 procedures that are in the same tab context
              const isSameTab = (tabContext === 'history' && p.status === 'COMPLETED') ||
                (tabContext === 'current' && p.status === 'IN_PROGRESS') ||
                (tabContext === 'plan' && p.status === 'PENDING');

              if (procedureDate === today && isSameTab) {
                relatedProcedures.push(p);
                processedIds.add(p.id);
              }
            }
          });
        }

        groups.push({
          id: procedure.id,
          mainProcedure: procedure,
          relatedProcedures,
          isGroup: relatedProcedures.length > 0
        });
        processedIds.add(procedure.id);
      } else if (isV35) {
        // V35 can be a main procedure if there's no V30 in the same tab
        // Check if there's a V30 in the same tab context
        const hasV30InSameTab = sortedProcedures.some(p =>
          p.code.code === 'V30' &&
          p.id !== procedure.id &&
          ((tabContext === 'history' && p.status === 'COMPLETED') ||
            (tabContext === 'current' && p.status === 'IN_PROGRESS') ||
            (tabContext === 'plan' && p.status === 'PENDING'))
        );

        if (!hasV30InSameTab) {
          // V35 can be a main procedure if no V30 exists in this tab
          groups.push({
            id: procedure.id,
            mainProcedure: procedure,
            relatedProcedures: [],
            isGroup: false
          });
          processedIds.add(procedure.id);
        }
      }
    });

    return groups;
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Helper function to check if a procedure is a filling (V-code)
  const isFilling = (procedure: DentalProcedure) => {
    return procedure.code.code.startsWith('V');
  };

  // Get the appropriate background color based on tab and procedure type
  const getProcedureBackgroundColor = (procedure: DentalProcedure, isSubProcedure = false) => {
    const filling = isFilling(procedure);

    // Paid procedures get a special muted appearance
    if (procedure.isPaid) {
      return isSubProcedure
        ? 'bg-gray-200 border-l-2 border-gray-400 opacity-60'
        : 'bg-gray-200 opacity-60';
    }

    if (isSubProcedure) {
      // Sub-procedures always get a muted gray background
      return 'bg-gray-50 border-l-2 border-gray-300';
    }


    // EXPLICIT COLOR LOGIC - Force colors based on current context
    if (activeTab === 'current' && filling) {
      return 'bg-blue-100';
    }

    if (activeTab === 'history' && filling) {
      return 'bg-gray-100';
    }

    if (activeTab === 'plan' && filling) {
      return 'bg-green-100';
    }

    // Non-filling procedures
    switch (activeTab) {
      case 'history':
        return 'bg-gray-50';
      case 'current':
        return 'bg-blue-50';
      case 'plan':
        return 'bg-green-50';
      default:
        return 'bg-gray-50';
    }
  };

  // Get the appropriate text color for procedure codes based on tab and procedure type
  const getProcedureCodeColor = (procedure: DentalProcedure) => {
    const filling = isFilling(procedure);

    // Crown procedures get special color styling (R24 = porcelain, R34 = gold)
    if (procedure.code.code.startsWith('R24') || procedure.code.code.startsWith('R34')) {
      return 'text-yellow-700';
    }

    // EXPLICIT TEXT COLOR LOGIC - Force colors based on current context
    if (activeTab === 'current' && filling) {
      return 'text-blue-600';
    }

    if (activeTab === 'history' && filling) {
      return 'text-gray-600';
    }

    if (activeTab === 'plan' && filling) {
      return 'text-green-600';
    }

    // Non-filling procedures
    switch (activeTab) {
      case 'history':
        return 'text-gray-500';
      case 'current':
        return 'text-blue-500';
      case 'plan':
        return 'text-green-500';
      default:
        return 'text-gray-600';
    }
  };

  const renderSingleProcedure = (procedure: DentalProcedure, isSubProcedure = false) => (
    <div
      className={`py-2 w-full text-xs ${isSubProcedure ? 'pl-8 pr-2' : 'px-2'} ${getProcedureBackgroundColor(procedure, isSubProcedure)}`}
      onDoubleClick={() => {
        if (!buttonClicked) {
          setSelectedProcedure(procedure);
          setShowEditModal(true);
        }
        setButtonClicked(false);
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* Top Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          {/* Only show checkbox for unpaid procedures */}
          {!procedure.isPaid && (
            <Checkbox className="mr-1" checked={isSelected(procedure.id)} onCheckedChange={() => toggleSelect(procedure.id)} />
          )}
          {/* Add spacing for paid procedures to maintain alignment */}
          {procedure.isPaid && <div className="w-5 mr-1" />}
          {/* Element Number */}
          <span className="font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs min-w-[30px] text-center">
            {procedure.toothNumber || '--'}
          </span>
          <span className={`font-semibold min-w-[45px] ${getProcedureCodeColor(procedure)}`}>{procedure.code.code}</span>
          <span className={`truncate max-w-[250px] ${procedure.isPaid ? 'text-gray-500' : 'text-gray-700'}`}>
            {procedure.code.description}
          </span>
          {/* Payment status indicator */}
          {procedure.isPaid && (
            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-semibold">
              PAID
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar className="w-4 h-4" />
            {new Date(procedure.date).toLocaleDateString()}
          </div>
          {/* Practitioner initials & cost are not shown in history tab */}
          {activeTab !== 'history' && (
            <>
              <span className="font-medium bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs">
                {getInitials(procedure.practitioner?.firstName, procedure.practitioner?.lastName)}
              </span>
              {/* Amount */}
              <span className="font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs min-w-[25px] text-center">
                {procedure.quantity || 1}
              </span>
              {getProcedureCost(procedure) > 0 && (
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <Euro className="h-3 w-3" />
                  <span className="text-sm font-medium">
                    €{getProcedureCost(procedure).toFixed(2)}
                  </span>
                </div>
              )}
            </>
          )}
          {/* Actions */}
          <div className="flex gap-1">
            <Button
              variant={procedure.isPaid ? "default" : "ghost"}
              size="icon"
              className={`h-6 w-6 ${procedure.isPaid ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
              onClick={() => {
                setButtonClicked(true);
                setSelectedProcedure(procedure);
                setShowEditModal(true);
              }}
              title={procedure.isPaid ? "Edit notes only" : "Edit procedure"}
            >
              <Edit className="w-4 h-4" />
            </Button>
            {/* Only show delete button for unpaid procedures */}
            {!procedure.isPaid && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setButtonClicked(true);
                  handleDeleteProcedure(procedure);
                }}
                title="Delete procedure"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Bottom Row - Notes */}
      {procedure.notes && (
        <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">
          {procedure.notes}
        </div>
      )}
    </div>
  );

  // Get card background color based on the main procedure
  const getCardBackgroundColor = (mainProcedure: DentalProcedure) => {
    return getProcedureBackgroundColor(mainProcedure, false);
  };

  const renderProcedureGroup = (group: any) => {
    if (!group.isGroup) {
      // Single procedure, render normally
      return (
        <Card key={group.id} className={`py-0 px-0 w-full rounded-none text-xs ${getCardBackgroundColor(group.mainProcedure)} ${isSelected(group.mainProcedure.id) ? 'ring-2 ring-blue-500' : ''}`}>
          {renderSingleProcedure(group.mainProcedure)}
        </Card>
      );
    }

    // Grouped procedures
    const isExpanded = expandedGroups.has(group.id);
    const mainSelected = isSelected(group.mainProcedure.id);
    const hasSelectedRelated = group.relatedProcedures.some((p: DentalProcedure) => isSelected(p.id));
    const allRelatedSelected = group.relatedProcedures.every((p: DentalProcedure) => isSelected(p.id));

    // Show ring when main is selected OR when all procedures in group are selected
    const showSelectionRing = mainSelected || (hasSelectedRelated && allRelatedSelected);

    return (
      <Card key={group.id} className={`py-0 px-0 w-full rounded-none text-xs ${getCardBackgroundColor(group.mainProcedure)} ${showSelectionRing ? 'ring-2 ring-blue-500' : ''}`}>

        {/* Main procedure with expand/collapse button */}
        <div className="flex items-center">
          <div className="flex-1">
            {renderSingleProcedure(group.mainProcedure)}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 mr-2"
            onClick={() => toggleGroupExpansion(group.id)}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Related procedures (collapsed by default) */}
        {isExpanded && group.relatedProcedures.map((procedure: DentalProcedure) => (
          <div key={procedure.id}>
            {renderSingleProcedure(procedure, true)}
          </div>
        ))}

        {/* Summary of collapsed procedures */}
        {!isExpanded && group.relatedProcedures.length > 0 && (
          <div className="px-2 pb-2 text-xs text-gray-500">
            + {group.relatedProcedures.length} related procedure{group.relatedProcedures.length > 1 ? 's' : ''} ({group.relatedProcedures.map((p: DentalProcedure) => p.code.code).join(', ')})
            {hasSelectedRelated && (
              <span className="ml-2 text-blue-600 font-medium">
                {group.relatedProcedures.filter((p: DentalProcedure) => isSelected(p.id)).length} selected
              </span>
            )}
          </div>
        )}

      </Card>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header: Tabs */}
      <div className="sticky top-0 bg-white z-20 border-b">
        <div className="grid w-full grid-cols-3 p-0 h-8 items-center">
          <button
            onClick={() => onTabChange('history')}
            className={`text-gray-600 font-bold px-4 py-1 ${activeTab === 'history' ? 'bg-gray-100' : ''}`}
          >
            History
          </button>
          <button
            onClick={() => onTabChange('current')}
            className={`text-blue-600 font-bold px-4 py-1 ${activeTab === 'current' ? 'bg-blue-100' : ''}`}
          >
            Current
          </button>
          <button
            onClick={() => onTabChange('plan')}
            className={`text-green-600 font-bold px-4 py-1 ${activeTab === 'plan' ? 'bg-green-100' : ''}`}
          >
            Plan
          </button>
        </div>
      </div>

      {/* Sticky Header: Select All */}
      <div className="sticky top-8 bg-white z-19 border-b">
        <div className="flex items-center gap-2 pl-2 py-1">
          <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
          <span className="text-sm">Select All</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-b-xl custom-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent'
        }}
      >
        <div className="space-y-0 rounded-b-xl">
          {activeTab === 'history' && (
            <>
              {/* Disabled Teeth Dropdown */}
              {disabledTeethProcedures.length > 0 && (
                <Card className="rounded-none border-b">
                  <button
                    onClick={() => setDisabledTeethExpanded(!disabledTeethExpanded)}
                    className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Disabled Teeth</span>
                      <span className="text-sm text-gray-500">({disabledTeethProcedures.length} tooth{disabledTeethProcedures.length !== 1 ? 's' : ''})</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${disabledTeethExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {disabledTeethExpanded && (
                    <div className="border-t bg-gray-50">
                      {disabledTeethProcedures.map(procedure => renderSingleProcedure(procedure))}
                    </div>
                  )}
                </Card>
              )}

              {/* Regular Dental procedures */}
              {regularProcedures.length === 0 ? (
                <Card className="p-4 text-center text-gray-500 rounded-none">
                  No old procedures
                </Card>
              ) : (
                groupProcedures(regularProcedures, activeTab).map(renderProcedureGroup)
              )}
            </>
          )}

          {activeTab === 'current' && (
            <>
              {/* Dental procedures */}
              {visibleProcedures.length === 0 ? (
                <Card className="p-4 text-center text-gray-500 rounded-none">
                  No current procedures
                </Card>
              ) : (
                groupProcedures(visibleProcedures, activeTab).map(renderProcedureGroup)
              )}
            </>
          )}

          {activeTab === 'plan' && (
            visibleProcedures.length === 0 ? (
              <Card className="p-4 text-center text-gray-500 rounded-none">
                No planned procedures
              </Card>
            ) : (
              groupProcedures(visibleProcedures, activeTab).map(renderProcedureGroup)
            )
          )}
        </div>
      </div>

      {/* Sticky Footer: Cost Bar (only for current & plan) */}
      {(activeTab === 'current' || activeTab === 'plan') && (
        <div className="sticky bottom-0 bg-white border-t z-20 rounded-b-xl">
          <div className="p-2 space-y-2">
            {/* Cost Summary */}
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">
                {activeTab === 'current' ? 'Total Current Cost:' : 'Total Planned Cost:'}
              </span>
              <span className="font-bold">
                €{calculateTotalCost(activeTab === 'current' ? 'IN_PROGRESS' : 'PENDING').toFixed(2)}
              </span>
            </div>

            {/* Payment Section (only for current tab) */}
            {activeTab === 'current' && selectedPayableProcedures.length > 0 && (
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-sm">
                  <span className="text-gray-600">Selected for payment:</span>
                  <span className="font-semibold ml-2">
                    {selectedPayableProcedures.length} procedure{selectedPayableProcedures.length !== 1 ? 's' : ''} - €{selectedPayableAmount.toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={handlePaySelected}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
                  size="sm"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay Selected
                </Button>
              </div>
            )}

            {/* Budget Section (only for plan tab) */}
            {activeTab === 'plan' && selectedProcedures.length > 0 && patient && (
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-sm">
                  <span className="text-gray-600">Selected for budget:</span>
                  <span className="font-semibold ml-2">
                    {selectedProcedures.length} procedure{selectedProcedures.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <Button
                  onClick={() => setShowBudgetModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Budget
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Treatment Modal */}
      <TreatmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveNewTreatment}
        patientAge={patientAge}
        availableCodes={availableCodes}
        patient={patient}
        onOpenAsaModal={onOpenAsaModal}
        onOpenPpsModal={onOpenPpsModal}
        onOpenScreeningRecallModal={onOpenScreeningRecallModal}
        onRefresh={onRefresh}
      />

      {/* Edit Treatment Modal */}
      <TreatmentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProcedure(null);
        }}
        onSave={handleUpdateTreatment}
        treatmentData={selectedProcedure ? {
          id: selectedProcedure.id,
          codeId: selectedProcedure.codeId,
          code: selectedProcedure.code,
          notes: selectedProcedure.notes,
          quantity: selectedProcedure.quantity,
          toothNumber: selectedProcedure.toothNumber,
          cost: selectedProcedure.cost,
          // Map existing procedure fields to treatment data format
          // Add more mappings here as needed
        } : null}
        patientAge={patientAge}
        availableCodes={availableCodes}
        isPaid={selectedProcedure?.isPaid || false}
        patient={patient}
        onOpenAsaModal={onOpenAsaModal}
        onOpenPpsModal={onOpenPpsModal}
        onOpenScreeningRecallModal={onOpenScreeningRecallModal}
        onRefresh={onRefresh}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        procedures={proceduresToPay}
        patientId={patientId}
        onPaymentComplete={handlePaymentComplete}
      />

      {/* Budget Modal */}
      {patient && (
        <BudgetModal
          isOpen={showBudgetModal}
          onClose={() => setShowBudgetModal(false)}
          procedures={selectedProcedures.map(id =>
            procedures.find(p => p.id === id)!
          ).filter(Boolean)}
          patient={patient}
          organization={organization}
          onEmailBudget={onEmailBudget}
        />
      )}
    </div>
  );
} 