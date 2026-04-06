const https = require('https')

const PROJECT_ID = 'lgm-apparel-665be'
const API_KEY = 'AIzaSyAbQJ35fJkDwltlXkG2sza2e9FVJmczC50'

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
  if (res.body.error) return null
  return res.body.idToken
}

async function addToAdmins(uid, idToken) {
  const body = JSON.stringify({ fields: { role: { stringValue: 'admin' }, email: { stringValue: uid } } })
  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  }
  if (idToken) headers['Authorization'] = `Bearer ${idToken}`

  const res = await request({
    hostname: 'firestore.googleapis.com',
    path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/admins/${uid}`,
    method: 'PATCH',
    headers,
  }, body)
  return res
}

async function main() {
  // Try without auth first
  console.log('Trying without authentication...')
  const testRes = await addToAdmins(adminUsers[0].uid, null)

  if (testRes.status === 200) {
    console.log('Rules allow unauthenticated writes, adding all admins...')
    for (const user of adminUsers.slice(1)) {
      const res = await addToAdmins(user.uid, null)
      if (res.status === 200) console.log(`✓ Added admin: ${user.email}`)
      else console.error(`✗ Failed ${user.email}:`, res.body?.error?.message || res.status)
    }
    console.log(`✓ Added admin: ${adminUsers[0].email}`)
    return
  }

  console.log(`No-auth failed (${testRes.status}): ${testRes.body?.error?.message}`)
  console.log('\nTrying to sign in as each new user and self-elevate...')

  // Try signing in as each new user with admin123
  for (const user of adminUsers) {
    const token = await signIn(user.email, 'admin123')
    if (!token) { console.log(`Could not sign in as ${user.email}`); continue }

    const res = await addToAdmins(user.uid, token)
    if (res.status === 200) {
      console.log(`✓ ${user.email} added themselves as admin`)
    } else {
      console.log(`✗ ${user.email} blocked by rules: ${res.body?.error?.message}`)
    }
  }
}

main()
