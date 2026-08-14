import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
const geist = Geist({ variable: "--font", subsets: ["latin"] });
export const metadata: Metadata = { title: "Sistema de Gestión de Órdenes", description: "Rectificadora Las Flores" };
export default function Layout({children}:{children:React.ReactNode}){return <html lang="es"><head><meta name="codex-preview" content="development" /></head><body className={geist.variable}>{children}</body></html>}
