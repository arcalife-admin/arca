# Change Management Policy

**Owner:** ArcaLife Engineering Lead  
**Effective:** June 2026  
**Review:** Annual

---

## 1. Scope

All changes to application code, database schema, infrastructure configuration, and environment variables.

## 2. Process

1. **Proposal** — Change described in GitHub issue or PR
2. **Review** — Code review by at least one engineer; security-sensitive changes require security lead review
3. **Testing** — CI passes (lint, Semgrep SAST, dependency audit)
4. **Deployment** — Vercel preview for PRs; production via merge to main
5. **Verification** — Post-deploy health check (`/api/health`)

## 3. Emergency changes

SEV-1 fixes may bypass full review with post-incident documentation within 24 hours.

## 4. Database migrations

- Prisma migrations reviewed for data impact
- Destructive migrations require explicit approval
- RLS policies maintained on all new tables

## 5. Rollback

Vercel instant rollback available for application deployments. Supabase PITR for database recovery when enabled.

## 6. Documentation

Security-relevant changes update [application-controls.md](../../security/application-controls.md) and [control-matrix.md](../../security/control-matrix.md).
