'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

const NAV_ITEMS = [
    { href: '/', label: 'Dashboard', icon: '🖥️', color: '#F59E0B' },
    { href: '/production', label: 'Produce', icon: '📝', color: '#F59E0B' },
    { href: '/finishing', label: 'Finish', icon: '🔧', color: '#8B5CF6' },
    { href: '/planning', label: 'Plan', icon: '📋', color: '#06B6D4' },
    { href: '/parts', label: 'Parts', icon: '📦', color: '#22C55E' },
]

const ADMIN_ITEM = { href: '/admin', label: 'Admin', icon: '⚙️', color: '#EF4444' }

export default function Navbar() {
    const pathname = usePathname()
    const { user, isAdmin, logout } = useAuth()
    const [menuOpen, setMenuOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        window.location.href = '/login'
    }

    const allItems = isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS

    return (
        <>
            <nav style={{
                background: '#0B1120',
                borderBottom: '3px solid #1E3A5F',
                boxShadow: '0 4px 0 0 rgba(0,0,0,0.3)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
            }}>
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '0 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '56px',
                }}>
                    {/* Logo */}
                    <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>🏭</span>
                        <span style={{
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: '11px',
                            background: 'linear-gradient(90deg, #F59E0B, #10B981)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '1px',
                        }}>
                            PRODUCTION
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }} className="desktop-nav">
                        {allItems.map(item => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '8px 12px',
                                        textDecoration: 'none',
                                        fontSize: '12px',
                                        fontWeight: isActive ? '700' : '500',
                                        color: isActive ? item.color : '#94A3B8',
                                        background: isActive ? `${item.color}15` : 'transparent',
                                        borderBottom: isActive ? `2px solid ${item.color}` : '2px solid transparent',
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'all 0.15s',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <span style={{ fontSize: '14px' }}>{item.icon}</span>
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Right Section: Clock + User + Hamburger */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* User Info (Desktop) */}
                        {user && (
                            <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#F1F5F9' }}>{user.fullName}</div>
                                    <div style={{ fontSize: '10px', color: '#64748B' }}>
                                        {user.role === 'admin' ? '👑 Admin' : user.department === 'production' ? '🏭 Prod' : '🔧 Fin'}
                                        {' · '}{user.employeeId}
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        padding: '6px 10px',
                                        background: '#1C1917',
                                        color: '#EF4444',
                                        border: '2px solid #7F1D1D',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        boxShadow: '2px 2px 0 0 rgba(0,0,0,0.3)',
                                    }}
                                    title="Logout"
                                >
                                    🚪
                                </button>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            className="mobile-menu-btn"
                            onClick={() => setMenuOpen(!menuOpen)}
                            style={{
                                display: 'none',
                                background: 'none',
                                border: '2px solid #334155',
                                borderRadius: '4px',
                                color: '#F1F5F9',
                                fontSize: '20px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                            }}
                        >
                            {menuOpen ? '✕' : '☰'}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {menuOpen && (
                    <div className="mobile-dropdown" style={{
                        borderTop: '2px solid #1E3A5F',
                        background: '#0B1120',
                        padding: '8px 16px 16px',
                        animation: 'slideDown 0.2s ease-out',
                    }}>
                        {allItems.map(item => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMenuOpen(false)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '12px',
                                        textDecoration: 'none',
                                        fontSize: '13px',
                                        fontWeight: isActive ? '700' : '500',
                                        color: isActive ? item.color : '#94A3B8',
                                        background: isActive ? `${item.color}15` : 'transparent',
                                        borderLeft: isActive ? `3px solid ${item.color}` : '3px solid transparent',
                                        borderRadius: '0 4px 4px 0',
                                    }}
                                >
                                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                                    {item.label}
                                </Link>
                            )
                        })}
                        {user && (
                            <div style={{
                                marginTop: '12px',
                                paddingTop: '12px',
                                borderTop: '2px solid #1E3A5F',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#F1F5F9' }}>{user.fullName}</div>
                                    <div style={{ fontSize: '10px', color: '#64748B' }}>
                                        {user.role === 'admin' ? '👑 Admin' : user.department === 'production' ? '🏭 Prod' : '🔧 Fin'}
                                        {' · '}{user.employeeId}
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        padding: '8px 14px',
                                        background: '#1C1917',
                                        color: '#EF4444',
                                        border: '2px solid #7F1D1D',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                    }}
                                >
                                    🚪 ออก
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </nav>

            {/* Responsive styles */}
            <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
        @media (min-width: 769px) {
          .mobile-dropdown { display: none !important; }
        }
      `}</style>
        </>
    )
}
