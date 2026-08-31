'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import styles from './Sidebar.module.css';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  Settings,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Coins,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, changeActiveRole } = useAuth();
  const [isPedidosOpen, setIsPedidosOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pedidosViewMode, setPedidosViewMode] = useState('kanban');

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }

    const savedMode = localStorage.getItem('pedidos_view_mode') || 'kanban';
    setPedidosViewMode(savedMode);

    const handleModeChange = () => {
      const currentMode = localStorage.getItem('pedidos_view_mode') || 'kanban';
      setPedidosViewMode(currentMode);
    };

    window.addEventListener('pedidos_view_mode_changed', handleModeChange);
    return () => window.removeEventListener('pedidos_view_mode_changed', handleModeChange);
  }, []);

  useEffect(() => {
    if (user?.is_factory_account) {
      setIsCollapsed(true);
    }
  }, [user]);

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const nextVal = !prev;
      localStorage.setItem('sidebar_collapsed', String(nextVal));
      return nextVal;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showVisualToggle = pathname === '/pedidos' && pedidosViewMode === 'kanban';

  useEffect(() => {
    if (pathname && pathname.startsWith('/pedidos')) {
      setIsPedidosOpen(true);
    }
  }, [pathname]);

  // Fechar o menu mobile ao navegar
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard size={17} />,
      allowedRoles: ['Administrador']
    },
    {
      label: 'Pedidos',
      path: '/pedidos',
      icon: <ShoppingBag size={17} />,
      allowedRoles: ['Administrador', 'Fábrica', 'Vendedor']
    },
    {
      label: 'Saldos e Créditos',
      path: '/pedidos/saldos',
      icon: <Coins size={17} />,
      allowedRoles: ['Administrador', 'Vendedor', 'Comercial']
    },
    {
      label: 'Clientes',
      path: '/clientes',
      icon: <Users size={17} />,
      allowedRoles: ['Administrador', 'Vendedor']
    },
    {
      label: 'Produtos / Estoque',
      path: '/produtos',
      icon: <Package size={17} />,
      allowedRoles: ['Administrador']
    },

    {
      label: 'Relatórios',
      path: '/relatorios',
      icon: <Boxes size={17} />,
      allowedRoles: ['Administrador']
    },
    {
      label: 'Dados do Operador',
      path: '/operador-perfil',
      icon: <Users size={17} />,
      allowedRoles: ['Administrador', 'Produção', 'Fábrica', 'Vendedor', 'Comercial', 'Financeiro', 'Expedição', 'Estoque']
    },
    {
      label: 'Configurações',
      path: '/configuracoes',
      icon: <Settings size={17} />,
      allowedRoles: ['Administrador']
    }
  ];

  if (!user) return null;

  const visibleNavItems = navItems.filter(item => {
    if (user.is_factory_account) {
      return item.path === '/pedidos';
    }
    return item.allowedRoles.includes(user.role);
  });

  const initials = user.full_name
    ? user.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? '?';

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {isCollapsed && showVisualToggle && (
        <button
          type="button"
          onClick={toggleCollapse}
          className={styles.expandBtn}
          title="Expandir Menu"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* ── Mobile Header ─────────────────────────── */}
      <header className={styles.mobileHeader}>
        <Image
          src="/logo.png"
          alt="Samppel Embalagens"
          width={130}
          height={38}
          style={{ width: 'auto', height: 'auto', objectFit: 'contain' }}
          priority
        />
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className={styles.hamburgerBtn}
          aria-label={isMobileOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Backdrop (escurecimento e desfoque ao fundo) */}
      {isMobileOpen && (
        <div className={styles.backdrop} onClick={() => setIsMobileOpen(false)} />
      )}

      {/* ── Sidebar Container (Drawer no Mobile) ──── */}
      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.sidebarMobileOpen : ''} ${isCollapsed ? styles.collapsedSidebar : ''}`}>
        {/* Header interno do menu no mobile (com botão de fechar) */}
        <div className={styles.mobileSidebarHeader}>
          <span className={styles.mobileSidebarTitle}>Navegação</span>
          <button
            onClick={() => setIsMobileOpen(false)}
            className={styles.closeBtn}
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Brand/Logo (oculto no mobile porque já tem o mobileHeader) */}
        <div className={styles.brand}>
          <Image
            src="/logo.png"
            alt="Samppel Embalagens"
            width={160}
            height={52}
            style={{ width: 'auto', height: 'auto', objectFit: 'contain', objectPosition: 'left' }}
            priority
          />

          {showVisualToggle && (
            <button
              type="button"
              onClick={toggleCollapse}
              className={styles.collapseBtn}
              title="Recolher Menu"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* ── Navigation ───────────────────────────── */}
        <nav className={styles.navSection}>
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path + '/'));
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ── User Profile Box ─────────────────────── */}
        <div className={styles.profileBox}>
          <div className={styles.profileRow}>
            <div className={styles.avatar}>
              {initials}
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{user.full_name}</span>
              <span className={styles.profileEmail}>{user.email}</span>
            </div>
          </div>

          {user.is_factory_account ? (
            <span className={styles.roleBadge} style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'var(--warning)' }}>
              Terminal Fábrica
            </span>
          ) : (
            <span className={styles.roleBadge}>{user.role}</span>
          )}

          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={14} />
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>
    </>
  );
}
