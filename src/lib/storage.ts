import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BYTES = 5 * 1024 * 1024;

/** Sube un archivo a <bucket>/<uid>/<nombre>. Devuelve la ruta o un mensaje de error. */
export async function uploadFile(
  supabase: SupabaseClient,
  bucket: "logos" | "photos" | "materials" | "invoices",
  uid: string,
  file: File,
  allowed: string[],
  subfolder = "",
): Promise<{ path: string } | { error: string }> {
  if (!allowed.includes(file.type)) return { error: "Formato de archivo no permitido" };
  if (file.size > MAX_BYTES) return { error: "El archivo no puede superar 5 MB" };
  const safe = file.name.normalize("NFD").replace(/[^\w.-]+/g, "_");
  const path = `${uid}/${subfolder ? subfolder + "/" : ""}${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
  return error ? { error: "No se pudo subir el archivo" } : { path };
}

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MATERIAL_TYPES = [...IMAGE_TYPES, "application/pdf"];

export function publicUrl(supabase: SupabaseClient, bucket: "logos" | "photos", path: string | null) {
  return path ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl : null;
}
