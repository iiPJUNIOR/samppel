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
