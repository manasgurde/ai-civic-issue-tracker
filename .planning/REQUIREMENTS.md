# Requirements
*Last updated: 2026-08-09*

## Authentication & Access
- [ ] **AUTH-01**: User can register via email/password, mobile OTP, or OAuth.
- [ ] **AUTH-02**: System validates passwords against complexity rules (Min 12 chars, uppercase, lowercase, number, special char).
- [ ] **AUTH-03**: System authenticates users via JWT access and refresh tokens.
- [ ] **AUTH-04**: Admin can manage Role Based Access Control (RBAC) permissions.

## Citizen Profile
- [ ] **PROF-01**: Citizen can view and update personal profile information.
- [ ] **PROF-02**: Citizen can manage notification preferences and language settings.
- [ ] **PROF-03**: Citizen can view personal complaint statistics and history.

## Complaint Submission
- [ ] **COMP-01**: Citizen can submit text-based complaints with category and description.
- [ ] **COMP-02**: Citizen can upload image evidence (JPG, PNG, WEBP, up to 10MB).
- [ ] **COMP-03**: Citizen can upload video evidence (MP4, MOV, WEBM, up to 100MB).
- [ ] **COMP-04**: Citizen can submit voice-recorded complaints (WAV, MP3, AAC, up to 20MB).
- [ ] **COMP-05**: Citizen can attach GPS location or select location on a map.

## AI Complaint Analyzer
- [ ] **AI-01**: AI Engine automatically classifies text, image, and voice complaints into predefined categories (e.g., Road, Garbage, Drainage).
- [ ] **AI-02**: AI Engine calculates a Priority Score based on severity, safety risk, location, and density.
- [ ] **AI-03**: AI Engine predicts and routes complaints to the appropriate department.
- [ ] **AI-04**: AI Engine detects and flags duplicate complaints using semantic search and image similarity.
- [ ] **AI-05**: AI Engine detects fraudulent complaints (spam, bots, location spoofing) using XGBoost/Isolation Forest.
- [ ] **AI-06**: Domain Restriction AI strictly blocks non-civic questions (coding, math, etc.).

## Complaint Tracking & Operations
- [ ] **WORK-01**: Citizen can view real-time status updates and timelines of their complaints.
- [ ] **WORK-02**: Field worker can view assigned tasks and navigate to locations.
- [ ] **WORK-03**: Field worker can upload resolution evidence (images/notes) to close tasks.
- [ ] **WORK-04**: Department manager can view queues, reassign workers, and monitor SLAs.
- [ ] **WORK-05**: System automatically escalates complaints upon SLA breach.

## Maps & GIS
- [ ] **GIS-01**: System renders interactive complaint maps and heatmaps.
- [ ] **GIS-02**: System supports spatial queries, clustering, and zone detection.

## Analytics & Reporting
- [ ] **ANALYTICS-01**: City Administrator can view city-wide KPI dashboards and operational analytics.
- [ ] **ANALYTICS-02**: System generates scheduled operational and compliance reports.

## Notifications
- [ ] **NOTIF-01**: System sends notifications via In-App, Push, SMS, and Email channels based on workflow triggers.

## Predictive Infrastructure Intelligence (Phase 5+)
- [ ] **PRED-01**: Predictive AI forecasts future infrastructure failures (potholes, water leaks) using historical data.

---

## Out of Scope
- **General AI Assistant**: System will not answer non-civic questions (coding, general knowledge).
- **Automated Financial Approvals**: AI will not approve budgets or penalties.
