import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Mail, X, Contact } from 'lucide-react'

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: () => Promise<void>
  emailFormData: any
  setEmailFormData: (data: any) => void
  emailInput: string
  handleEmailInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleEmailInputKeyDown: (e: React.KeyboardEvent) => void
  removeEmailRecipient: (email: string) => void
  addPatientEmail: () => void
  setShowPhonebookModal: (show: boolean) => void
  setShowTemplateModal: (show: boolean) => void
  toggleFileSelection: (fileId: string, type: 'file' | 'image') => void
  patient: any
  patientImages: any[]
  emailInputError: string
}

export default function EmailModal({
  isOpen,
  onClose,
  onSend,
  emailFormData,
  setEmailFormData,
  emailInput,
  handleEmailInputChange,
  handleEmailInputKeyDown,
  removeEmailRecipient,
  addPatientEmail,
  setShowPhonebookModal,
  setShowTemplateModal,
  toggleFileSelection,
  patient,
  patientImages,
  emailInputError
}: EmailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Compose and send an email to the patient or other recipients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            {/* Quick Templates */}
            <div>
              <Button
                variant="outline"
                onClick={() => setShowTemplateModal(true)}
                className="w-full justify-center"
              >
                📝 Browse Quick Templates
              </Button>
            </div>
            <div>
              <Label>To</Label>
              <div className="mt-1 space-y-2">
                <div className="flex flex-wrap gap-1 min-h-[2.5rem] p-2 border rounded bg-white items-center">
                  {emailFormData.recipients.map((email) => (
                    <div
                      key={email}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                    >
                      {email}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-blue-600"
                        onClick={() => removeEmailRecipient(email)}
                      />
                    </div>
                  ))}
                  <input
                    type="email"
                    value={emailInput}
                    onChange={handleEmailInputChange}
                    onKeyDown={handleEmailInputKeyDown}
                    placeholder={emailFormData.recipients.length === 0 ? "Type email address..." : ""}
                    className="flex-1 min-w-[200px] outline-none bg-transparent text-sm py-1 rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPhonebookModal(true)}
                    className="text-xs flex items-center gap-1"
                  >
                    <Contact className="w-5 h-5" />
                  </Button>
                </div>

                {emailInputError && (
                  <div className="text-xs text-red-500 px-2">
                    {emailInputError}
                  </div>
                )}

                <div className="flex gap-2">
                  {patient?.email && !emailFormData.recipients.includes(patient.email) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPatientEmail}
                      className="text-xs"
                    >
                      + Add Patient Email
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label>Subject</Label>
              <Input
                value={emailFormData.subject}
                onChange={(e) => setEmailFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Message</Label>
              <Textarea
                value={emailFormData.content}
                onChange={(e) => setEmailFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter your message..."
                rows={12}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onSend}
            disabled={!emailFormData.subject.trim() || !emailFormData.content.trim() || emailFormData.recipients.length === 0}
            className="flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 