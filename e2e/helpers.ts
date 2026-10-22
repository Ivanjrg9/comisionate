import { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

export const PASSWORD = "Comisionate123!";
export const service = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

export const stamp = Date.now();
export const unique = (prefix: string) => `${prefix}.${stamp}.${Math.random().toString(36).slice(2, 6)}@comisionate.test`;
export const randomPhone = () => "6" + String(Math.floor(Math.random() * 1e8)).padStart(8, "0");

/** Rellena el formulario de registro. El formulario exige >1,2 s desde que se muestra (anti-bots). */
export async function registerUI(page: Page, role: "empresa" | "comercial", email: string, name: string) {
  await page.goto(`/registro?rol=${role}`);
  await page.waitForTimeout(1500);
  await page.getByLabel("Tu nombre y apellidos").fill(name);
  if (role === "empresa") {
    await page.getByLabel("Razón social").fill(`${name} SL`);
    await page.getByLabel("CIF").fill(`B${Math.floor(1e7 + Math.random() * 9e7)}`);
  } else {
    await page.getByLabel("DNI / NIE").fill("12345678Z");
  }
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByLabel(/Acepto los términos/).check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.waitForURL(role === "empresa" ? "**/empresa" : "**/comercial");
}

export async function loginUI(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Contraseña" }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

export async function logoutUI(page: Page) {
  await page.getByRole("button", { name: "Salir" }).click();
  await page.waitForURL("**/");
}

/** Busca en el buzón local (Mailpit) el último enlace de verificación enviado a un email. */
export async function mailLink(email: string): Promise<string> {
  const api = "http://127.0.0.1:54324/api/v1";
  for (let i = 0; i < 30; i++) {
    const search = await (await fetch(`${api}/search?query=${encodeURIComponent(`to:${email}`)}`)).json();
    const id = search.messages?.[0]?.ID;
    if (id) {
      const msg = await (await fetch(`${api}/message/${id}`)).json();
      const link = (msg.HTML as string).match(/href="([^"]*\/auth\/v1\/verify[^"]*)"/)?.[1];
      if (link) return link.replace(/&amp;/g, "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No llegó ningún email a ${email}`);
}

export const expectPdf = async (page: Page, href: string) => {
  const res = await page.request.get(href);
  expect(res.status()).toBe(200);
  expect((await res.body()).subarray(0, 5).toString()).toBe("%PDF-");
};
