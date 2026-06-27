'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import styles from './Sidebar.module.css';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Contact, 
  Package, 
  DollarSign, 
  Settings,
  Boxes
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
      icon: <LayoutDashboard size={18} />,
      allowedRoles: ['Administrador', 'Comercial', 'Produção', 'Financeiro', 'Estoque', 'Expedição']
    },
    {
      label: 'Pedidos',
      path: '/pedidos',
      icon: <ShoppingBag size={18} />,
      allowedRoles: ['Administrador', 'Comercial', 'Produção', 'Financeiro', 'Estoque', 'Expedição']
    },
    {
      label: 'Clientes',
      path: '/clientes',
      icon: <Users size={18} />,
      allowedRoles: ['Administrador', 'Comercial', 'Financeiro']
    },

    {
      label: 'Produtos / Estoque',
      path: '/produtos',
      icon: <Package size={18} />,
      allowedRoles: ['Administrador', 'Comercial', 'Produção', 'Estoque']
    },
    {
      label: 'Financeiro',
      path: '/financeiro',
      icon: <DollarSign size={18} />,
      allowedRoles: ['Administrador', 'Financeiro']
    },
    {
      label: 'Relatórios',
      path: '/relatorios',
      icon: <Boxes size={18} />,
      allowedRoles: ['Administrador', 'Comercial', 'Produção']
    },
    {
      label: 'Configurações / API',
      path: '/configuracoes',
      icon: <Settings size={18} />,
      allowedRoles: ['Administrador']
    }
  ];

  if (!user) return null;

  // Filtrar links com base no cargo do usuario
  const visibleNavItems = navItems.filter(item => item.allowedRoles.includes(user.role));

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <img 
          src="/logo.png" 
          alt="Samppel Embalagens Logo" 
          style={{ width: '100%', maxWidth: '200px', objectFit: 'contain' }}
        />
      </div>

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
                  <span className={`${styles.chevron} ${isPedidosOpen ? styles.chevronOpen : ''}`}>
                    ▼
                  </span>
                </button>
                
                {isPedidosOpen && (
                  <div className={styles.submenu}>
                    <Link 
                      href="/pedidos"
                      className={`${styles.submenuLink} ${pathname === '/pedidos' ? styles.submenuActive : ''}`}
                    >
                      <span>Painel Kanban</span>
                    </Link>
                    {showSaldos && (
                      <Link 
                        href="/pedidos/saldos"
                        className={`${styles.submenuLink} ${pathname === '/pedidos/saldos' ? styles.submenuActive : ''}`}
                      >
                        <span>Saldos e Créditos</span>
                      </Link>
                    )}
                    {showConfig && (
                      <Link 
                        href="/pedidos/configuracoes"
                        className={`${styles.submenuLink} ${pathname === '/pedidos/configuracoes' ? styles.submenuActive : ''}`}
                      >
                        <span>Configurações</span>
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

      <div className={styles.profileBox}>
        <div className={styles.profileInfo}>
          <span className={styles.profileName}>{user.full_name}</span>
          <span className={styles.profileEmail}>{user.email}</span>
          {user.actual_role === 'Administrador' ? (
            <select
              value={user.role}
              onChange={(e) => changeActiveRole(e.target.value as UserRole)}
              className={styles.roleSelector}
              style={{ marginTop: '6px' }}
            >
              <option value="Administrador">Administrador</option>
              <option value="Comercial">Comercial</option>
              <option value="Produção">Produção</option>
              <option value="Financeiro">Financeiro</option>
              <option value="Estoque">Estoque</option>
              <option value="Expedição">Expedição</option>
            </select>
          ) : (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginTop: '2px', display: 'block' }}>
              {user.role}
            </span>
          )}
        </div>
        
        <button 
          onClick={handleLogout}
          className="btn btn-secondary" 
          style={{ width: '100%', marginTop: '10px', padding: '0.4rem', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', gap: '0.25rem', alignItems: 'center' }}
        >
          <span>Sair da Conta</span>
        </button>
      </div>
    </aside>
  );
}
