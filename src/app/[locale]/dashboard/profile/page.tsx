'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import OrganizationThemeSettings from '@/components/OrganizationThemeSettings'
import PersonalThemeSettings from '@/components/PersonalThemeSettings'
import ProcedurePriceSettings from '@/components/ProcedurePriceSettings'
import { LogoUpload } from '@/components/ui/logo-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Palette, Settings, Euro } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import MfaSettings from '@/components/profile/MfaSettings'
import ChangePasswordSettings from '@/components/profile/ChangePasswordSettings'

interface User {
  id: string
  name: string
  email: string
  phone: string
  address: string
  role: string
  organizationId: string
  firstName: string
  lastName: string
}

interface Organization {
  id: string
  name: string
  address: string
  phone: string
  email: string
  logoUrl?: string
}

const formatRole = (role: string) => {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Edit states
  const [isEditingUser, setIsEditingUser] = useState(false)
  const [isEditingOrganization, setIsEditingOrganization] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Collapsible states
  const [isPersonalThemeOpen, setIsPersonalThemeOpen] = useState(false)
  const [isProcedurePricesOpen, setIsProcedurePricesOpen] = useState(false)
  const [isOrgThemeOpen, setIsOrgThemeOpen] = useState(false)

  // Form states
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: ''
  })

  const [organizationForm, setOrganizationForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  })

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      const data = await res.json()

      if (res.ok) {
        setUser(data.user)
        setOrganization(data.organization)

        // Initialize form states
        setUserForm({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          address: data.user.address || ''
        })

        if (data.organization) {
          setOrganizationForm({
            name: data.organization.name || '',
            address: data.organization.address || '',
            phone: data.organization.phone || '',
            email: data.organization.email || ''
          })
        }
      } else {
        setError('Încărcarea datelor profilului a eșuat')
      }
    } catch (error) {
      setError('Încărcarea datelor profilului a eșuat')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router])

  const handleUserSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'user',
          data: userForm
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setUser(data.user)
        setOrganization(data.organization)
        setIsEditingUser(false)

        // Update session if email changed
        if (userForm.email !== session?.user?.email) {
          await update()
        }

        toast({
          title: 'Succes',
          description: 'Profilul a fost actualizat cu succes',
        })
      } else {
        toast({
          title: 'Eroare',
          description: data.message || 'Actualizarea profilului a eșuat',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'A apărut o eroare neașteptată',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleOrganizationSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'organization',
          data: organizationForm
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setUser(data.user)
        setOrganization(data.organization)
        setIsEditingOrganization(false)

        toast({
          title: 'Succes',
          description: 'Informațiile organizației au fost actualizate cu succes',
        })
      } else {
        toast({
          title: 'Eroare',
          description: data.message || 'Actualizarea informațiilor organizației a eșuat',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Eroare',
        description: 'A apărut o eroare neașteptată',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogoUpdate = (logoUrl: string | null) => {
    // Update the organization state with the new logo URL
    if (organization) {
      setOrganization({
        ...organization,
        logoUrl: logoUrl || undefined
      })
    }
  }

  const handleUserCancel = () => {
    // Reset form to original values
    if (user) {
      setUserForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      })
    }
    setIsEditingUser(false)
  }

  const handleOrganizationCancel = () => {
    // Reset form to original values
    if (organization) {
      setOrganizationForm({
        name: organization.name || '',
        address: organization.address || '',
        phone: organization.phone || '',
        email: organization.email || ''
      })
    }
    setIsEditingOrganization(false)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profil</h1>

        {/* User Information Section */}
        {user && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Informații utilizator</h2>
              {!isEditingUser && (
                <Button
                  onClick={() => setIsEditingUser(true)}
                  variant="outline"
                  size="sm"
                >
                  Editează
                </Button>
              )}
            </div>

            {isEditingUser ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prenume</Label>
                    <Input
                      id="firstName"
                      value={userForm.firstName}
                      onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nume</Label>
                    <Input
                      id="lastName"
                      value={userForm.lastName}
                      onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={userForm.phone}
                    onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Adresă</Label>
                  <Input
                    id="address"
                    value={userForm.address}
                    onChange={(e) => setUserForm(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700">Rol</Label>
                  <div className="mt-1 text-sm text-gray-500">{formatRole(user.role)} (nu poate fi modificat)</div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleUserSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Se salvează...' : 'Salvează modificările'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleUserCancel}
                    disabled={isSaving}
                  >
                    Anulează
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <div className="mt-1 text-sm text-gray-900">{user.firstName} {user.lastName}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-mail</label>
                  <div className="mt-1 text-sm text-gray-900">{user.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon</label>
                  <div className="mt-1 text-sm text-gray-900">{user.phone}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresă</label>
                  <div className="mt-1 text-sm text-gray-900">{user.address}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rol</label>
                  <div className="mt-1 text-sm text-gray-900">{formatRole(user.role)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        <ChangePasswordSettings />

        <MfaSettings />

        {/* Organization Information Section */}
        {organization && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Informații organizație</h2>
              {!isEditingOrganization && user?.role === 'ORGANIZATION_OWNER' && (
                <Button
                  onClick={() => setIsEditingOrganization(true)}
                  variant="outline"
                  size="sm"
                >
                  Editează
                </Button>
              )}
            </div>

            {isEditingOrganization ? (
              <div className="space-y-6">
                {/* Organization Logo Upload */}
                <div>
                  <LogoUpload
                    currentLogoUrl={organization.logoUrl}
                    onLogoUpdate={handleLogoUpdate}
                    disabled={false}
                  />
                </div>

                {/* Organization Details */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={organizationForm.name}
                      onChange={(e) => setOrganizationForm(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgEmail">Email</Label>
                    <Input
                      id="orgEmail"
                      type="email"
                      value={organizationForm.email}
                      onChange={(e) => setOrganizationForm(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgPhone">Phone</Label>
                    <Input
                      id="orgPhone"
                      value={organizationForm.phone}
                      onChange={(e) => setOrganizationForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orgAddress">Address</Label>
                    <Input
                      id="orgAddress"
                      value={organizationForm.address}
                      onChange={(e) => setOrganizationForm(prev => ({ ...prev, address: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleOrganizationSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Se salvează...' : 'Salvează modificările'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOrganizationCancel}
                    disabled={isSaving}
                  >
                    Anulează
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Logo Display */}
                <div>
                  <LogoUpload
                    currentLogoUrl={organization.logoUrl}
                    onLogoUpdate={handleLogoUpdate}
                    disabled={true}
                  />
                </div>

                {/* Organization Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <div className="mt-1 text-sm text-gray-900">{organization.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-mail</label>
                  <div className="mt-1 text-sm text-gray-900">{organization.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefon</label>
                  <div className="mt-1 text-sm text-gray-900">{organization.phone}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Adresă</label>
                  <div className="mt-1 text-sm text-gray-900">{organization.address}</div>
                </div>
                {user?.role !== 'ORGANIZATION_OWNER' && (
                  <p className="text-sm text-gray-500 italic">Doar proprietarii organizației pot edita aceste informații.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Personal Theme Settings - Visible to All Users */}
        {user && (
          <Card className="mt-8">
            <Collapsible open={isPersonalThemeOpen} onOpenChange={setIsPersonalThemeOpen}>
              <CardHeader className="pb-4">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="flex items-center space-x-3">
                      <Palette className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-900">Setări temă personală</h3>
                        <p className="text-sm text-gray-600">Personalizați aspectul interfeței</p>
                      </div>
                    </div>
                    {isPersonalThemeOpen ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <PersonalThemeSettings />
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Procedure default prices - visible to all users */}
        {user && (
          <Card className="mt-8">
            <Collapsible open={isProcedurePricesOpen} onOpenChange={setIsProcedurePricesOpen}>
              <CardHeader className="pb-4">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="flex items-center space-x-3">
                      <Euro className="h-5 w-5 text-green-600" />
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-900">Prețuri implicite proceduri</h3>
                        <p className="text-sm text-gray-600">
                          Set your default prices for surgical procedures (prefilled when adding to patients)
                        </p>
                      </div>
                    </div>
                    {isProcedurePricesOpen ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <ProcedurePriceSettings />
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Organization Theme Settings - Only for Organization Owners */}
        {user && user.role === 'ORGANIZATION_OWNER' && (
          <Card className="mt-8">
            <Collapsible open={isOrgThemeOpen} onOpenChange={setIsOrgThemeOpen}>
              <CardHeader className="pb-4">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="flex items-center space-x-3">
                      <Settings className="h-5 w-5 text-purple-600" />
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-900">Setări temă organizație</h3>
                        <p className="text-sm text-gray-600">Personalizați aspectul interfeței organizației</p>
                      </div>
                    </div>
                    {isOrgThemeOpen ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <OrganizationThemeSettings />
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}
      </div>
    </div>
  )
} 