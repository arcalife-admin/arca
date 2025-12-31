"use client";

import React, { useState, useCallback, useRef, useEffect, Suspense } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

interface ScannedImage {
    id: string;
    url: string;
    name: string;
    status: "pending" | "scanning" | "completed";
}

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string | Date;
}

interface Practitioner {
    id: string;
    name: string;
}

interface Appointment {
    id: string;
    patientId: string;
    patient: Patient;
    practitionerId: string;
    startTime: string;
    endTime: string;
    type: {
        id: string;
        name: string;
        color: string;
    };
}

function ImagingPageContent() {
    const searchParams = useSearchParams();
    const [images, setImages] = useState<ScannedImage[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [currentScanningIndex, setCurrentScanningIndex] = useState<number | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scanningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationDuration = 3000; // 3000ms = 3 seconds

    // Patient selection state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [editingPatient, setEditingPatient] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [selectedPractitionerId, setSelectedPractitionerId] = useState<string | null>(null);

    // Fetch patients
    const { data: patients = [], isSuccess: isPatientsLoaded } = useQuery({
        queryKey: ['patients'],
        queryFn: async () => {
            const response = await fetch('/api/patients');
            if (!response.ok) {
                throw new Error('Failed to fetch patients');
            }
            const data = await response.json();
            return data.map((patient: any) => ({
                ...patient,
                name: `${patient.firstName} ${patient.lastName}`
            }));
        },
    });

    // Fetch practitioners
    const { data: practitioners = [] } = useQuery({
        queryKey: ['practitioners'],
        queryFn: async () => {
            const response = await fetch('/api/practitioners');
            if (!response.ok) {
                throw new Error('Failed to fetch practitioners');
            }
            return response.json();
        },
    });

    // Fetch today's appointments
    const { data: todayAppointments = [] } = useQuery({
        queryKey: ['appointments', 'today', selectedPractitionerId],
        queryFn: async () => {
            let url = '/api/appointments';
            // Get today's date in ISO format (YYYY-MM-DD)
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            url += `?date=${todayStr}`;

            if (selectedPractitionerId) {
                url += `&practitionerId=${selectedPractitionerId}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Failed to fetch appointments');
            }
            return response.json();
        },
    });

    const filteredPatients = patients.filter((patient: any) => {
        const search = searchQuery.trim().toLowerCase();
        return !search || [
            patient.name,
            patient.email || '',
            patient.phone,
            patient.address || '',
            patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '',
        ].some((field) => String(field || '').toLowerCase().includes(search));
    });

    // Handle patientId from URL query parameter
    useEffect(() => {
        const patientId = searchParams.get('patientId');
        if (patientId && isPatientsLoaded && patients.length > 0 && !selectedPatient) {
            const foundPatient = patients.find((patient: any) => patient.id === patientId);
            if (foundPatient) {
                setSelectedPatient(foundPatient);
                setSearchQuery(`${foundPatient.firstName} ${foundPatient.lastName}`);
                setEditingPatient(false);
            }
        }
    }, [searchParams, isPatientsLoaded, patients, selectedPatient]);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const processFiles = (files: FileList) => {
        const newImages: ScannedImage[] = Array.from(files).map((file) => ({
            id: Math.random().toString(36).substring(2, 9),
            url: URL.createObjectURL(file),
            name: file.name,
            status: "pending",
        }));

        setImages((prev) => [...prev, ...newImages]);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
        }
    };

    const handleClickUpload = () => {
        fileInputRef.current?.click();
    };

    // Function to handle scan completion
    const onScanComplete = useCallback((imageId: string) => {
        // Set exiting state to true
        setIsExiting(true);

        // Mark the image as completed
        setImages(prev => {
            const index = prev.findIndex(img => img.id === imageId);
            if (index === -1) return prev;

            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                status: "completed"
            };
            return updated;
        });

        // Reset scanning state
        setCurrentScanningIndex(null);
        setIsAnimating(false);

        // After the exit animation completes, reset exiting state
        setTimeout(() => {
            setIsExiting(false);
        }, 600); // Slightly longer than the exit animation duration to ensure it completes
    }, []);

    const startNextScan = useCallback(() => {
        if (isAnimating || isExiting) return;

        // Find the first pending image
        const pendingIndex = images.findIndex(img => img.status === "pending");

        if (pendingIndex !== -1) {
            setIsAnimating(true);
            setCurrentScanningIndex(pendingIndex);

            // Update status to scanning
            setImages(prev => {
                const updated = [...prev];
                if (updated[pendingIndex]) {
                    updated[pendingIndex] = { ...updated[pendingIndex], status: "scanning" };
                }
                return updated;
            });

            // Clear any existing timeout
            if (scanningTimeoutRef.current) {
                clearTimeout(scanningTimeoutRef.current);
            }

            // Set a timeout to complete the scan
            const imageId = images[pendingIndex].id;
            scanningTimeoutRef.current = setTimeout(() => {
                onScanComplete(imageId);
            }, animationDuration);
        }
    }, [images, isAnimating, isExiting, onScanComplete]);

    // Start scanning when new images are added or previous scan completes
    useEffect(() => {
        if (!isAnimating && !isExiting && images.some(img => img.status === "pending")) {
            startNextScan();
        }

        // Cleanup function
        return () => {
            if (scanningTimeoutRef.current) {
                clearTimeout(scanningTimeoutRef.current);
            }
        };
    }, [images, isAnimating, isExiting, startNextScan]);

    const removeImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const handleKeyDown = (e: React.KeyboardEvent, patients: any[]) => {
        if (!patients.length) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev < patients.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < patients.length) {
                    const patient = patients[selectedIndex];
                    setSelectedPatient(patient);
                    setSearchQuery(patient.name);
                    setEditingPatient(false);
                    setSelectedIndex(-1);
                }
                break;
            case 'Escape':
                setEditingPatient(false);
                setSelectedIndex(-1);
                break;
        }
    };

    const handleAppointmentSelect = (appointment: Appointment) => {
        const patient = appointment.patient;
        setSelectedPatient(patient);
        setSearchQuery(`${patient.firstName} ${patient.lastName}`);
        setEditingPatient(false);
    };

    const saveImages = async (imageIds?: string[]) => {
        if (!selectedPatient) return;

        // Save only specific images if imageIds is provided, otherwise save all completed images
        const imagesToSave = imageIds
            ? images.filter(img => imageIds.includes(img.id) && img.status === "completed")
            : images.filter(img => img.status === "completed");

        if (imagesToSave.length === 0) {
            toast.error("No completed images to save");
            return;
        }

        try {
            // Track successful uploads
            let successCount = 0;

            // Process each image sequentially
            for (const image of imagesToSave) {
                // Convert data URL to Blob
                const response = await fetch(image.url);
                const blob = await response.blob();

                // Create a File object from the Blob
                const file = new File([blob], image.name, { type: blob.type });

                // Create form data
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', 'XRAY'); // Default to X-ray type
                formData.append('notes', `Uploaded from imaging scanner: ${image.name}`);
                // Add optional fields
                formData.append('side', ''); // Optional side information

                // Call the API
                const result = await fetch(`/api/patients/${selectedPatient.id}/images`, {
                    method: 'POST',
                    body: formData
                });

                if (result.ok) {
                    successCount++;
                    // Remove the image from our local state once saved
                    removeImage(image.id);
                } else {
                    console.error(`Failed to save image ${image.name}`);
                }
            }

            if (successCount > 0) {
                toast.success(`${successCount} image${successCount > 1 ? 's' : ''} saved to patient: ${selectedPatient.firstName} ${selectedPatient.lastName}`);
            } else {
                toast.error('Failed to save images');
            }
        } catch (error) {
            console.error('Error saving images:', error);
            toast.error('Failed to save images to patient record');
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-12 gap-6">
                {/* Patient Selection Column */}
                <div className="col-span-12 md:col-span-3">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Patient Selection</CardTitle>
                            <CardDescription>
                                Select a patient for the images
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Patient Info Display */}
                            <div className="p-3 bg-gray-50 rounded-md">
                                {selectedPatient ? (
                                    <div>
                                        <h3 className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                                        {selectedPatient.dateOfBirth && (
                                            <p className="text-sm text-gray-500">DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No patient selected</p>
                                )}
                            </div>

                            {/* Search Bar */}
                            <div className="relative">
                                {editingPatient ? (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Search patients..."
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setSelectedIndex(-1);
                                            }}
                                            onKeyDown={(e) => handleKeyDown(e, filteredPatients)}
                                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            autoFocus
                                        />
                                        {searchQuery && filteredPatients.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                                                {filteredPatients.map((patient: any, index: number) => (
                                                    <div
                                                        key={patient.id}
                                                        className={`px-4 py-2 cursor-pointer flex justify-between items-center ${index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                                                        onClick={() => {
                                                            setSelectedPatient(patient);
                                                            setSearchQuery(patient.name);
                                                            setEditingPatient(false);
                                                            setSelectedIndex(-1);
                                                        }}
                                                    >
                                                        <span>
                                                            {patient.name} <span className="text-xs text-gray-500">({patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'})</span>
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div
                                        className="w-full px-3 py-2 border rounded-md bg-white text-gray-900 cursor-pointer hover:bg-gray-50"
                                        onClick={() => {
                                            setEditingPatient(true);
                                            setSearchQuery('');
                                        }}
                                    >
                                        {searchQuery || 'Search patients...'}
                                    </div>
                                )}
                            </div>

                            {/* Today's Appointments */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-medium">Today's Appointments</h3>
                                    <Select value={selectedPractitionerId || ''} onValueChange={(value) => setSelectedPractitionerId(value || null)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select doctor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={null}>All Practitioners</SelectItem>
                                            {practitioners.map((doc: any) => (
                                                <SelectItem key={doc.id} value={doc.id}>
                                                    {doc.firstName} {doc.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <ScrollArea className="h-[300px] border rounded-md">
                                    {todayAppointments.filter((appointment: Appointment) => appointment.patient).length > 0 ? (
                                        <div className="p-2">
                                            {todayAppointments
                                                .filter((appointment: Appointment) => appointment.patient)
                                                .map((appointment: Appointment) => (
                                                    <div
                                                        key={appointment.id}
                                                        className="p-2 border-b last:border-b-0 cursor-pointer hover:bg-gray-50"
                                                        onClick={() => handleAppointmentSelect(appointment)}
                                                    >
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: appointment.type.color }}></div>
                                                            <span className="font-medium text-sm">{appointment.patient.firstName} {appointment.patient.lastName}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {format(new Date(appointment.startTime), 'h:mm a')} - {format(new Date(appointment.endTime), 'h:mm a')}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-gray-500 italic">
                                            No appointments today
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>

                            {/* Save Image Buttons */}
                            {selectedPatient && images.some(img => img.status === "completed") && (
                                <div className="space-y-2 pt-2">
                                    <Button
                                        className="w-full"
                                        onClick={() => saveImages()}
                                    >
                                        Save All Images to Patient
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* X-Ray Scanner Column */}
                <div className="col-span-12 md:col-span-9">
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>X-Ray Scanner Emulator</CardTitle>
                            <CardDescription>
                                Upload your X-ray images to see them being scanned
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Drop Zone */}
                            <div
                                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-gray-300"
                                    }`}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium">Drag and drop your X-ray images</h3>
                                <p className="text-sm text-gray-500 mt-1 mb-4">
                                    or click the button below to browse
                                </p>
                                <Button onClick={handleClickUpload}>
                                    Select Images
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileInputChange}
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>

                            {/* Scanner Visualization */}
                            <div className="mt-8 p-6 bg-gray-100 rounded-lg relative min-h-[200px] flex items-center justify-center overflow-hidden">
                                {/* Scanner bed with lighting effects */}
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-75"></div>
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-75"></div>

                                {/* Scan line that moves during animation */}
                                {isAnimating && (
                                    <motion.div
                                        initial={{ top: "0%" }}
                                        animate={{ top: "100%" }}
                                        transition={{ duration: animationDuration / 1000, ease: "linear" }}
                                        className="absolute inset-x-0 h-2 bg-blue-500/50 z-10"
                                        style={{ boxShadow: "0 0 10px 5px rgba(59, 130, 246, 0.3)" }}
                                    />
                                )}

                                {/* Scanner Animation Area */}
                                <AnimatePresence mode="wait">
                                    {currentScanningIndex !== null && images[currentScanningIndex]?.status === "scanning" && (
                                        <motion.div
                                            key={`scanning-${images[currentScanningIndex]?.id}`}
                                            initial={{ y: -200, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: 200, opacity: 0, transition: { duration: 0.5 } }}
                                            transition={{
                                                duration: animationDuration / 1000,
                                                ease: "linear"
                                            }}
                                            onAnimationComplete={() => {
                                                // This is a backup check in case the timeout doesn't fire properly
                                                if (currentScanningIndex !== null && images[currentScanningIndex]?.status === "scanning") {
                                                    const imageId = images[currentScanningIndex]?.id;
                                                    if (imageId) {
                                                        onScanComplete(imageId);
                                                    }
                                                }
                                            }}
                                            className="max-w-full max-h-[180px] shadow-lg"
                                        >
                                            <img
                                                src={images[currentScanningIndex]?.url}
                                                alt="Scanning"
                                                className="max-h-[180px] object-contain"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Only show this when not scanning and not in exit animation */}
                                {!isAnimating && !isExiting && (
                                    <div className="text-center">
                                        <p className="text-gray-500 italic mb-2">Scanner ready. Upload images to begin.</p>
                                        {images.some(img => img.status === "completed") && (
                                            <p className="text-green-600 text-sm flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 mr-1" /> Completed images ready
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Completed Images Gallery */}
                            <div className="mt-6">
                                <h3 className="text-lg font-medium mb-3">Completed Images</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {images.filter(img => img.status === "completed").map(image => (
                                        <div key={image.id} className="relative rounded-lg overflow-hidden border bg-white">
                                            <div className="relative aspect-video">
                                                <img
                                                    src={image.url}
                                                    alt={image.name}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                            <div className="p-2 flex justify-between items-center">
                                                <span className="text-sm truncate">{image.name}</span>
                                                <div className="flex space-x-1">
                                                    {selectedPatient && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => saveImages([image.id])}
                                                        >
                                                            Save
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeImage(image.id)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {images.filter(img => img.status === "completed").length === 0 && (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500">No completed images yet</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default function ImagingPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
            <ImagingPageContent />
        </Suspense>
    );
}
