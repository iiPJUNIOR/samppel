const fs = require('fs');
let page = fs.readFileSync('src/app/pedidos/page.tsx', 'utf8');

const modals = [
  'ExpeditionTransitionModal', 'ColetaAgendadaModal', 'FreightModal', 'ProductionAlertModal',
  'ConferencyModal', 'HandlingTeamModal', 'LinkedItemsWarningModal', 'SyncModal',
  'PackagingModal', 'AdjustmentModal', 'ShippingCrudModal', 'DetailViewModal',
  'SectorCrudModal', 'MachineCrudModal', 'OrderInProgressModal', 'InsufficientStockModal',
  'SiblingMoveModal', 'FaturadoAlertModal', 'BlockedPaymentModal', 'MoveStageModal',
  'LocationCrudModal', 'ShortageModal', 'ExpeditionModal'
];

let importsToAdd = [];
modals.forEach(m => {
  if (!page.includes(`import { ${m} }`)) {
    importsToAdd.push(`import { ${m} } from '@/components/modals/${m}';`);
  }
});

if (importsToAdd.length > 0) {
  page = page.replace('import { DeleteConfirmModal', importsToAdd.join('\n') + '\nimport { DeleteConfirmModal');
  fs.writeFileSync('src/app/pedidos/page.tsx', page, 'utf8');
}
console.log('Added ' + importsToAdd.length + ' imports');
