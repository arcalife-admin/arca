'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, Pill, Search, X } from 'lucide-react';
import { appAlert } from '@/lib/app-alert';
import type { ClinicMedicationResult } from '@/components/pharma/MedicationCard';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Category {
  id: string;
  name: string;
  color?: string;
}

type RequestType = 'medicament' | 'supply';

const MEDICAMENT_CATEGORY = 'Medicamente';

const emptyForm = {
  itemName: '',
  description: '',
  quantity: 1,
  urgency: 'NORMAL',
  reason: '',
  categoryId: '',
};

export default function NewRequestModal({ isOpen, onClose, onSuccess }: NewRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [requestType, setRequestType] = useState<RequestType>('medicament');
  const [formData, setFormData] = useState(emptyForm);
  const [selectedMedication, setSelectedMedication] = useState<ClinicMedicationResult | null>(null);
  const [medSearch, setMedSearch] = useState('');
  const [medResults, setMedResults] = useState<ClinicMedicationResult[]>([]);
  const [medSearchLoading, setMedSearchLoading] = useState(false);

  const loadData = async () => {
    try {
      const categoriesRes = await fetch('/api/item-categories');
      if (categoriesRes.ok) {
        setCategories(await categoriesRes.json());
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const searchMedications = useCallback(async (query: string) => {
    setMedSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      const res = await fetch(`/api/medications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMedResults(data.results ?? []);
      }
    } catch (error) {
      console.error('Error searching medications:', error);
    } finally {
      setMedSearchLoading(false);
    }
  }, []);

  const medicamentCategoryId = categories.find((c) => c.name === MEDICAMENT_CATEGORY)?.id ?? '';

  useEffect(() => {
    if (isOpen) {
      loadData();
      setRequestType('medicament');
      setFormData(emptyForm);
      setSelectedMedication(null);
      setMedSearch('');
      setMedResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || requestType !== 'medicament') return;
    searchMedications(medSearch);
  }, [isOpen, requestType, medSearch, searchMedications]);

  useEffect(() => {
    if (!selectedMedication || !medicamentCategoryId) return;
    setFormData((prev) =>
      prev.categoryId === medicamentCategoryId ? prev : { ...prev, categoryId: medicamentCategoryId }
    );
  }, [selectedMedication, medicamentCategoryId]);

  const selectMedication = (med: ClinicMedicationResult) => {
    setSelectedMedication(med);
    const details = [med.activeIngredient, med.form].filter(Boolean).join(' · ');
    setFormData((prev) => ({
      ...prev,
      itemName: med.name,
      description: details,
      categoryId: medicamentCategoryId,
    }));
    setMedSearch('');
    setMedResults([]);
  };

  const clearMedication = () => {
    setSelectedMedication(null);
    setFormData({ ...formData, itemName: '', description: '', categoryId: '' });
  };

  const switchRequestType = (type: RequestType) => {
    setRequestType(type);
    setFormData(emptyForm);
    setSelectedMedication(null);
    setMedSearch('');
    setMedResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName.trim()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        description: formData.description || undefined,
        reason: formData.reason || undefined,
        categoryId: formData.categoryId || undefined,
      };

      const response = await fetch('/api/order-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        appAlert(error.error || 'Crearea cererii a eșuat', { title: 'Eroare' });
      }
    } catch (error) {
      console.error('Error creating request:', error);
      appAlert('Crearea cererii a eșuat', { title: 'Eroare' });
    } finally {
      setLoading(false);
    }
  };

  const urgencyOptions = [
    { value: 'LOW', label: 'Scăzută', icon: '🟢' },
    { value: 'NORMAL', label: 'Normală', icon: '🔵' },
    { value: 'HIGH', label: 'Ridicată', icon: '🟠' },
    { value: 'URGENT', label: 'Urgentă', icon: '🔴' },
  ];

  const canSubmit = formData.itemName.trim() && (requestType === 'supply' || selectedMedication);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Cerere nouă de comandă
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex rounded-lg border p-1 bg-gray-50">
            <button
              type="button"
              onClick={() => switchRequestType('medicament')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                requestType === 'medicament'
                  ? 'bg-white text-red-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Pill className="h-4 w-4" />
              Medicament
            </button>
            <button
              type="button"
              onClick={() => switchRequestType('supply')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                requestType === 'supply'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="h-4 w-4" />
              Consumabile / Echipamente
            </button>
          </div>

          {requestType === 'medicament' ? (
            <div className="space-y-3">
              {selectedMedication ? (
                <div className="flex items-start justify-between rounded-lg border border-red-200 bg-red-50 p-3">
                  <div>
                    <p className="font-medium text-gray-900">{selectedMedication.name}</p>
                    {(selectedMedication.activeIngredient || selectedMedication.form) && (
                      <p className="text-sm text-gray-600 mt-0.5">
                        {[selectedMedication.activeIngredient, selectedMedication.form].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {selectedMedication.requiresFridge && (
                      <Badge variant="outline" className="mt-1 text-xs">La frigider</Badge>
                    )}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={clearMedication}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Label>Selectați din formular</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={medSearch}
                      onChange={(e) => setMedSearch(e.target.value)}
                      placeholder="Căutați medicamente (ex.: Propofol, Cefort, Clexane)..."
                      className="pl-10"
                    />
                  </div>
                  {medSearchLoading && (
                    <p className="text-sm text-gray-500">Se caută...</p>
                  )}
                  {!medSearch && !medSearchLoading && medResults.length > 0 && (
                    <p className="text-sm text-gray-500">
                      {medResults.length} medicamente în formular — tastați pentru a filtra lista de mai jos.
                    </p>
                  )}
                  {!medSearchLoading && medResults.length > 0 && !selectedMedication && (
                    <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
                      {(medSearch ? medResults : medResults.slice(0, 12)).map((med) => (
                        <button
                          key={med.id}
                          type="button"
                          onClick={() => selectMedication(med)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <p className="font-medium text-sm text-gray-900">{med.name}</p>
                          {med.activeIngredient && (
                            <p className="text-xs text-gray-500">{med.activeIngredient}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {!medSearchLoading && medSearch && medResults.length === 0 && (
                    <p className="text-sm text-gray-500">Niciun medicament găsit. Încercați o altă căutare.</p>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="itemName">Denumire articol *</Label>
                <Input
                  id="itemName"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="ex.: Mănuși chirurgicale sterile (L), seturi IV, câmpuri chirurgicale"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descriere (opțional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mărime, preferință de marcă sau alte detalii..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="category">Categorie (opțional)</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectați o categorie..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => c.name !== MEDICAMENT_CATEGORY)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <span className="flex items-center gap-2">
                            {category.color && (
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                            )}
                            {category.name}
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Cantitate</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div>
              <Label htmlFor="urgency">Urgență</Label>
              <Select
                value={formData.urgency}
                onValueChange={(value) => setFormData({ ...formData, urgency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {urgencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Motivul cererii (opțional)</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder={
                requestType === 'medicament'
                  ? "ex.: Stoc redus în farmacie — au mai rămas doar 2 fiole"
                  : "ex.: Stoc în scădere — reînnoire înainte de următoarea zi de chirurgie"
              }
              rows={2}
            />
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Atribuirea furnizorului este gestionată de manager la aprobarea și plasarea comenzilor.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Anulare
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Se creează...' : 'Creează cererea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
