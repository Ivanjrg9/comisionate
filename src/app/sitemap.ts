import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content/site";

const PATHS = ["/", "/ofertas", "/como-funciona", "/preguntas-frecuentes", "/registro", "/login", "/legal/aviso-legal", "/legal/privacidad", "/legal/cookies", "/legal/terminos-empresas", "/legal/terminos-comerciales"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({ url: `${SITE.url}${path}`, changeFrequency: path === "/" ? "weekly" : "monthly", priority: path === "/" ? 1 : 0.6 }));
}
