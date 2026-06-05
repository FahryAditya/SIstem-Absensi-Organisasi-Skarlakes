# 📧 Implementasi Gmail Pesan - Next.js Full Stack

**Panduan lengkap implementasi fitur pengiriman email dari Admin ke Anggota Organisasi**

---

## 📑 Daftar Isi

1. [Project Structure](#project-structure)
2. [Database Schema (Prisma)](#database-schema-prisma)
3. [Environment Setup](#environment-setup)
4. [Services & Utilities](#services--utilities)
5. [API Routes](#api-routes)
6. [Frontend Components](#frontend-components)
7. [Pages](#pages)
8. [Installation & Testing](#installation--testing)

---

## 🗂️ Project Structure

```
project-root/
├── prisma/
│   └── schema.prisma                    # Database schema
│
├── lib/
│   ├── prisma.ts                        # Prisma client instance
│   ├── auth.ts                          # Auth helper
│   └── services/
│       ├── gmail.service.ts             # Gmail API service
│       ├── excel.service.ts             # Excel parser service
│       ├── email-template.service.ts    # Email template renderer
│       └── email.utils.ts               # Email utilities
│
├── app/
│   ├── api/
│   │   ├── members/
│   │   │   └── import-excel/
│   │   │       └── route.ts             # Import Excel endpoint
│   │   └── email/
│   │       ├── send/
│   │       │   └── route.ts             # Send email endpoint
│   │       ├── logs/
│   │       │   └── route.ts             # Get email logs endpoint
│   │       └── templates/
│   │           └── route.ts             # Email template endpoints
│   │
│   └── (dashboard)/
│       └── admin/
│           ├── members/
│           │   ├── page.tsx             # Members list page
│           │   └── import/
│           │       └── page.tsx         # Import members page
│           └── email/
│               ├── page.tsx             # Send email page
│               └── history/
│                   └── page.tsx         # Email history page
│
└── components/
    ├── admin/
    │   ├── ImportMembersForm.tsx        # Form import Excel
    │   ├── SendEmailForm.tsx            # Form kirim email
    │   ├── EmailHistoryTable.tsx        # Tabel history email
    │   └── MembersTable.tsx             # Tabel anggota
    └── common/
        ├── LoadingSpinner.tsx
        └── SuccessAlert.tsx
```

---

## 📊 Database Schema (Prisma)

### File: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ============= UPDATED MEMBER MODEL =============
model Member {
  id              String   @id @default(cuid())
  name            String   @db.Varchar(100)
  kelas           String   @db.Varchar(50)
  nis             String?  @db.Varchar(20)
  jabatan         String   @db.Varchar(100)
  gmail           String   @unique @db.Varchar(150)  // NEW COLUMN
  
  organizationId  String
  organization    Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Relations
  emailLogs       EmailLog[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([organizationId])
  @@index([jabatan])
  @@index([gmail])
  @@fulltext([name, gmail]) // Untuk full-text search di Neon
}

// ============= NEW EMAIL LOG MODEL =============
model EmailLog {
  id                String   @id @default(cuid())
  subject           String   @db.Varchar(255)
  recipientEmail    String   @db.Varchar(150)
  recipientName     String   @db.Varchar(100)
  emailType         String   @db.Varchar(50)  // "pertemuan", "rapat", etc
  organizationType  String   @db.Varchar(50)  // "Programming", "English", "OSIS", "MPK"
  content           String   @db.Text
  
  memberId          String
  member            Member @relation(fields: [memberId], references: [id], onDelete: Cascade)
  
  adminId           String
  admin             User @relation(fields: [adminId], references: [id], onDelete: Cascade)
  
  status            String   @default("sent") @db.Varchar(20)
  errorMessage      String?  @db.Text
  
  sentAt            DateTime?
  scheduledAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([memberId])
  @@index([adminId])
  @@index([organizationType])
  @@index([status])
  @@index([createdAt])
}

// ============= EMAIL TEMPLATE MODEL =============
model EmailTemplate {
  id                String   @id @default(cuid())
  organizationType  String   @db.Varchar(50)
  emailType         String   @db.Varchar(50)
  subject           String   @db.Text
  bodyTemplate      String   @db.Text // HTML dengan {{placeholder}}
  description       String?  @db.Text
  isActive          Boolean  @default(true)
  createdBy         String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([organizationType, emailType])
  @@index([isActive])
}

// ============= IMPORT LOG MODEL =============
model EmailImportLog {
  id                String   @id @default(cuid())
  filename          String   @db.Varchar(255)
  totalRows         Int
  successRows       Int
  failureRows       Int
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  adminId           String
  admin             User @relation(fields: [adminId], references: [id], onDelete: Cascade)
  errors            String   @db.Text // JSON array
  status            String   @default("completed") @db.Varchar(20)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([organizationId])
  @@index([adminId])
  @@index([status])
}

// ============= EXISTING MODELS (UPDATE) =============
model Organization {
  id                String   @id @default(cuid())
  name              String   @unique
  type              String   // "Programming", "English", "OSIS", "MPK"
  members           Member[]
  emailLogs         EmailLog[]
  emailImportLogs   EmailImportLog[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model User {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String?
  role              String   // "ADMIN", "TEACHER", "STUDENT"
  emailLogs         EmailLog[]
  emailImportLogs   EmailImportLog[]
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

---

## ⚙️ Environment Setup

### File: `.env.local`

```env
# Database
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/dbname
DIRECT_URL=postgresql://user:password@ep-xxx.neon.tech/dbname

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Gmail Configuration
GMAIL_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GMAIL_FROM_EMAIL=noreply@smk.sch.id

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### File: `.env.example`

```env
DATABASE_URL=postgresql://user:password@host/dbname
DIRECT_URL=postgresql://user:password@host/dbname
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx
GMAIL_SERVICE_ACCOUNT_EMAIL=xxx
GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY=xxx
GMAIL_FROM_EMAIL=noreply@smk.sch.id
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🔧 Services & Utilities

### 1. File: `lib/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
```

### 2. File: `lib/services/gmail.service.ts`

```typescript
import nodemailer from "nodemailer";
import { google } from "googleapis";

interface SendEmailOptions {
  to: string[];
  subject: string;
  html: string;
  bcc?: string[];
}

async function createGmailTransporter() {
  const serviceAccountKey = {
    type: "service_account",
    project_id: process.env.GMAIL_SERVICE_ACCOUNT_EMAIL?.split("@")[1]?.split(".")[0],
    private_key: process.env.GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GMAIL_SERVICE_ACCOUNT_EMAIL,
    client_id: "",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
  };

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountKey as any,
    scopes: ["https://www.googleapis.com/auth/gmail.send"],
  });

  const authClient = await auth.getClient();

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_FROM_EMAIL,
      xoauth2: authClient as any,
    },
  });
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    const transporter = await createGmailTransporter();

    const mailOptions = {
      from: process.env.GMAIL_FROM_EMAIL,
      to: options.to.join(","),
      subject: options.subject,
      html: options.html,
      bcc: options.bcc?.join(","),
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Gmail send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### 3. File: `lib/services/excel.service.ts`

```typescript
import * as XLSX from "xlsx";

export interface ImportMemberRow {
  nama: string;
  kelas: string;
  nis?: string;
  jabatan: string;
  gmail: string;
}

export interface ImportValidationError {
  row: number;
  field: string;
  value: any;
  error: string;
}

export function parseExcelFile(buffer: Buffer): {
  data: ImportMemberRow[];
  errors: ImportValidationError[];
} {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet);

    const data: ImportMemberRow[] = [];
    const errors: ImportValidationError[] = [];

    rows.forEach((row: any, index: number) => {
      const rowIndex = index + 2; // +2 karena header di row 1

      // Validasi nama
      if (!row.nama || typeof row.nama !== "string") {
        errors.push({
          row: rowIndex,
          field: "nama",
          value: row.nama,
          error: "Nama harus diisi dan berupa teks",
        });
      }

      // Validasi kelas
      if (!row.kelas || typeof row.kelas !== "string") {
        errors.push({
          row: rowIndex,
          field: "kelas",
          value: row.kelas,
          error: "Kelas harus diisi",
        });
      }

      // Validasi jabatan
      if (!row.jabatan || typeof row.jabatan !== "string") {
        errors.push({
          row: rowIndex,
          field: "jabatan",
          value: row.jabatan,
          error: "Jabatan harus diisi",
        });
      }

      // Validasi gmail
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!row.gmail || !emailRegex.test(row.gmail)) {
        errors.push({
          row: rowIndex,
          field: "gmail",
          value: row.gmail,
          error: "Email tidak valid",
        });
      }

      // Jika tidak ada error, tambah ke data
      if (!errors.some((e) => e.row === rowIndex)) {
        data.push({
          nama: row.nama.trim(),
          kelas: row.kelas.trim(),
          nis: row.nis ? String(row.nis).trim() : undefined,
          jabatan: row.jabatan.trim(),
          gmail: row.gmail.trim().toLowerCase(),
        });
      }
    });

    return { data, errors };
  } catch (error) {
    throw new Error(`Gagal parse Excel: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
```

### 4. File: `lib/services/email-template.service.ts`

```typescript
const TEMPLATES = {
  Programming: {
    pertemuan: {
      subject: "Undangan Pertemuan {{organizationType}}",
      body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); color: white; padding: 30px 20px; }
    .title { font-size: 24px; font-weight: 700; margin: 0; }
    .content { padding: 30px 20px; }
    .greeting { font-size: 16px; color: #333; margin-bottom: 20px; }
    .info-box { background: #f0f9ff; border-left: 4px solid #1e40af; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-item { margin: 12px 0; color: #555; }
    .info-label { font-weight: 600; color: #1e40af; display: inline-block; width: 90px; }
    .footer { background: #fafafa; padding: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">📅 Undangan Pertemuan {{organizationType}}</h1>
    </div>
    <div class="content">
      <p class="greeting">Halo {{nama}},</p>
      <p>Kami dengan senang hati mengundang Anda untuk menghadiri pertemuan {{organizationType}} berikut:</p>
      
      <div class="info-box">
        <div class="info-item">
          <span class="info-label">📅 Tanggal:</span> {{tanggal}}
        </div>
        <div class="info-item">
          <span class="info-label">🕐 Waktu:</span> {{waktu}}
        </div>
        <div class="info-item">
          <span class="info-label">📍 Tempat:</span> {{tempat}}
        </div>
        <div class="info-item">
          <span class="info-label">💬 Agenda:</span> {{pembahasan}}
        </div>
      </div>

      <p>Mohon kehadiran Anda. Apabila ada pertanyaan, silakan hubungi panitia.</p>
      <p>Terima kasih atas perhatian Anda!</p>
    </div>
    <div class="footer">
      <p>Salam Pembahasan,<br><strong>Tim {{organizationType}}</strong></p>
      <p style="margin-top: 15px; font-size: 11px; color: #bbb;">Email ini dikirim secara otomatis oleh Sistem Absensi Organisasi Skarlakes</p>
    </div>
  </div>
</body>
</html>
      `,
    },
  },
  English: {
    pertemuan: {
      subject: "Undangan Pertemuan {{organizationType}}",
      body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px 20px; }
    .title { font-size: 24px; font-weight: 700; margin: 0; }
    .content { padding: 30px 20px; }
    .info-box { background: #f0fdf4; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-item { margin: 12px 0; color: #555; }
    .info-label { font-weight: 600; color: #059669; display: inline-block; width: 90px; }
    .footer { background: #fafafa; padding: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">📅 Undangan Pertemuan {{organizationType}}</h1>
    </div>
    <div class="content">
      <p>Halo {{nama}},</p>
      <p>Kami dengan senang hati mengundang Anda untuk menghadiri pertemuan {{organizationType}}!</p>
      
      <div class="info-box">
        <div class="info-item"><span class="info-label">📅 Tanggal:</span> {{tanggal}}</div>
        <div class="info-item"><span class="info-label">🕐 Waktu:</span> {{waktu}}</div>
        <div class="info-item"><span class="info-label">📍 Tempat:</span> {{tempat}}</div>
        <div class="info-item"><span class="info-label">💬 Agenda:</span> {{pembahasan}}</div>
      </div>

      <p>Kami tunggu kehadiran Anda!</p>
    </div>
    <div class="footer">
      <p><strong>Salam Pembahasan,</strong><br>Tim {{organizationType}}</p>
      <p style="margin-top: 15px; font-size: 11px; color: #bbb;">Email ini dikirim secara otomatis oleh Sistem Absensi Organisasi Skarlakes</p>
    </div>
  </div>
</body>
</html>
      `,
    },
  },
  OSIS: {
    rapat: {
      subject: "Undangan Rapat {{organizationType}}",
      body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px 20px; }
    .title { font-size: 24px; font-weight: 700; margin: 0; }
    .content { padding: 30px 20px; }
    .info-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-item { margin: 12px 0; color: #555; }
    .info-label { font-weight: 600; color: #dc2626; display: inline-block; width: 90px; }
    .footer { background: #fafafa; padding: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">📋 Undangan Rapat {{organizationType}}</h1>
    </div>
    <div class="content">
      <p>Yth. {{nama}},</p>
      <p>Dengan hormat, kami mengundang Anda untuk hadir dalam rapat {{organizationType}}.</p>
      
      <div class="info-box">
        <div class="info-item"><span class="info-label">📅 Tanggal:</span> {{tanggal}}</div>
        <div class="info-item"><span class="info-label">🕐 Waktu:</span> {{waktu}}</div>
        <div class="info-item"><span class="info-label">📍 Tempat:</span> {{tempat}}</div>
        <div class="info-item"><span class="info-label">📌 Agenda:</span> {{pembahasan}}</div>
        <div class="info-item"><span class="info-label">⚠️ Masalah:</span> {{masalah}}</div>
      </div>

      <p>Mohon kesediaan Anda untuk hadir tepat waktu.</p>
    </div>
    <div class="footer">
      <p><strong>Hormat kami,</strong><br>Pengurus {{organizationType}}</p>
      <p style="margin-top: 15px; font-size: 11px; color: #bbb;">Email ini dikirim secara otomatis oleh Sistem Absensi Organisasi Skarlakes</p>
    </div>
  </div>
</body>
</html>
      `,
    },
  },
  MPK: {
    rapat: {
      subject: "Undangan Rapat {{organizationType}}",
      body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%); color: white; padding: 30px 20px; }
    .title { font-size: 24px; font-weight: 700; margin: 0; }
    .content { padding: 30px 20px; }
    .info-box { background: #faf5ff; border-left: 4px solid #9333ea; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-item { margin: 12px 0; color: #555; }
    .info-label { font-weight: 600; color: #9333ea; display: inline-block; width: 90px; }
    .footer { background: #fafafa; padding: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">📋 Undangan Rapat {{organizationType}}</h1>
    </div>
    <div class="content">
      <p>Yth. {{nama}},</p>
      <p>Dengan hormat, kami mengundang Anda untuk hadir dalam rapat {{organizationType}}.</p>
      
      <div class="info-box">
        <div class="info-item"><span class="info-label">📅 Tanggal:</span> {{tanggal}}</div>
        <div class="info-item"><span class="info-label">🕐 Waktu:</span> {{waktu}}</div>
        <div class="info-item"><span class="info-label">📍 Tempat:</span> {{tempat}}</div>
        <div class="info-item"><span class="info-label">📌 Agenda:</span> {{pembahasan}}</div>
      </div>

      <p>Mohon kesediaan Anda untuk hadir tepat waktu.</p>
    </div>
    <div class="footer">
      <p><strong>Hormat kami,</strong><br>Pengurus {{organizationType}}</p>
      <p style="margin-top: 15px; font-size: 11px; color: #bbb;">Email ini dikirim secara otomatis oleh Sistem Absensi Organisasi Skarlakes</p>
    </div>
  </div>
</body>
</html>
      `,
    },
  },
};

export function renderEmailTemplate(
  organizationType: string,
  emailType: string,
  data: Record<string, any>
): { subject: string; html: string } {
  const template =
    TEMPLATES[organizationType as keyof typeof TEMPLATES]?.[
      emailType as keyof (typeof TEMPLATES)[keyof typeof TEMPLATES]
    ];

  if (!template) {
    throw new Error(`Template tidak ditemukan: ${organizationType} - ${emailType}`);
  }

  let subject = template.subject;
  let html = template.body;

  // Replace placeholders
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder, "g"), String(value));
    html = html.replace(new RegExp(placeholder, "g"), String(value));
  });

  return { subject, html };
}
```

### 5. File: `lib/services/email.utils.ts`

```typescript
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function generateCSVFromLogs(logs: any[]): string {
  const headers = ["Tanggal", "Penerima", "Email", "Organisasi", "Tipe", "Status"];
  const rows = logs.map((log) => [
    new Date(log.createdAt).toLocaleString("id-ID"),
    log.recipientName,
    log.recipientEmail,
    log.organizationType,
    log.emailType,
    log.status,
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csv;
}
```

---

## 🔌 API Routes

### 1. File: `app/api/members/import-excel/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseExcelFile } from "@/lib/services/excel.service";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const organizationId = formData.get("organizationId") as string;

    if (!file || !organizationId) {
      return NextResponse.json(
        { error: "File dan organizationId harus diisi" },
        { status: 400 }
      );
    }

    // Check organization exists
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organisasi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Parse Excel
    const buffer = Buffer.from(await file.arrayBuffer());
    const { data, errors } = parseExcelFile(buffer);

    if (data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Tidak ada data valid di Excel",
          errors,
        },
        { status: 400 }
      );
    }

    // Save to database
    let importedCount = 0;
    const importErrors = [];

    for (const row of data) {
      try {
        await prisma.member.create({
          data: {
            name: row.nama,
            kelas: row.kelas,
            nis: row.nis,
            jabatan: row.jabatan,
            gmail: row.gmail,
            organizationId,
          },
        });
        importedCount++;
      } catch (error) {
        importErrors.push({
          row: row.nama,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Save import log
    await prisma.emailImportLog.create({
      data: {
        filename: file.name,
        totalRows: data.length,
        successRows: importedCount,
        failureRows: data.length - importedCount,
        organizationId,
        adminId: session.user.id,
        errors: JSON.stringify(importErrors),
        status: "completed",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Import berhasil",
      imported: importedCount,
      failed: data.length - importedCount,
      errors: importErrors,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 2. File: `app/api/email/send/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/services/gmail.service";
import { renderEmailTemplate } from "@/lib/services/email-template.service";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { organizationType, emailType, recipientIds, data, subject } = body;

    // Validasi input
    if (!organizationType || !emailType || !recipientIds || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json(
        { error: "Minimal 1 penerima harus dipilih" },
        { status: 400 }
      );
    }

    // Ambil data members
    const members = await prisma.member.findMany({
      where: {
        id: { in: recipientIds },
      },
    });

    if (members.length === 0) {
      return NextResponse.json({ error: "Members tidak ditemukan" }, { status: 404 });
    }

    // Kirim email dan log
    const results = [];
    let successCount = 0;

    for (const member of members) {
      try {
        // Render template
        const { subject: emailSubject, html } = renderEmailTemplate(
          organizationType,
          emailType,
          {
            ...data,
            nama: member.name,
            organizationType,
          }
        );

        // Send email
        const sendResult = await sendEmail({
          to: [member.gmail],
          subject: emailSubject,
          html,
        });

        // Log to database
        await prisma.emailLog.create({
          data: {
            subject: emailSubject,
            recipientEmail: member.gmail,
            recipientName: member.name,
            emailType,
            organizationType,
            content: html,
            memberId: member.id,
            adminId: session.user.id,
            status: sendResult.success ? "sent" : "failed",
            errorMessage: sendResult.error,
            sentAt: sendResult.success ? new Date() : null,
          },
        });

        if (sendResult.success) {
          successCount++;
        }

        results.push({
          memberId: member.id,
          email: member.gmail,
          status: sendResult.success ? "sent" : "failed",
        });
      } catch (error) {
        console.error(`Error sending to ${member.gmail}:`, error);
        results.push({
          memberId: member.id,
          email: member.gmail,
          status: "failed",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Email berhasil dikirim ke ${successCount} penerima`,
      sent: successCount,
      failed: results.length - successCount,
      results,
    });
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 3. File: `app/api/email/logs/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId required" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const logs = await prisma.emailLog.findMany({
      where: {
        member: {
          organizationId,
        },
      },
      include: {
        member: true,
        admin: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.emailLog.count({
      where: {
        member: {
          organizationId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get logs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Frontend Components

### 1. File: `components/admin/ImportMembersForm.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ImportMembersFormProps {
  organizationId: string;
}

export function ImportMembersForm({ organizationId }: ImportMembersFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith(".xlsx")) {
      setFile(selectedFile);
      setMessage("");
    } else {
      setMessage("Hanya file .xlsx yang diterima");
      setMessageType("error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage("Pilih file terlebih dahulu");
      setMessageType("error");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("organizationId", organizationId);

    try {
      const response = await fetch("/api/members/import-excel", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setMessage(
          `✅ Import berhasil! ${result.imported} anggota ditambahkan`
        );
        setMessageType("success");
        setFile(null);
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        setMessage(`❌ ${result.error || "Import gagal"}`);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("❌ Terjadi kesalahan");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition">
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          className="hidden"
          id="file-input"
          disabled={loading}
        />
        <label
          htmlFor="file-input"
          className="cursor-pointer block text-center"
        >
          <p className="text-gray-600">
            {file ? file.name : "Drag & drop file Excel atau klik untuk upload"}
          </p>
          <p className="text-sm text-gray-400 mt-1">(.xlsx)</p>
        </label>
      </div>

      <button
        type="submit"
        disabled={!file || loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? "Mengimport..." : "Import Data"}
      </button>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            messageType === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>
      )}
    </form>
  );
}
```

### 2. File: `components/admin/SendEmailForm.tsx`

```typescript
"use client";

import { useState } from "react";
import { Member } from "@prisma/client";

interface SendEmailFormProps {
  organizationType: string;
  members: Member[];
}

const EMAIL_TYPES: Record<string, string[]> = {
  Programming: ["pertemuan"],
  English: ["pertemuan"],
  OSIS: ["rapat", "masalah", "pembahasan"],
  MPK: ["rapat", "masalah", "pembahasan"],
};

export function SendEmailForm({
  organizationType,
  members,
}: SendEmailFormProps) {
  const [emailType, setEmailType] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    tanggal: "",
    waktu: "",
    tempat: "",
    agenda: "",
    pembahasan: "",
    masalah: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [showPreview, setShowPreview] = useState(false);

  const emailTypesForOrg =
    EMAIL_TYPES[organizationType as keyof typeof EMAIL_TYPES] || [];

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map((m) => m.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailType) {
      setMessage("Pilih jenis email terlebih dahulu");
      setMessageType("error");
      return;
    }

    if (selectedMembers.length === 0) {
      setMessage("Pilih minimal 1 penerima");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationType,
          emailType,
          recipientIds: selectedMembers,
          data: formData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ Email berhasil dikirim ke ${result.sent} penerima`);
        setMessageType("success");
        setSelectedMembers([]);
        setFormData({
          tanggal: "",
          waktu: "",
          tempat: "",
          agenda: "",
          pembahasan: "",
          masalah: "",
        });
        setEmailType("");
      } else {
        setMessage(`❌ ${result.error || "Gagal mengirim email"}`);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("❌ Terjadi kesalahan");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Jenis Email
        </label>
        <select
          value={emailType}
          onChange={(e) => setEmailType(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Pilih jenis email</option>
          {emailTypesForOrg.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Form Fields */}
      {emailType && (
        <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
          <input
            type="date"
            value={formData.tanggal}
            onChange={(e) =>
              setFormData({ ...formData, tanggal: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            type="text"
            value={formData.waktu}
            onChange={(e) =>
              setFormData({ ...formData, waktu: e.target.value })
            }
            placeholder="Waktu (contoh: 15:00 - 17:00 WIB)"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            type="text"
            value={formData.tempat}
            onChange={(e) =>
              setFormData({ ...formData, tempat: e.target.value })
            }
            placeholder="Tempat"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            type="text"
            value={formData.agenda}
            onChange={(e) =>
              setFormData({ ...formData, agenda: e.target.value })
            }
            placeholder="Agenda"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          <textarea
            value={formData.pembahasan}
            onChange={(e) =>
              setFormData({ ...formData, pembahasan: e.target.value })
            }
            placeholder="Pembahasan"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
          {emailType === "masalah" && (
            <textarea
              value={formData.masalah}
              onChange={(e) =>
                setFormData({ ...formData, masalah: e.target.value })
              }
              placeholder="Masalah yang akan dibahas"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          )}
        </div>
      )}

      {/* Member Selection */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Pilih Penerima ({selectedMembers.length}/{members.length})
          </label>
          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {selectedMembers.length === members.length
              ? "Batal Pilih Semua"
              : "Pilih Semua"}
          </button>
        </div>
        <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
          {members.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Tidak ada anggota untuk organisasi ini
            </p>
          ) : (
            members.map((member) => (
              <label
                key={member.id}
                className="flex items-center mb-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => toggleMember(member.id)}
                  className="mr-3 w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.gmail}</p>
                </div>
                <span className="text-xs text-gray-400">{member.jabatan}</span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || selectedMembers.length === 0}
        className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading
          ? "Mengirim..."
          : `Kirim ke ${selectedMembers.length} Penerima`}
      </button>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            messageType === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>
      )}
    </form>
  );
}
```

### 3. File: `components/admin/MembersTable.tsx`

```typescript
"use client";

import { Member } from "@prisma/client";

interface MembersTableProps {
  members: Member[];
}

export function MembersTable({ members }: MembersTableProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Nama
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Kelas
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                NIS
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Jabatan
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Gmail
              </th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  Tidak ada data anggota
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {member.name}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {member.kelas}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {member.nis || "-"}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {member.jabatan}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {member.gmail}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 📄 Pages

### 1. File: `app/(dashboard)/admin/members/import/page.tsx`

```typescript
import { ImportMembersForm } from "@/components/admin/ImportMembersForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import Anggota - Admin",
  description: "Import data anggota dari file Excel",
};

export default function ImportMembersPage() {
  const organizationId = "org-programming"; // Ambil dari params atau session

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Import Anggota</h1>
      <p className="text-gray-600 mb-8">
        Import data anggota baru dari file Excel (.xlsx)
      </p>

      <div className="bg-white rounded-lg shadow p-6">
        <ImportMembersForm organizationId={organizationId} />
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Format Excel</h3>
        <p className="text-blue-800 text-sm mb-3">
          File Excel harus memiliki kolom berikut:
        </p>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• <strong>Nama</strong> - Nama lengkap anggota</li>
          <li>• <strong>Kelas</strong> - Kelas/tingkat anggota</li>
          <li>• <strong>NIS</strong> - Nomor identitas siswa (opsional)</li>
          <li>• <strong>Jabatan</strong> - Posisi di organisasi</li>
          <li>• <strong>Gmail</strong> - Email Google anggota</li>
        </ul>
      </div>
    </div>
  );
}
```

### 2. File: `app/(dashboard)/admin/email/page.tsx`

```typescript
import { SendEmailForm } from "@/components/admin/SendEmailForm";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kirim Email - Admin",
  description: "Kirim email notifikasi ke anggota organisasi",
};

export default async function SendEmailPage() {
  const organizationId = "org-programming"; // Ambil dari params atau session

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        orderBy: { name: "asc" },
      },
    },
  });

  if (!organization) {
    return <div className="text-center py-8">Organisasi tidak ditemukan</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Kirim Email</h1>
      <p className="text-gray-600 mb-8">
        Kirim notifikasi email ke anggota {organization.name}
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
          <SendEmailForm
            organizationType={organization.type}
            members={organization.members}
          />
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3">📊 Statistik</h3>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Organisasi:</span>{" "}
                {organization.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Total Anggota:</span>{" "}
                {organization.members.length}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tips</h3>
            <ul className="text-blue-800 text-xs space-y-1">
              <li>• Isi semua field sebelum mengirim</li>
              <li>• Periksa email penerima</li>
              <li>• Kirim email saat jam kerja</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 3. File: `app/(dashboard)/admin/email/history/page.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/services/email.utils";

interface EmailLog {
  id: string;
  subject: string;
  recipientName: string;
  recipientEmail: string;
  organizationType: string;
  emailType: string;
  status: string;
  createdAt: string;
  admin?: {
    name: string;
  };
}

export default function EmailHistoryPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const organizationId = "org-programming"; // Ambil dari params atau session

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(
          `/api/email/logs?organizationId=${organizationId}`
        );
        const result = await response.json();
        if (result.success) {
          setLogs(result.data);
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Riwayat Email</h1>
      <p className="text-gray-600 mb-8">
        Lihat semua email yang telah dikirim
      </p>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Memuat data...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Belum ada riwayat email
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Penerima
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <p className="font-medium text-gray-900">
                        {log.recipientName}
                      </p>
                      <p className="text-gray-500 text-xs">{log.recipientEmail}</p>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {log.subject}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {log.emailType}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          log.status === "sent"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {log.status === "sent" ? "✓ Terkirim" : "✗ Gagal"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 📦 Installation & Testing

### Step 1: Install Dependencies

```bash
npm install nodemailer googleapis express-fileupload xlsx
npm install -D @types/nodemailer
```

### Step 2: Setup Database

```bash
# Update Prisma schema dengan code di atas, lalu:
npx prisma migrate dev --name add_email_system

# atau untuk reset:
npx prisma db push
```

### Step 3: Google Cloud Setup

1. Buka [Google Cloud Console](https://console.cloud.google.com)
2. Create Project baru
3. Enable Gmail API
4. Create Service Account dengan email verification
5. Download JSON key → simpan di secure location
6. Update `.env.local` dengan credentials

### Step 4: Run Development Server

```bash
npm run dev
```

### Step 5: Test Flow

**A. Test Import Excel:**
- Buka http://localhost:3000/admin/members/import
- Download template Excel
- Upload dengan data valid
- Check database untuk verify data tersimpan

**B. Test Send Email:**
- Buka http://localhost:3000/admin/email
- Pilih anggota
- Isi form detail
- Click "Kirim Email"
- Check Gmail inbox penerima

**C. Test Email History:**
- Buka http://localhost:3000/admin/email/history
- Verify semua email log tercatat

---

**Document Version:** 1.0  
**Tech Stack:** Next.js 14+ | Prisma | Neon | Supabase  
**Status:** Ready for Implementation
