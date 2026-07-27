import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const TARGET_DIR = path.join(process.cwd(), 'claudekit-engineer-2.15.0')
const ENCRYPTED_FILE = path.join(process.cwd(), 'claudekit-engineer.enc')

function getKey(password) {
  return crypto.scryptSync(password, 'forge_salt_2026_super_secure', 32)
}

export function encryptFolder(password) {
  if (!fs.existsSync(TARGET_DIR)) {
    console.error('❌ Target directory does not exist:', TARGET_DIR)
    return
  }

  const key = getKey(password)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  console.log('🔒 Encrypting ClaudeKit Engineer directory with AES-256-GCM...')
  const files = []

  function readDir(dir) {
    for (const file of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, file)
      if (fs.statSync(fullPath).isDirectory()) {
        readDir(fullPath)
      } else {
        const relPath = path.relative(TARGET_DIR, fullPath)
        const content = fs.readFileSync(fullPath).toString('base64')
        files.push({ path: relPath, content })
      }
    }
  }

  readDir(TARGET_DIR)
  const jsonStr = JSON.stringify(files)
  let encrypted = cipher.update(jsonStr, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')

  const outputPayload = JSON.stringify({
    iv: iv.toString('hex'),
    authTag,
    data: encrypted
  })

  fs.writeFileSync(ENCRYPTED_FILE, outputPayload)
  console.log(`✅ SUCCESS: Encrypted payload generated at ${ENCRYPTED_FILE}`)
}

export function decryptFolder(password) {
  if (!fs.existsSync(ENCRYPTED_FILE)) {
    console.error('❌ Encrypted payload file not found!')
    return
  }

  console.log('🔓 Decrypting ClaudeKit Engineer payload...')
  const key = getKey(password)
  const payload = JSON.parse(fs.readFileSync(ENCRYPTED_FILE, 'utf8'))
  const iv = Buffer.from(payload.iv, 'hex')
  const authTag = Buffer.from(payload.authTag, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  try {
    let decrypted = decipher.update(payload.data, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    const files = JSON.parse(decrypted)

    if (!fs.existsSync(TARGET_DIR)) {
      fs.mkdirSync(TARGET_DIR, { recursive: true })
    }

    for (const f of files) {
      const fullPath = path.join(TARGET_DIR, f.path)
      fs.mkdirSync(path.dirname(fullPath), { recursive: true })
      fs.writeFileSync(fullPath, Buffer.from(f.content, 'base64'))
    }
    console.log(`✅ SUCCESS: ClaudeKit Engineer decrypted into ${TARGET_DIR}`)
  } catch (err) {
    console.error('❌ INVALID PASSWORD! Decryption failed.')
  }
}

// CLI runner
const action = process.argv[2]
const pass = process.argv[3] || 'anhkin69'

if (action === 'encrypt' || action === 'lock') {
  encryptFolder(pass)
} else if (action === 'decrypt' || action === 'unlock') {
  decryptFolder(pass)
}
