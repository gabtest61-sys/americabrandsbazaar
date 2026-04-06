const https = require('https')

const API_KEY = 'AIzaSyAbQJ35fJkDwltlXkG2sza2e9FVJmczC50'
const PROJECT_ID = 'lgm-apparel-665be'

// UIDs from the user creation step
const adminUsers = [
  { email: 'gab@abb.com', uid: 'PJ5iygMZONMwgG7IVmOAOseFiyz1' },
  { email: 'mark@abb.com', uid: '7YLQWO0ABBURtPq0ktYBzYLfnEB2' },
  { email: 'nhey@abb.com', uid: '1IvlbRwykKNVMKRuN4imBT9tcjj2' },
  { email: 'khey@abb.com', uid: 'vAsSpRdnX2U58HX4cklxyT59EfI3' },
]

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

async function signIn(email, password) {
  const body = JSON.stringify({ email, password, returnSecureToken: true })
  const res = await request({
    hostname: 'identitytoolkit.googleapis.com',
    path: `/v1/accounts:signInWithPassword?key=${API_KEY}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  }, body)
  if (res.body.error) throw new Error(res.body.error.message)
  return res.body.idToken
}

async function addToAdmins(uid, idToken) {
  const body = JSON.stringify({ fields: { role: { stringValue: 'admin' } } })
  const res = await request({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/admins/${uid}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'Authorization': `Bearer ${idToken}`,
    },
  }, body)
  return res
}

async function main() {
  // Sign in as gab (first admin we're creating) using their credentials
  // We need an existing admin token — sign in as the first user and try
  // If rules block it, we need an existing admin's credentials

  const adminEmail = process.argv[2]
  const adminPass = process.argv[3]

  if (!adminEmail || !adminPass) {
    console.error('Usage: node add-admins.js <existing-admin-email> <password>')
    console.error('Example: node add-admins.js gmaturan60@gmail.com yourpassword')
    process.exit(1)
  }

  let idToken
  try {
    idToken = await signIn(adminEmail, adminPass)
    console.log(`Signed in as ${adminEmail}`)
  } catch (err) {
    console.error(`Sign-in failed: ${err.message}`)
    process.exit(1)
  }

  for (const user of adminUsers) {
    const res = await addToAdmins(user.uid, idToken)
    if (res.status === 200) {
      console.log(`✓ Added admin: ${user.email}`)
    } else {
      console.error(`✗ Failed ${user.email}: ${JSON.stringify(res.body?.error || res.body)}`)
    }
  }
}

main()
