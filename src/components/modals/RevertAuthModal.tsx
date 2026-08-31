// @ts-nocheck
import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle
} from 'lucide-react';
import Image from 'next/image';

export function RevertAuthModal(props: any) {
  const {
    Eye,
    EyeOff,
    Loader2,
    handleRevertAuthSubmit,
    pendingRevertItem,
    pendingRevertTargetStageId,
    revertAuthEmail,
    revertAuthError,
    revertAuthJustification,
    revertAuthLoading,
    revertAuthPassword,
    setIsRevertAuthModalOpen,
    setRevertAuthEmail,
    setRevertAuthJustification,
    setRevertAuthPassword,
    setShowRevertPassword,
    showRevertPassword,
    stages
  } = props;

        const item = pendingRevertItem;
        const order = item.order || {};
        const fromStage = stages.find(s => s.id === item.stage_id);
        const toStage = stages.find(s => s.id === pendingRevertTargetStageId);

        // Calcular tempo desde o último move
        let movedAgoText = '';
        try {
          const raw = localStorage.getItem(`samppel_mv_${item.id}`);
          if (raw) {
            const rec = JSON.parse(raw);
            const diffMin = Math.floor((Date.now() - rec.movedAt) / 60000);
            movedAgoText = diffMin < 60
              ? `${diffMin} minuto${diffMin !== 1 ? 's' : ''} atrás`
              : `${Math.floor(diffMin / 60)}h ${diffMin % 60}min atrás`;
          }
        } catch { }

        return (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) setIsRevertAuthModalOpen(false); }}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1200, padding: '1rem',
              backdropFilter: 'blur(6px)'
            }}
          >
            <div style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              borderTop: '3px solid hsl(38, 92.7%, 50.2%)',
              boxShadow: 'var(--shadow-premium)',
              width: '100%',
              maxWidth: '480px',
              animation: 'fadeIn 0.2s ease',
              overflow: 'hidden'
            }}>

              {/* Header */}
              <div style={{
                padding: '1.1rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                background: 'hsla(38, 92.7%, 50.2%, 0.06)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>
                      Autorização Necessária
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    A janela de 10 minutos para desfazer este move expirou
                  </span>
                </div>
                <button
                  onClick={() => setIsRevertAuthModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '-2px' }}
                >
                  &times;
                </button>
              </div>

              {/* Contexto do movimento */}
              <div style={{
                margin: '1.1rem 1.5rem 0',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Movimento solicitado
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text)' }}>
                    {item.friendly_id || '---'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text)' }}>
                    {item.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', flexWrap: 'wrap', marginTop: '2px' }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '99px', fontWeight: 700, fontSize: '0.72rem',
                    backgroundColor: (fromStage?.color || '#888') + '22',
                    color: fromStage?.color || 'var(--text)',
                    border: `1px solid ${(fromStage?.color || '#888')}55`
                  }}>
                    {fromStage?.name || 'Etapa atual'}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{
                    padding: '2px 8px', borderRadius: '99px', fontWeight: 700, fontSize: '0.72rem',
                    backgroundColor: (toStage?.color || '#888') + '22',
                    color: toStage?.color || 'var(--text)',
                    border: `1px solid ${(toStage?.color || '#888')}55`
                  }}>
                    {toStage?.name || 'Etapa destino'}
                  </span>
                  {movedAgoText && (
                    <span style={{ fontSize: '0.68rem', color: 'hsl(38, 92.7%, 45%)', fontWeight: 600 }}>
                      · Movido {movedAgoText}
                    </span>
                  )}
                </div>
              </div>

              {/* Formulário de autorização */}
              <form onSubmit={handleRevertAuthSubmit} style={{ padding: '1rem 1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  Para retroceder um card além da janela de 10 minutos, um <strong>Administrador</strong> precisa confirmar a ação com suas credenciais.
                </p>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>E-mail do Administrador</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="admin@empresa.com"
                    value={revertAuthEmail}
                    onChange={e => setRevertAuthEmail(e.target.value)}
                    required
                    autoComplete="off"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Senha do Administrador</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      className="form-input"
                      type={showRevertPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={revertAuthPassword}
                      onChange={e => setRevertAuthPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      style={{ fontSize: '0.85rem', paddingRight: '2.5rem', width: '100%' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRevertPassword(!showRevertPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--text-muted, #888)',
                        padding: '4px'
                      }}
                    >
                      {showRevertPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>
                    Justificativa <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'normal', marginLeft: '4px' }}>(Opcional)</span>
                  </label>
                  <textarea
                    className="form-textarea"
                    placeholder="Descreva o motivo do retrocesso manual..."
                    value={revertAuthJustification}
                    onChange={e => setRevertAuthJustification(e.target.value)}
                    rows={2}
                    style={{ fontSize: '0.82rem', resize: 'none' }}
                  />
                </div>

                {revertAuthError && (
                  <div style={{
                    padding: '0.6rem 0.85rem',
                    backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.08)',
                    border: '1px solid hsla(0, 84.2%, 60.2%, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'hsl(0, 84.2%, 50%)',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}>
                    {revertAuthError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsRevertAuthModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem' }}
                    disabled={revertAuthLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', minWidth: '130px', justifyContent: 'center' }}
                    disabled={revertAuthLoading}
                  >
                    {revertAuthLoading ? (
                      <><Loader2 size={13} className="spin" /> Verificando...</>
                    ) : (
                      <><CheckCircle2 size={13} /> Aprovar Retrocesso</>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        );
}
