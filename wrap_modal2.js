const fs = require('fs');
const vars = 'CheckCircle2, customers, factoryLocations, formArtName, formCustomer, formEmbalagem, formFirstPaymentDate, formFormaPag, formFreight, formFreteInfo, formHandlingAllocations, formInitialDestination, formInstallmentsPaid, formInstallmentsTotal, formInternalNotes, formMachineId, formMeasure, formMeioPag, formNotes, formOpNumber, formOverShortQuantity, formPhysicalLocation, formPrazo, formPrintRun, formProductionStartDate, formPvNumber, formSector, formSelectedProductStock, formSeller, formShippingType, formStageId, getItemRealMeasure, handleOpenLocationCrudModal, handleRequestDeleteManualOrder, handleSubmit, handlingTeams, hideMonetaryValues, isAdmin, isManualOrder, isModalOpen, isReadOnlyForForm, modalType, productionMachines, productionSectors, products, selectedItem, selectedOrder, setFormArtName, setFormCustomer, setFormEmbalagem, setFormFirstPaymentDate, setFormFormaPag, setFormFreight, setFormFreteInfo, setFormHandlingAllocations, setFormHandlingTeamId, setFormInitialDestination, setFormInstallmentsPaid, setFormInstallmentsTotal, setFormInternalNotes, setFormMachineId, setFormMeasure, setFormMeioPag, setFormNotes, setFormOpNumber, setFormOverShortQuantity, setFormPhysicalLocation, setFormPrazo, setFormPrintRun, setFormProduct, setFormProductionStartDate, setFormPvNumber, setFormSector, setFormSelectedProductStock, setFormSeller, setFormShippingType, setFormStageId, setFormStatus, setIsMachineCrudModalOpen, setIsModalOpen, setIsSectorCrudModalOpen, stages, user'.split(', ');

const jsx = fs.readFileSync('temp_detail_modal.tsx', 'utf8');

const content = `import React from 'react';
import { 
  X, Search, AlertTriangle, Users, Plus, Trash2, ChevronDown, 
  Info, Package, Truck, MapPin, FileText, Calendar, DollarSign, 
  CreditCard, Check, AlertCircle, Save, CheckCircle2
} from 'lucide-react';

export function DetailModal(props: any) {
  const {
    ${vars.join(',\n    ')}
  } = props;

  return (
    <>
${jsx}
    </>
  );
}
`;

fs.writeFileSync('src/components/modals/DetailModal.tsx', content, 'utf8');
console.log('Successfully written DetailModal.tsx');
