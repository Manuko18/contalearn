"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10L12 3l9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>
    <path d="M9 21V13h6v8"/>
  </svg>
)
const BookIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h10a3 3 0 0 1 3 3v13H7a3 3 0 0 1-3-3z"/>
    <path d="M17 4h2a1 1 0 0 1 1 1v14"/>
  </svg>
)
const BuildingIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="18" rx="1"/>
    <line x1="9" y1="7" x2="9" y2="7.01"/>
    <line x1="15" y1="7" x2="15" y2="7.01"/>
    <line x1="9" y1="11" x2="9" y2="11.01"/>
    <line x1="15" y1="11" x2="15" y2="11.01"/>
    <path d="M10 21v-5h4v5"/>
  </svg>
)
const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 4h8v7a4 4 0 0 1-8 0z"/>
    <path d="M16 5h4v3a3 3 0 0 1-3 3"/>
    <path d="M8 5H4v3a3 3 0 0 0 3 3"/>
    <line x1="12" y1="15" x2="12" y2="19"/>
    <line x1="9" y1="21" x2="15" y2="21"/>
  </svg>
)
const RankingIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 21a8 8 0 0 1 16 0"/>
  </svg>
)

const NAV_ITEMS = [
  { href: "/",        Icon: HomeIcon,     label: "Inicio",  badge: true  },
  { href: "/niveles", Icon: BookIcon,     label: "Niveles", badge: false },
  { href: "/empresa", Icon: BuildingIcon, label: "Empresa", badge: false },
  { href: "/logros",  Icon: TrophyIcon,   label: "Logros",  badge: false },
  { href: "/ranking", Icon: RankingIcon,  label: "Ranking", badge: false },
]

export default function Navbar() {
  const pathname = usePathname()
  const [misionesPendientes, setMisionesPendientes] = useState(0)

  useEffect(() => {
    const n = parseInt(localStorage.getItem("cl_misiones_pendientes") || "0", 10)
    setMisionesPendientes(n)
  }, [pathname])

  return (
    <>
      {/* ── Desktop top bar ── */}
      <nav
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center px-8 h-14"
        style={{
          background: "rgba(6,11,24,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link
          href="/"
          style={{
            color: "var(--accent-green-bright)",
            fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px",
            textDecoration: "none", marginRight: 32,
            textShadow: "0 0 18px rgba(34,197,94,0.55)",
          }}
        >
          ⚡ ContaLearn
        </Link>
        <div style={{ display: "flex", gap: 4 }}>
          {NAV_ITEMS.map(({ href, label, badge }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                style={{
                  position: "relative", display: "flex", alignItems: "center",
                  gap: 6, fontSize: 13, fontWeight: 700,
                  padding: "6px 14px", borderRadius: 10,
                  textDecoration: "none", transition: "all 0.2s",
                  color: active ? "var(--accent-green-bright)" : "var(--text-3)",
                  background: active ? "rgba(34,197,94,0.1)" : "transparent",
                }}
              >
                {label}
                {badge && misionesPendientes > 0 && (
                  <span style={{ width: 7, height: 7, background: "#ef4444", borderRadius: "50%", position: "absolute", top: 6, right: 10 }} />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ── Mobile bottom nav ── */}
      <nav className="bnav md:hidden">
        {NAV_ITEMS.map(({ href, Icon, label, badge }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`bnav-item${active ? " active" : ""}`}
            >
              <span className="bnav-ico">
                <Icon />
                {badge && misionesPendientes > 0 && <span className="bnav-dot" />}
              </span>
              <span className="bnav-label">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
