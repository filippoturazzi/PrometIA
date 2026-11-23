import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { Header } from "@/components/Header";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";
import { Tour } from "@/components/Tour";
import { HideOnStandalone } from "@/components/AppChrome";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ScrollReveal, revealBootScript } from "@/components/ScrollReveal";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PrometIA — O que prometia, entrega",
  description:
    "Protótipo conceitual: IA que confere se o que é prometido na divulgação bate com o que o comprador recebe.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${interTight.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: revealBootScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <HideOnStandalone>
          <Header />
        </HideOnStandalone>
        <main className="flex w-full flex-1 flex-col">{children}</main>
        <HideOnStandalone>
          <DisclaimerFooter />
        </HideOnStandalone>
        <Toaster theme="light" position="top-right" />
        <ScrollToTop />
        <HideOnStandalone>
          <Tour />
        </HideOnStandalone>
        <ScrollReveal />
      </body>
    </html>
  );
}
