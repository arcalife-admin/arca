import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AddressAutocomplete from '@/components/AddressAutocomplete'

interface PatientEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  editFormData: {
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: 'MALE' | 'FEMALE' | 'OTHER'
    email: string
    phone: string
    address: string
    cnp: string
    country: string
    allowEarlySpotContact: boolean
    isLongTermCareAct: boolean
  }
  setEditFormData: (data: any) => void
  selectedAddress: any
  setSelectedAddress: (address: any) => void
}

export default function PatientEditModal({
  isOpen,
  onClose,
  onSubmit,
  editFormData,
  setEditFormData,
  selectedAddress,
  setSelectedAddress
}: PatientEditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose()
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editează informațiile pacientului</DialogTitle>
          <DialogDescription>
            Actualizați datele personale ale pacientului
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prenume</Label>
              <Input
                id="firstName"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nume</Label>
              <Input
                id="lastName"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateOfBirth">Data nașterii</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={editFormData.dateOfBirth}
                onChange={(e) => setEditFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="gender">Sex</Label>
              <Select
                value={editFormData.gender}
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, gender: value as 'MALE' | 'FEMALE' | 'OTHER' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Masculin</SelectItem>
                  <SelectItem value="FEMALE">Feminin</SelectItem>
                  <SelectItem value="OTHER">Altul</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              type="tel"
              value={editFormData.phone}
              onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="address">Adresă</Label>
            <AddressAutocomplete
              onSelect={(result) => {
                if (result.display_name !== editFormData.address) {
                  setEditFormData(prev => ({ ...prev, address: result.display_name }))
                  setSelectedAddress(result)
                  console.log('Address selected via autocomplete:', result)
                } else {
                  console.log('Same address selected, ignoring')
                }
              }}
              placeholder="Introduceți adresa..."
              className="w-full"
              value={editFormData.address}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cnp">CNP</Label>
              <Input
                id="cnp"
                value={editFormData.cnp}
                onChange={(e) => setEditFormData(prev => ({ ...prev, cnp: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="country">Țară</Label>
              <Input
                id="country"
                value={editFormData.country}
                onChange={(e) => setEditFormData(prev => ({ ...prev, country: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowEarlySpotContact"
              checked={editFormData.allowEarlySpotContact}
              onCheckedChange={(checked) =>
                setEditFormData(prev => ({ ...prev, allowEarlySpotContact: checked as boolean }))
              }
            />
            <Label
              htmlFor="allowEarlySpotContact"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Acceptă contact pentru programări anticipate
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isLongTermCareAct"
              checked={editFormData.isLongTermCareAct}
              onCheckedChange={(checked) =>
                setEditFormData(prev => ({ ...prev, isLongTermCareAct: checked as boolean }))
              }
            />
            <Label
              htmlFor="isLongTermCareAct"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Pacient în regim de îngrijire pe termen lung
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Anulează
            </Button>
            <Button type="submit">
              Salvează modificările
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 