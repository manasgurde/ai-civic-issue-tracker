# Phase 1: Platform Foundation Plan

## Goal
Establish authentication, user management, and base infrastructure.

## Verification
- [ ] Users can register and login securely.
- [ ] RBAC is enforced across the API.
- [ ] User profiles can be managed.

## Tasks

### 1. Database & Models
- [ ] Define SQLAlchemy `User` model with hardcoded `Role` enum and `preferences` JSONB column.

### 2. Authentication API
- [ ] Implement `POST /auth/register` (email/password).
- [ ] Implement `POST /auth/login` using FastAPI `OAuth2PasswordBearer` + JWT.

### 3. User Profile API
- [ ] Implement `GET /users/me` and `PUT /users/me`.

### 4. Frontend Foundation
- [ ] Setup Next.js 15 pages for login and registration.
- [ ] Wire up auth forms to backend.

## Ponytail Rules
- **No OTP, No OAuth.**
- **No RBAC Engine.** Just `role: admin | citizen`.
- **No specialized preference tables.** Just JSONB.
- **Stop if overengineering.**
