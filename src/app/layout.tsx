import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/content/site";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  openGraph: { siteName: SITE.name, locale: "es_ES", type: "website" },
  title: { default: "ComisionaTe — Tu red de comerciales a comisión", template: "%s · ComisionaTe" },
  description:
    "Conectamos empresas de placas solares con comerciales independientes que cobran comisión por cada cliente que consiguen.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
