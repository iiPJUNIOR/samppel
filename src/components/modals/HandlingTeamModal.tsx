// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2, Factory,
  Clock, Printer, PenTool, TrendingUp, HelpCircle, History,
  ArrowRight, RotateCcw
} from 'lucide-react';
import Image from 'next/image';
import { 
  HANDLING_SERVICE_OPTIONS,
  saveHandlingDivergence,
  getHandlingDivergencesForItem,
  saveOrderItemShortage,
  type HandlingDivergenceRecord
} from '@/services/supabase_modules/orders';

export function HandlingTeamModal(props: any) {
  const {
    executeSaveHandlingTeam,
    handleSwitchHandlingModalItem,
    handlingTeamAllocations,
    handlingTeamModalItem,
    handlingTeamModalTargetStageId,
    handlingTeams,
    itemHandlingTeamsMap,
    orderItems,
    orders,
    resetAllBypasses,
    savingHandlingTeam,
    setHandlingTeamAllocations,
    setHandlingTeamModalItem,
    setHandlingTeamModalTargetStageId,
    setIsHandlingReworkModalOpen,
    setIsHandlingTeamModalOpen,
    setIsShortageModalOpen,
    setPendingHandlingPayload,
    setShortageItem,
    setShortageNotes,
    setShortageQty,
    setShortageReason,
    stages
  } = props;

  // Estados de Conciliação (Falta vs. Pendência)
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
  const [reconciliationData, setReconciliationData] = useState<{
    allocationIndex: number;
    allocation: any;
    withdrawnQty: number;
    returnedQty: number;
    pendingBalance: number;
    difference: number;
    returnDate: string;
  } | null>(null);
  const [reconciliationChoice, setReconciliationChoice] = useState<'PENDENCIA' | 'FALTA'>('PENDENCIA');
  const [reconciliationNotes, setReconciliationNotes] = useState('');
  const [savingReconciliation, setSavingReconciliation] = useState(false);

  // Estados de Histórico e Auditoria
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<HandlingDivergenceRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [divergencesCount, setDivergencesCount] = useState<number>(0);

  const parentOrder = orders.find(o => o.id === handlingTeamModalItem.order_id) || handlingTeamModalItem.order;
  const allSiblingItems = orderItems.filter(i => i.order_id === handlingTeamModalItem.order_id);
  const totalItemQty = Number(handlingTeamModalItem.print_run || handlingTeamModalItem.quantity || 0);
  const totalAllocated = handlingTeamAllocations.reduce((sum, a) => {
    if (a.status === 'PARCIALMENTE_CONCLUIDO') {
      return sum + (Number(a.return_quantity) || 0);
    }
    return sum + (Number(a.quantity) || 0);
  }, 0);
  const isTargetManuseio = handlingTeamModalTargetStageId && stages.find(s => s.id === handlingTeamModalTargetStageId)?.name === 'Manuseio';
  const isCurrentManuseio = stages.find(s => s.id === handlingTeamModalItem.stage_id)?.name === 'Manuseio';
  const showConferenceChecks = isCurrentManuseio || isTargetManuseio;

  // Formata data ISO para PT-BR (DD/MM/AAAA)
  const formatarDataPtBr = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    const clean = dateStr.slice(0, 10);
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Carrega contagem inicial de divergências para o item ativo
  useEffect(() => {
    if (handlingTeamModalItem?.id) {
      getHandlingDivergencesForItem(handlingTeamModalItem.id).then(res => {
        if (res?.data) {
          setDivergencesCount(res.data.length);
        }
      });
    }
  }, [handlingTeamModalItem?.id]);

  // Abre modal de histórico e carrega registros de auditoria
  const handleOpenHistoryModal = async () => {
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const res = await getHandlingDivergencesForItem(handlingTeamModalItem.id);
      if (res?.data) {
        setHistoryRecords(res.data);
        setDivergencesCount(res.data.length);
      }
    } catch (e) {
      console.warn('Erro ao carregar histórico de divergências:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Preenche a data de retorno com o dia atual do sistema
  const handleSetTodayReturnDate = (idx: number) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setHandlingTeamAllocations((prev: any[]) => prev.map((a, i) => {
      if (i !== idx) return a;
      return {
        ...a,
        return_date: todayStr,
        completed_at: todayStr
      };
    }));
  };

  // Aciona validação de conferência para a linha da equipe
  const handleConferirLinha = (idx: number) => {
    const alloc = handlingTeamAllocations[idx];
    if (!alloc.handling_team_id) {
      alert('Por favor, selecione a equipe antes de conferir.');
      return;
    }

    const withdrawnQty = Number(alloc.quantity) || 0;
    if (withdrawnQty <= 0) {
      alert('A quantidade de saída deve ser maior que zero.');
      return;
    }

    const returnDate = alloc.return_date || alloc.completed_at || new Date().toISOString().slice(0, 10);
    const returnedQty = Number(alloc.return_quantity);

    if (isNaN(returnedQty) || returnedQty === null || returnedQty === undefined) {
      alert('Por favor, informe a quantidade retornada.');
      return;
    }

    // Se já estava conferido, permite reabrir
    if (alloc.is_completed) {
      if (confirm('Esta remessa já foi conferida. Deseja reabrir para edição?')) {
        setHandlingTeamAllocations((prev: any[]) => prev.map((a, i) => i === idx ? {
          ...a,
          is_completed: false,
          status: 'PENDENTE'
        } : a));
      }
      return;
    }

    const pendingBalance = withdrawnQty;
    const difference = pendingBalance - returnedQty;

    // Cenário 1: Retorno Exato (diferença == 0)
    if (difference === 0) {
      setHandlingTeamAllocations((prev: any[]) => prev.map((a, i) => i === idx ? {
        ...a,
        return_quantity: returnedQty,
        return_date: returnDate,
        completed_at: returnDate,
        is_completed: true,
        status: 'CONCLUIDO'
      } : a));
      return;
    }

    // Cenário 2: Faltou Quantidade (diferença > 0) -> Abre Submodal de Conciliação
    if (difference > 0) {
      setReconciliationData({
        allocationIndex: idx,
        allocation: alloc,
        withdrawnQty,
        returnedQty,
        pendingBalance,
        difference,
        returnDate
      });
      setReconciliationChoice('PENDENCIA');
      setReconciliationNotes('');
      setIsReconciliationModalOpen(true);
      return;
    }

    // Cenário 3: Excesso (diferença < 0) -> Quantidade Retornada maior que o esperado
    if (difference < 0) {
      const excessQty = Math.abs(difference);
      const confirmExcess = confirm(
        `A quantidade retornada (${returnedQty.toLocaleString('pt-BR')} un) é maior que a quantidade retirada (${withdrawnQty.toLocaleString('pt-BR')} un).\n\nExcesso de +${excessQty.toLocaleString('pt-BR')} un.\n\nDeseja confirmar a conferência com registro de excesso no histórico?`
      );
      if (!confirmExcess) return;

      const formattedDate = formatarDataPtBr(returnDate);
      const formattedMsg = `Foi constatado o excesso de ${excessQty.toLocaleString('pt-BR')} na etapa de manuseio no dia ${formattedDate}.`;

      saveHandlingDivergence({
        order_item_id: handlingTeamModalItem.id,
        order_id: handlingTeamModalItem.order_id || null,
        handling_team_id: alloc.handling_team_id,
        handling_allocation_id: alloc.id || null,
        handling_code: alloc.handling_code,
        type: 'EXCESSO',
        divergence_quantity: excessQty,
        withdrawn_quantity: withdrawnQty,
        returned_quantity: returnedQty,
        event_date: returnDate,
        formatted_message: formattedMsg,
        reported_by_name: 'Operador',
        notes: `Excesso de ${excessQty.toLocaleString('pt-BR')} un registrado na conferência.`
      }).then(() => {
        setDivergencesCount(prev => prev + 1);
      });

      setHandlingTeamAllocations((prev: any[]) => prev.map((a, i) => i === idx ? {
        ...a,
        return_quantity: returnedQty,
        return_date: returnDate,
        completed_at: returnDate,
        is_completed: true,
        status: 'CONCLUIDO_COM_EXCESSO'
      } : a));
    }
  };

  // Confirma a resolução do Submodal de Conciliação
  const handleConfirmReconciliation = async () => {
    if (!reconciliationData) return;
    setSavingReconciliation(true);

    try {
      const { allocationIndex, allocation, withdrawnQty, returnedQty, difference, returnDate } = reconciliationData;
      const formattedDate = formatarDataPtBr(returnDate);

      if (reconciliationChoice === 'PENDENCIA') {
        // OPÇÃO A: Registrar como Pendência
        // 1. Marca a remessa atual como devolvida parcialmente
        const updatedAllocations = [...handlingTeamAllocations];
        updatedAllocations[allocationIndex] = {
          ...allocation,
          return_quantity: returnedQty,
          return_date: returnDate,
          completed_at: returnDate,
          is_completed: true,
          status: 'PARCIALMENTE_CONCLUIDO',
          notes: reconciliationNotes ? `Devolução parcial de ${returnedQty.toLocaleString('pt-BR')} un. ${reconciliationNotes}` : `Devolução parcial de ${returnedQty.toLocaleString('pt-BR')} un.`
        };

        // 2. Calcula próximo código de manuseio (ex: MS1798/1/2)
        const currentCode = allocation.handling_code || `MS${(handlingTeamModalItem?.friendly_id || '262/1').replace(/^PV-?/i, '')}/1`;
        const baseCodePrefix = currentCode.replace(/\/\d+$/, '');
        const nextIndex = updatedAllocations.length + 1;
        const nextCode = `${baseCodePrefix}/${nextIndex}`;

        // 3. Cria automaticamente uma nova linha de entrega com o saldo restante (a diferença)
        const newPendingRow: any = {
          id: `h-pend-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          parent_allocation_id: allocation.id || null,
          handling_team_id: allocation.handling_team_id,
          quantity: difference,
          departure_date: returnDate,
          return_quantity: difference,
          return_date: '',
          handling_code: nextCode,
          is_completed: false,
          completed_at: '',
          status: 'PENDENTE',
          services: Array.isArray(allocation.services) ? [...allocation.services] : [],
          notes: `Saldo pendente desdobrado da remessa ${allocation.handling_code || ''}.`
        };

        updatedAllocations.push(newPendingRow);
        setHandlingTeamAllocations(updatedAllocations);
        setIsReconciliationModalOpen(false);
        setReconciliationData(null);
      } else {
        // OPÇÃO B: Registrar como Falta
        // 1. Finaliza a entrega atual permanentemente com a quantidade devolvida
        const updatedAllocations = [...handlingTeamAllocations];
        updatedAllocations[allocationIndex] = {
          ...allocation,
          return_quantity: returnedQty,
          return_date: returnDate,
          completed_at: returnDate,
          is_completed: true,
          status: 'CONCLUIDO_COM_FALTA',
          notes: reconciliationNotes ? `Finalizado com falta de ${difference.toLocaleString('pt-BR')} un. ${reconciliationNotes}` : `Finalizado com falta de ${difference.toLocaleString('pt-BR')} un.`
        };
        setHandlingTeamAllocations(updatedAllocations);

        // 2. Grava registro definitivo na tabela de auditoria/divergências com a frase obrigatória
        const formattedMsg = `Foi constatada a falta de ${difference.toLocaleString('pt-BR')} na etapa de manuseio no dia ${formattedDate}.`;

        await saveHandlingDivergence({
          order_item_id: handlingTeamModalItem.id,
          order_id: handlingTeamModalItem.order_id || null,
          handling_team_id: allocation.handling_team_id,
          handling_allocation_id: allocation.id || null,
          handling_code: allocation.handling_code,
          type: 'FALTA',
          divergence_quantity: difference,
          withdrawn_quantity: withdrawnQty,
          returned_quantity: returnedQty,
          event_date: returnDate,
          formatted_message: formattedMsg,
          reported_by_name: 'Operador',
          notes: reconciliationNotes || 'Falta registrada na conferência de retorno de manuseio.'
        });

        setDivergencesCount(prev => prev + 1);

        // 3. Integração com o módulo de perdas/faltas para acerto na expedição
        try {
          await saveOrderItemShortage({
            order_id: handlingTeamModalItem.order_id,
            order_item_id: handlingTeamModalItem.id,
            customer_id: handlingTeamModalItem.order?.customer_id || '',
            shortage_quantity: difference,
            reason: 'MANUSEIO_AVARIA',
            notes: `${formattedMsg}${reconciliationNotes ? ' Obs: ' + reconciliationNotes : ''}`,
            reported_by_name: 'Operador de Manuseio',
            status: 'PENDENTE_EXPEDICAO'
          });
        } catch (shortageErr) {
          console.warn('Alerta ao registrar em order_item_shortages:', shortageErr);
        }

        setIsReconciliationModalOpen(false);
        setReconciliationData(null);
      }
    } catch (err: any) {
      console.error('Erro na conciliação:', err);
      alert('Erro ao processar conciliação: ' + (err.message || 'Falha ao salvar.'));
    } finally {
      setSavingReconciliation(false);
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 500000, padding: '1rem', backdropFilter: 'blur(4px)'
      }}>
        <div style={{
          backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)',
          padding: '1.5rem', maxWidth: '680px', width: '100%',
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)',
          animation: 'fadeIn 0.2s ease',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                backgroundColor: 'hsla(271, 91.2%, 65.1%, 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'hsl(271, 91.2%, 55%)'
              }}>
                <Users size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                  Vincular Equipe de Manuseio
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {parentOrder?.pv_number ? `Pedido / PV: ${parentOrder.pv_number}` : `Pedido #${parentOrder?.order_number || 'S/N'}`} · Cliente: <strong>{parentOrder?.customer?.name || handlingTeamModalItem.customer_name || 'Não informado'}</strong>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Botão de Histórico e Auditoria */}
              <button
                type="button"
                onClick={handleOpenHistoryModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm, 6px)',
                  backgroundColor: divergencesCount > 0 ? 'hsla(271, 91%, 65%, 0.12)' : 'var(--background)',
                  color: divergencesCount > 0 ? 'hsl(271, 91%, 45%)' : 'var(--text-muted)',
                  border: `1px solid ${divergencesCount > 0 ? 'hsla(271, 91%, 65%, 0.3)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Visualizar histórico e auditoria de faltas e excessos"
              >
                <History size={15} />
                <span>Histórico</span>
                {divergencesCount > 0 && (
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: '99px',
                    backgroundColor: 'hsl(271, 91%, 50%)',
                    color: '#fff',
                    fontSize: '0.66rem',
                    fontWeight: 800
                  }}>
                    {divergencesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsHandlingTeamModalOpen(false);
                  setHandlingTeamModalItem(null);
                  setHandlingTeamModalTargetStageId('');
                  resetAllBypasses();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title="Fechar modal"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Seletor de Itens Irmãos do Pedido (quando houver múltiplos) */}
            {allSiblingItems.length > 1 && (
              <div style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Itens deste Pedido ({allSiblingItems.length} itens no lote):
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Clique para alternar o item
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '2px' }}>
                  {allSiblingItems.map((itm) => {
                    const isSelected = itm.id === handlingTeamModalItem.id;
                    const itmAllocations = itemHandlingTeamsMap.get(itm.id) || [];
                    const isDone = itmAllocations.length > 0 && itmAllocations.every(a => a.is_completed);
                    const itmStage = stages.find(s => s.id === itm.stage_id);

                    return (
                      <button
                        key={itm.id}
                        type="button"
                        onClick={() => handleSwitchHandlingModalItem(itm)}
                        style={{
                          padding: '0.45rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.76rem',
                          fontWeight: isSelected ? 700 : 500,
                          backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface)',
                          color: isSelected ? '#ffffff' : 'var(--text)',
                          border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ opacity: isSelected ? 1 : 0.8 }}>{itm.friendly_id || `/${itm.item_index}`}</span>
                        <span>·</span>
                        <span>{itm.name?.slice(0, 16)}{itm.name?.length > 16 ? '...' : ''}</span>
                        <span style={{ opacity: 0.85 }}>({Number(itm.print_run || 0).toLocaleString('pt-BR')} un)</span>
                        {isDone && <Check size={12} style={{ color: isSelected ? '#fff' : 'var(--success)' }} />}
                        {itmStage && !isSelected && (
                          <span style={{ fontSize: '0.65rem', opacity: 0.7, padding: '1px 4px', borderRadius: '3px', backgroundColor: 'var(--background)' }}>
                            {itmStage.name}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Card com Detalhes Completos do Item Ativo */}
            <div style={{
              backgroundColor: 'hsla(var(--primary-rgb), 0.04)',
              border: '1px solid hsla(var(--primary-rgb), 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--primary)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.85rem'
                  }}>
                    {handlingTeamModalItem.friendly_id || `Item #${handlingTeamModalItem.item_index || 1}`}
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                    {handlingTeamModalItem.name}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <div style={{
                    padding: '3px 10px',
                    borderRadius: '99px',
                    backgroundColor: 'hsla(271, 91.2%, 65.1%, 0.15)',
                    color: 'hsl(271, 91.2%, 50%)',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    border: '1px solid hsla(271, 91.2%, 65.1%, 0.3)'
                  }}>
                    Tiragem: {totalItemQty.toLocaleString('pt-BR')} un
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Cód. Manuseio: <span style={{ color: 'var(--primary)', fontFamily: 'monospace', fontWeight: 700 }}>
                      {handlingTeamAllocations.map(a => (a.handling_code || '').replace(/^(MAN-?PV-?|MAN-?|MS-?)/gi, 'MS')).filter(Boolean).join(', ') || `MS${(handlingTeamModalItem.friendly_id || '262/1').replace(/^PV-?/i, '')}/1`}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                <span>Medida: <strong style={{ color: 'var(--text)' }}>{handlingTeamModalItem.measure || 'Padrão'}</strong></span>
                {handlingTeamModalItem.production_sector && (
                  <span>Setor Atual: <strong style={{ color: 'var(--text)' }}>{handlingTeamModalItem.production_sector}</strong></span>
                )}
                {handlingTeamModalItem.boxes_count && (
                  <span>Volumes: <strong style={{ color: 'var(--text)' }}>{handlingTeamModalItem.boxes_count} cx</strong></span>
                )}
              </div>
            </div>

            {/* BANNER DE ALERTA PARA QUANTIDADE NÃO ALOCADA / FALTA DE PRODUÇÃO */}
            {totalAllocated < totalItemQty && (
              <div style={{
                backgroundColor: 'hsla(45, 93%, 47%, 0.12)',
                border: '1.5px solid hsla(45, 93%, 47%, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem 0.9rem',
                color: 'hsl(45, 93%, 30%)',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.6rem',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={18} style={{ color: 'hsl(45, 93%, 40%)' }} />
                  <div>
                    <div>HÁ {(totalItemQty - totalAllocated).toLocaleString('pt-BR')} UN DA TIRAGEM NÃO ALOCADAS A NENHUMA EQUIPE</div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 500, opacity: 0.9 }}>
                      Se houver refugo, rasgo ou perda no manuseio/produção, registre a falta para acerto de crédito/débito na Expedição.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-warning"
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '0.35rem 0.75rem',
                    whiteSpace: 'nowrap',
                    backgroundColor: 'hsl(45, 93%, 42%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setShortageItem(handlingTeamModalItem);
                    setShortageQty(totalItemQty - totalAllocated);
                    setShortageReason('MANUSEIO_AVARIA');
                    setShortageNotes('');
                    setIsShortageModalOpen(true);
                  }}
                >
                  Registrar Falta / Avaria
                </button>
              </div>
            )}

            {/* ALERTA DE EXCESSO DE QUANTIDADE ALOCADA */}
            {totalAllocated > totalItemQty && (
              <div style={{
                backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.12)',
                border: '1.5px solid hsla(0, 84.2%, 60.2%, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem 0.9rem',
                color: 'hsl(0, 84.2%, 45%)',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <AlertTriangle size={20} style={{ minWidth: '20px', color: 'hsl(0, 84.2%, 50%)' }} />
                <div>
                  <div>ATENÇÃO: QUANTIDADE ALOCADA MAIOR QUE O PEDIDO</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 500, opacity: 0.95, marginTop: '2px' }}>
                    A quantidade total alocada (<strong>{totalAllocated.toLocaleString('pt-BR')} un</strong>) é maior do que o solicitado no pedido (<strong>{totalItemQty.toLocaleString('pt-BR')} un</strong>). Excesso de <strong>+{(totalAllocated - totalItemQty).toLocaleString('pt-BR')} un</strong>.
                  </div>
                </div>
              </div>
            )}

            {/* Distribuição de Equipes de Manuseio */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, margin: 0, fontSize: '0.85rem' }}>
                    Distribuição de Equipes de Manuseio *
                  </label>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '99px',
                    backgroundColor: totalAllocated === totalItemQty
                      ? 'hsla(142, 71%, 45%, 0.12)'
                      : totalAllocated < totalItemQty
                        ? 'hsla(45, 93%, 47%, 0.15)'
                        : 'hsla(0, 84%, 60%, 0.2)',
                    color: totalAllocated === totalItemQty
                      ? 'hsl(142, 71%, 35%)'
                      : totalAllocated < totalItemQty
                        ? 'hsl(45, 93%, 35%)'
                        : 'hsl(0, 84%, 40%)',
                    border: `1.5px solid ${totalAllocated === totalItemQty ? 'hsla(142, 71%, 45%, 0.3)' : totalAllocated < totalItemQty ? 'hsla(45, 93%, 47%, 0.3)' : 'hsla(0, 84%, 60%, 0.5)'}`
                  }}>
                    {totalAllocated === totalItemQty
                      ? `Total: ${totalAllocated.toLocaleString('pt-BR')} un (100% Distribuído)`
                      : totalAllocated < totalItemQty
                        ? `Alocado: ${totalAllocated.toLocaleString('pt-BR')} / ${totalItemQty.toLocaleString('pt-BR')} un (Faltam ${(totalItemQty - totalAllocated).toLocaleString('pt-BR')})`
                        : `Excesso: ${totalAllocated.toLocaleString('pt-BR')} / ${totalItemQty.toLocaleString('pt-BR')} un (+${(totalAllocated - totalItemQty).toLocaleString('pt-BR')} un a mais)`}
                  </span>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    gap: '0.4rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md, 6px)',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => {
                    const remaining = Math.max(0, totalItemQty - totalAllocated);
                    const itemPv = (handlingTeamModalItem?.friendly_id || handlingTeamModalItem?.order?.pv_number || '262/1').replace(/^PV-?/i, '');
                    setHandlingTeamAllocations(prev => [
                      ...prev,
                      {
                        id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                        handling_team_id: '',
                        quantity: remaining,
                        departure_date: new Date().toISOString().slice(0, 10),
                        return_quantity: remaining,
                        return_date: '',
                        handling_code: `MS${itemPv}/${prev.length + 1}`,
                        is_completed: false,
                        completed_at: '',
                        status: 'PENDENTE',
                        services: []
                      }
                    ]);
                  }}
                  title="Clique para adicionar uma nova equipe ou divisão de manuseio"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Adicionar Equipe de Manuseio</span>
                </button>
              </div>

              {/* Lista de Alocações */}
              {handlingTeamAllocations.map((alloc, idx) => {
                const isCompleted = alloc.is_completed || false;
                const status = alloc.status || (isCompleted ? 'CONCLUIDO' : 'PENDENTE');
                const allocQty = Number(alloc.quantity) || 0;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      backgroundColor: 'var(--background)',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${isCompleted ? 'hsla(142, 71%, 45%, 0.3)' : 'var(--border)'}`,
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    {/* Cabeçalho da Linha */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary)', margin: 0 }}>
                          Equipe {idx + 1} — Equipe de Manuseio <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginLeft: '0.2rem' }}>({(alloc.handling_code || `MS${(handlingTeamModalItem?.friendly_id || '262/1').replace(/^PV-?/i, '')}/${idx + 1}`).replace(/^(MAN-?PV-?|MAN-?|MS-?)/gi, 'MS')})</span> *
                        </label>

                        {/* Status Badge */}
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '1.5px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.02em',
                          backgroundColor: status === 'CONCLUIDO'
                            ? 'hsla(142, 71%, 45%, 0.12)'
                            : status === 'PARCIALMENTE_CONCLUIDO'
                              ? 'hsla(217, 91%, 60%, 0.12)'
                              : status === 'CONCLUIDO_COM_FALTA'
                                ? 'hsla(0, 84%, 60%, 0.12)'
                                : status === 'CONCLUIDO_COM_EXCESSO'
                                  ? 'hsla(271, 91%, 65%, 0.12)'
                                  : 'hsla(45, 93%, 47%, 0.15)',
                          color: status === 'CONCLUIDO'
                            ? 'hsl(142, 71%, 35%)'
                            : status === 'PARCIALMENTE_CONCLUIDO'
                              ? 'hsl(217, 91%, 45%)'
                              : status === 'CONCLUIDO_COM_FALTA'
                                ? 'hsl(0, 84%, 45%)'
                                : status === 'CONCLUIDO_COM_EXCESSO'
                                  ? 'hsl(271, 91%, 45%)'
                                  : 'hsl(45, 93%, 35%)',
                          border: `1px solid ${status === 'CONCLUIDO' ? 'hsla(142, 71%, 45%, 0.3)' : status === 'CONCLUIDO_COM_FALTA' ? 'hsla(0, 84%, 60%, 0.3)' : 'hsla(45, 93%, 47%, 0.3)'}`
                        }}>
                          {status === 'CONCLUIDO' && 'Conferido Integral'}
                          {status === 'PARCIALMENTE_CONCLUIDO' && 'Devolução Parcial'}
                          {status === 'CONCLUIDO_COM_FALTA' && 'Finalizado com Falta'}
                          {status === 'CONCLUIDO_COM_EXCESSO' && 'Finalizado com Excesso'}
                          {status === 'PENDENTE' && 'Pendente de Retorno'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (alloc.is_completed) {
                            if (!confirm('Esta equipe já foi conferida. Deseja realmente excluí-la?')) return;
                          }
                          setHandlingTeamAllocations(prev => prev.filter((_, i) => i !== idx));
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          padding: '4px',
                          marginLeft: '0.5rem'
                        }}
                        title="Excluir esta equipe vinculada"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Seleção da Equipe */}
                    <div>
                      <select
                        className="form-select"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.82rem', width: '100%' }}
                        value={alloc.handling_team_id}
                        disabled={isCompleted}
                        onChange={(e) => setHandlingTeamAllocations(prev => prev.map((a, i) => i === idx ? { ...a, handling_team_id: e.target.value } : a))}
                      >
                        <option value="">— Selecione a Equipe —</option>
                        {handlingTeams.filter(t => t.status === 'ATIVO').map((team) => (
                          <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* PAINEL DE SALDO DA REMESSA (EXIBIÇÃO CLARA DE SALDO) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.4rem',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.76rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Quantidade Retirada:</span>
                        <span style={{ fontWeight: 800, color: 'var(--text)' }}>
                          {allocQty.toLocaleString('pt-BR')} un
                        </span>
                      </div>

                      {status === 'PARCIALMENTE_CONCLUIDO' && (
                        <>
                          <div style={{ height: '14px', width: '1px', backgroundColor: 'var(--border)' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Devolvido:</span>
                            <span style={{ fontWeight: 800, color: 'hsl(142, 71%, 35%)' }}>
                              {(Number(alloc.return_quantity) || 0).toLocaleString('pt-BR')} un
                            </span>
                          </div>
                        </>
                      )}

                      <div style={{ height: '14px', width: '1px', backgroundColor: 'var(--border)' }} />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Saldo Atual:</span>
                        <span style={{
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: status === 'PARCIALMENTE_CONCLUIDO'
                            ? 'hsla(217, 91%, 60%, 0.12)'
                            : status === 'CONCLUIDO_COM_FALTA'
                              ? 'hsla(0, 84%, 60%, 0.12)'
                              : isCompleted 
                                ? 'hsla(142, 71%, 45%, 0.12)' 
                                : 'hsla(45, 93%, 47%, 0.15)',
                          color: status === 'PARCIALMENTE_CONCLUIDO'
                            ? 'hsl(217, 91%, 45%)'
                            : status === 'CONCLUIDO_COM_FALTA'
                              ? 'hsl(0, 84%, 45%)'
                              : isCompleted 
                                ? 'hsl(142, 71%, 35%)' 
                                : 'hsl(45, 93%, 35%)',
                          border: `1px solid ${
                            status === 'PARCIALMENTE_CONCLUIDO'
                              ? 'hsla(217, 91%, 60%, 0.25)'
                              : status === 'CONCLUIDO_COM_FALTA'
                                ? 'hsla(0, 84%, 60%, 0.25)'
                                : isCompleted 
                                  ? 'hsla(142, 71%, 45%, 0.25)' 
                                  : 'hsla(45, 93%, 47%, 0.3)'
                          }`
                        }}>
                          {status === 'PARCIALMENTE_CONCLUIDO' 
                            ? `0 un (${(allocQty - (Number(alloc.return_quantity) || 0)).toLocaleString('pt-BR')} un desdobradas)` 
                            : status === 'CONCLUIDO_COM_FALTA'
                              ? `0 un (Falta de ${(allocQty - (Number(alloc.return_quantity) || 0)).toLocaleString('pt-BR')} un)`
                              : isCompleted 
                                ? '0 un (Conferido Integral)' 
                                : `${allocQty.toLocaleString('pt-BR')} un (Pendente)`}
                        </span>
                      </div>
                    </div>
                    {alloc.notes && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '0.25rem' }}>
                        Nota: {alloc.notes}
                      </div>
                    )}

                    {/* GRID DE ENTRADA: DATA SAÍDA | QTD SAÍDA | DATA RETORNO + [HOJE] | QTD RETORNO | AÇÃO CONFERIDO */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.05fr 0.95fr 1.35fr 1fr 1fr',
                      gap: '0.5rem',
                      alignItems: 'flex-end',
                      backgroundColor: 'var(--surface)',
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border)'
                    }}>
                      {/* Data Saída */}
                      <div>
                        <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>
                          Data Saída
                        </label>
                        <input
                          type="date"
                          className="form-input"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78rem', marginTop: '2px' }}
                          value={alloc.departure_date || ''}
                          disabled={isCompleted}
                          onChange={(e) => setHandlingTeamAllocations(prev => prev.map((a, i) => i === idx ? { ...a, departure_date: e.target.value } : a))}
                        />
                      </div>

                      {/* Qtd Saída (un) */}
                      <div>
                        <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>
                          Qtd Saída (un)
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78rem', marginTop: '2px' }}
                          value={alloc.quantity || ''}
                          placeholder="Qtd."
                          disabled={isCompleted}
                          onChange={(e) => setHandlingTeamAllocations(prev => prev.map((a, i) => i === idx ? { ...a, quantity: Number(e.target.value) } : a))}
                        />
                      </div>

                      {/* Data Retorno + Botão [Hoje] */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                            Data Retorno
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSetTodayReturnDate(idx)}
                            style={{
                              padding: '1px 5px',
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              color: 'var(--primary)',
                              backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                              border: '1px solid rgba(var(--primary-rgb), 0.25)',
                              borderRadius: '3px',
                              cursor: 'pointer'
                            }}
                            title="Preencher com a data de hoje"
                          >
                            [Hoje]
                          </button>
                        </div>
                        <input
                          type="date"
                          className="form-input"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78rem', marginTop: '2px' }}
                          value={alloc.return_date || alloc.completed_at || ''}
                          onChange={(e) => setHandlingTeamAllocations(prev => prev.map((a, i) => i === idx ? {
                            ...a,
                            return_date: e.target.value,
                            completed_at: e.target.value
                          } : a))}
                        />
                      </div>

                      {/* Qtd Retorno (un) */}
                      <div>
                        <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block' }}>
                          Qtd Retorno (un)
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '0.3rem 0.4rem', fontSize: '0.78rem', marginTop: '2px' }}
                          value={alloc.return_quantity !== undefined && alloc.return_quantity !== null ? alloc.return_quantity : ''}
                          placeholder="Qtd."
                          onChange={(e) => setHandlingTeamAllocations(prev => prev.map((a, i) => i === idx ? { ...a, return_quantity: e.target.value === '' ? '' : Number(e.target.value) } : a))}
                        />
                      </div>

                      {/* Botão de Ação: Conferido */}
                      <div>
                        <label style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>
                          Conferência
                        </label>
                        <button
                          type="button"
                          onClick={() => handleConferirLinha(idx)}
                          style={{
                            width: '100%',
                            padding: '0.32rem 0.4rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            borderRadius: 'var(--radius-xs, 4px)',
                            border: isCompleted 
                              ? '1px solid hsl(142, 71%, 38%)' 
                              : '1px solid var(--primary)',
                            backgroundColor: isCompleted 
                              ? 'hsl(142, 71%, 40%)' 
                              : 'var(--primary)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            marginTop: '2px',
                            transition: 'all 0.15s ease',
                            boxShadow: isCompleted ? 'none' : '0 1px 4px rgba(37, 99, 235, 0.25)'
                          }}
                          title={isCompleted ? 'Remessa conferida. Clique para reabrir.' : 'Validar retorno da equipe'}
                        >
                          {isCompleted ? (
                            <>
                              <Check size={13} strokeWidth={2.5} />
                              <span>Conferido</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={13} strokeWidth={2.5} />
                              <span>Conferido</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* TIPOS DE SERVIÇO DE MANUSEIO (SIGLAS: CA, CC, DB, RBC, RF) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.4rem',
                      padding: '0.4rem 0.65rem',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                          Serviços:
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {HANDLING_SERVICE_OPTIONS.map((srv) => {
                          const currentServices = Array.isArray(alloc.services) ? alloc.services : [];
                          const isSelected = currentServices.includes(srv.key);
                          return (
                            <button
                              key={srv.key}
                              type="button"
                              onClick={() => {
                                setHandlingTeamAllocations((prev: any[]) => prev.map((a, i) => {
                                  if (i !== idx) return a;
                                  const sList = Array.isArray(a.services) ? a.services : [];
                                  const nextServices = isSelected
                                    ? sList.filter((s: string) => s !== srv.key)
                                    : [...sList, srv.key];
                                  return { ...a, services: nextServices };
                                }));
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: '2.5px 7px',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: isSelected ? 800 : 600,
                                cursor: 'pointer',
                                border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                backgroundColor: isSelected ? 'rgba(var(--primary-rgb), 0.12)' : 'var(--background)',
                                color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                                transition: 'all 0.15s ease'
                              }}
                              title={`${srv.label} (${srv.key})`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                style={{ cursor: 'pointer', width: '13px', height: '13px', pointerEvents: 'none', margin: 0 }}
                              />
                              <span>{srv.key}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rodapé e Ações */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setIsHandlingTeamModalOpen(false);
                setHandlingTeamModalItem(null);
                setHandlingTeamModalTargetStageId('');
                resetAllBypasses();
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={savingHandlingTeam}
              onClick={() => {
                const validAllocations = handlingTeamAllocations.filter(a => a.handling_team_id && a.quantity > 0);
                if (validAllocations.length === 0) {
                  alert('Por favor, selecione ao menos uma equipe de manuseio com quantidade maior que zero.');
                  return;
                }

                const hasIncompleteRow = handlingTeamAllocations.some(a => (a.quantity > 0 && !a.handling_team_id) || (a.handling_team_id && !a.quantity));
                if (hasIncompleteRow) {
                  alert('Existem equipes preenchidas incorretamente. Verifique se todas possuem equipe e quantidade.');
                  return;
                }

                const fullExistingList = itemHandlingTeamsMap.get(handlingTeamModalItem.id) || [];
                const editingIds = new Set(handlingTeamAllocations.map(a => a.id).filter(Boolean));
                const uneditedAllocations = fullExistingList.filter((a: any) => !editingIds.has(a.id));

                const mergedPayload = [
                  ...uneditedAllocations,
                  ...handlingTeamAllocations
                ];

                const teamCounts = new Map<string, number>();
                for (const alloc of mergedPayload) {
                  if (alloc.handling_team_id) {
                    teamCounts.set(alloc.handling_team_id, (teamCounts.get(alloc.handling_team_id) || 0) + 1);
                  }
                }
                const hasRework = Array.from(teamCounts.values()).some(count => count > 1);

                if (hasRework) {
                  setPendingHandlingPayload(mergedPayload);
                  setIsHandlingReworkModalOpen(true);
                  return;
                }

                executeSaveHandlingTeam(mergedPayload);
              }}
            >
              {savingHandlingTeam ? 'Gravando...' : (handlingTeamModalTargetStageId && handlingTeamModalTargetStageId !== handlingTeamModalItem.stage_id ? 'Salvar e Mover para Manuseio' : 'Salvar Distribuição')}
            </button>
          </div>
        </div>
      </div>

      {/* SUBMODAL DE CONCILIAÇÃO (FALTA VS. PENDÊNCIA) */}
      {isReconciliationModalOpen && reconciliationData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 510000, padding: '1rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg, 12px)',
            maxWidth: '520px',
            width: '100%',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Cabeçalho do Submodal */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'hsla(45, 93%, 47%, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(45, 93%, 35%)', fontWeight: 800 }}>
                <AlertCircle size={20} />
                <span>Conciliação de Retorno de Manuseio</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReconciliationModalOpen(false);
                  setReconciliationData(null);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Corpo do Submodal */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.84rem', color: 'var(--text)', lineHeight: 1.5 }}>
                A quantidade retornada (<strong>{reconciliationData.returnedQty.toLocaleString('pt-BR')} un</strong>) é menor do que a quantidade que a equipe retirou (<strong>{reconciliationData.withdrawnQty.toLocaleString('pt-BR')} un</strong>).
              </div>

              {/* Card de Resumo das Quantidades */}
              <div style={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm, 6px)',
                padding: '0.75rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1.2fr',
                gap: '0.5rem',
                fontSize: '0.76rem'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 600 }}>Qtd Retirada</span>
                  <strong style={{ color: 'var(--text)' }}>{reconciliationData.withdrawnQty.toLocaleString('pt-BR')} un</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 600 }}>Qtd Retornada</span>
                  <strong style={{ color: 'hsl(142, 71%, 35%)' }}>{reconciliationData.returnedQty.toLocaleString('pt-BR')} un</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.68rem', fontWeight: 600 }}>Diferença Restante</span>
                  <strong style={{ color: 'hsl(0, 84%, 45%)' }}>{reconciliationData.difference.toLocaleString('pt-BR')} un</strong>
                </div>
              </div>

              {/* Opções de Seleção */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>
                  Selecione como deseja tratar as {reconciliationData.difference.toLocaleString('pt-BR')} unidades restantes:
                </span>

                {/* OPÇÃO A: Registrar como Pendência */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${reconciliationChoice === 'PENDENCIA' ? 'var(--primary)' : 'var(--border)'}`,
                  backgroundColor: reconciliationChoice === 'PENDENCIA' ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}>
                  <input
                    type="radio"
                    name="reconciliation_type"
                    checked={reconciliationChoice === 'PENDENCIA'}
                    onChange={() => setReconciliationChoice('PENDENCIA')}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <div>
                    <strong style={{ fontSize: '0.84rem', color: 'var(--text)', display: 'block' }}>
                      Opção A: Registrar como Pendência (Manter com a Equipe)
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'block', marginTop: '2px' }}>
                      Mantém o fluxo ativo. Cria automaticamente uma nova linha de entrega vinculada à equipe contendo as {reconciliationData.difference.toLocaleString('pt-BR')} un restantes e deixando a data de retorno em branco, aguardando a próxima conferência.
                    </span>
                  </div>
                </label>

                {/* OPÇÃO B: Registrar como Falta */}
                <label style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${reconciliationChoice === 'FALTA' ? 'hsl(0, 84%, 60%)' : 'var(--border)'}`,
                  backgroundColor: reconciliationChoice === 'FALTA' ? 'hsla(0, 84%, 60%, 0.05)' : 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}>
                  <input
                    type="radio"
                    name="reconciliation_type"
                    checked={reconciliationChoice === 'FALTA'}
                    onChange={() => setReconciliationChoice('FALTA')}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                  <div>
                    <strong style={{ fontSize: '0.84rem', color: 'hsl(0, 84%, 45%)', display: 'block' }}>
                      Opção B: Registrar como Falta Definitiva
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, display: 'block', marginTop: '2px' }}>
                      Finaliza aquela entrega/lote permanentemente. A diferença de {reconciliationData.difference.toLocaleString('pt-BR')} un é convertida em um registro definitivo de perda/extravio no histórico e integrada para acerto na Expedição.
                    </span>
                  </div>
                </label>
              </div>

              {/* Campo Opcional de Observações */}
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Observações da Conciliação (Opcional):
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={reconciliationNotes}
                  onChange={(e) => setReconciliationNotes(e.target.value)}
                  placeholder="Ex: refugo no manuseio, rasgo de alça, lote retido para término amanhã..."
                  style={{ fontSize: '0.78rem', width: '100%', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Rodapé do Submodal */}
            <div style={{
              padding: '0.85rem 1.25rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.6rem',
              backgroundColor: 'var(--background)'
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={savingReconciliation}
                onClick={() => {
                  setIsReconciliationModalOpen(false);
                  setReconciliationData(null);
                }}
              >
                Voltar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={savingReconciliation}
                onClick={handleConfirmReconciliation}
                style={{
                  backgroundColor: reconciliationChoice === 'FALTA' ? 'hsl(0, 84%, 50%)' : 'var(--primary)',
                  borderColor: reconciliationChoice === 'FALTA' ? 'hsl(0, 84%, 45%)' : 'var(--primary)'
                }}
              >
                {savingReconciliation ? 'Processando...' : (reconciliationChoice === 'FALTA' ? 'Confirmar e Registrar Falta' : 'Confirmar e Gerar Pendência')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO E AUDITORIA */}
      {isHistoryModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 510000, padding: '1rem', backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: 'var(--surface)',
            borderRadius: 'var(--radius-lg, 12px)',
            maxWidth: '580px',
            width: '100%',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xl)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '85vh'
          }}>
            {/* Cabeçalho do Histórico */}
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'hsla(271, 91.2%, 65.1%, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'hsl(271, 91.2%, 45%)', fontWeight: 800 }}>
                <History size={20} />
                <div>
                  <div style={{ fontSize: '1rem' }}>Histórico de Auditoria do Manuseio</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Item: {handlingTeamModalItem.friendly_id || 'PV'} · Tiragem: {totalItemQty.toLocaleString('pt-BR')} un
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Lista de Registros */}
            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Carregando registros de auditoria...
                </div>
              ) : historyRecords.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '2.5rem 1rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  backgroundColor: 'var(--background)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border)'
                }}>
                  Nenhuma divergência de falta ou excesso registrada para este item até o momento.
                </div>
              ) : (
                historyRecords.map((rec) => {
                  const isFalta = rec.type === 'FALTA';
                  return (
                    <div
                      key={rec.id}
                      style={{
                        backgroundColor: 'var(--background)',
                        border: `1.5px solid ${isFalta ? 'hsla(0, 84%, 60%, 0.3)' : 'hsla(217, 91%, 60%, 0.3)'}`,
                        borderRadius: 'var(--radius-sm, 6px)',
                        padding: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: isFalta ? 'hsla(0, 84%, 60%, 0.12)' : 'hsla(217, 91%, 60%, 0.12)',
                          color: isFalta ? 'hsl(0, 84%, 45%)' : 'hsl(217, 91%, 45%)',
                          border: `1px solid ${isFalta ? 'hsla(0, 84%, 60%, 0.25)' : 'hsla(217, 91%, 60%, 0.25)'}`
                        }}>
                          {isFalta ? 'FALTA CONSTATADA' : 'EXCESSO CONSTATADO'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {formatarDataPtBr(rec.event_date)} · {rec.handling_code || ''}
                        </span>
                      </div>

                      {/* FRASE OBRIGATÓRIA DA REGRA DE NEGÓCIO */}
                      <div style={{
                        backgroundColor: 'var(--surface)',
                        borderLeft: `3px solid ${isFalta ? 'hsl(0, 84%, 50%)' : 'hsl(217, 91%, 50%)'}`,
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0 4px 4px 0',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: 'var(--text)'
                      }}>
                        {rec.formatted_message}
                      </div>

                      {/* Metadados Adicionais */}
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: 'var(--text-muted)', flexWrap: 'wrap', marginTop: '2px' }}>
                        <span>Retirada: <strong>{Number(rec.withdrawn_quantity || 0).toLocaleString('pt-BR')} un</strong></span>
                        <span>Devolvida: <strong>{Number(rec.returned_quantity || 0).toLocaleString('pt-BR')} un</strong></span>
                        {rec.team?.name && <span>Equipe: <strong>{rec.team.name}</strong></span>}
                        {rec.notes && <span>Obs: {rec.notes}</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé do Histórico */}
            <div style={{
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: 'var(--background)'
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
