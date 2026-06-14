'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, ImagePlus, Lock, LogOut, Search, Upload } from 'lucide-react';
import { toast } from 'sonner';

type ImageCategory = 'BEFORE_PHOTO' | 'AFTER_PHOTO';

interface PatientSummary {
  id: string;
  firstName: string;
  lastName: string;
  patientCode: string | null;
  dateOfBirth: string;
  phone: string | null;
}

interface RecentUpload {
  id: string;
  patientName: string;
  type: ImageCategory;
  count: number;
  at: string;
}

function normalizeDate(dateString: string): string[] {
  if (!dateString) return [];
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return [dateString];
  const pad = (n: number) => n.toString().padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear().toString();
  const year2 = year.slice(-2);
  return [
    date.toLocaleDateString('en-GB'),
    date.toLocaleDateString('en-US'),
    date.toISOString().slice(0, 10),
    `${day}${month}${year2}`,
    `${month}${day}${year2}`,
    `${day}${month}${year}`,
  ];
}

export default function UploadStationPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [pin, setPin] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [category, setCategory] = useState<ImageCategory>(() => {
    if (typeof window === 'undefined') return 'BEFORE_PHOTO';
    return (sessionStorage.getItem('upload-station-category') as ImageCategory) || 'BEFORE_PHOTO';
  });
  const [isUploading, setIsUploading] = useState(false);
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/upload-station/patients');
      if (res.ok) {
        const data = await res.json();
        setPatients(data);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    sessionStorage.setItem('upload-station-category', category);
  }, [category]);

  const filteredPatients = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    if (!search) return patients.slice(0, 20);
    return patients.filter((patient) =>
      [
        patient.patientCode || '',
        patient.firstName || '',
        patient.lastName || '',
        patient.phone || '',
        ...normalizeDate(patient.dateOfBirth).map((d) => d.toLowerCase()),
      ].some((field) => String(field).toLowerCase().includes(search))
    ).slice(0, 20);
  }, [patients, searchQuery]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUnlocking(true);
    try {
      const res = await fetch('/api/upload-station/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        toast.error('Invalid PIN');
        return;
      }
      setPin('');
      await checkAuth();
      toast.success('Upload station unlocked');
    } catch {
      toast.error('Failed to unlock');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/upload-station/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
    setSelectedPatient(null);
    setPatients([]);
    toast.success('Locked');
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length || !selectedPatient) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('patientId', selectedPatient.id);
      formData.append('type', category);
      Array.from(files).forEach((file) => formData.append('files', file));

      const res = await fetch('/api/upload-station/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const label = category === 'BEFORE_PHOTO' ? 'Before' : 'After';
      toast.success(`${data.count} ${label} photo${data.count > 1 ? 's' : ''} added for ${data.patient}`);

      setRecentUploads((prev) => [
        {
          id: crypto.randomUUID(),
          patientName: data.patient,
          type: category,
          count: data.count,
          at: new Date().toLocaleTimeString(),
        },
        ...prev,
      ].slice(0, 5));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold">Arca Upload</h1>
            <p className="mt-2 text-sm text-muted-foreground">Enter clinic PIN to upload photos</p>
          </div>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <Label htmlFor="pin" className="sr-only">PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Clinic PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="text-center text-lg tracking-widest h-14"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg" disabled={isUnlocking || !pin}>
              {isUnlocking ? 'Unlocking...' : 'Unlock'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
        <h1 className="text-lg font-semibold">Arca Upload</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-1" />
          Lock
        </Button>
      </header>

      <main className="flex-1 space-y-6 p-4">
        {/* Patient search */}
        <section className="space-y-3">
          <Label className="text-sm font-medium">Patient</Label>
          {selectedPatient ? (
            <div className="flex items-center justify-between rounded-lg border bg-white p-3">
              <div>
                <p className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPatient.patientCode || 'No code'} · {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedPatient(null)}>
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, code, or DOB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-12"
                />
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border bg-white">
                {filteredPatients.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">No patients found</p>
                ) : (
                  filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      className="w-full border-b px-4 py-3 text-left last:border-b-0 hover:bg-gray-50 active:bg-gray-100"
                      onClick={() => {
                        setSelectedPatient(patient);
                        setSearchQuery('');
                      }}
                    >
                      <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                      <p className="text-sm text-muted-foreground">
                        {patient.patientCode || 'No code'} · {new Date(patient.dateOfBirth).toLocaleDateString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* Before / After toggle */}
        <section className="space-y-3">
          <Label className="text-sm font-medium">Photo type</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={category === 'BEFORE_PHOTO' ? 'default' : 'outline'}
              className="h-14 text-base"
              onClick={() => setCategory('BEFORE_PHOTO')}
            >
              Before
            </Button>
            <Button
              type="button"
              variant={category === 'AFTER_PHOTO' ? 'default' : 'outline'}
              className="h-14 text-base"
              onClick={() => setCategory('AFTER_PHOTO')}
            >
              After
            </Button>
          </div>
        </section>

        {/* Upload buttons */}
        <section className="space-y-3">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />

          <Button
            className="w-full h-16 text-lg"
            disabled={!selectedPatient || isUploading}
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="h-6 w-6 mr-2" />
            {isUploading ? 'Uploading...' : 'Take Photo'}
          </Button>
          <Button
            variant="outline"
            className="w-full h-14 text-base"
            disabled={!selectedPatient || isUploading}
            onClick={() => galleryInputRef.current?.click()}
          >
            <ImagePlus className="h-5 w-5 mr-2" />
            Choose from Gallery
          </Button>
        </section>

        {/* Recent uploads */}
        {recentUploads.length > 0 && (
          <section className="space-y-2">
            <Label className="text-sm font-medium">Recent uploads</Label>
            <div className="space-y-2">
              {recentUploads.map((upload) => (
                <div key={upload.id} className="flex items-center gap-3 rounded-lg border bg-white p-3 text-sm">
                  <Upload className="h-4 w-4 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{upload.patientName}</p>
                    <p className="text-muted-foreground">
                      {upload.count} {upload.type === 'BEFORE_PHOTO' ? 'Before' : 'After'} · {upload.at}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
