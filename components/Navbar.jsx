"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/",        icon: "🏠", label: "Inicio"  },
  { href: "/niveles", icon: "📚", label: "Niveles" },
  { href: "/ranking", icon: "🏆", label: "Ranking" },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <>
      {/* ── Barra superior (desktop) ── */}
      <nav
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center px-8 py-0 h-16"
        style={{
          background: "rgba(19,31,36,0.72)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(88,204,2,0.12)",
          boxShadow: "0 2px 32px 0 rgba(88,204,2,0.05)",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-extrabold text-xl mr-10 select-none"
          style={{
            color: "var(--color-primary)",
            textShadow: "0 0 18px rgba(88,204,2,0.55)",
            letterSpacing: "-0.5px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              filter: "drop-shadow(0 0 8px rgba(88,204,2,0.7))",
            }}
          >
            ⚡
          </span>
          ContaLearn
        </Link>

        {/* Links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="relative flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all duration-200 group"
                style={{
                  color: active ? "var(--color-primary)" : "#94a3b8",
                }}
              >
                {/* Hover glow bg */}
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: "rgba(88,204,2,0.08)" }}
                  aria-hidden
                />

                {/* Active glow bg */}
                {active && (
                  <span
                    className="absolute inset-0 rounded-xl"
                    style={{ background: "rgba(88,204,2,0.13)" }}
                    aria-hidden
                  />
                )}

                <span className="relative text-base">{icon}</span>
                <span className="relative">{label}</span>

                {/* Active underline bar */}
                {active && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                    style={{
                      background: "var(--color-primary)",
                      boxShadow: "0 0 10px 2px rgba(88,204,2,0.7)",
                    }}
                    aria-hidden
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ── Barra inferior (móvil) ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-2 py-2"
        style={{
          background: "rgba(19,31,36,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(88,204,2,0.12)",
          boxShadow: "0 -2px 24px rgba(0,0,0,0.4)",
        }}
      >
        {links.map(({ href, icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-0.5 px-6 py-1 rounded-xl transition-all duration-200"
              style={{ color: active ? "var(--color-primary)" : "#64748b" }}
            >
              {active && (
                <span
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "rgba(88,204,2,0.12)" }}
                  aria-hidden
                />
              )}
              <span
                className="relative text-2xl"
                style={{
                  filter: active
                    ? "drop-shadow(0 0 6px rgba(88,204,2,0.8))"
                    : "none",
                }}
              >
                {icon}
              </span>
              <span
                className="relative text-[10px] font-bold"
                style={{
                  textShadow: active ? "0 0 10px rgba(88,204,2,0.7)" : "none",
                }}
              >
                {label}
              </span>
              {active && (
                <span
                  className="absolute top-0 left-1/4 right-1/4 h-[2px] rounded-full"
                  style={{
                    background: "var(--color-primary)",
                    boxShadow: "0 0 8px 1px rgba(88,204,2,0.8)",
                  }}
                  aria-hidden
                />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
