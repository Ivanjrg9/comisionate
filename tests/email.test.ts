import { describe, expect, it } from "vitest";
import { renderEmail } from "../src/lib/email";

describe("email de notificación", () => {
  it("escapa el HTML del contenido y enlaza a la app", () => {
    const html = renderEmail('<script>alert("x")</script>', "Total & más", "/empresa/facturas");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Total &amp; más");
    expect(html).toContain("/empresa/facturas");
  });
  it("no pinta botón si no hay enlace", () => {
    expect(renderEmail("Hola", "x", null)).not.toContain("Abrir en ComisionaTe");
  });
});
