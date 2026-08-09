# Phase 1: Platform Foundation Context
*Date: 2026-08-09*

## Domain
Establish authentication, user management, and base infrastructure.

## Prior Decisions
- From PROJECT.md: Next.js 15, FastAPI, PostgreSQL.

## Decisions

### Authentication
- Email/Password only.
- **ponytail:** Skipped OTP and OAuth (YAGNI for MVP). Add when basic auth becomes a proven bottleneck.
- **ponytail:** Standard FastAPI `OAuth2PasswordBearer` + JWT. No custom token rotation engines. 

### Access Control
- **ponytail:** Hardcoded role enums in DB (Citizen, Field Worker, Manager, Admin). Skipped complex RBAC UI/engine.

### User Profile
- **ponytail:** Preferences stored in a single JSONB column. Skipped dedicated preferences tables.

## Deferred Ideas
- Mobile OTP and OAuth.
- Granular custom RBAC permissions UI.

## Canonical Refs
- `.planning/REQUIREMENTS.md`
