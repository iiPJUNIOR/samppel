import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Sidebar from "@/components/Sidebar";
import AppGuard from "@/components/AppGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portal Samppel | Sistema Comercial & Produção",
  description: "MVP de Sistema Operacional Comercial para Embalagens Personalizadas integrado ao ERP Conta Azul.",
  keywords: "embalagens, conta azul, erp, portal samppel, vendas, expedição, produção",
  authors: [{ name: "Portal Samppel Team" }]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <AppGuard>
              <div className="app-container">
                <Sidebar />
                <div className="main-content">
                  {children}
                </div>
              </div>
            </AppGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
