// Test API Login endpoint
const testLoginAPI = async (nama, email, password) => {
  console.log('\n=== Testing Login API ===')
  console.log(`Nama: ${nama}`)
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}\n`)
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nama, email, password }),
    })
    
    const data = await response.json()
    
    console.log(`Status: ${response.status}`)
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (response.ok) {
      console.log('\n✅ LOGIN SUCCESS!')
      console.log(`Welcome, ${data.user.nama}!`)
      console.log(`Role: ${data.user.role}`)
      
      // Check cookies
      const cookies = response.headers.get('set-cookie')
      if (cookies) {
        console.log('\nCookie set:', cookies.substring(0, 100) + '...')
      }
    } else {
      console.log('\n❌ LOGIN FAILED!')
      console.log(`Error: ${data.error}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\nMake sure the development server is running:')
    console.log('  npm run dev')
  }
}

// Test with multiple accounts
const runTests = async () => {
  await testLoginAPI('Fahry Aditya Setiawan', 'Fahryadityasetiawann@gmail.com', 'AdministratorFahry')
  await testLoginAPI('Samuel Alden', 'programmingakarlakes1@gmail.com', 'pgskarlakes1')
  await testLoginAPI('Eunike Devina', 'osismpkskarlakes1@gmail.com', 'osismpk1')
  
  // Test with wrong credentials
  console.log('\n\n=== Testing Wrong Credentials ===')
  await testLoginAPI('Wrong Name', 'Fahryadityasetiawann@gmail.com', 'WrongPassword')
}

runTests()
