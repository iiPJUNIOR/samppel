'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

const SUPABASE_PROJECT_ID = 'cywbfcrtuawsgtbsjnnb';
const SUPABASE_DASHBOARD_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}`;
const HEALTH_CHECK_COOLDOWN_MS = 15 * 60 * 1000;

export default function DatabaseStatusBanner() {
  const [isDown, setIsDown] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastCheckedAtRef = useRef<number>(0);
  const isDownRef = useRef<boolean>(false);

  const checkStatus = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && !isDownRef.current && lastCheckedAtRef.current > 0 && now - lastCheckedAtRef.current < HEALTH_CHECK_COOLDOWN_MS) {
      return;
    }

    lastCheckedAtRef.current = now;
    setIsChecking(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (!res.ok || !data.healthy) {
        isDownRef.current = true;
        setIsDown(true);
        setErrorMessage(data.database?.error || 'Banco inacessível ou pausado no Supabase.');
      } else {
        isDownRef.current = false;
        setIsDown(false);
        setErrorMessage(null);
      }
    } catch (err: any) {
      isDownRef.current = true;
      setIsDown(true);
      setErrorMessage(err.message || 'Erro de conexão com o servidor da aplicação.');
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const startTimer = () => {
      if (!interval) {
        // Verificação periódica a cada 15 minutos apenas enquanto a aba estiver visível
        interval = setInterval(() => checkStatus(true), HEALTH_CHECK_COOLDOWN_MS);
      }
    };

    const stopTimer = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStatus(false);
        startTimer();
      } else {
        stopTimer();
      }
    };

    // Verificação inicial rápida
    checkStatus(true);
    startTimer();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkStatus]);

  if (!isDown) return null;

  return (
    <div style={{
      backgroundColor: '#7f1d1d',
      borderBottom: '2px solid #ef4444',
      color: '#ffffff',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      fontSize: '0.85rem',
      fontWeight: 500,
      zIndex: 99999,
      position: 'relative',
      boxShadow: '0 4px 12px rgba(0,0,0,0.25)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <AlertTriangle size={18} color="#fca5a5" style={{ flexShrink: 0 }} />
        <div style={{ lineHeight: 1.4 }}>
          <strong>Atenção:</strong> O banco de dados Supabase parece estar <strong>pausado ou inacessível</strong>.
          {errorMessage && (
            <span style={{ opacity: 0.85, marginLeft: '6px', fontSize: '0.8rem' }}>
              ({errorMessage})
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => checkStatus(true)}
          disabled={isChecking}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '6px',
            color: '#ffffff',
            padding: '5px 10px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: isChecking ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
          <span>{isChecking ? 'Verificando...' : 'Reverificar'}</span>
        </button>

        <a
          href={SUPABASE_DASHBOARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: '#2563eb',
            borderRadius: '6px',
            color: '#ffffff',
            padding: '5px 12px',
            fontSize: '0.8rem',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>Reativar no Supabase</span>
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}
