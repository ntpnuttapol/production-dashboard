'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { useAuth, type PageAccessKey } from '@/lib/auth-context'
import { getHubUrl } from '@/lib/public-env'

interface NavItem {
    href: string
    label: string
    icon: string
    color: string
    page: PageAccessKey
}

const NAV_ITEMS: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: '🖥️', color: '#F59E0B', page: 'dashboard' },
    { href: '/production', label: 'Produce', icon: '📝', color: '#F59E0B', page: 'production' },
    { href: '/finishing', label: 'Finish', icon: '🔧', color: '#8B5CF6', page: 'finishing' },
    { href: '/analytics', label: 'Analytics', icon: '📊', color: '#3B82F6', page: 'analytics' },
    { href: '/parts', label: 'Parts', icon: '📦', color: '#22C55E', page: 'parts' },
    { href: '/customers', label: 'Customers', icon: '👥', color: '#10B981', page: 'customers' },
]

export default function Navbar() {
    const pathname = usePathname()
    const { user, isAdmin, logout, canAccessPage } = useAuth()
    const [menuOpen, setMenuOpen] = useState(false)
    const [accountMenuOpen, setAccountMenuOpen] = useState(false)
    const accountMenuRef = useRef<HTMLDivElement | null>(null)
    const portalHomeUrl = getHubUrl()

    useEffect(() => {
        setMenuOpen(false)
        setAccountMenuOpen(false)
    }, [pathname])

    useEffect(() => {
        if (!accountMenuOpen) return

        const handlePointerDown = (event: MouseEvent) => {
            if (!accountMenuRef.current?.contains(event.target as Node)) {
                setAccountMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', handlePointerDown)
        return () => document.removeEventListener('mousedown', handlePointerDown)
    }, [accountMenuOpen])

    const handleLogout = async () => {
        setAccountMenuOpen(false)
        setMenuOpen(false)
        await logout()
        window.location.href = '/login'
    }

    const visibleItems = NAV_ITEMS.filter(item => canAccessPage(item.page))

    const userDepartmentLabel = user?.role === 'admin'
        ? '👑 Admin'
        : user?.department === 'production'
            ? '🏭 Prod'
            : user?.department === 'finishing'
                ? '🔧 Fin'
                : '🌐 All'

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
                        {visibleItems.map(item => {
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
                            <div className="desktop-nav" ref={accountMenuRef} style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setAccountMenuOpen(current => !current)}
                                    className="cartoon-btn"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '8px 14px',
                                        background: 'var(--color-bg-input)',
                                        color: 'var(--color-text-primary)',
                                        minHeight: '44px',
                                    }}
                                    title="Account actions"
                                >
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-text-primary)' }}>{user.fullName}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                                            {userDepartmentLabel}
                                            {' · '}{user.employeeId}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{accountMenuOpen ? '▲' : '▼'}</span>
                                </button>
                                {accountMenuOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: 'calc(100% + 8px)',
                                        minWidth: '210px',
                                        background: 'var(--color-bg-primary)',
                                        border: '2px solid var(--color-border)',
                                        borderRadius: '18px',
                                        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.16)',
                                        padding: '8px',
                                        zIndex: 1200,
                                    }}>
                                        {isAdmin && (
                                            <Link
                                                href="/admin"
                                                onClick={() => setAccountMenuOpen(false)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    padding: '10px 12px',
                                                    borderRadius: '12px',
                                                    textDecoration: 'none',
                                                    color: 'var(--color-text-primary)',
                                                    fontSize: '13px',
                                                    fontWeight: 700,
                                                }}
                                            >
                                                ⚙️ Admin
                                            </Link>
                                        )}
                                        <Link
                                            href="/change-password"
                                            onClick={() => setAccountMenuOpen(false)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                textDecoration: 'none',
                                                color: 'var(--color-text-primary)',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                            }}
                                        >
                                            🔑 เปลี่ยนรหัสผ่าน
                                        </Link>
                                        <a
                                            href={portalHomeUrl}
                                            onClick={() => setAccountMenuOpen(false)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                textDecoration: 'none',
                                                color: 'var(--color-text-primary)',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                            }}
                                        >
                                            🏠 กลับ Portal
                                        </a>
                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '10px 12px',
                                                borderRadius: '12px',
                                                border: 'none',
                                                background: 'transparent',
                                                color: '#EF4444',
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            🚪 ออกจากระบบ
                                        </button>
                                    </div>
                                )}
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
                        {visibleItems.map(item => {
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
                                        {userDepartmentLabel}
                                        {' · '}{user.employeeId}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    {isAdmin && (
                                        <Link href="/admin" onClick={() => setMenuOpen(false)} className="cartoon-btn" style={{
                                            padding: '8px 14px', background: '#FEE2E2', color: '#EF4444', fontSize: '13px'
                                        }}>
                                            ⚙️ Admin
                                        </Link>
                                    )}
                                    <Link href="/change-password" onClick={() => setMenuOpen(false)} className="cartoon-btn" style={{
                                        padding: '8px 14px', background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)', fontSize: '13px'
                                    }}>
                                        🔑 รหัสผ่าน
                                    </Link>
                                    <a
                                        href={portalHomeUrl}
                                        onClick={() => setMenuOpen(false)}
                                        className="cartoon-btn"
                                        style={{
                                            padding: '8px 14px',
                                            background: '#EEF2FF',
                                            color: '#6366F1',
                                            fontSize: '13px',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        🏠 Portal
                                    </a>
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
