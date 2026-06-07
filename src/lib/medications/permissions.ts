export function hasManagerPermissions(userRole?: string | null): boolean {
  return userRole === 'ORGANIZATION_OWNER' || userRole === 'MANAGER'
}
