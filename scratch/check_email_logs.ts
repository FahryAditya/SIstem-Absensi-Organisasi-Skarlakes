import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('--- Checking Env Variables ---')
  console.log('GMAIL_FROM_EMAIL:', process.env.GMAIL_FROM_EMAIL)
  console.log('GMAIL_SERVICE_ACCOUNT_EMAIL:', process.env.GMAIL_SERVICE_ACCOUNT_EMAIL)
  console.log('GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY exists:', !!process.env.GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY)

  console.log('\n--- Checking Email Logs ---')
  try {
    const logs = await prisma.emailLog.findMany({
      take: 10,
      orderBy: { created_at: 'desc' }
    })
    console.log(`Found ${logs.length} logs:`)
    logs.forEach(log => {
      console.log(`- [${log.created_at.toISOString()}] To: ${log.recipientName} (${log.recipientEmail}), Subject: "${log.subject}", Status: ${log.status}, Error: ${log.error_message}`)
    })
  } catch (e) {
    console.error('Error querying email logs:', e)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
