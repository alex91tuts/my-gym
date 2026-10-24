import { supabase, supabaseConfigured } from './supabase'

const BUCKET = 'media'

// Micșorează poza înainte de upload (pozele de pe telefon au câțiva MB).
async function resize(file: Blob, max: number, quality: number): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  return new Promise((ok, fail) =>
    canvas.toBlob((b) => (b ? ok(b) : fail(new Error('Poza nu a putut fi procesată'))), 'image/jpeg', quality),
  )
}

const toDataUrl = (b: Blob) =>
  new Promise<string>((ok, fail) => {
    const r = new FileReader()
    r.onload = () => ok(String(r.result))
    r.onerror = () => fail(r.error)
    r.readAsDataURL(b)
  })

// Urcă poza și întoarce URL-ul ei. În mod local, poza (mai mică) se ține direct ca data URL.
export async function uploadImage(file: Blob): Promise<string> {
  if (!supabaseConfigured) return toDataUrl(await resize(file, 700, 0.7))
  const blob = await resize(file, 1400, 0.82)
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Nu ești autentificat')
  const path = `${data.user.id}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
  if (error) throw new Error(error.message)
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// Șterge o poză veche din Storage (best-effort).
export async function removeImage(url: string | null | undefined) {
  if (!url || !supabaseConfigured) return
  const marker = `/object/public/${BUCKET}/`
  const i = url.indexOf(marker)
  if (i < 0) return
  await supabase.storage
    .from(BUCKET)
    .remove([decodeURIComponent(url.slice(i + marker.length))])
    .catch(() => {})
}

// Starea unui câmp de poză într-un formular: URL-ul existent sau un fișier ales, încă neurcat.
export interface ImageDraft {
  url: string | null
  file?: Blob
}

// La salvare: urcă fișierul nou (dacă e cazul) și întoarce URL-ul final.
export async function commitImage(draft: ImageDraft): Promise<string | null> {
  return draft.file ? uploadImage(draft.file) : draft.url
}
