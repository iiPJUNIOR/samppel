import { Skeleton as HeroUISkeleton } from "@heroui/react";

export function Basic() {
  return (
    <div className="shadow-panel w-[250px] space-y-5 rounded-lg bg-transparent p-4">
      <HeroUISkeleton className="h-32 rounded-lg" />
      <div className="space-y-3">
        <HeroUISkeleton className="h-3 w-3/5 rounded-lg" />
        <HeroUISkeleton className="h-3 w-4/5 rounded-lg" />
        <HeroUISkeleton className="h-3 w-2/5 rounded-lg" />
      </div>
    </div>
  );
}

// Preserve existing helper interfaces to prevent page compile errors
export function Skeleton({ className = '', width, height, borderRadius, style }: any) {
  const customStyle = {
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    borderRadius: borderRadius || 'var(--radius-sm)',
    ...style
  };

  return (
    <HeroUISkeleton 
      className={className} 
      style={customStyle} 
    />
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <Skeleton height={20} width={i === 0 ? 40 : (i === 1 ? '70%' : '50%')} />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton() {
  return (
    <div className="card skeleton-container" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Skeleton height={24} width="40%" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Skeleton height={14} width="100%" />
        <Skeleton height={14} width="90%" />
        <Skeleton height={14} width="75%" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
        <Skeleton height={36} width={100} />
        <Skeleton height={20} width={60} />
      </div>
    </div>
  );
}

function ShimmerBlock({
  width = '100%',
  height = 12,
  pill = false,
  delayMs = 0,
  style
}: {
  width?: number | string;
  height?: number | string;
  pill?: boolean;
  delayMs?: number;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`samppel-skeleton-block${pill ? ' samppel-skeleton-pill' : ''}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        animationDelay: delayMs ? `${delayMs}ms` : undefined,
        flexShrink: 0,
        ...style
      }}
    />
  );
}

export function KanbanCardMiniSkeleton({
  accentColor = '#3b82f6',
  compact = false,
  delayMs = 0
}: {
  accentColor?: string;
  compact?: boolean;
  delayMs?: number;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        backgroundColor: 'var(--skeleton-card-bg, var(--surface))',
        borderTop: '1px solid var(--border)',
        borderRight: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 'var(--radius-sm)',
        padding: '0.5rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.38rem'
      }}
    >
      {/* Linha 1: PV + Status + OP */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <ShimmerBlock width={52} height={11} delayMs={delayMs} />
          <ShimmerBlock width={40} height={10} pill delayMs={delayMs + 40} />
        </div>
        <ShimmerBlock width={44} height={12} delayMs={delayMs + 80} />
      </div>

      {/* Linha 2: Nome da Arte + Cliente */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <ShimmerBlock width="76%" height={12} delayMs={delayMs + 60} />
        <ShimmerBlock width="52%" height={9} delayMs={delayMs + 100} />
      </div>

      {/* Linha 3: Data de Expedicao + DU/DC */}
      {!compact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.3rem', marginTop: '1px' }}>
          <ShimmerBlock width="62%" height={10} delayMs={delayMs + 120} />
          <div style={{ display: 'flex', gap: '3px' }}>
            <ShimmerBlock width={18} height={12} delayMs={delayMs + 140} />
            <ShimmerBlock width={18} height={12} delayMs={delayMs + 160} />
          </div>
        </div>
      )}

      {/* Linha 4: Tiragem e Embalagem */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '0.22rem 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <ShimmerBlock width="44%" height={10} delayMs={delayMs + 150} />
        <ShimmerBlock width="24%" height={10} delayMs={delayMs + 180} />
      </div>

      {/* Linha 5: Frete + Liberacao + Botao Mover */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <ShimmerBlock width={54} height={13} delayMs={delayMs + 190} />
          <ShimmerBlock width={34} height={13} pill delayMs={delayMs + 210} />
        </div>
        <ShimmerBlock width={50} height={18} delayMs={delayMs + 230} />
      </div>
    </div>
  );
}

const KANBAN_SKELETON_COLUMNS = [
  { id: 'sk-delayed', color: '#ef4444', titleWidth: 66, cards: 2, isDashed: true, showChips: false },
  { id: 'sk-pedidos', color: '#64748b', titleWidth: 58, cards: 4, isDashed: false, showChips: true },
  { id: 'sk-producao', color: '#3b82f6', titleWidth: 68, cards: 3, isDashed: false, showChips: false },
  { id: 'sk-estoque', color: '#10b981', titleWidth: 56, cards: 3, isDashed: false, showChips: false },
  { id: 'sk-manuseio', color: '#8b5cf6', titleWidth: 64, cards: 2, isDashed: false, showChips: false },
  { id: 'sk-expedicao', color: '#f59e0b', titleWidth: 70, cards: 3, isDashed: false, showChips: false },
  { id: 'sk-concluido', color: '#22c55e', titleWidth: 66, cards: 4, isDashed: false, showChips: false }
];

export function KanbanBoardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Carregando quadro de pedidos"
      className="kanban-board-scroll kanban-board-container"
      style={{
        display: 'flex',
        gap: '0.75rem',
        width: '100%',
        flex: '1 1 0',
        minHeight: '480px',
        alignItems: 'stretch',
        overflowX: 'auto',
        overflowY: 'hidden',
        paddingTop: '0.25rem',
        paddingBottom: '0.5rem',
        boxSizing: 'border-box'
      }}
    >
      {KANBAN_SKELETON_COLUMNS.map((col, colIdx) => (
        <div
          key={col.id}
          style={{
            flex: '1 1 280px',
            minWidth: '260px',
            maxWidth: '450px',
            alignSelf: 'stretch',
            backgroundColor: 'var(--skeleton-col-bg, var(--background))',
            border: col.isDashed ? '2px dashed rgba(239, 68, 68, 0.35)' : '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.4rem 0.4rem 0.2rem 0.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            height: '100%',
            maxHeight: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          {/* Cabecalho da coluna */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              borderBottom: `2px solid ${col.color}`,
              paddingBottom: '0.3rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: col.color,
                    opacity: 0.75,
                    flexShrink: 0
                  }}
                />
                <ShimmerBlock width={col.titleWidth} height={12} delayMs={colIdx * 55} />
              </div>
              <ShimmerBlock width={24} height={14} pill delayMs={colIdx * 55 + 40} />
            </div>

            {col.showChips && (
              <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.15rem' }}>
                <ShimmerBlock width={36} height={13} delayMs={80} />
                <ShimmerBlock width={52} height={13} delayMs={110} />
                <ShimmerBlock width={58} height={13} delayMs={140} />
              </div>
            )}
          </div>

          {/* Lista de cards simulados */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              paddingTop: '0.1rem'
            }}
          >
            {Array.from({ length: col.cards }).map((_, cardIdx) => (
              <KanbanCardMiniSkeleton
                key={`${col.id}-${cardIdx}`}
                accentColor={col.color}
                compact={cardIdx >= 2}
                delayMs={colIdx * 65 + cardIdx * 90}
              />
            ))}
          </div>

          {/* Rodape da coluna */}
          <div
            style={{
              borderTop: '1px solid var(--border)',
              padding: '0.35rem 0.35rem 0.2rem 0.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'auto'
            }}
          >
            <ShimmerBlock width={48} height={10} delayMs={colIdx * 55 + 120} />
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: col.color,
                opacity: 0.6
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function OrdersListInlineMoreSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={`inline-more-sk-${rowIdx}`} aria-hidden="true">
          <td>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <ShimmerBlock width={64} height={12} delayMs={rowIdx * 60} />
              <ShimmerBlock width={46} height={10} delayMs={rowIdx * 60 + 40} />
            </div>
          </td>
          <td>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <ShimmerBlock width={rowIdx % 2 === 0 ? '74%' : '62%'} height={12} delayMs={rowIdx * 60 + 50} />
              <ShimmerBlock width="48%" height={10} delayMs={rowIdx * 60 + 80} />
            </div>
          </td>
          <td><ShimmerBlock width="68%" height={12} delayMs={rowIdx * 60 + 90} /></td>
          <td><ShimmerBlock width={72} height={12} delayMs={rowIdx * 60 + 110} /></td>
          <td><ShimmerBlock width={58} height={12} delayMs={rowIdx * 60 + 120} /></td>
          <td><ShimmerBlock width={68} height={12} delayMs={rowIdx * 60 + 140} /></td>
          <td><ShimmerBlock width={66} height={18} pill delayMs={rowIdx * 60 + 150} /></td>
          <td><ShimmerBlock width={78} height={18} pill delayMs={rowIdx * 60 + 170} /></td>
          <td><ShimmerBlock width={76} height={12} delayMs={rowIdx * 60 + 185} /></td>
          <td>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <ShimmerBlock width={32} height={22} delayMs={rowIdx * 60 + 200} />
              <ShimmerBlock width={46} height={22} delayMs={rowIdx * 60 + 220} />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

export function OrdersTableSkeleton({ rows = 9 }: { rows?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Carregando lista de pedidos"
      className="card"
    >
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>PV / OP</th>
              <th>Produto/Serviço (Cliente)</th>
              <th>Produto / Medida</th>
              <th>Tiragem (Cortesia/Falta)</th>
              <th>Embalagem Final</th>
              <th>Setor / Local</th>
              <th>Liberação Fábrica</th>
              <th>Status</th>
              <th>Entrega / Lançamento</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <OrdersListInlineMoreSkeleton rows={rows} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
