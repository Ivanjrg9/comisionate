import { expect, test } from "@playwright/test";

test.describe("web pública", () => {
  test("la portada explica la propuesta y enseña el ticket de comisión", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("cobra tu comisión");
    await expect(page.getByText("Paga la empresa")).toBeVisible();
    await expect(page.getByText("550 €")).toBeVisible();
  });

  test("el marketplace público lista ofertas activas y lleva al registro", async ({ page }) => {
    await page.goto("/ofertas");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Ofertas disponibles");
    await expect(page.locator("main li").first()).toBeVisible();
    await page.getByRole("link", { name: "Crear cuenta de comercial" }).click();
    await expect(page).toHaveURL(/registro\?rol=comercial/);
  });

  test("las páginas informativas y legales cargan con su título", async ({ page }) => {
    for (const [path, title] of [
      ["/como-funciona", "Cómo funciona"], ["/preguntas-frecuentes", "Preguntas frecuentes"], ["/legal/aviso-legal", "Aviso legal"],
      ["/legal/privacidad", "Política de privacidad"], ["/legal/cookies", "Política de cookies"],
      ["/legal/terminos-empresas", "Términos de uso para empresas"], ["/legal/terminos-comerciales", "Términos de uso para comerciales"],
    ]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.getByRole("heading", { level: 1 }), path).toContainText(title);
    }
  });

  test("las preguntas frecuentes se abren con el teclado", async ({ page }) => {
    await page.goto("/preguntas-frecuentes");
    await page.getByText("¿Cuándo cobro?").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Hay dos momentos posibles")).toBeVisible();
  });

  test("una ruta inexistente muestra la página 404 propia", async ({ page }) => {
    const res = await page.goto("/esto-no-existe");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "No encontramos esa página" })).toBeVisible();
  });

  test("no hay desbordamiento horizontal en ninguna página pública", async ({ page }) => {
    for (const path of ["/", "/ofertas", "/como-funciona", "/preguntas-frecuentes", "/legal/privacidad", "/legal/cookies", "/login", "/registro?rol=empresa"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test("las cabeceras de seguridad están presentes", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["strict-transport-security"]).toContain("max-age");
  });
});
