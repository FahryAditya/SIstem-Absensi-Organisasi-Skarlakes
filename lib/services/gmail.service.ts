import nodemailer from 'nodemailer'
import { google } from 'googleapis'

interface SendEmailOptions {
  to: string[]
  subject: string
  html: string
  bcc?: string[]
}

async function createGmailTransporter() {
  const debugMode = process.env.NODE_ENV !== 'production' || process.env.GMAIL_SMTP_DEBUG === 'true'

  // Jika GMAIL_APP_PASSWORD diset, gunakan metode App Password yang lebih simpel & andal
  if (process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      debug: debugMode,
      logger: debugMode,
      auth: {
        user: process.env.GMAIL_FROM_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  }

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

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    debug: debugMode,
    logger: debugMode,
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_FROM_EMAIL,
      serviceClient: serviceAccountKey.client_email,
      privateKey: serviceAccountKey.private_key,
    } as any,
  })
}

export async function sendEmail(options: SendEmailOptions) {
  try {
    const transporter = await createGmailTransporter()

    const mailOptions = {
      from: process.env.GMAIL_FROM_EMAIL,
      to: options.to.join(','),
      subject: options.subject,
      html: options.html,
      bcc: options.bcc?.join(','),
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
