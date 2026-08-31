// @ts-nocheck

import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function ShippingCrudModal(props: any) {
  const {
    createShippingTypeConfig,
    deleteShippingTypeConfig,
    loading,
    newShippingTypeName,
    setIsShippingCrudModalOpen,
    setLoading,
    setNewShippingTypeName,
    setShippingTypes,
    shippingTypes,
    user
  } = props;

  return (
    <>
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 3100, padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
            padding: '1.5rem', maxWidth: '450px', width: '100%',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Cadastrar Tipos de Frete
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsShippingCrudModalOpen(false);
                  setNewShippingTypeName('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: '1' }}
              >
                &times;
              </button>
            </div>

            {/* Form de Adicionar Novo */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Lalamove, Motoboy..."
                value={newShippingTypeName}
                onChange={(e) => setNewShippingTypeName(e.target.value)}
                style={{ padding: '0.45rem 0.6rem', fontSize: '0.85rem', flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  if (!newShippingTypeName.trim()) return;
                  setLoading(true);
                  try {
                    const tenantId = user?.tenant_id || 'd3b07384-d113-4ec8-a5c6-e91bc4ff99e0';
                    const { data, error } = await createShippingTypeConfig({
                      tenant_id: tenantId,
                      name: newShippingTypeName.trim(),
                      status: 'ATIVO'
                    });

                    if (error) {
                      alert('Erro ao cadastrar tipo de frete: ' + error.message);
                    } else if (data) {
                      setShippingTypes(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
                      setNewShippingTypeName('');
                    }
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              >
                Adicionar
              </button>
            </div>

            {/* Listagem com Opção de Deletar */}
            <div style={{
              maxHeight: '220px',
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--background)'
            }}>
              {shippingTypes.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Nenhum tipo de frete cadastrado.
                </div>
              ) : (
                shippingTypes.map((type) => (
                  <div
                    key={type.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '0.82rem',
                      color: 'var(--text)'
                    }}
                  >
                    <span>{type.name}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Deseja realmente remover o tipo de frete "${type.name}"?`)) return;
                        setLoading(true);
                        try {
                          const { error } = await deleteShippingTypeConfig(type.id);
                          if (error) {
                            alert('Erro ao excluir tipo de frete: ' + error.message);
                          } else {
                            setShippingTypes(prev => prev.filter(t => t.id !== type.id));
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--danger)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsShippingCrudModalOpen(false);
                  setNewShippingTypeName('');
                }}
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
    </>
  );
}
