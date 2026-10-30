'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Code2,
  Sliders,
  X,
} from 'lucide-react';
import styles from './monitoring.module.css';
import { METRIC_GUIDES, MetricGuide, MetricGuideKey, PolarityType } from './metricGuides';

interface InfoHintProps {
  guideKey?: MetricGuideKey;
  guide?: MetricGuide;
  ariaLabel?: string;
}

interface PopoverCoords {
  top?: number;
  bottom?: number;
  left: number;
  maxWidth: number;
}

function getPolarityBadgeClass(polarity: PolarityType): string {
  switch (polarity) {
    case 'HIGH_IS_GOOD':
      return styles.badgeSuccess;
    case 'LOW_IS_GOOD':
      return styles.badgeInfo;
    case 'ZERO_IS_BEST':
      return styles.badgeSuccess;
    case 'DUAL':
      return styles.badgeWarning;
    default:
      return styles.badgeNeutral;
  }
}

function PolarityIcon({ polarity }: { polarity: PolarityType }) {
  switch (polarity) {
    case 'HIGH_IS_GOOD':
      return <ArrowUpRight size={13} aria-hidden="true" />;
    case 'LOW_IS_GOOD':
      return <ArrowDownRight size={13} aria-hidden="true" />;
    case 'ZERO_IS_BEST':
      return <CheckCircle2 size={13} aria-hidden="true" />;
    default:
      return <Sliders size={13} aria-hidden="true" />;
  }
}

export function InfoHint({ guideKey, guide, ariaLabel }: InfoHintProps) {
  const resolved: MetricGuide | undefined = guide ?? (guideKey ? METRIC_GUIDES[guideKey] : undefined);
  const tooltipId = useId();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [coords, setCoords] = useState<PopoverCoords>({ left: 16, top: 64, maxWidth: 370 });

  const isOpen = hovered || pinned;

  useEffect(() => {
    setMounted(true);
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const updatePosition = useCallback(() => {
    const el = btnRef.current;
    if (!el || typeof window === 'undefined') return;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;
    const desiredWidth = Math.min(380, vw - margin * 2);

    let left = rect.left + rect.width / 2 - desiredWidth / 2;
    if (left < margin) left = margin;
    if (left + desiredWidth > vw - margin) {
      left = Math.max(margin, vw - desiredWidth - margin);
    }

    const estimatedHeight = 310;
    const spaceBelow = vh - rect.bottom;
    const openAbove = spaceBelow < estimatedHeight && rect.top > spaceBelow;

    if (openAbove) {
      setCoords({
        bottom: Math.max(margin, vh - rect.top + 8),
        left,
        maxWidth: desiredWidth,
      });
    } else {
      setCoords({
        top: Math.min(vh - 80, rect.bottom + 8),
        left,
        maxWidth: desiredWidth,
      });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScrollOrResize = () => updatePosition();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinned(false);
        setHovered(false);
      }
    };
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        target &&
        !btnRef.current?.contains(target) &&
        !popRef.current?.contains(target)
      ) {
        setPinned(false);
        setHovered(false);
      }
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen, updatePosition]);

  if (!resolved) return null;

  const cancelScheduledClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelScheduledClose();
    closeTimerRef.current = setTimeout(() => {
      setHovered(false);
    }, 150);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`${styles.infoCircleBtn} ${isOpen ? styles.infoCircleBtnActive : ''}`}
        aria-label={ariaLabel || `Entender indicador: ${resolved.title}`}
        aria-expanded={isOpen}
        aria-controls={isOpen ? tooltipId : undefined}
        onMouseEnter={() => {
          cancelScheduledClose();
          updatePosition();
          setHovered(true);
        }}
        onMouseLeave={scheduleClose}
        onFocus={() => {
          cancelScheduledClose();
          updatePosition();
          setHovered(true);
        }}
        onBlur={() => {
          if (!pinned) scheduleClose();
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          updatePosition();
          setPinned((prev) => !prev);
        }}
      >
        <span aria-hidden="true" className={styles.infoCircleGlyph}>
          i
        </span>
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={popRef}
            id={tooltipId}
            role="dialog"
            aria-label={resolved.title}
            className={styles.infoPopoverCard}
            style={{
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: `${coords.left}px`,
              width: `${coords.maxWidth}px`,
            }}
            onMouseEnter={cancelScheduledClose}
            onMouseLeave={scheduleClose}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.infoPopoverHeader}>
              <strong className={styles.infoPopoverTitle}>{resolved.title}</strong>
              <button
                type="button"
                className={styles.infoPopoverCloseBtn}
                aria-label="Fechar explicacao"
                onClick={() => {
                  setPinned(false);
                  setHovered(false);
                }}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>

            <div>
              <span
                className={`${styles.badge} ${getPolarityBadgeClass(resolved.polarity)}`}
              >
                <PolarityIcon polarity={resolved.polarity} />
                <span>{resolved.polarityLabel}</span>
              </span>
            </div>

            <div className={styles.infoPopoverBlock}>
              <span className={styles.infoPopoverSectionLabel}>O que e na pratica:</span>
              <p className={styles.infoPopoverText}>{resolved.whatIsIt}</p>
            </div>

            <div className={styles.infoPopoverBlock}>
              <span className={styles.infoPopoverSectionLabel}>
                Quando agir antes de estourar:
              </span>
              <p className={styles.infoPopoverText}>{resolved.whenToAct}</p>
            </div>

            <div className={styles.infoPopoverCodeBox}>
              <span className={styles.infoPopoverCodeTitle}>
                <Code2 size={13} aria-hidden="true" />
                <span>Como resolver no codigo / banco (Sem pagar o Pro):</span>
              </span>
              <p className={styles.infoPopoverText}>{resolved.codeFixToAvoidPro}</p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

