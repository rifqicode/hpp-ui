/**
 * Tamper-evident cache untuk permissions.
 * - Payload disimpan di sessionStorage beserta signature HMAC-SHA256.
 * - Key HMAC dibuat non-extractable & disimpan di IndexedDB, sehingga nilainya
 *   tidak bisa dibaca/di-copy lewat JS biasa atau devtools storage tab.
 * - Signature mengikat userId + storeId + expiry; edit manual => cache dibuang.
 * Catatan: ini hanya UX gating. Backend tetap wajib enforce permission.
 */

const CACHE_KEY = "perm-cache"
const DB_NAME = "hpp-secure"
const STORE_NAME = "keys"
const KEY_ID = "perm-hmac"
const TTL_MS = 15 * 60 * 1000

interface CachePayload {
  userId: string
  storeId: string
  role: string
  permissions: string[]
  exp: number
}

interface StoredCache {
  payload: string
  sig: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getKey(): Promise<CryptoKey> {
  const db = await openDb()
  const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
    const r = db.transaction(STORE_NAME).objectStore(STORE_NAME).get(KEY_ID)
    r.onsuccess = () => resolve(r.result as CryptoKey | undefined)
    r.onerror = () => reject(r.error)
  })
  if (existing) return existing
  const key = await crypto.subtle.generateKey(
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(key, KEY_ID)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  return key
}

const enc = new TextEncoder()

function toB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function fromB64(s: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
}

export async function writePermissionCache(
  userId: string,
  storeId: string,
  data: { permissions: string[]; role: string }
): Promise<void> {
  try {
    const payload: CachePayload = { userId, storeId, ...data, exp: Date.now() + TTL_MS }
    const raw = JSON.stringify(payload)
    const sig = await crypto.subtle.sign("HMAC", await getKey(), enc.encode(raw))
    const stored: StoredCache = { payload: raw, sig: toB64(sig) }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(stored))
  } catch {
    clearPermissionCache()
  }
}

export async function readPermissionCache(
  userId: string,
  storeId: string
): Promise<{ permissions: string[]; role: string } | null> {
  try {
    const item = sessionStorage.getItem(CACHE_KEY)
    if (!item) return null
    const stored = JSON.parse(item) as StoredCache
    const valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      fromB64(stored.sig),
      enc.encode(stored.payload)
    )
    if (!valid) {
      clearPermissionCache()
      return null
    }
    const p = JSON.parse(stored.payload) as CachePayload
    if (p.userId !== userId || p.storeId !== storeId || p.exp < Date.now()) {
      clearPermissionCache()
      return null
    }
    return { permissions: p.permissions, role: p.role }
  } catch {
    clearPermissionCache()
    return null
  }
}

export function clearPermissionCache(): void {
  sessionStorage.removeItem(CACHE_KEY)
}
