'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  User,
  Calendar,
  Clock,
  CheckCircle,
  X,
  ArrowRight,
  FileText,
  Mail
} from 'lucide-react';
import { useCall } from '@/contexts/CallContext';
import { WaitingListEntry } from '@/types/waiting-list';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { EmailModal } from '@/components/patient-detail';

interface WaitingListTableProps {
  entries: WaitingListEntry[];
  practitionerName: string;
  onPatientClick: (patientId: string) => void;
  onRefresh: () => void;
}

export default function WaitingListTable({
  entries,
  practitionerName,
  onPatientClick,
  onRefresh
}: WaitingListTableProps) {
  const { startCall } = useCall();
  const { toast } = useToast();
  const [completingEntryId, setCompletingEntryId] = useState<string | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [movingToPending, setMovingToPending] = useState<string | null>(null);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailFormData, setEmailFormData] = useState({
    recipients: [] as string[],
    subject: '',
    content: '',
    selectedFiles: [] as string[],
    selectedImages: [] as string[]
  });
  const [emailInput, setEmailInput] = useState('');
  const [emailInputError, setEmailInputError] = useState('');



  const handleCallPatient = (patient: any) => {
    if (!patient.phone) {
      toast({
        title: 'No phone number',
        description: 'This patient does not have a phone number on file.',
        variant: 'destructive',
      });
      return;
    }

    // Check if we're in an embedded iframe
    if (typeof window !== 'undefined' && window.parent !== window) {
      // We're in an iframe, send message to parent to start the call
      window.parent.postMessage({
        type: 'startCall',
        patientData: {
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
          phone: patient.phone,
          initials: `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`
        }
      }, '*');
    } else {
      // Normal mode, start call directly
      startCall({
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        phone: patient.phone,
        initials: `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`
      });
    }
  };

  const handleEmailPatient = (entry: WaitingListEntry) => {
    if (!entry.patient.email) {
      toast({
        title: 'No email address',
        description: 'This patient does not have an email address on file.',
        variant: 'destructive',
      });
      return;
    }

    // Create contextual email content
    const appointmentInfo = entry.waitingAppointment
      ? `${entry.waitingAppointment.type} appointment (${entry.waitingAppointment.duration} minutes)`
      : 'dental appointment';

    const subject = `Available Appointment Slot - ${practitionerName}`;

    const content =
      `Dear ${entry.patient.firstName} ${entry.patient.lastName},\n\n` +
      `Great news! We have an available appointment slot for your ${appointmentInfo} with ${practitionerName}.\n\n` +
      `📅 AVAILABLE APPOINTMENT:\n` +
      `Date: [ENTER DATE HERE - e.g., Monday, January 15th]\n` +
      `Time: [ENTER TIME HERE - e.g., 2:30 PM]\n\n` +
      `If you're interested in this appointment, please reply to this email or call our office as soon as possible to confirm, as these slots fill up quickly.\n\n` +
      `If this time doesn't work for you, please let us know and we'll keep you on our waiting list for the next available slot.\n\n` +
      `We look forward to seeing you soon!\n\n` +
      `Best regards,\n` +
      `Your Dental Team`;

    // Set up email modal with pre-filled content
    setEmailFormData({
      recipients: [entry.patient.email],
      subject: subject,
      content: content,
      selectedFiles: [],
      selectedImages: []
    });

    setShowEmailModal(true);
  };

  // Auto-select the first placeholder when email modal opens
  useEffect(() => {
    if (showEmailModal) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder*="Enter your message"]') as HTMLTextAreaElement;
        if (textarea) {
          const content = textarea.value;
          const firstPlaceholderStart = content.indexOf('[ENTER DATE HERE');
          const firstPlaceholderEnd = content.indexOf(']', firstPlaceholderStart) + 1;

          if (firstPlaceholderStart !== -1 && firstPlaceholderEnd !== -1) {
            textarea.focus();
            textarea.setSelectionRange(firstPlaceholderStart, firstPlaceholderEnd);
          }
        }
      }, 100);
    }
  }, [showEmailModal]);

  // Email handling functions
  const handleSendEmail = async () => {
    // Simulate sending email
    toast({
      title: 'Success',
      description: 'Email sent successfully!',
    });
    setShowEmailModal(false);
    setEmailFormData({
      subject: '',
      content: '',
      recipients: [],
      selectedFiles: [],
      selectedImages: []
    });
  };

  const addEmailRecipient = (email: string) => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailFormData.recipients.includes(email) && emailRegex.test(email)) {
      setEmailFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, email]
      }));
      setEmailInputError('');
      return true;
    } else if (email && !emailRegex.test(email)) {
      setEmailInputError('Please enter a valid email address');
      return false;
    } else if (emailFormData.recipients.includes(email)) {
      setEmailInputError('Email already added');
      return false;
    }
    return false;
  };

  const removeEmailRecipient = (email: string) => {
    setEmailFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(recipient => recipient !== email)
    }));
  };

  const addPatientEmail = () => {
    // This function is required by EmailModal but not used in this context
  };

  const handleEmailInputKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && emailInput.trim()) {
      e.preventDefault();
      if (addEmailRecipient(emailInput.trim())) {
        setEmailInput('');
        setEmailInputError('');
      }
    } else if (e.key === 'Backspace' && !emailInput && emailFormData.recipients.length > 0) {
      // Remove last recipient if input is empty and backspace is pressed
      const lastEmail = emailFormData.recipients[emailFormData.recipients.length - 1];
      removeEmailRecipient(lastEmail);
    }
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailInput(e.target.value);
    // Clear error when user starts typing
    if (emailInputError) {
      setEmailInputError('');
    }
  };

  const toggleFileSelection = (fileId: string, type: 'file' | 'image') => {
    // File selection not implemented for waiting list emails
  };

  const handleCompleteEntry = async () => {
    if (!completingEntryId) return;

    try {
      const response = await fetch('/api/waiting-list', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: completingEntryId,
          status: 'COMPLETED',
        }),
      });

      if (!response.ok) throw new Error('Failed to complete entry');

      toast({
        title: 'Success',
        description: 'Patient removed from waiting list',
      });

      onRefresh();
      setShowCompleteModal(false);
      setCompletingEntryId(null);
    } catch (error) {
      console.error('Error completing entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove patient from waiting list',
        variant: 'destructive',
      });
    }
  };

  const handleMoveToPending = async (waitingAppointmentId: string) => {
    try {
      setMovingToPending(waitingAppointmentId);

      const response = await fetch('/api/waiting-list/move-to-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waitingAppointmentId,
        }),
      });

      if (!response.ok) throw new Error('Failed to move to pending');

      toast({
        title: 'Success',
        description: 'Waiting appointment moved to pending list',
      });

      onRefresh();
    } catch (error) {
      console.error('Error moving to pending:', error);
      toast({
        title: 'Error',
        description: 'Failed to move appointment to pending',
        variant: 'destructive',
      });
    } finally {
      setMovingToPending(null);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (dateString?: string | Date) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>{practitionerName} - Waiting List</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No patients in the waiting list for this practitioner.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>{practitionerName} - Waiting List</span>
            <Badge variant="secondary" className="ml-2">
              {entries.length} patient{entries.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Patient</th>
                  <th className="text-left py-3 px-2 font-medium">Notes</th>
                  <th className="text-left py-3 px-2 font-medium">Date Added</th>
                  <th className="text-left py-3 px-2 font-medium">Waiting Appointment</th>
                  <th className="text-left py-3 px-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-gray-50">
                    {/* Patient Column */}
                    <td className="py-4 px-2">
                      <div className="space-y-1">
                        <div>
                          <button
                            onClick={() => onPatientClick(entry.patient.id)}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                          >
                            {entry.patient.firstName} {entry.patient.lastName}
                          </button>
                        </div>
                        {/* Contact Information */}
                        <div className="space-y-1">
                          {entry.patient.phone && (
                            <div className="flex items-center gap-1 text-xs">
                              <span
                                onClick={() => handleCallPatient(entry.patient)}
                                title="Call patient"
                                className="cursor-pointer"
                              >
                                <Phone className="w-3 h-3 text-blue-600 hover:text-blue-800" />
                              </span>
                              <span className="text-gray-500">{entry.patient.phone}</span>
                            </div>
                          )}
                          {entry.patient.email && (
                            <div className="flex items-center gap-1 text-xs">
                              <span
                                onClick={() => handleEmailPatient(entry)}
                                title="Send email to patient"
                                className="cursor-pointer"
                              >
                                <Mail className="w-3 h-3 text-blue-600 hover:text-blue-800" />
                              </span>
                              <span className="text-gray-500">{entry.patient.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Notes Column */}
                    <td className="py-4 px-2">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {entry.notes || 'No notes'}
                        </span>
                      </div>
                    </td>

                    {/* Date Added Column */}
                    <td className="py-4 px-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {formatDate(entry.createdAt)}
                        </span>
                      </div>
                    </td>

                    {/* Waiting Appointment Column */}
                    <td className="py-4 px-2">
                      {entry.waitingAppointment ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {entry.waitingAppointment.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {entry.waitingAppointment.duration} min
                            </span>
                          </div>
                          {entry.waitingAppointment.startTime && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>
                                {formatTime(entry.waitingAppointment.startTime)}
                                {entry.waitingAppointment.endTime &&
                                  ` - ${formatTime(entry.waitingAppointment.endTime)}`
                                }
                              </span>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMoveToPending(entry.waitingAppointment!.id)}
                            disabled={movingToPending === entry.waitingAppointment!.id}
                            className="h-6 px-2 text-xs"
                          >
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Move to Pending
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          No appointment
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCompletingEntryId(entry.id);
                          setShowCompleteModal(true);
                        }}
                        className="h-8 px-3 text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Complete Confirmation Modal */}
      <ConfirmationModal
        open={showCompleteModal}
        onOpenChange={setShowCompleteModal}
        title="Mark as Completed"
        description="Are you sure you want to mark this patient as completed and remove them from the waiting list?"
        confirmText="Mark Complete"
        cancelText="Cancel"
        variant="default"
        icon="info"
        onConfirm={handleCompleteEntry}
      />

      {/* Email Modal */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSend={handleSendEmail}
        emailFormData={emailFormData}
        setEmailFormData={setEmailFormData}
        emailInput={emailInput}
        handleEmailInputChange={handleEmailInputChange}
        handleEmailInputKeyDown={handleEmailInputKeyDown}
        removeEmailRecipient={removeEmailRecipient}
        addPatientEmail={addPatientEmail}
        setShowPhonebookModal={() => { }} // Not implemented for waiting list
        setShowTemplateModal={() => { }} // Not implemented for waiting list
        toggleFileSelection={toggleFileSelection}
        patient={null} // No specific patient context for waiting list
        patientImages={[]} // No images for waiting list emails
        emailInputError={emailInputError}
      />
    </>
  );
} 