'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  MapPin,
  Wrench,
  Users,
  Plus,
  Edit,
  Trash2,
  Star,
  Phone,
  Mail,
  Building,
  Calendar,
  ArrowLeft,
  Save,
  X
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  description?: string;
  color?: string;
  _count: {
    equipment: number;
    repairRequests: number;
  };
}

interface Equipment {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  category: string;
  location: Location;
  purchaseDate?: string;
  warrantyExpiry?: string;
  isActive: boolean;
}

interface ContactPerson {
  id: string;
  name: string;
  company?: string;
  role?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  specialties: string[];
  isActive: boolean;
  isPreferred: boolean;
  _count: {
    repairRequests: number;
    locationContacts: number;
  };
}

export default function RepairSettingsPage() {
  const [activeTab, setActiveTab] = useState('locations');
  const [locations, setLocations] = useState<Location[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form data
  const [locationForm, setLocationForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    description: '',
    brand: '',
    model: '',
    serialNumber: '',
    category: 'DENTAL_CHAIR',
    locationId: '',
    purchaseDate: '',
    warrantyExpiry: '',
    isActive: true,
  });

  const [contactForm, setContactForm] = useState({
    name: '',
    company: '',
    role: '',
    email: '',
    phone: '',
    mobile: '',
    specialties: [] as string[],
    isActive: true,
    isPreferred: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [locationsRes, equipmentRes, contactsRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/equipment'),
        fetch('/api/contact-persons'),
      ]);

      if (locationsRes.ok) setLocations(await locationsRes.json());
      if (equipmentRes.ok) setEquipment(await equipmentRes.json());
      if (contactsRes.ok) setContactPersons(await contactsRes.json());
    } catch (error) {
      console.error('Error loading repair settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    try {
      const url = editingItem ? `/api/locations` : '/api/locations';
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem
        ? { ...locationForm, id: editingItem.id }
        : locationForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        loadData();
        setShowLocationModal(false);
        setEditingItem(null);
        setLocationForm({ name: '', description: '', color: '#3B82F6' });
      }
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleSaveEquipment = async () => {
    try {
      const url = editingItem ? `/api/equipment` : '/api/equipment';
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem
        ? { ...equipmentForm, id: editingItem.id }
        : equipmentForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        loadData();
        setShowEquipmentModal(false);
        setEditingItem(null);
        setEquipmentForm({
          name: '',
          description: '',
          brand: '',
          model: '',
          serialNumber: '',
          category: 'DENTAL_CHAIR',
          locationId: '',
          purchaseDate: '',
          warrantyExpiry: '',
          isActive: true,
        });
      }
    } catch (error) {
      console.error('Error saving equipment:', error);
    }
  };

  const handleSaveContact = async () => {
    try {
      const url = editingItem ? `/api/contact-persons` : '/api/contact-persons';
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem
        ? { ...contactForm, id: editingItem.id }
        : contactForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        loadData();
        setShowContactModal(false);
        setEditingItem(null);
        setContactForm({
          name: '',
          company: '',
          role: '',
          email: '',
          phone: '',
          mobile: '',
          specialties: [],
          isActive: true,
          isPreferred: false,
        });
      }
    } catch (error) {
      console.error('Error saving contact person:', error);
    }
  };

  const equipmentCategories = [
    { value: 'DENTAL_CHAIR', label: 'Dental Chair' },
    { value: 'XRAY_MACHINE', label: 'X-Ray Machine' },
    { value: 'AUTOCLAVE', label: 'Autoclave' },
    { value: 'COMPRESSOR', label: 'Compressor' },
    { value: 'VACUUM_SYSTEM', label: 'Vacuum System' },
    { value: 'LIGHTING', label: 'Lighting' },
    { value: 'HVAC', label: 'HVAC' },
    { value: 'INSTRUMENTS', label: 'Instruments' },
    { value: 'COMPUTER_EQUIPMENT', label: 'Computer Equipment' },
    { value: 'PHONE_SYSTEM', label: 'Phone System' },
    { value: 'SECURITY_SYSTEM', label: 'Security System' },
    { value: 'OTHER', label: 'Other' },
  ];

  const specialtyOptions = [
    'Dental Chairs',
    'X-Ray Equipment',
    'Sterilization',
    'HVAC Systems',
    'Electrical',
    'Plumbing',
    'Computer/IT',
    'Phone Systems',
    'Security Systems',
    'General Maintenance',
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard/orders'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Repair Settings</h1>
            <p className="text-gray-600">
              Manage clinic locations, equipment, and repair contacts
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Locations ({locations.length})
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Equipment ({equipment.length})
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Contacts ({contactPersons.length})
          </TabsTrigger>
        </TabsList>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Define the different areas in your clinic for equipment tracking
            </p>
            <Button
              onClick={() => {
                setEditingItem(null);
                setLocationForm({ name: '', description: '', color: '#3B82F6' });
                setShowLocationModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
              <Card key={location.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: location.color || '#3B82F6' }}
                    />
                    <h3 className="font-medium">{location.name}</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingItem(location);
                      setLocationForm({
                        name: location.name,
                        description: location.description || '',
                        color: location.color || '#3B82F6',
                      });
                      setShowLocationModal(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                {location.description && (
                  <p className="text-sm text-gray-600 mb-3">{location.description}</p>
                )}

                <div className="flex justify-between text-sm text-gray-500">
                  <span>{location._count.equipment} equipment</span>
                  <span>{location._count.repairRequests} repairs</span>
                </div>
              </Card>
            ))}

            {locations.length === 0 && (
              <Card className="p-8 text-center col-span-full">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No locations defined</h3>
                <p className="text-gray-500 mb-4">
                  Create locations to organize your clinic equipment and repairs.
                </p>
                <Button
                  onClick={() => setShowLocationModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Location
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Track all equipment in your clinic for maintenance and repairs
            </p>
            <Button
              onClick={() => {
                setEditingItem(null);
                setEquipmentForm({
                  name: '',
                  description: '',
                  brand: '',
                  model: '',
                  serialNumber: '',
                  category: 'DENTAL_CHAIR',
                  locationId: '',
                  purchaseDate: '',
                  warrantyExpiry: '',
                  isActive: true,
                });
                setShowEquipmentModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </div>

          <div className="space-y-4">
            {equipment.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{item.name}</h3>
                      <Badge variant="outline">
                        {equipmentCategories.find(c => c.value === item.category)?.label}
                      </Badge>
                      <Badge
                        className={item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                      <div>
                        <span className="font-medium">Location:</span> {item.location.name}
                      </div>
                      {item.brand && (
                        <div>
                          <span className="font-medium">Brand:</span> {item.brand}
                        </div>
                      )}
                      {item.model && (
                        <div>
                          <span className="font-medium">Model:</span> {item.model}
                        </div>
                      )}
                      {item.serialNumber && (
                        <div>
                          <span className="font-medium">Serial:</span> {item.serialNumber}
                        </div>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                    )}

                    <div className="flex gap-4 text-sm text-gray-500">
                      {item.purchaseDate && (
                        <span>Purchased: {new Date(item.purchaseDate).toLocaleDateString()}</span>
                      )}
                      {item.warrantyExpiry && (
                        <span>Warranty: {new Date(item.warrantyExpiry).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingItem(item);
                      setEquipmentForm({
                        name: item.name,
                        description: item.description || '',
                        brand: item.brand || '',
                        model: item.model || '',
                        serialNumber: item.serialNumber || '',
                        category: item.category,
                        locationId: item.location.id,
                        purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
                        warrantyExpiry: item.warrantyExpiry ? item.warrantyExpiry.split('T')[0] : '',
                        isActive: item.isActive,
                      });
                      setShowEquipmentModal(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Manage repair technicians and service contacts
            </p>
            <Button
              onClick={() => {
                setEditingItem(null);
                setContactForm({
                  name: '',
                  company: '',
                  role: '',
                  email: '',
                  phone: '',
                  mobile: '',
                  specialties: [],
                  isActive: true,
                  isPreferred: false,
                });
                setShowContactModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>

          <div className="space-y-4">
            {contactPersons.map((contact) => (
              <Card key={contact.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{contact.name}</h3>
                      {contact.isPreferred && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" />
                          Preferred
                        </Badge>
                      )}
                      <Badge
                        className={contact.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {contact.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      {contact.company && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {contact.company}
                        </div>
                      )}
                      {contact.role && (
                        <div>
                          <span className="font-medium">Role:</span> {contact.role}
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {contact.phone}
                        </div>
                      )}
                      {contact.mobile && contact.mobile !== contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {contact.mobile} (Mobile)
                        </div>
                      )}
                    </div>

                    {contact.specialties.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700">Specialties: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {contact.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>{contact._count.repairRequests} repairs handled</span>
                      <span>{contact._count.locationContacts} locations assigned</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingItem(contact);
                      setContactForm({
                        name: contact.name,
                        company: contact.company || '',
                        role: contact.role || '',
                        email: contact.email || '',
                        phone: contact.phone || '',
                        mobile: contact.mobile || '',
                        specialties: contact.specialties,
                        isActive: contact.isActive,
                        isPreferred: contact.isPreferred,
                      });
                      setShowContactModal(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {/* Location Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Location' : 'Add New Location'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                value={locationForm.name}
                onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                placeholder="e.g., Treatment Room 1"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={locationForm.description}
                onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                placeholder="Optional description..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={locationForm.color}
                onChange={(e) => setLocationForm({ ...locationForm, color: e.target.value })}
                className="w-20 h-10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocationModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveLocation}
              disabled={!locationForm.name.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Equipment Modal */}
      <Dialog open={showEquipmentModal} onOpenChange={setShowEquipmentModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Equipment' : 'Add New Equipment'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equipmentName">Equipment Name *</Label>
                <Input
                  id="equipmentName"
                  value={equipmentForm.name}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                  placeholder="e.g., Dental Chair 1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={equipmentForm.category}
                  onValueChange={(value) => setEquipmentForm({ ...equipmentForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {equipmentCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Select
                value={equipmentForm.locationId}
                onValueChange={(value) => setEquipmentForm({ ...equipmentForm, locationId: value })}
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
              <Label htmlFor="equipmentDescription">Description</Label>
              <Textarea
                id="equipmentDescription"
                value={equipmentForm.description}
                onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
                placeholder="Additional details..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={equipmentForm.brand}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, brand: e.target.value })}
                  placeholder="e.g., Sirona"
                />
              </div>

              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={equipmentForm.model}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, model: e.target.value })}
                  placeholder="e.g., C8+"
                />
              </div>

              <div>
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={equipmentForm.serialNumber}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, serialNumber: e.target.value })}
                  placeholder="Serial #"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={equipmentForm.purchaseDate}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, purchaseDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                <Input
                  id="warrantyExpiry"
                  type="date"
                  value={equipmentForm.warrantyExpiry}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, warrantyExpiry: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active Equipment</Label>
                <p className="text-sm text-gray-500">Equipment is in use and available for repairs</p>
              </div>
              <Switch
                id="isActive"
                checked={equipmentForm.isActive}
                onCheckedChange={(checked) => setEquipmentForm({ ...equipmentForm, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEquipmentModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEquipment}
              disabled={!equipmentForm.name.trim() || !equipmentForm.locationId}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Contact Person' : 'Add New Contact Person'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">Name *</Label>
                <Input
                  id="contactName"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={contactForm.company}
                  onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role">Role/Title</Label>
              <Input
                id="role"
                value={contactForm.role}
                onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                placeholder="e.g., Service Technician, Manager"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="email@company.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="Office phone"
                />
              </div>

              <div>
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={contactForm.mobile}
                  onChange={(e) => setContactForm({ ...contactForm, mobile: e.target.value })}
                  placeholder="Mobile phone"
                />
              </div>
            </div>

            <div>
              <Label>Specialties</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {specialtyOptions.map((specialty) => (
                  <label key={specialty} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={contactForm.specialties.includes(specialty)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setContactForm({
                            ...contactForm,
                            specialties: [...contactForm.specialties, specialty]
                          });
                        } else {
                          setContactForm({
                            ...contactForm,
                            specialties: contactForm.specialties.filter(s => s !== specialty)
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="contactActive">Active Contact</Label>
                  <p className="text-sm text-gray-500">Contact is available for repair assignments</p>
                </div>
                <Switch
                  id="contactActive"
                  checked={contactForm.isActive}
                  onCheckedChange={(checked) => setContactForm({ ...contactForm, isActive: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="contactPreferred" className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Preferred Contact
                  </Label>
                  <p className="text-sm text-gray-500">Mark as preferred for priority selection</p>
                </div>
                <Switch
                  id="contactPreferred"
                  checked={contactForm.isPreferred}
                  onCheckedChange={(checked) => setContactForm({ ...contactForm, isPreferred: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveContact}
              disabled={!contactForm.name.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 