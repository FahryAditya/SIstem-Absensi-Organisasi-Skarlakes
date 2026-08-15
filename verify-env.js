require('dotenv').config()

console.log('╔═══════════════════════════════════════════════════════════╗')
console.log('║              ENVIRONMENT VARIABLES CHECK                  ║')
console.log('╚═══════════════════════════════════════════════════════════╝')
console.log()

const checks = {
  'Database Configuration': [
    { name: 'DATABASE_URL', required: true, sensitive: true },
    { name: 'DIRECT_URL', required: true, sensitive: true },
  ],
  'Supabase Configuration': [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true, sensitive: false },
    { name: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', required: false, sensitive: false },
    { name: 'SUPABASE_ANON_KEY', required: false, sensitive: true },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', required: false, sensitive: true },
  ],
  'JWT Configuration': [
    { name: 'JWT_SECRET', required: true, sensitive: true },
  ],
  'Cloudinary Configuration': [
    { name: 'CLOUDINARY_CLOUD_NAME', required: false, sensitive: false },
    { name: 'CLOUDINARY_API_KEY', required: false, sensitive: false },
    { name: 'CLOUDINARY_API_SECRET', required: false, sensitive: true },
  ],
  'Email Configuration': [
    { name: 'GMAIL_FROM_EMAIL', required: false, sensitive: false },
    { name: 'GMAIL_APP_PASSWORD', required: false, sensitive: true },
  ]
}

let hasErrors = false
let hasWarnings = false

Object.keys(checks).forEach(category => {
  console.log(`📁 ${category}`)
  console.log()
  
  checks[category].forEach(check => {
    const value = process.env[check.name]
    const exists = !!value
    const isEmpty = !value || value.trim() === ''
    
    let status = '✅'
    let message = 'Configured'
    let showValue = ''
    
    if (check.required && isEmpty) {
      status = '❌'
      message = 'MISSING (Required)'
      hasErrors = true
    } else if (!check.required && isEmpty) {
      status = '⚠️ '
      message = 'Not set (Optional)'
      hasWarnings = true
    } else {
      if (check.sensitive) {
        showValue = value.substring(0, 20) + '...'
      } else {
        showValue = value
      }
    }
    
    console.log(`   ${status} ${check.name}`)
    if (!isEmpty) {
      console.log(`      ${showValue}`)
    } else {
      console.log(`      ${message}`)
    }
    console.log()
  })
})

// Special checks
console.log('🔍 Special Validations')
console.log()

// Check JWT_SECRET strength
const jwtSecret = process.env.JWT_SECRET
if (jwtSecret) {
  if (jwtSecret.length < 32) {
    console.log('   ⚠️  JWT_SECRET should be at least 32 characters')
    console.log(`      Current length: ${jwtSecret.length}`)
    hasWarnings = true
  } else {
    console.log('   ✅ JWT_SECRET length is sufficient')
    console.log(`      Length: ${jwtSecret.length} characters`)
  }
  
  if (jwtSecret === 'fallback-secret-change-this' || jwtSecret.includes('ganti-dengan')) {
    console.log('   ⚠️  JWT_SECRET appears to be a default/placeholder value')
    hasWarnings = true
  }
} else {
  console.log('   ❌ JWT_SECRET is missing!')
  hasErrors = true
}
console.log()

// Check DATABASE_URL format
const dbUrl = process.env.DATABASE_URL
if (dbUrl) {
  if (dbUrl.includes('postgres://') || dbUrl.includes('postgresql://')) {
    console.log('   ✅ DATABASE_URL has valid PostgreSQL format')
  } else {
    console.log('   ❌ DATABASE_URL does not appear to be a PostgreSQL URL')
    hasErrors = true
  }
  
  if (dbUrl.includes('supabase.com')) {
    console.log('   ✅ Using Supabase database')
  } else if (dbUrl.includes('neon.tech')) {
    console.log('   ✅ Using Neon database')
  }
  
  if (dbUrl.includes('pgbouncer=true')) {
    console.log('   ✅ Connection pooling enabled')
  }
} else {
  console.log('   ❌ DATABASE_URL is missing!')
  hasErrors = true
}
console.log()

// Check DIRECT_URL format
const directUrl = process.env.DIRECT_URL
if (directUrl) {
  if (directUrl.includes(':5432') || directUrl.includes(':6543')) {
    console.log('   ✅ DIRECT_URL has valid PostgreSQL port')
  }
  
  if (!directUrl.includes('pgbouncer')) {
    console.log('   ✅ DIRECT_URL is not pooled (correct)')
  } else {
    console.log('   ⚠️  DIRECT_URL should not use connection pooling')
    hasWarnings = true
  }
} else {
  console.log('   ❌ DIRECT_URL is missing!')
  hasErrors = true
}
console.log()

// Summary
console.log('╔═══════════════════════════════════════════════════════════╗')
console.log('║                      SUMMARY                              ║')
console.log('╚═══════════════════════════════════════════════════════════╝')
console.log()

if (hasErrors) {
  console.log('❌ ERRORS FOUND - Please fix required variables')
  console.log()
  process.exit(1)
} else if (hasWarnings) {
  console.log('⚠️  WARNINGS FOUND - Some optional features may not work')
  console.log()
  console.log('✅ Core configuration is valid - Login should work')
  console.log()
} else {
  console.log('✅ ALL CHECKS PASSED')
  console.log()
  console.log('🎉 Environment is properly configured!')
  console.log()
}

console.log('Next steps:')
console.log('  1. Run: npm run dev')
console.log('  2. Visit: http://localhost:3000/login')
console.log('  3. Login with any account from: node quick-check.js')
console.log()
