const fs = require('fs');

// 1. Add Image import to DetailModal.tsx
let modalContent = fs.readFileSync('src/components/modals/DetailModal.tsx', 'utf8');
if (!modalContent.includes('next/image')) {
  modalContent = modalContent.replace("import React from 'react';", "import React from 'react';\nimport Image from 'next/image';");
  fs.writeFileSync('src/components/modals/DetailModal.tsx', modalContent, 'utf8');
}

// 2. Inject DetailModal into page.tsx
const vars = 'CheckCircle2, customers, factoryLocations, formArtName, formCustomer, formEmbalagem, formFirstPaymentDate, formFormaPag, formFreight, formFreteInfo, formHandlingAllocations, formInitialDestination, formInstallmentsPaid, formInstallmentsTotal, formInternalNotes, formMachineId, formMeasure, formMeioPag, formNotes, formOpNumber, formOverShortQuantity, formPhysicalLocation, formPrazo, formPrintRun, formProductionStartDate, formPvNumber, formSector, formSelectedProductStock, formSeller, formShippingType, formStageId, getItemRealMeasure, handleOpenLocationCrudModal, handleRequestDeleteManualOrder, handleSubmit, handlingTeams, hideMonetaryValues, isAdmin, isManualOrder, isModalOpen, isReadOnlyForForm, modalType, productionMachines, productionSectors, products, selectedItem, selectedOrder, setFormArtName, setFormCustomer, setFormEmbalagem, setFormFirstPaymentDate, setFormFormaPag, setFormFreight, setFormFreteInfo, setFormHandlingAllocations, setFormHandlingTeamId, setFormInitialDestination, setFormInstallmentsPaid, setFormInstallmentsTotal, setFormInternalNotes, setFormMachineId, setFormMeasure, setFormMeioPag, setFormNotes, setFormOpNumber, setFormOverShortQuantity, setFormPhysicalLocation, setFormPrazo, setFormPrintRun, setFormProduct, setFormProductionStartDate, setFormPvNumber, setFormSector, setFormSelectedProductStock, setFormSeller, setFormShippingType, setFormStageId, setFormStatus, setIsMachineCrudModalOpen, setIsModalOpen, setIsSectorCrudModalOpen, stages, user'.split(', ');

let pageContent = fs.readFileSync('src/app/pedidos/page.tsx', 'utf8');
const lines = pageContent.split('\n');

const startLine = lines.findIndex(l => l.includes('{isModalOpen && ('));
const endLine = lines.findIndex((l, i) => i > startLine && l.includes(')}'));

if (startLine !== -1 && endLine !== -1) {
  const injection = `      <DetailModal {...{ ${vars.join(', ')} }} />`;
  lines.splice(startLine, (endLine - startLine) + 1, injection);
  
  // Also add the import at the top
  const importIndex = lines.findIndex(l => l.includes('import { DeleteConfirmModal'));
  if (importIndex !== -1 && !lines.join('\n').includes('DetailModal')) {
    lines.splice(importIndex + 1, 0, "import { DetailModal } from '@/components/modals/DetailModal';");
  }

  fs.writeFileSync('src/app/pedidos/page.tsx', lines.join('\n'), 'utf8');
  console.log('Successfully injected DetailModal into page.tsx');
} else {
  console.log('Could not find bounds for injection.');
}
