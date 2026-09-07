// GYM_MODULE_SPEC.md §12a — gallery photos never touch our backend. The browser
// uploads directly to Cloudinary via an unsigned preset (safe to expose client-side
// by design; the restriction is enforced Cloudinary-side) and we relay the resulting
// {secure_url, public_id} to POST /admin/gyms/{gym_id}/gallery. No API key/secret
// belongs in this file — those are server-side only and unrelated to unsigned uploads.
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

export async function uploadToCloudinary(file: File): Promise<{ secure_url: string; public_id: string }> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured — set VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET in .env.local');
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Cloudinary upload failed: ${res.status}`);
  }
  return res.json();
}
