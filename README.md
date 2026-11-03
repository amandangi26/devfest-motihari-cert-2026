# GDG Cloud Motihari - Certificate Portal

Official Certificate Distribution and Verification Platform for GDG CLOUD MOTIHARI.

## Features

- 📜 **Dynamic Certificate Generation**: High-resolution certificate generation with custom fonts, attendee names, and dynamic scaling.
- 🔍 **Instant Verification**: QR code verification link directly embedded onto each certificate.
- ⚡ **Admin Dashboard**: Bulk upload attendee data via CSV / Excel, configure certificate templates, and manage records.
- 🎨 **Neo-Brutalist Google Theme**: Clean, responsive UI built with Tailwind CSS, Next.js App Router, and Lucide icons.

## Getting Started

First, install dependencies:

```bash
npm install
```

Configure your environment variables in `.env` (refer to `.env.example`):

```bash
cp .env.example .env
```

Set up your database with Prisma:

```bash
npx prisma db push
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.
