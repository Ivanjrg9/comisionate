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

  test("aplica el sistema de diseño Graphite (lienzo casi negro, texto blanco, botón principal Paper White)", async ({ page }) => {
    await page.goto("/");
    const css = await page.evaluate(() => {
      const cta = [...document.querySelectorAll("a")].find((a) => a.textContent?.includes("Soy comercial: empieza gratis"))!;
      return {
        bg: getComputedStyle(document.body).backgroundColor,
        fg: getComputedStyle(document.body).color,
        scheme: getComputedStyle(document.documentElement).colorScheme,
        cta: getComputedStyle(cta).backgroundColor,
        ctaRadius: getComputedStyle(cta).borderTopLeftRadius,
        h1Size: getComputedStyle(document.querySelector("h1")!).fontSize,
      };
    });
    expect(css).toMatchObject({ bg: "rgb(10, 10, 10)", fg: "rgb(250, 250, 250)", scheme: "dark", cta: "rgb(229, 229, 229)", ctaRadius: "8px" });
    expect(parseFloat(css.h1Size)).toBeLessThanOrEqual(60);
  });

  test("el marco de producto cambia de pestaña con el teclado (flechas)", async ({ page }) => {
    await page.goto("/");
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(3);
    await tabs.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText("Cada cliente, en su punto del proceso");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tabpanel")).toContainText("Tu comisión, íntegra y con fecha");
    await page.keyboard.press("ArrowRight");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  });

  test("las cabeceras de seguridad están presentes", async ({ request }) => {
    const res = await request.get("/");
    expect(res.headers()["x-frame-options"]).toBe("DENY");
    expect(res.headers()["x-content-type-options"]).toBe("nosniff");
    expect(res.headers()["strict-transport-security"]).toContain("max-age");
  });
});
