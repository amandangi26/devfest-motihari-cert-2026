# GDG Certificate Downloader Implementation Plan

## Goal
Build a production-ready web app for generating and delivering event participation certificates for "GDG Cloud Motihari 2026".

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Database**: SQLite (via Prisma ORM)
- **PDF Generation**: pdf-lib
- **Excel Parsing**: xlsx
- **Icons**: Lucide React

## User Review Required
- **PDF Template**: The system will start with a placeholder PDF generation or require an initial upload. I will implement a default "upload" mechanism.
- **Coordinates**: Name placement coordinates will be configurable via code constants initially, but I will structure it to be easily editable.

## Proposed Changes

### Database
#### [NEW] [schema.prisma](file:///Users/aman_dangi26/NEW%20CODES/CERTIFICATE%20DOWNLOADER%20FOR%20GDG/gdg-cert-app/prisma/schema.prisma)
- Define `Attendee` model (id, name, email, createdAt).
- Define `Config` model (key, value) for storing template path or other settings (optional, maybe just file system for now).

### Backend (API Routes)
#### [NEW] [app/api/upload/route.ts](file:///Users/aman_dangi26/NEW%20CODES/CERTIFICATE%20DOWNLOADER%20FOR%20GDG/gdg-cert-app/app/api/upload/route.ts)
- Handle POST requests.
- Parse Excel/CSV using `xlsx`.
- Upsert attendees into SQLite.
- Handle PDF template upload (save to `public/uploads` or similar).

#### [NEW] [app/api/certificate/route.ts](file:///Users/aman_dangi26/NEW%20CODES/CERTIFICATE%20DOWNLOADER%20FOR%20GDG/gdg-cert-app/app/api/certificate/route.ts)
- Handle GET/POST requests.
- Validate email.
- Check DB for attendee.
- Load PDF template.
- Overlay name using `pdf-lib`.
- Return PDF stream.

### Frontend
#### [NEW] [app/admin/page.tsx](file:///Users/aman_dangi26/NEW%20CODES/CERTIFICATE%20DOWNLOADER%20FOR%20GDG/gdg-cert-app/app/admin/page.tsx)
- File input for Excel/CSV.
- File input for PDF Template.
- Status messages (success/error).
- List of uploaded attendees (optional, for verification).

#### [MODIFY] [app/page.tsx](file:///Users/aman_dangi26/NEW%20CODES/CERTIFICATE%20DOWNLOADER%20FOR%20GDG/gdg-cert-app/app/page.tsx)
- Public landing page.
- Email input form.
- Loading state.
- Download button / Preview upon success.
- Error message if not found.

#### [NEW] [middleware.ts](file:///Users/aman_dangi26/NEW%20CODES/CERTIFICATE%20DOWNLOADER%20FOR%20GDG/gdg-cert-app/middleware.ts)
- Protect `/admin` routes.
- Check for `admin_session` cookie.

#### [NEW] [app/login/page.tsx](file:///Users/aman_dangi26/NEW%20CODES/CERTIFICATE%20DOWNLOADER%20FOR%20GDG/gdg-cert-app/app/login/page.tsx)
- Simple password login form.

#### [NEW] [app/api/auth/login/route.ts](file:///Users/aman_dangi26/NEW%20CODES/CERTIFICATE%20DOWNLOADER%20FOR%20GDG/gdg-cert-app/app/api/auth/login/route.ts)
- Verify password against env var.
- Set HTTP-only cookie.

#### [MODIFY] [app/layout.tsx](file:///Users/aman_dangi26/NEW%20CODES/CERTIFICATE%20DOWNLOADER%20FOR%20GDG/gdg-cert-app/app/layout.tsx)
- Add `suppressHydrationWarning` to `html` tag.

#### [NEW] [app/api/attendees/route.ts](file:///Users/aman_dangi26/NEW%20CODES/CERTIFICATE%20DOWNLOADER%20FOR%20GDG/gdg-cert-app/app/api/attendees/route.ts)
- GET: Fetch all attendees (with pagination/search if needed).
- DELETE: Delete an attendee by ID or Email.

#### [MODIFY] [app/admin/page.tsx](file:///Users/aman_dangi26/NEW%20CODES/CERTIFICATE%20DOWNLOADER%20FOR%20GDG/gdg-cert-app/app/admin/page.tsx)
- Add Dashboard Stats (Total Attendees, etc.).
- Add Attendee Table with Delete action.
- Improve UI with GDG Theme.

#### [MODIFY] [app/page.tsx](file:///Users/aman_dangi26/NEW%20CODES/CERTIFICATE%20DOWNLOADER%20FOR%20GDG/gdg-cert-app/app/page.tsx)
- Redesign with GDG Colors (Blue, Red, Yellow, Green).
- Add background pattern and animations.

#### [MODIFY] [lib/pdf-generator.ts](file:///Users/aman_dangi26/NEW%20CODES/CERTIFICATE%20DOWNLOADER%20FOR%20GDG/gdg-cert-app/lib/pdf-generator.ts)
- Support custom font embedding (e.g., Google Fonts).

### Utilities
#### [NEW] [lib/db.ts](file:///Users/aman_dangi26/NEW%20CODES/CERTIFICATE%20DOWNLOADER%20FOR%20GDG/gdg-cert-app/lib/db.ts)
- Prisma client singleton.

#### [NEW] [lib/pdf-generator.ts](file:///Users/aman_dangi26/NEW%20CODES/CERTIFICATE%20DOWNLOADER%20FOR%20GDG/gdg-cert-app/lib/pdf-generator.ts)
- Function to load template and draw text.
- Constants for font size, color, position.

## Verification Plan
### Automated Tests
- N/A (Will rely on manual verification for this scope).

### Manual Verification
1. **Admin Flow**:
   - Upload a sample Excel file (`sample_attendees.xlsx`).
   - Verify data in DB (via Prisma Studio or logs).
   - Upload a sample PDF template.
2. **User Flow**:
   - Go to home page.
   - Enter a valid email from the Excel.
   - Verify PDF is generated and name is correct.
   - Enter invalid email.
   - Verify error message.
