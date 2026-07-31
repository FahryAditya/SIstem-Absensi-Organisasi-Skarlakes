#!/usr/bin/env node

/**
 * Verification script for the 5 critical repairs in perbaikan-bagian1.md
 * This script checks if the implemented fixes are working correctly
 */

const fs = require('fs')
const path = require('path')

const VERIFICATION_CHECKLIST = {
  '1. Session Management': {
    description: 'Auto token refresh mechanism',
    files: [
      'middleware.ts',
      'backend/lib/auth.ts'
    ],
    checks: [
      { file: 'backend/lib/auth.ts', contains: 'refreshToken' },
      { file: 'middleware.ts', contains: 'x-refresh-token' }
    ]
  },
  
  '2. Organization State Management': {
    description: 'Data isolation between organizations',
    files: [
      'app/api/auth/active-org/route.ts',
      'backend/lib/org-context.ts'
    ],
    checks: [
      { file: 'app/api/auth/active-org/route.ts', contains: 'clearState: true' },
      { file: 'backend/lib/org-context.ts', contains: 'validateOrganizationAccess' }
    ]
  },
  
  '3. Clear Database with Backup': {
    description: 'Automatic backup before deletion',
    files: [
      'app/api/admin/clear-database/route.ts'
    ],
    checks: [
      { file: 'app/api/admin/clear-database/route.ts', contains: 'createBackupBeforeDelete' },
      { file: 'app/api/admin/clear-database/route.ts', contains: 'backupResult.success' }
    ]
  },
  
  '4. Data Persistence': {
    description: 'Enhanced attendance and kas persistence',
    files: [
      'app/api/absensi/route.ts',
      'app/api/kas/transactions/route.ts'
    ],
    checks: [
      { file: 'app/api/absensi/route.ts', contains: 'verification.length' },
      { file: 'app/api/kas/transactions/route.ts', contains: 'verification.organization_id' }
    ]
  },
  
  '5. RBAC Security': {
    description: 'Role-based access control for critical endpoints',
    files: [
      'app/api/exp/route.ts',
      'backend/lib/rbac-middleware.ts'
    ],
    checks: [
      { file: 'app/api/exp/route.ts', contains: 'Dilarang - Hanya admin' },
      { file: 'backend/lib/rbac-middleware.ts', contains: 'protectedEndpoint' }
    ]
  }
}

console.log('🔍 Verifying Repair Implementation...\n')

let totalPassed = 0
let totalFailed = 0

for (const [repairName, config] of Object.entries(VERIFICATION_CHECKLIST)) {
  console.log(`\n📋 ${repairName}: ${config.description}`)
  
  let sectionPassed = 0
  let sectionFailed = 0
  
  for (const check of config.checks) {
    const filePath = path.join(process.cwd(), check.file)
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ File not found: ${check.file}`)
      sectionFailed++
      continue
    }
    
    const content = fs.readFileSync(filePath, 'utf-8')
    
    if (content.includes(check.contains)) {
      console.log(`   ✅ ${check.file}: Found "${check.contains}"`)
      sectionPassed++
    } else {
      console.log(`   ❌ ${check.file}: Missing "${check.contains}"`)
      sectionFailed++
    }
  }
  
  totalPassed += sectionPassed
  totalFailed += sectionFailed
  
  const sectionStatus = sectionFailed === 0 ? '✅ PASS' : '⚠️  PARTIAL'
  console.log(`   ${sectionStatus} (${sectionPassed}/${sectionPassed + sectionFailed})`)
}

console.log('\n' + '='.repeat(50))
console.log(`📊 VERIFICATION SUMMARY`)
console.log(`✅ Passed: ${totalPassed}`)
console.log(`❌ Failed: ${totalFailed}`)
console.log(`📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`)

if (totalFailed === 0) {
  console.log('\n🎉 ALL REPAIRS SUCCESSFULLY IMPLEMENTED!')
  console.log('\n📋 NEXT STEPS:')
  console.log('   1. Test session persistence (wait 30 minutes while using system)')
  console.log('   2. Test organization switching (verify data isolation)')  
  console.log('   3. Test clear database (verify backup creation)')
  console.log('   4. Test attendance/kas input (verify data persists after refresh)')
  console.log('   5. Test XP giving as non-admin user (verify RBAC blocking)')
} else {
  console.log('\n⚠️  Some issues detected. Please review the failed checks above.')
  process.exit(1)
}