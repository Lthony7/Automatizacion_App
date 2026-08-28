export type Role = 'OWNER' | 'ADMIN' | 'EDITOR' | 'REVIEWER' | 'VIEWER'

export type Permission =
  | 'content:create'
  | 'content:edit'
  | 'content:delete'
  | 'content:approve'
  | 'content:reject'
  | 'project:manage'
  | 'vertical:manage'
  | 'tenant:manage'
  | 'settings:manage'
  | 'users:manage'
  | 'analytics:view'
  | 'costs:view'
  | 'publications:manage'

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    'content:create',
    'content:edit',
    'content:delete',
    'content:approve',
    'content:reject',
    'project:manage',
    'vertical:manage',
    'tenant:manage',
    'settings:manage',
    'users:manage',
    'analytics:view',
    'costs:view',
    'publications:manage',
  ],
  ADMIN: [
    'content:create',
    'content:edit',
    'content:delete',
    'content:approve',
    'content:reject',
    'project:manage',
    'vertical:manage',
    'settings:manage',
    'users:manage',
    'analytics:view',
    'costs:view',
    'publications:manage',
  ],
  EDITOR: [
    'content:create',
    'content:edit',
    'content:delete',
    'analytics:view',
    'costs:view',
  ],
  REVIEWER: [
    'content:approve',
    'content:reject',
    'analytics:view',
  ],
  VIEWER: [
    'analytics:view',
  ],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false
}

export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

export function canReview(role: Role): boolean {
  return hasPermission(role, 'content:approve') || hasPermission(role, 'content:reject')
}

export function canCreateContent(role: Role): boolean {
  return hasPermission(role, 'content:create')
}

export function canEditContent(role: Role): boolean {
  return hasPermission(role, 'content:edit')
}

export function canManageSettings(role: Role): boolean {
  return hasPermission(role, 'settings:manage')
}

export function canManageUsers(role: Role): boolean {
  return hasPermission(role, 'users:manage')
}
