'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Package, Clock, AlertTriangle } from 'lucide-react';
import { appAlert } from '@/lib/app-alert';

interface OrderRequest {
  id: string;
  itemName: string;
  description?: string;
  quantity: number;
  urgency: string;
  requestedBy: {
    firstName: string;
    lastName: string;
  };
  category?: {
    name: string;
    color?: string;
  };
  vendor?: {
    name: string;
  };
}

interface Vendor {
  id: string;
  name: string;
  category?: string;
  orderingUrl?: string;
}

interface OrderCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedRequests: OrderRequest[];
}

export default function OrderCreationModal({
  isOpen,
  onClose,
  onSuccess,
  selectedRequests
}: OrderCreationModalProps) {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [formData, setFormData] = useState({
    vendorId: '',
    expectedDelivery: '',
    deliveryUnknown: false,
    notes: '',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
  });

  useEffect(() => {
    if (isOpen) {
      loadVendors();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && vendors.length > 0) {
      // Auto-select vendor if all requests have the same vendor
      const vendorNames = selectedRequests.map(r => r.vendor?.name).filter(Boolean);
      if (vendorNames.length > 0 && vendorNames.every(v => v === vendorNames[0])) {
        // Find vendor by name instead of ID
        const vendor = vendors.find(v => v.name === vendorNames[0]);
        if (vendor) {
          setFormData(prev => ({ ...prev, vendorId: vendor.id }));
        }
      }
    }
  }, [isOpen, selectedRequests, vendors]);

  const loadVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      if (response.ok) {
        const vendorsData = await response.json();
        setVendors(vendorsData);
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId) return;

    setLoading(true);
    try {
      // Convert requests to order items
      const items = selectedRequests.map(request => ({
        itemName: request.itemName,
        description: request.description || '',
        quantity: request.quantity,
        unitPrice: 0, // Will be updated when actual pricing is known
        categoryId: request.category?.name ? undefined : undefined, // We don't have categoryId in requests
        minimumStock: 1,
        maxStock: 10,
        location: 'Storage',
      }));

      const orderData = {
        vendorId: formData.vendorId,
        items,
        priority: formData.priority,
        expectedDelivery: formData.deliveryUnknown ? null : formData.expectedDelivery,
        notes: formData.notes,
        requestIds: selectedRequests.map(r => r.id),
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          vendorId: '',
          expectedDelivery: '',
          deliveryUnknown: false,
          notes: '',
          priority: 'NORMAL',
        });
      } else {
        const error = await response.json();
        appAlert(error.error || 'Crearea comenzii a eșuat', { title: 'Eroare' });
      }
    } catch (error) {
      console.error('Error creating order:', error);
      appAlert('Crearea comenzii a eșuat', { title: 'Eroare' });
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      URGENT: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      NORMAL: 'bg-blue-100 text-blue-800',
      LOW: 'bg-gray-100 text-gray-800',
    };
    return colors[urgency] || 'bg-gray-100 text-gray-800';
  };

  const priorityOptions = [
    { value: 'LOW', label: 'Prioritate scăzută', icon: '🟢' },
    { value: 'NORMAL', label: 'Prioritate normală', icon: '🔵' },
    { value: 'HIGH', label: 'Prioritate ridicată', icon: '🟠' },
    { value: 'URGENT', label: 'Urgentă', icon: '🔴' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Creează comandă din cereri
          </DialogTitle>
          <DialogDescription>
            Creați o comandă pentru {selectedRequests.length} {selectedRequests.length === 1 ? 'cerere aprobată' : 'cereri aprobate'}.
            Setați așteptările de livrare și detaliile furnizorului.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selected Requests Summary */}
          <div>
            <Label className="text-sm font-medium">Cereri selectate ({selectedRequests.length})</Label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {selectedRequests.map((request) => (
                <Card key={request.id} className="p-3">
                  <CardContent className="p-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{request.itemName}</span>
                          <Badge variant="outline" className={getUrgencyColor(request.urgency)}>
                            {request.urgency}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Cant.: {request.quantity} • Solicitat de {request.requestedBy.firstName} {request.requestedBy.lastName}
                        </p>
                        {request.description && (
                          <p className="text-sm text-gray-500 mt-1">{request.description}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Vendor Selection */}
          <div>
            <Label htmlFor="vendor">Furnizor *</Label>
            <Select
              value={formData.vendorId}
              onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selectați un furnizor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                    {vendor.category && ` (${vendor.category})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Selection */}
          <div>
            <Label htmlFor="priority">Prioritate comandă</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT') =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
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

          {/* Delivery Date */}
          <div>
            <Label className="text-sm font-medium">Livrare estimată</Label>
            <div className="mt-2 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="deliveryUnknown"
                  checked={formData.deliveryUnknown}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, deliveryUnknown: checked as boolean })
                  }
                />
                <Label htmlFor="deliveryUnknown" className="text-sm">
                  Nu cunosc încă data livrării
                </Label>
              </div>

              {!formData.deliveryUnknown && (
                <div>
                  <Input
                    type="date"
                    value={formData.expectedDelivery}
                    onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Puteți ajusta ulterior în fila Comenzi
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Note comandă (opțional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Instrucțiuni speciale sau note pentru această comandă..."
              rows={3}
            />
          </div>

          {/* Warning about pricing */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Informații despre prețuri</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Prețurile unitare sunt setate provizoriu la 0 €. Puteți actualiza detaliile de preț în fila Comenzi după primirea ofertelor.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Anulare
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.vendorId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Se creează comanda...' : 'Creează comandă'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
