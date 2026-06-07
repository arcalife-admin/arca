import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Edit, Trash2, Plus, Calendar, ChevronDown, ChevronUp, CreditCard, FileText } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import SurgicalProcedureForm from '@/components/surgical/SurgicalProcedureForm'
import { PaymentModal } from '@/components/patients/PaymentModal'
import { BudgetModal } from '@/components/patients/BudgetModal'
import { ProcedurePriceDisplay } from '@/components/ProcedurePriceDisplay'
import { formatLei, toLei } from '@/lib/procedure-currency'
import { useEurToRonRate } from '@/hooks/useEurToRonRate'

interface SurgicalProcedureCode {
  id: string;
  code: string;
  description: string;
  price: number | null;
  currency?: string;
  category: string;
}

interface SurgicalProcedure {
  id: string;
  patientId: string;
  codeId: string;
  date: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  code: SurgicalProcedureCode;
  practitioner?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  bodyArea?: string | null;
  procedureType?: string | null;
  anesthesiaType?: string | null;
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
  procedures: SurgicalProcedure[];
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
  const rate = useEurToRonRate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<SurgicalProcedure | null>(null);
  const [selectedProcedures, setSelectedProcedures] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [proceduresToPay, setProceduresToPay] = useState<SurgicalProcedure[]>([]);

  // Undo stack to support Ctrl+Z restore
  const [undoStack, setUndoStack] = useState<SurgicalProcedure[][]>([]);

  // State for tracking expanded procedure groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Shop purchases state
  const [shopPurchases, setShopPurchases] = useState<ShopPurchase[]>([]);

  // Budget modal state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);

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
  const visibleProcedures = activeTab === 'history'
    ? procedures.filter(p => p.status === 'COMPLETED')
    : activeTab === 'current'
      ? procedures.filter(p => p.status === 'IN_PROGRESS')
      : procedures.filter(p => p.status === 'PENDING');

  // Shop purchases are shown in current tab (paid purchases)
  const visibleShopPurchases: ShopPurchase[] = [];


