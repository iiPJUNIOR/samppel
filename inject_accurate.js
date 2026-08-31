const fs = require('fs');
const vars = 'CheckCircle2, customers, factoryLocations, formArtName, formCustomer, formEmbalagem, formFirstPaymentDate, formFormaPag, formFreight, formFreteInfo, formHandlingAllocations, formInitialDestination, formInstallmentsPaid, formInstallmentsTotal, formInternalNotes, formMachineId, formMeasure, formMeioPag, formNotes, formOpNumber, formOverShortQuantity, formPhysicalLocation, formPrazo, formPrintRun, formProductionStartDate, formPvNumber, formSector, formSelectedProductStock, formSeller, formShippingType, formStageId, getItemRealMeasure, handleOpenLocationCrudModal, handleRequestDeleteManualOrder, handleSubmit, handlingTeams, hideMonetaryValues, isAdmin, isManualOrder, isModalOpen, isReadOnlyForForm, modalType, productionMachines, productionSectors, products, selectedItem, selectedOrder, setFormArtName, setFormCustomer, setFormEmbalagem, setFormFirstPaymentDate, setFormFormaPag, setFormFreight, setFormFreteInfo, setFormHandlingAllocations, setFormHandlingTeamId, setFormInitialDestination, setFormInstallmentsPaid, setFormInstallmentsTotal, setFormInternalNotes, setFormMachineId, setFormMeasure, setFormMeioPag, setFormNotes, setFormOpNumber, setFormOverShortQuantity, setFormPhysicalLocation, setFormPrazo, setFormPrintRun, setFormProduct, setFormProductionStartDate, setFormPvNumber, setFormSector, setFormSelectedProductStock, setFormSeller, setFormShippingType, setFormStageId, setFormStatus, setIsMachineCrudModalOpen, setIsModalOpen, setIsSectorCrudModalOpen, stages, user'.split(', ');

let pageContent = fs.readFileSync('src/app/pedidos/page.tsx', 'utf8');
const lines = pageContent.split('\n');

const startLine = lines.findIndex(l => l.includes('{isModalOpen && ('));

let openBraces = 0;
let endLine = -1;
for (let i = startLine; i < lines.length; i++) {
  const line = lines[i];
  const openCount = (line.match(/\{/g) || []).length;
  const closeCount = (line.match(/\}/g) || []).length;
  openBraces += openCount - closeCount;
  
  if (i > startLine && openBraces === 0 && line.includes(')}')) {
    endLine = i;
    break;
  }
}

if (startLine !== -1 && endLine !== -1) {
  console.log(`Replacing lines ${startLine} to ${endLine}`);
  const injection = `      {isModalOpen && <DetailModal {...{ ${vars.join(', ')} }} />}`;
  lines.splice(startLine, (endLine - startLine) + 1, injection);
  
  const importIndex = lines.findIndex(l => l.includes('import { DeleteConfirmModal'));
  if (importIndex !== -1 && !lines.join('\n').includes('DetailModal')) {
    lines.splice(importIndex + 1, 0, "import { DetailModal } from '@/components/modals/DetailModal';");
  }

  fs.writeFileSync('src/app/pedidos/page.tsx', lines.join('\n'), 'utf8');
  console.log('Successfully injected DetailModal into page.tsx');
} else {
  console.log('Could not find bounds for injection.', startLine, endLine);
}
