'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check, ChevronDown, User, Building2 } from 'lucide-react';

export interface CustomerOption {
  id: string;
  name: string;
  document?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface SearchableCustomerSelectProps {
  customers: CustomerOption[];
  value: string;
  onChange: (customerId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function SearchableCustomerSelect({
  customers = [],
  value,
  onChange,
  placeholder = 'Buscar cliente por nome ou CNPJ/CPF...',
  disabled = false,
  required = false
}: SearchableCustomerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === value) || null;
  }, [customers, value]);

  // Normalização de texto para busca insensível a acentos e pontuação
  const normalize = (str: string) => {
    return (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) {
      return customers;
    }
    const cleanSearch = normalize(searchTerm);
    return customers.filter(c => {
      const nameMatch = normalize(c.name).includes(cleanSearch);
      const docMatch = c.document && normalize(c.document).includes(cleanSearch);
      const emailMatch = c.email && normalize(c.email).includes(cleanSearch);
      return nameMatch || docMatch || emailMatch;
    });
  }, [customers, searchTerm]);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Foca no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setHighlightedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % (filteredCustomers.length + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + filteredCustomers.length + 1) % (filteredCustomers.length + 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex === 0) {
        // Opção "Nenhum"
        onChange('');
        setIsOpen(false);
      } else if (filteredCustomers[highlightedIndex - 1]) {
        onChange(filteredCustomers[highlightedIndex - 1].id);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      style={{ position: 'relative', width: '100%' }}
      onKeyDown={handleKeyDown}
    >
      {/* Botão Gatilho / Visualização do Selecionado */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.625rem 0.75rem',
          backgroundColor: 'var(--surface)',
          border: isOpen ? '1px solid var(--primary)' : '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          minHeight: '42px',
          boxShadow: isOpen ? '0 0 0 2px rgba(var(--primary-rgb, 59, 130, 246), 0.2)' : 'none',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, overflow: 'hidden' }}>
          {selectedCustomer ? (
            <>
              <Building2 size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedCustomer.name}
                </span>
                {selectedCustomer.document && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    CNPJ/CPF: {selectedCustomer.document}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {placeholder}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {selectedCustomer && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--text-muted)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Desvincular cliente"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </div>
      </div>

      {/* Dropdown com Campo de Busca */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 100,
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '320px',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Campo de Pesquisa em Tempo Real */}
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--background)' }}>
            <Search size={16} style={{ color: 'var(--text-muted)', marginLeft: '4px' }} />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Digite o nome ou CNPJ para filtrar..."
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '0.85rem',
                color: 'var(--text)'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Lista de Clientes */}
          <div 
            ref={listRef} 
            style={{ 
              overflowY: 'auto', 
              maxHeight: '260px',
              padding: '0.25rem' 
            }}
          >
            {/* Opção Desvincular / Nenhum */}
            <div
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                backgroundColor: highlightedIndex === 0 ? 'var(--background)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>— Nenhum (Desvincular Cliente) —</span>
              {!value && <Check size={14} style={{ color: 'var(--primary)' }} />}
            </div>

            {filteredCustomers.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Nenhum cliente encontrado para "{searchTerm}".
              </div>
            ) : (
              filteredCustomers.map((c, idx) => {
                const isSelected = c.id === value;
                const isHighlighted = highlightedIndex === idx + 1;

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onChange(c.id);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx + 1)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      backgroundColor: isHighlighted ? 'var(--background)' : (isSelected ? 'rgba(var(--primary-rgb, 59, 130, 246), 0.08)' : 'transparent'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      transition: 'background-color 0.1s ease'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--primary)' : 'var(--text)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {c.name}
                      </span>
                      {c.document && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          CNPJ/CPF: {c.document}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
