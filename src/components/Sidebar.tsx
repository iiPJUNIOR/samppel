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
  DollarSign,
  Settings,
  Boxes,
  ChevronDown,
  LogOut,
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

  useEffect(() => {
    if (pathname && pathname.startsWith('/pedidos')) {
      setIsPedidosOpen(true);
    }
  }, [pathname]);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard size={17} />,
      allowedRoles: ['Administrador', 'Comercial', 'Produção', 'Financeiro', 'Estoque', 'Expedição']
    },
    {
      label: 'Pedidos',
      path: '/pedidos',
      icon: <ShoppingBag size={17} />,
      allowedRoles: ['Administrador', 'Comercial', 'Produção', 'Financeiro', 'Estoque', 'Expedição']
    },
    {
      label: 'Clientes',
      path: '/clientes',
      icon: <Users size={17} />,
      allowedRoles: ['Administrador', 'Comercial', 'Financeiro']
    },
    {
      label: 'Produtos / Estoque',
      path: '/produtos',
      icon: <Package size={17} />,
      allowedRoles: ['Administrador', 'Comercial', 'Produção', 'Estoque']
    },
    {
      label: 'Financeiro',
      path: '/financeiro',
      icon: <DollarSign size={17} />,
      allowedRoles: ['Administrador', 'Financeiro']
    },
    {
      label: 'Relatórios',
      path: '/relatorios',
      icon: <Boxes size={17} />,
      allowedRoles: ['Administrador', 'Comercial', 'Produção']
    },
    {
      label: 'Configurações',
      path: '/configuracoes',
      icon: <Settings size={17} />,
      allowedRoles: ['Administrador']
    }
  ];

  if (!user) return null;

  const visibleNavItems = navItems.filter(item => item.allowedRoles.includes(user.role));

  // Generate initials from full name
  const initials = user.full_name
    ? user.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? '?';

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className={styles.sidebar}>
      {/* ── Brand ────────────────────────────────── */}
      <div className={styles.brand}>
        <Image
          src="/logo.png"
          alt="Samppel Embalagens"
          width={160}
          height={52}
          style={{ objectFit: 'contain', objectPosition: 'left' }}
          priority
        />
      </div>

      {/* ── Navigation ───────────────────────────── */}
      <nav className={styles.navSection}>
        {visibleNavItems.map((item) => {
          if (item.path === '/pedidos') {
            const isActive = pathname === '/pedidos' || pathname?.startsWith('/pedidos/');
            const showConfig = user.role === 'Administrador';
            const isSupervisor = user?.role === 'Comercial' && (user.email?.includes('supervisor') || user.full_name?.includes('Super'));
            const showSaldos = user?.role === 'Administrador' || isSupervisor;

            return (
              <div key={item.path} className={styles.submenuContainer}>
                <button
                  onClick={() => setIsPedidosOpen(!isPedidosOpen)}
                  className={`${styles.navLink} ${styles.submenuTrigger} ${isActive ? styles.active : ''}`}
                >
                  <div className={styles.navLinkContent}>
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`${styles.chevron} ${isPedidosOpen ? styles.chevronOpen : ''}`}
                  />
                </button>

                {isPedidosOpen && (
                  <div className={styles.submenu}>
                    <Link
                      href="/pedidos"
                      className={`${styles.submenuLink} ${pathname === '/pedidos' ? styles.submenuActive : ''}`}
                    >
                      Painel Kanban
                    </Link>
                    {showSaldos && (
                      <Link
                        href="/pedidos/saldos"
                        className={`${styles.submenuLink} ${pathname === '/pedidos/saldos' ? styles.submenuActive : ''}`}
                      >
                        Saldos e Créditos
                      </Link>
                    )}
                    {showConfig && (
                      <Link
                        href="/pedidos/configuracoes"
                        className={`${styles.submenuLink} ${pathname === '/pedidos/configuracoes' ? styles.submenuActive : ''}`}
                      >
                        Configurações
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          }

          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
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
          {/* Avatar with initials */}
          <div className={styles.avatar}>
            {initials}
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>{user.full_name}</span>
            <span className={styles.profileEmail}>{user.email}</span>
          </div>
        </div>

        {/* Role selector (admin only) or role badge */}
        {user.actual_role === 'Administrador' ? (
          <select
            value={user.role}
            onChange={(e) => changeActiveRole(e.target.value as UserRole)}
            className={styles.roleSelector}
          >
            <option value="Administrador">Administrador</option>
            <option value="Comercial">Comercial</option>
            <option value="Produção">Produção</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Estoque">Estoque</option>
            <option value="Expedição">Expedição</option>
          </select>
        ) : (
          <span className={styles.roleBadge}>{user.role}</span>
        )}

        {/* Logout */}
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <LogOut size={14} />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  );
}
