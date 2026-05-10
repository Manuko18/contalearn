import "./globals.css"
import FondoDinamico from "../components/FondoDinamico"
import AmbientProvider from "../components/AmbientProvider"

export const metadata = {
  title: "ContaLearn ⚡",
  description: "Aprende contabilidad jugando",
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
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
