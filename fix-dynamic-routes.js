const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

async function fixDynamicRoutes() {
  console.log('🔍 Searching for API routes that need dynamic directive...\n')
  
  // Find all route.ts files in app/api
  const files = await glob('app/api/**/route.ts', {
    cwd: __dirname,
    absolute: true,
    windowsPathsNoEscape: true
  })
  
  console.log(`Found ${files.length} route files\n`)
  
  let fixed = 0
  let skipped = 0
  let alreadyHas = 0
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8')
      
      // Skip if doesn't use getSessionFromRequest or cookies
      const needsDynamic = content.includes('getSessionFromRequest') || 
                          content.includes('cookies()') ||
                          content.includes("from 'next/headers'")
      
      if (!needsDynamic) {
        skipped++
        continue
      }
      
      // Check if already has dynamic directive
      if (content.includes("export const dynamic = 'force-dynamic'")) {
        console.log(`✓ Already has dynamic: ${path.relative(process.cwd(), file)}`)
        alreadyHas++
        continue
      }
      
      // Find where to insert the directive (after imports, before first function/export)
      const lines = content.split('\n')
      let insertIndex = 0
      let foundImports = false
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        // Track when we're past imports
        if (line.startsWith('import ')) {
          foundImports = true
          insertIndex = i + 1
        }
        
        // Stop at first non-import, non-empty, non-comment line after imports
        if (foundImports && line && !line.startsWith('import ') && !line.startsWith('//') && !line.startsWith('/*')) {
          insertIndex = i
          break
        }
      }
      
      // Insert the dynamic directive
      lines.splice(insertIndex, 0, '', "export const dynamic = 'force-dynamic'", '')
      
      const newContent = lines.join('\n')
      fs.writeFileSync(file, newContent, 'utf-8')
      
      console.log(`✅ Fixed: ${path.relative(process.cwd(), file)}`)
      fixed++
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('Summary:')
  console.log(`  ✅ Fixed: ${fixed}`)
  console.log(`  ✓  Already had directive: ${alreadyHas}`)
  console.log(`  ⊘  Skipped (no auth): ${skipped}`)
  console.log(`  📝 Total files: ${files.length}`)
  console.log('='.repeat(60))
  
  if (fixed > 0) {
    console.log('\n✅ All routes have been updated!')
    console.log('📌 This fixes the "dynamic-server-error" on Vercel deployment')
  }
}

// Check if glob is available
try {
  require.resolve('glob')
  fixDynamicRoutes().catch(console.error)
} catch (e) {
  console.log('Installing glob package...')
  require('child_process').execSync('npm install glob', { stdio: 'inherit' })
  console.log('\nNow running the fix...\n')
  fixDynamicRoutes().catch(console.error)
}
