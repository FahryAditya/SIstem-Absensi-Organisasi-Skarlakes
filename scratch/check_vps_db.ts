import { PrismaClient } from '@prisma/client'

// Load production/vps database URL
const vpsDbUrl = "postgresql://neondb_owner:npg_j56eNsgamUOW@ep-spring-king-apv671dv.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: vpsDbUrl
    }
  }
})

async function main() {
  console.log('--- Checking VPS Database Email Logs ---')
  try {
    const logs = await prisma.emailLog.findMany({
      take: 10,
      orderBy: { created_at: 'desc' }
    })
    console.log(`Found ${logs.length} logs in VPS DB:`)
    logs.forEach(log => {
      console.log(`- [${log.created_at.toISOString()}] To: ${log.recipientName} (${log.recipientEmail}), Subject: "${log.subject}", Status: ${log.status}, Error: ${log.error_message}`)
    })
  } catch (e) {
    console.error('Error querying VPS DB logs:', e)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