  // Helper function to get all related procedures for a given procedure
  const getRelatedProcedureIds = (procedureId: string): string[] => {
    const procedureGroups = groupProcedures(visibleProcedures);

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
    const procedureGroups = groupProcedures(visibleProcedures);
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

  const getProcedureCost = (procedure: SurgicalProcedure) => {
    if (typeof procedure.cost === 'number') {
      return procedure.cost;
    }
    return (procedure.code.price || 0) * (procedure.quantity || 1);
  };

  const getProcedureCostLei = (procedure: SurgicalProcedure) => {
    const amount = getProcedureCost(procedure);
    const currency = procedure.code?.currency ?? 'EUR';
    return toLei(amount, currency, rate);
  };

  const calculateTotalCostLei = (status: 'COMPLETED' | 'PENDING' | 'IN_PROGRESS' | 'CANCELLED') => {
    return procedures
      .filter((p) => p.status === status && !p.isPaid)
      .reduce((total, procedure) => total + getProcedureCostLei(procedure), 0);
  };

  // Payment functions
  const handlePaySelected = () => {
    const selected = visibleProcedures.filter(p =>
      selectedProcedures.includes(p.id) && !p.isPaid && getProcedureCost(p) > 0
    );

    if (selected.length === 0) {
      toast.error('Selectați proceduri neplătite cu prețuri valide');
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
  const canBePaid = (procedure: SurgicalProcedure) => {
    return !procedure.isPaid && getProcedureCost(procedure) > 0;
  };

  // Get selected procedures that can be paid
  const selectedPayableProcedures = visibleProcedures.filter(p =>
    selectedProcedures.includes(p.id) && canBePaid(p)
  );

  const selectedPayableAmount = selectedPayableProcedures.reduce(
    (sum, proc) => sum + getProcedureCostLei(proc),
    0
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

  const performDelete = async (proceduresToDelete: SurgicalProcedure[]) => {
    if (proceduresToDelete.length === 0) return;

    // Push to undo stack
    setUndoStack(prev => [...prev, proceduresToDelete]);

    try {
      // Delete procedures from database
      await Promise.all(
        proceduresToDelete.map(p => fetch(`/api/patients/${patientId}/surgical-procedures/${p.id}`, { method: 'DELETE' }))
      );

      toast.success(`${proceduresToDelete.length} procedur${proceduresToDelete.length > 1 ? 'i' : 'ă'} șters${proceduresToDelete.length > 1 ? 'e' : 'ă'}`);
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
      toast.error('Ștergerea procedurii/procedurilor a eșuat');
    }
  };

  const handleDeleteProcedure = (procedure: SurgicalProcedure) => {
    if (selectedProcedures.length > 1 && selectedProcedures.includes(procedure.id)) {
      const procs = procedures.filter(p => selectedProcedures.includes(p.id));
      performDelete(procs);
    } else {
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
              fetch('/api/surgical-procedures/undo', {
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
                      if (err.code === 'NO_LOG') toast.error('Nimic de anulat.');
                      else if (err.code === 'NO_BACKUP_DELETE' || err.code === 'NO_BACKUP_EDIT') toast.error('Nu se poate restaura, copia de rezervă lipsește.');
                      else if (err.code === 'PROCEDURE_NOT_FOUND') toast.error('Procedura nu a fost găsită pentru anulare.');
                      else if (err.code === 'UNAUTHORIZED') toast.error('Nu aveți autorizația de a anula.');
                      else toast.error(err.error || 'Anularea a eșuat');
                    } else {
                      toast.error('Anularea a eșuat');
                    }
                    throw new Error(err.error || 'Anularea a eșuat');
                  }
                  return res.json();
                })
            )
          )
            .then(() => {
              toast.success('Anulare reușită');
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
        fetch('/api/surgical-procedures/redo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
          .then(async res => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              if (err && err.code) {
                if (err.code === 'NO_UNDO_LOG') toast.error('Nimic de refăcut.');
                else if (err.code === 'ALREADY_PROCESSED') {
                  // This is expected when multiple requests arrive - just refresh the UI
                  toast.success('Refacere finalizată');
                  onProcedureAdded(); // Refresh the procedures list
                }
                else if (err.code === 'NO_ORIGINAL_DATA') toast.error('Nu se poate reface, datele originale lipsesc.');
                else if (err.code === 'PROCEDURE_NOT_FOUND') toast.error('Procedura nu a fost găsită pentru refacere.');
                else if (err.code === 'UNAUTHORIZED') toast.error('Nu aveți autorizația de a reface.');
                else toast.error(err.error || 'Refacerea a eșuat');
              } else {
                toast.error('Refacerea a eșuat');
              }
              throw new Error(err.error || 'Refacerea a eșuat');
            }
            return res.json();
          })
          .then(() => {
            toast.success('Refacere reușită');
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

  const groupProcedures = (procedureList: SurgicalProcedure[]) => {
    return procedureList.map((procedure) => ({
      id: procedure.id,
      mainProcedure: procedure,
      relatedProcedures: [] as SurgicalProcedure[],
      isGroup: false,
    }));
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
  const isFilling = (procedure: SurgicalProcedure) => {
    return procedure.code.code.startsWith('V');
  };

  // Get the appropriate background color based on tab and procedure type
  const getProcedureBackgroundColor = (procedure: SurgicalProcedure, isSubProcedure = false) => {
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
  const getProcedureCodeColor = (procedure: SurgicalProcedure) => {
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

  const renderSingleProcedure = (procedure: SurgicalProcedure, isSubProcedure = false) => (
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
          <span className="font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs min-w-[50px] text-center capitalize">
            {procedure.bodyArea || '--'}
          </span>
          <span className={`font-semibold min-w-[45px] ${getProcedureCodeColor(procedure)}`}>{procedure.code.code}</span>
          <span className={`truncate max-w-[250px] ${procedure.isPaid ? 'text-gray-500' : 'text-gray-700'}`}>
            {procedure.code.description}
          </span>
          {/* Payment status indicator */}
          {procedure.isPaid && (
            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-semibold">
              PLĂTIT
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
                <ProcedurePriceDisplay
                  amount={getProcedureCost(procedure)}
                  currency={procedure.code?.currency ?? 'EUR'}
                  rate={rate}
                  className="text-sm font-medium"
                />
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
              title={procedure.isPaid ? "Editare note doar" : "Editare procedură"}
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
                title="Ștergere procedură"
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
  const getCardBackgroundColor = (mainProcedure: SurgicalProcedure) => {
    return getProcedureBackgroundColor(mainProcedure, false);
  };

  const renderProcedureGroup = (group: any) => {
    if (!group.isGroup) {
      // Single procedure, render normally
      return (
        <Card key={group.id} className={`py-0 px-0 w-full rounded-none border-0 border-b border-gray-200 shadow-none text-xs ${getCardBackgroundColor(group.mainProcedure)} ${isSelected(group.mainProcedure.id) ? 'ring-2 ring-blue-500' : ''}`}>
          {renderSingleProcedure(group.mainProcedure)}
        </Card>
      );
    }

    // Grouped procedures
    const isExpanded = expandedGroups.has(group.id);
    const mainSelected = isSelected(group.mainProcedure.id);
    const hasSelectedRelated = group.relatedProcedures.some((p: SurgicalProcedure) => isSelected(p.id));
    const allRelatedSelected = group.relatedProcedures.every((p: SurgicalProcedure) => isSelected(p.id));

    // Show ring when main is selected OR when all procedures in group are selected
    const showSelectionRing = mainSelected || (hasSelectedRelated && allRelatedSelected);

    return (
      <Card key={group.id} className={`py-0 px-0 w-full rounded-none border-0 border-b border-gray-200 shadow-none text-xs ${getCardBackgroundColor(group.mainProcedure)} ${showSelectionRing ? 'ring-2 ring-blue-500' : ''}`}>

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
        {isExpanded && group.relatedProcedures.map((procedure: SurgicalProcedure) => (
          <div key={procedure.id}>
            {renderSingleProcedure(procedure, true)}
          </div>
        ))}

        {/* Summary of collapsed procedures */}
        {!isExpanded && group.relatedProcedures.length > 0 && (
          <div className="px-2 pb-2 text-xs text-gray-500">
            + {group.relatedProcedures.length} procedur{group.relatedProcedures.length > 1 ? 'i' : 'ă'} asociat{group.relatedProcedures.length > 1 ? 'e' : 'ă'} ({group.relatedProcedures.map((p: SurgicalProcedure) => p.code.code).join(', ')})
            {hasSelectedRelated && (
              <span className="ml-2 text-blue-600 font-medium">
                {group.relatedProcedures.filter((p: SurgicalProcedure) => isSelected(p.id)).length} selectat{group.relatedProcedures.filter((p: SurgicalProcedure) => isSelected(p.id)).length > 1 ? 'e' : ''}
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
            Istoric
          </button>
          <button
            onClick={() => onTabChange('current')}
            className={`text-blue-600 font-bold px-4 py-1 ${activeTab === 'current' ? 'bg-blue-100' : ''}`}
          >
            Curent
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
          <span className="text-sm">Selectează tot</span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent'
        }}
      >
        <div className="space-y-0">
          {activeTab === 'history' && (
            visibleProcedures.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                Nu există proceduri finalizate
              </p>
            ) : (
              groupProcedures(visibleProcedures).map(renderProcedureGroup)
            )
          )}

          {activeTab === 'current' && (
            <>
              {visibleProcedures.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  Nu există proceduri curente
                </p>
              ) : (
                groupProcedures(visibleProcedures).map(renderProcedureGroup)
              )}
            </>
          )}

          {activeTab === 'plan' && (
            visibleProcedures.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                Nu există proceduri planificate
              </p>
            ) : (
              groupProcedures(visibleProcedures).map(renderProcedureGroup)
            )
          )}
        </div>
      </div>

      {/* Sticky Footer: Cost Bar (only for current & plan) */}
      {(activeTab === 'current' || activeTab === 'plan') && (
        <div className="sticky bottom-0 bg-white border-t z-20 shrink-0">
          <div className="p-2 space-y-2">
            {/* Cost Summary */}
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">
                {activeTab === 'current' ? 'Cost total curent:' : 'Cost total planificat:'}
              </span>
              <span className="font-bold">
                {formatLei(
                  calculateTotalCostLei(activeTab === 'current' ? 'IN_PROGRESS' : 'PENDING')
                )}
              </span>
            </div>

            {/* Payment Section (only for current tab) */}
            {activeTab === 'current' && selectedPayableProcedures.length > 0 && (
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-sm">
                  <span className="text-gray-600">Selectate pentru plată:</span>
                  <span className="font-semibold ml-2">
                    {selectedPayableProcedures.length} procedur{selectedPayableProcedures.length !== 1 ? 'i' : 'ă'} - {formatLei(selectedPayableAmount)}
                  </span>
                </div>
                <Button
                  onClick={handlePaySelected}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
                  size="sm"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Plătește selectate
                </Button>
              </div>
            )}

            {/* Budget Section (only for plan tab) */}
            {activeTab === 'plan' && selectedProcedures.length > 0 && patient && (
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="text-sm">
                  <span className="text-gray-600">Selectate pentru deviz:</span>
                  <span className="font-semibold ml-2">
                    {selectedProcedures.length} procedur{selectedProcedures.length !== 1 ? 'i' : 'ă'}
                  </span>
                </div>
                <Button
                  onClick={() => setShowBudgetModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm"
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generează deviz
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adăugare procedură</DialogTitle>
            <DialogDescription>
              Adăugați o procedură în {activeTab === 'plan' ? 'planul de tratament' : activeTab === 'current' ? 'tratamentul curent' : 'istoric'}.
            </DialogDescription>
          </DialogHeader>
          <SurgicalProcedureForm
            patientId={patientId}
            status={
              activeTab === 'history'
                ? 'COMPLETED'
                : activeTab === 'current'
                  ? 'IN_PROGRESS'
                  : 'PENDING'
            }
            onSuccess={() => {
              setShowAddModal(false);
              onProcedureAdded();
            }}
            onCancel={() => setShowAddModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={(open) => {
        setShowEditModal(open);
        if (!open) setSelectedProcedure(null);
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editare procedură</DialogTitle>
          </DialogHeader>
          {selectedProcedure && (
            <SurgicalProcedureForm
              patientId={patientId}
              procedure={selectedProcedure}
              status={
                activeTab === 'history'
                  ? 'COMPLETED'
                  : activeTab === 'current'
                    ? 'IN_PROGRESS'
                    : 'PENDING'
              }
              onSuccess={() => {
                setShowEditModal(false);
                setSelectedProcedure(null);
                onProcedureUpdated();
              }}
              onCancel={() => {
                setShowEditModal(false);
                setSelectedProcedure(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

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