# Access Control Policy

**Owner:** ArcaLife Security Lead  
**Effective:** June 2026  
**Review:** Annual

---

## 1. User provisioning

- Staff accounts created by clinic managers or organization owners
- Public registration disabled in production by default
- Privileged roles (MANAGER, ORGANIZATION_OWNER) cannot be self-assigned via registration

## 2. Authentication

- Email + password with bcrypt hashing (cost factor 10)
- Account lockout via `isActive` / `isDisabled` flags
- MFA (TOTP) **required** for MANAGER and ORGANIZATION_OWNER roles

## 3. Authorization

- Role-based access per `UserRole` enum
- All patient data scoped to `organizationId`
- Manager-only access: user management, audit logs, analytics, DSR export/erasure

## 4. Access review

- Quarterly review of active users per organization (manager responsibility)
- Immediate revocation on staff departure (`isDisabled`)

## 5. Privileged access

- Production database credentials limited to engineering leads
- Secrets stored in Vercel environment variables, never in git
- Upload station PINs managed by clinic managers

## 6. Session management

- JWT sessions via NextAuth
- Stateless — no persistent session store
- Upload station: HMAC-signed cookie, 12-hour TTL
