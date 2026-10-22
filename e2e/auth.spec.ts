import { expect, test } from "@playwright/test";
import { PASSWORD, loginUI, logoutUI, mailLink, registerUI, service, unique } from "./helpers";

test.describe("acceso y cuentas", () => {
  test("las áreas privadas redirigen al login conservando el destino", async ({ page }) => {
    await page.goto("/empresa/leads");
    await expect(page).toHaveURL(/login\?next=%2Fempresa%2Fleads/);
  });

  test("un login incorrecto muestra un error claro", async ({ page }) => {
    await loginUI(page, "comercial1@comisionate.test", "otra-clave-1");
    await expect(page.getByRole("alert").filter({ hasText: "incorrectos" })).toBeVisible();
  });

  test("un comercial no puede entrar en el panel de empresa ni en el de admin", async ({ page }) => {
    await loginUI(page, "comercial1@comisionate.test");
    await page.waitForURL("**/comercial");
    for (const path of ["/empresa", "/admin"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/comercial$/);
    }
  });

  test("el registro rechaza contraseñas débiles y bots", async ({ page }) => {
    await page.goto("/registro?rol=comercial");
    await page.waitForTimeout(1500);
    await page.getByLabel("Tu nombre y apellidos").fill("Persona Prueba");
    await page.getByLabel("DNI / NIE").fill("12345678Z");
    await page.getByLabel("Email").fill(unique("debil"));
    await page.getByLabel("Contraseña").fill("solo-letras");
    await page.getByLabel(/Acepto los términos/).check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByText("letras y números")).toBeVisible();

    // Un bot rellena el campo trampa invisible
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.locator('input[name="website"]').evaluate((el: HTMLInputElement) => (el.value = "http://spam.example"));
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "No se pudo crear la cuenta" })).toBeVisible();
  });

  test("un registro rápido (sin esperar) se bloquea como bot", async ({ page }) => {
    await page.goto("/registro?rol=comercial");
    await page.getByLabel("Tu nombre y apellidos").fill("Bot Rápido");
    await page.getByLabel("DNI / NIE").fill("12345678Z");
    await page.getByLabel("Email").fill(unique("bot"));
    await page.getByLabel("Contraseña").fill(PASSWORD);
    await page.getByLabel(/Acepto los términos/).check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "No se pudo crear la cuenta" })).toBeVisible();
  });

  test("registro correcto guarda la aceptación de términos con su versión", async ({ page }) => {
    const email = unique("terminos");
    await registerUI(page, "comercial", email, "Terminos Test");
    const { data } = await service().from("profiles").select("terms_version, terms_accepted_at").eq("email", email).single();
    expect(data?.terms_version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data?.terms_accepted_at).not.toBeNull();
  });

  test("recuperar la contraseña de extremo a extremo (email → enlace → nueva contraseña)", async ({ page }) => {
    const email = unique("reset");
    const { error } = await service().auth.admin.createUser({
      email, password: PASSWORD, email_confirm: true, user_metadata: { role: "comercial", full_name: "Reset Test", nif: "12345678Z", fiscal: "particular" },
    });
    expect(error).toBeNull();

    await page.goto("/login");
    await page.getByRole("link", { name: "¿Has olvidado tu contraseña?" }).click();
    await page.getByLabel("Email de tu cuenta").fill(email);
    await page.getByRole("button", { name: "Enviarme el enlace" }).click();
    await expect(page.getByRole("status")).toContainText("te hemos enviado un enlace");

    // El email llega en español
    await mailLink(email);
    const found = await (await fetch(`http://127.0.0.1:54324/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`)).json();
    expect(found.messages[0].Subject).toBe("Elige una contraseña nueva en ComisionaTe");

    await page.goto(await mailLink(email));
    await page.waitForURL("**/nueva-contrasena");
    await page.getByLabel("Contraseña nueva").fill("nuevaclave2026");
    await page.getByLabel("Repite la contraseña").fill("nuevaclave2027");
    await page.getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(page.getByText("Las contraseñas no coinciden")).toBeVisible();
    await page.getByLabel("Repite la contraseña").fill("nuevaclave2026");
    await page.getByRole("button", { name: "Guardar contraseña" }).click();
    await page.waitForURL("**/comercial");

    await logoutUI(page);
    await loginUI(page, email, PASSWORD);
    await expect(page.getByRole("alert").filter({ hasText: "incorrectos" })).toBeVisible();
    await loginUI(page, email, "nuevaclave2026");
    await page.waitForURL("**/comercial");
  });

  test("recuperar contraseña no revela si el email existe", async ({ page }) => {
    await page.goto("/recuperar");
    await page.getByLabel("Email de tu cuenta").fill(unique("noexiste"));
    await page.getByRole("button", { name: "Enviarme el enlace" }).click();
    await expect(page.getByRole("status")).toContainText("Si hay una cuenta con ese email");
  });

  test("un enlace usado o sin sesión no deja cambiar la contraseña", async ({ page }) => {
    await page.goto("/nueva-contrasena");
    await expect(page).toHaveURL(/login\?error=enlace/);
    await expect(page.getByRole("alert").filter({ hasText: "caducado" })).toBeVisible();
  });
});
