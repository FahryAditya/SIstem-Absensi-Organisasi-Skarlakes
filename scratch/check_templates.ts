import { prisma } from '../lib/prisma'

async function checkTemplates() {
  try {
    const templates = await prisma.emailTemplate.findMany()
    console.log('Templates in DB count:', templates.length)
    console.log('Templates:', JSON.stringify(templates, null, 2))
  } catch (error) {
    console.error('Error querying templates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTemplates()
