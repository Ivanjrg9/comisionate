import { AnnouncementBar } from "@/components/public/AnnouncementBar";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Footer } from "@/components/public/Footer";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-primary-foreground">
        Saltar al contenido
      </a>
      <AnnouncementBar />
      <PublicHeader />
      <div id="contenido" className="flex-1">{children}</div>
      <Footer />
    </>
  );
}
