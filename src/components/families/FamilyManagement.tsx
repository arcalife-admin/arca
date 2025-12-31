'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  Plus,
  Trash2,
  UserMinus,
  Search,
  Home,
  User
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PatientWithCode, FamilyGroup } from '@/types/appointment';

interface FamilyManagementProps {
  organizationId: string;
}

interface ApiResponse {
  familyGroups: FamilyGroup[];
  individualPatients: PatientWithCode[];
  totalFamilies: number;
  totalIndividuals: number;
}

export default function FamilyManagement({ organizationId }: FamilyManagementProps) {
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [individualPatients, setIndividualPatients] = useState<PatientWithCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [isCreatingFamily, setIsCreatingFamily] = useState(false);

  useEffect(() => {
    fetchFamilyData();
  }, []);

  const fetchFamilyData = async () => {
    try {
      const response = await fetch('/api/families');
      if (!response.ok) throw new Error('Failed to fetch families');

      const data: ApiResponse = await response.json();
      setFamilyGroups(data.familyGroups);
      setIndividualPatients(data.individualPatients);
    } catch (error) {
      console.error('Error fetching families:', error);
      toast({
        title: 'Error',
        description: 'Failed to load family data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createFamily = async () => {
    if (selectedPatients.length < 2) {
      toast({
        title: 'Error',
        description: 'Please select at least 2 patients to create a family',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingFamily(true);
    try {
      const response = await fetch('/api/families', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientCodes: selectedPatients,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create family');
      }

      const result = await response.json();
      toast({
        title: 'Success',
        description: `Family created with ${result.membersCount} members under code ${result.familyHeadCode}`,
      });

      setSelectedPatients([]);
      await fetchFamilyData();
    } catch (error: any) {
      console.error('Error creating family:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create family',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingFamily(false);
    }
  };

  const removePatientFromFamily = async (familyHeadCode: string, patientCode: string) => {
    try {
      const response = await fetch(
        `/api/families/${familyHeadCode}?patientCode=${patientCode}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove patient');
      }

      toast({
        title: 'Success',
        description: 'Patient removed from family',
      });

      await fetchFamilyData();
    } catch (error: any) {
      console.error('Error removing patient:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove patient',
        variant: 'destructive',
      });
    }
  };

  const deleteFamily = async (familyHeadCode: string) => {
    try {
      const response = await fetch(`/api/families/${familyHeadCode}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete family');
      }

      const result = await response.json();
      toast({
        title: 'Success',
        description: `Family deleted. ${result.membersReverted} patients reverted to individual status.`,
      });

      await fetchFamilyData();
    } catch (error: any) {
      console.error('Error deleting family:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete family',
        variant: 'destructive',
      });
    }
  };

  const togglePatientSelection = (patientCode: string) => {
    setSelectedPatients(prev =>
      prev.includes(patientCode)
        ? prev.filter(code => code !== patientCode)
        : [...prev, patientCode]
    );
  };

  const filteredIndividualPatients = individualPatients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFamilyGroups = familyGroups.filter(family =>
    family.patients.some(patient =>
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      family.familyHeadCode.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Family Management</h1>
          <p className="text-gray-600">
            {familyGroups.length} families • {individualPatients.length} individual patients
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search patients or families</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search by name, code, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Create Family Section */}
      {selectedPatients.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Create New Family
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Selected patients ({selectedPatients.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedPatients.map(code => {
                    const patient = individualPatients.find(p => p.patientCode === code);
                    return patient ? (
                      <Badge key={code} variant="secondary">
                        {patient.patientCode}: {patient.firstName} {patient.lastName}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={createFamily}
                  disabled={isCreatingFamily || selectedPatients.length < 2}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {isCreatingFamily ? 'Creating...' : 'Create Family'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedPatients([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Family Groups */}
      {filteredFamilyGroups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Home className="h-5 w-5" />
            Family Groups ({filteredFamilyGroups.length})
          </h2>
          {filteredFamilyGroups.map((family) => (
            <Card key={family.familyHeadCode} className="border-green-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-green-600" />
                    Family {family.familyHeadCode}
                    <Badge variant="secondary">
                      {family.patients.length} members
                    </Badge>
                  </CardTitle>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteFamily(family.familyHeadCode)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {family.patients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <div className="font-medium">
                          {patient.patientCode}: {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {patient.email} • {patient.phone}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePatientFromFamily(family.familyHeadCode, patient.patientCode)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Individual Patients */}
      {filteredIndividualPatients.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Individual Patients ({filteredIndividualPatients.length})
          </h2>
          <div className="grid gap-3">
            {filteredIndividualPatients.map((patient) => (
              <Card key={patient.id} className="border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedPatients.includes(patient.patientCode)}
                        onCheckedChange={() => togglePatientSelection(patient.patientCode)}
                      />
                      <div>
                        <div className="font-medium">
                          {patient.patientCode}: {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {patient.email} • {patient.phone}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">Individual</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty States */}
      {filteredFamilyGroups.length === 0 && filteredIndividualPatients.length === 0 && searchTerm && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or check spelling.
            </p>
          </CardContent>
        </Card>
      )}

      {familyGroups.length === 0 && individualPatients.length === 0 && !searchTerm && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No patients found</h3>
            <p className="text-gray-600">
              Add patients to your organization to start managing families.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 