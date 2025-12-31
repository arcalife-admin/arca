'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, AlertTriangle } from 'lucide-react';

interface NewRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Location {
  id: string;
  name: string;
  description?: string;
}

interface Equipment {
  id: string;
  name: string;
  category: string;
  location: Location;
}

interface ContactPerson {
  id: string;
  name: string;
  company?: string;
  specialties: string[];
}

export default function NewRepairModal({ isOpen, onClose, onSuccess }: NewRepairModalProps) {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    urgency: 'NORMAL',
    locationId: '',
    equipmentId: '',
    issueCategory: 'MECHANICAL',
    symptoms: [] as string[],
    contactPersonId: '',
    scheduledDate: '',
    scheduledTime: '',
    estimatedDuration: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [locationsRes, equipmentRes, contactsRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/equipment'),
        fetch('/api/contact-persons?isActive=true'),
      ]);

      if (locationsRes.ok) setLocations(await locationsRes.json());
      if (equipmentRes.ok) setEquipment(await equipmentRes.json());
      if (contactsRes.ok) setContactPersons(await contactsRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.locationId) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        description: formData.description || undefined,
        equipmentId: formData.equipmentId || undefined,
        contactPersonId: formData.contactPersonId || undefined,
        scheduledDate: formData.scheduledDate || undefined,
        scheduledTime: formData.scheduledTime || undefined,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
      };

      const response = await fetch('/api/repair-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          title: '',
          description: '',
          urgency: 'NORMAL',
          locationId: '',
          equipmentId: '',
          issueCategory: 'MECHANICAL',
          symptoms: [],
          contactPersonId: '',
          scheduledDate: '',
          scheduledTime: '',
          estimatedDuration: '',
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to create repair request'}`);
      }
    } catch (error) {
      console.error('Error creating repair request:', error);
      alert('Failed to create repair request');
    } finally {
      setLoading(false);
    }
  };

  const urgencyOptions = [
    { value: 'LOW', label: 'Low', icon: '🟢' },
    { value: 'NORMAL', label: 'Normal', icon: '🔵' },
    { value: 'HIGH', label: 'High', icon: '🟠' },
    { value: 'URGENT', label: 'Urgent', icon: '🔴' },
    { value: 'EMERGENCY', label: 'Emergency', icon: '🚨' },
  ];

  const issueCategories = [
    { value: 'MECHANICAL', label: 'Mechanical' },
    { value: 'ELECTRICAL', label: 'Electrical' },
    { value: 'SOFTWARE', label: 'Software' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'CALIBRATION', label: 'Calibration' },
    { value: 'CLEANING', label: 'Cleaning' },
    { value: 'INSTALLATION', label: 'Installation' },
    { value: 'UPGRADE', label: 'Upgrade' },
    { value: 'EMERGENCY', label: 'Emergency' },
    { value: 'OTHER', label: 'Other' },
  ];

  const symptomOptions = [
    'Not turning on',
    'Makes noise',
    'Overheating',
    'Slow performance',
    'Error messages',
    'Physical damage',
    'Calibration issues',
    'Software errors',
    'Connection problems',
    'Other',
  ];

  const handleSymptomToggle = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Report Repair Issue
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Issue Details</h3>

            <div>
              <Label htmlFor="title">Issue Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Dental Chair 1 - Water line blockage"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the problem..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="urgency">Urgency</Label>
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

              <div>
                <Label htmlFor="issueCategory">Issue Category</Label>
                <Select
                  value={formData.issueCategory}
                  onValueChange={(value) => setFormData({ ...formData, issueCategory: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {issueCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Location and Equipment */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Location & Equipment</h3>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Select
                value={formData.locationId}
                onValueChange={(value) => setFormData({ ...formData, locationId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="equipment">Equipment (Optional)</Label>
              <Select
                value={formData.equipmentId}
                onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment if applicable..." />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="flex items-center gap-2">
                        {item.name}
                        <span className="text-xs text-gray-500">({item.location.name})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Symptoms */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Symptoms (Optional)</h3>
            <div className="grid grid-cols-2 gap-2">
              {symptomOptions.map((symptom) => (
                <label key={symptom} className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.symptoms.includes(symptom)}
                    onCheckedChange={() => handleSymptomToggle(symptom)}
                  />
                  <span className="text-sm">{symptom}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Scheduling (Optional)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduledDate">Preferred Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="scheduledTime">Preferred Time</Label>
                <Input
                  id="scheduledTime"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  placeholder="e.g., 09:00-11:00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
              <Input
                id="estimatedDuration"
                type="number"
                min={15}
                step={15}
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                placeholder="e.g., 60"
              />
            </div>
          </div>

          {/* Contact Assignment */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Contact Assignment (Optional)</h3>

            <div>
              <Label htmlFor="contactPerson">Preferred Contact</Label>
              <Select
                value={formData.contactPersonId}
                onValueChange={(value) => setFormData({ ...formData, contactPersonId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact person..." />
                </SelectTrigger>
                <SelectContent>
                  {contactPersons.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      <span className="flex items-center gap-2">
                        {contact.name}
                        {contact.company && (
                          <span className="text-xs text-gray-500">({contact.company})</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim() || !formData.locationId}>
              {loading ? 'Creating...' : 'Report Issue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 