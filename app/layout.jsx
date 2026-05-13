import "./globals.css"
import { Manrope } from "next/font/google"
import FondoDinamico from "../components/FondoDinamico"
import AmbientProvider from "../components/AmbientProvider"

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
})

export const metadata = {
  title: "ContaLearn ⚡",
  description: "Aprende contabilidad jugando",
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={manrope.variable}>
      <body className="min-h-screen">
        <AmbientProvider />
        <FondoDinamico />
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  )
}
