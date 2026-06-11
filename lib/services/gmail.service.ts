import nodemailer from 'nodemailer'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

interface SendEmailOptions {
  to: string[]
  subject: string
  html: string
  bcc?: string[]
}

/**
 * Ambil konfigurasi email pengirim dari database.
 * Jika belum diatur di DB, fallback ke environment variables.
 */
async function getEmailCredentials(): Promise<{ email: string; appPassword: string | null; name: string }> {
  const defaultName = process.env.GMAIL_FROM_NAME || 'Sistem Ekstrakurikuler'
  try {
    const setting = await prisma.emailSetting.findFirst()
    if (setting && setting.email && setting.appPassword) {
      return { email: setting.email, appPassword: setting.appPassword, name: defaultName }
    }
  } catch (e) {
    console.warn('Gagal membaca email setting dari DB, fallback ke env:', e)
  }

  return {
    email: process.env.GMAIL_FROM_EMAIL || '',
    appPassword: process.env.GMAIL_APP_PASSWORD || null,
    name: defaultName,
  }
}

async function createGmailTransporter() {
  const debugMode = process.env.NODE_ENV !== 'production' || process.env.GMAIL_SMTP_DEBUG === 'true'

  // 1. Coba ambil kredensial dari database terlebih dahulu
  const creds = await getEmailCredentials()

  // 2. Jika ada App Password (dari DB atau env), gunakan metode App Password
  if (creds.appPassword) {
    return {
      transporter: nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        debug: debugMode,
        logger: debugMode,
        auth: {
          user: creds.email,
          pass: creds.appPassword,
        },
      }),
      fromEmail: creds.email,
      fromName: creds.name,
    }
  }

  // 3. Fallback: Google Service Account (OAuth2)
  const serviceAccountKey = {
    type: 'service_account',
    project_id: process.env.GMAIL_SERVICE_ACCOUNT_EMAIL?.split('@')[1]?.split('.')[0],
    private_key: process.env.GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GMAIL_SERVICE_ACCOUNT_EMAIL,
    client_id: '',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
  }

  const auth = new google.auth.GoogleAuth({
    credentials: serviceAccountKey as any,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
  })

  // Dapatkan client authorization
  const authClient = await auth.getClient()

  return {
    transporter: nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      debug: debugMode,
      logger: debugMode,
      auth: {
        type: 'OAuth2',
        user: creds.email || process.env.GMAIL_FROM_EMAIL,
        serviceClient: serviceAccountKey.client_email,
        privateKey: serviceAccountKey.private_key,
      } as any,
    }),
    fromEmail: creds.email || process.env.GMAIL_FROM_EMAIL || '',
    fromName: creds.name,
  }
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    const { transporter, fromEmail, fromName } = await createGmailTransporter()

    // Strip HTML tags to provide a plain text version for spam filters
    const textAlternative = options.html
      .replace(/<style([\s\S]*?)<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    const mailOptions = {
      from: fromName ? `"${fromName}" <${fromEmail}>` : fromEmail,
      to: options.to.join(','),
      subject: options.subject,
      text: textAlternative,
      html: options.html,
      bcc: options.bcc?.join(','),
      replyTo: fromEmail,
      headers: {
        'X-Priority': '3 (Normal)',
        'X-MSMail-Priority': 'Normal',
        'X-Mailer': 'Nodemailer',
        'X-Auto-Response-Suppress': 'OOF, AutoReply',
        'Precedence': 'bulk',
        'List-Unsubscribe': `<mailto:${fromEmail}?subject=unsubscribe>`,
        'List-ID': `<${process.env.APP_NAME || 'SistemEkstrakurikuler'}>`,
        'X-Complaints-To': fromEmail,
      },
    }

    const info = await transporter.sendMail(mailOptions)

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error('Gmail send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
