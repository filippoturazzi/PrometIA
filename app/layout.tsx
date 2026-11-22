import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/Header";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";
import { Tour } from "@/components/Tour";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PrometIA — O que prometia, entrega",
  description:
    "Protótipo conceitual: IA que confere se o que é prometido na divulgação bate com o que o comprador recebe.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-20 sm:px-6">
          {children}
        </main>
        <DisclaimerFooter />
        <Toaster theme="light" position="top-right" />
        <Tour />
      </body>
    </html>
  );
}
