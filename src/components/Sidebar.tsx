'use client';

import React from 'react';
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
  const { user, changeRole } = useAuth();

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard size={18} />,
      allowedRoles: ['Administrador', 'Comercial', 'Produção', 'Financeiro']
    },
    {
      label: 'Pedidos',
      path: '/pedidos',
      icon: <ShoppingBag size={18} />,
      allowedRoles: ['Administrador', 'Comercial', 'Produção', 'Financeiro']
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
      allowedRoles: ['Administrador', 'Comercial', 'Produção']
    },
    {
      label: 'Financeiro',
      path: '/financeiro',
      icon: <DollarSign size={18} />,
      allowedRoles: ['Administrador', 'Financeiro']
    },
    {
      label: 'Configurações / API',
      path: '/configuracoes',
      icon: <Settings size={18} />,
      allowedRoles: ['Administrador']
    }
  ];

  if (!user) return null;

  // Filter navigation links based on user role
  const visibleNavItems = navItems.filter(item => item.allowedRoles.includes(user.role));

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changeRole(e.target.value as UserRole);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        {/* Usando a imagem de logo da empresa solicitada */}
        <img 
          src="/logo.png" 
          alt="Samppel Embalagens Logo" 
          style={{ width: '100%', maxWidth: '200px', objectFit: 'contain' }}
        />
      </div>

      <nav className={styles.navSection}>
        {visibleNavItems.map((item) => {
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
        </div>
        
        {/* Role Simulator Selector - Highly useful for testing MVP */}
        <div style={{ marginTop: '4px' }}>
          <label style={{ fontSize: '10px', color: 'var(--sidebar-text-muted)', display: 'block', marginBottom: '4px' }}>
            Simular Acesso:
          </label>
          <select 
            className={styles.roleSelector}
            value={user.role}
            onChange={handleRoleChange}
          >
            <option value="Administrador">Administrador</option>
            <option value="Comercial">Comercial</option>
            <option value="Produção">Produção (Fábrica)</option>
            <option value="Financeiro">Financeiro</option>
          </select>
        </div>
      </div>
    </aside>
  );
}
