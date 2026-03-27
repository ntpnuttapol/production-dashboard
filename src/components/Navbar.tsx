'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

const NAV_ITEMS = [
    { href: '/', label: 'Dashboard', icon: '🖥️', color: '#F59E0B' },
    { href: '/production', label: 'Produce', icon: '📝', color: '#F59E0B' },
    { href: '/finishing', label: 'Finish', icon: '🔧', color: '#8B5CF6' },
    { href: '/analytics', label: 'Analytics', icon: '📊', color: '#3B82F6' },
    { href: '/parts', label: 'Parts', icon: '📦', color: '#22C55E' },
    { href: '/customers', label: 'Customers', icon: '👥', color: '#10B981' },
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
                background: 'var(--color-bg-primary)',
                borderBottom: '2px dashed var(--color-border)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
            }}>
                <div style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '64px',
                }}>
                    {/* Logo */}
                    <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px', animation: 'float 3s infinite ease-in-out' }}>🏭</span>
                        <span className="cartoon-font" style={{
                            fontSize: '18px',
                            color: 'var(--color-blue)',
                            letterSpacing: '0.5px',
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
                        {/* Portal Home */}
                        <a
                            href="http://localhost:8888"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 16px',
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#818CF8',
                                background: 'rgba(129, 140, 248, 0.1)',
                                borderBottom: '3px solid #818CF8',
                                borderRadius: '12px 12px 0 0',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>🏠</span>
                            Portal
                        </a>
                        {allItems.map(item => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 16px',
                                        textDecoration: 'none',
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                        background: isActive ? `${item.color}20` : 'transparent',
                                        borderBottom: isActive ? `3px solid ${item.color}` : '3px solid transparent',
                                        borderRadius: '12px 12px 0 0',
                                        transition: 'all 0.2s ease',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    <span style={{ fontSize: '18px' }}>{item.icon}</span>
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
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-text-primary)' }}>{user.fullName}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                        {user.role === 'admin' ? '👑 Admin' : user.department === 'production' ? '🏭 Prod' : '🔧 Fin'}
                                        {' · '}{user.employeeId}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Link href="/change-password" title="เปลี่ยนรหัสผ่าน" className="cartoon-btn" style={{
                                        padding: '8px 16px', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'
                                    }}>
                                        🔑 รหัสผ่าน
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="cartoon-btn"
                                        style={{
                                            padding: '8px 16px',
                                            background: '#FEE2E2',
                                            color: '#EF4444',
                                            fontSize: '13px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                        }}
                                        title="Logout"
                                    >
                                        🚪 ออกระบบ
                                    </button>
                                </div>
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
                        borderTop: '2px dashed var(--color-border)',
                        background: 'var(--color-bg-primary)',
                        padding: '12px 20px 20px',
                        animation: 'slideDown 0.2s ease-out',
                    }}>
                        {/* Portal Home (Mobile) */}
                        <a
                            href="http://localhost:8888"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '16px',
                                textDecoration: 'none',
                                fontSize: '15px',
                                fontWeight: 800,
                                color: '#818CF8',
                                background: 'rgba(129, 140, 248, 0.1)',
                                borderLeft: '4px solid #818CF8',
                                borderRadius: '0 12px 12px 0',
                                marginBottom: '8px',
                            }}
                        >
                            <span style={{ fontSize: '20px' }}>🏠</span>
                            Portal Home
                        </a>
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
                                        gap: '12px',
                                        padding: '16px',
                                        textDecoration: 'none',
                                        fontSize: '15px',
                                        fontWeight: isActive ? '800' : '600',
                                        color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                        background: isActive ? `${item.color}20` : 'transparent',
                                        borderLeft: isActive ? `4px solid ${item.color}` : '4px solid transparent',
                                        borderRadius: '0 12px 12px 0',
                                    }}
                                >
                                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                                    {item.label}
                                </Link>
                            )
                        })}
                        {user && (
                            <div style={{
                                marginTop: '16px',
                                paddingTop: '16px',
                                borderTop: '2px dashed var(--color-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-text-primary)' }}>{user.fullName}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                        {user.role === 'admin' ? '👑 Admin' : user.department === 'production' ? '🏭 Prod' : '🔧 Fin'}
                                        {' · '}{user.employeeId}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <Link href="/change-password" onClick={() => setMenuOpen(false)} className="cartoon-btn" style={{
                                        padding: '8px 14px', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)', fontSize: '13px'
                                    }}>
                                        🔑 รหัสผ่าน
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="cartoon-btn"
                                        style={{
                                            padding: '8px 14px',
                                            background: '#FEE2E2',
                                            color: '#EF4444',
                                            fontSize: '13px',
                                        }}
                                    >
                                        🚪 ออก
                                    </button>
                                </div>
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
