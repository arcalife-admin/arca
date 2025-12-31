'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import OrganizationThemeSettings from '@/components/OrganizationThemeSettings'
import PersonalThemeSettings from '@/components/PersonalThemeSettings'
import { LogoUpload } from '@/components/ui/logo-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronRight, Palette, Settings, FileText, Users, Shield } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

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
        setError('Failed to load profile data')
      }
    } catch (error) {
      setError('Failed to load profile data')
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
          title: 'Success',
          description: 'Your profile has been updated successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to update profile',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
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
          title: 'Success',
          description: 'Organization information has been updated successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to update organization information',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

        {/* Quick Access Tools */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/file-management"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
            >
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900 group-hover:text-blue-700">File Management</h3>
                <p className="text-xs text-gray-500">Manage templates & documents</p>
              </div>
            </Link>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-400">Team Management</h3>
                <p className="text-xs text-gray-400">Coming soon...</p>
              </div>
            </div>

            <div className="flex items-center p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-400">Security Settings</h3>
                <p className="text-xs text-gray-400">Coming soon...</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Information Section */}
        {user && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">User Information</h2>
              {!isEditingUser && (
                <Button
                  onClick={() => setIsEditingUser(true)}
                  variant="outline"
                  size="sm"
                >
                  Edit
                </Button>
              )}
            </div>

            {isEditingUser ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={userForm.firstName}
                      onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={userForm.lastName}
                      onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={userForm.phone}
                    onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={userForm.address}
                    onChange={(e) => setUserForm(prev => ({ ...prev, address: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700">Role</Label>
                  <div className="mt-1 text-sm text-gray-500">{formatRole(user.role)} (cannot be changed)</div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={handleUserSave}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleUserCancel}
                    disabled={isSaving}
                  >
                    Cancel
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
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 text-sm text-gray-900">{user.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <div className="mt-1 text-sm text-gray-900">{user.phone}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <div className="mt-1 text-sm text-gray-900">{user.address}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <div className="mt-1 text-sm text-gray-900">{formatRole(user.role)}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Organization Information Section */}
        {organization && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Organization Information</h2>
              {!isEditingOrganization && user?.role === 'ORGANIZATION_OWNER' && (
                <Button
                  onClick={() => setIsEditingOrganization(true)}
                  variant="outline"
                  size="sm"
                >
                  Edit
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
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOrganizationCancel}
                    disabled={isSaving}
                  >
                    Cancel
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
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 text-sm text-gray-900">{organization.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <div className="mt-1 text-sm text-gray-900">{organization.phone}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <div className="mt-1 text-sm text-gray-900">{organization.address}</div>
                </div>
                {user?.role !== 'ORGANIZATION_OWNER' && (
                  <p className="text-sm text-gray-500 italic">Only organization owners can edit this information.</p>
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
                        <h3 className="text-lg font-semibold text-gray-900">Personal Theme Settings</h3>
                        <p className="text-sm text-gray-600">Customize your personal interface appearance</p>
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
                        <h3 className="text-lg font-semibold text-gray-900">Organization Theme Settings</h3>
                        <p className="text-sm text-gray-600">Customize your organization's interface appearance</p>
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