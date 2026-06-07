'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Users, Star } from 'lucide-react';
import { appAlert } from '@/lib/app-alert';

interface NewVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewVendorModal({ isOpen, onClose, onSuccess }: NewVendorModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    orderingUrl: '',
    accountNumber: '',
    paymentTerms: '',
    deliveryTime: '',
    minimumOrder: '',
    isActive: true,
    isPreferred: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        description: formData.description || undefined,
        category: formData.category || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        website: formData.website || undefined,
        orderingUrl: formData.orderingUrl || undefined,
        accountNumber: formData.accountNumber || undefined,
        paymentTerms: formData.paymentTerms || undefined,
        deliveryTime: formData.deliveryTime || undefined,
        minimumOrder: formData.minimumOrder || undefined,
      };

      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          name: '',
          description: '',
          category: '',
          contactEmail: '',
          contactPhone: '',
          website: '',
          orderingUrl: '',
          accountNumber: '',
          paymentTerms: '',
          deliveryTime: '',
          minimumOrder: '',
          isActive: true,
          isPreferred: false,
        });
      } else {
        const error = await response.json();
        appAlert(error.error || 'Crearea furnizorului a eșuat', { title: 'Eroare' });
      }
    } catch (error) {
      console.error('Error creating vendor:', error);
      appAlert('Crearea furnizorului a eșuat', { title: 'Eroare' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Adaugă furnizor nou
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Informații de bază</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Denumire furnizor *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex.: Farmacia Unirea, MedSupply SRL"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Categorie (opțional)</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="ex.: Medicamente, Materiale chirurgicale"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descriere (opțional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Scurtă descriere a furnizorului..."
                rows={2}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Date de contact (opțional)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactEmail">E-mail</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="comenzi@furnizor.ro"
                />
              </div>

              <div>
                <Label htmlFor="contactPhone">Telefon</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+40-800-123-456"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Site web (opțional)</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.furnizor.ro"
                />
              </div>

              <div>
                <Label htmlFor="orderingUrl">URL pagină comenzi (opțional)</Label>
                <Input
                  id="orderingUrl"
                  type="url"
                  value={formData.orderingUrl}
                  onChange={(e) => setFormData({ ...formData, orderingUrl: e.target.value })}
                  placeholder="https://www.furnizor.ro/comenzi"
                />
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Detalii comerciale (opțional)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accountNumber">Număr cont</Label>
                <Input
                  id="accountNumber"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Numărul contului dvs. la furnizor"
                />
              </div>

              <div>
                <Label htmlFor="paymentTerms">Termeni de plată</Label>
                <Input
                  id="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  placeholder="ex.: Net 30, la livrare"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliveryTime">Termen livrare (zile)</Label>
                <Input
                  id="deliveryTime"
                  type="number"
                  min={1}
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                  placeholder="ex.: 3"
                />
              </div>

              <div>
                <Label htmlFor="minimumOrder">Comandă minimă (€)</Label>
                <Input
                  id="minimumOrder"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formData.minimumOrder}
                  onChange={(e) => setFormData({ ...formData, minimumOrder: e.target.value })}
                  placeholder="ex.: 100.00"
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Setări</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Furnizor activ</Label>
                <p className="text-sm text-gray-500">Furnizorul este activ și disponibil pentru comenzi</p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isPreferred" className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Furnizor preferat
                </Label>
                <p className="text-sm text-gray-500">Marcați ca furnizor preferat pentru afișare prioritară</p>
              </div>
              <Switch
                id="isPreferred"
                checked={formData.isPreferred}
                onCheckedChange={(checked) => setFormData({ ...formData, isPreferred: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Anulare
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? 'Se creează...' : 'Creează furnizor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
