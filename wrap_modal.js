const fs = require('fs');
const jsx = fs.readFileSync('temp_detail_modal.tsx', 'utf8');

const content = `import React from 'react';
import { X, Search } from 'lucide-react'; // Example imports, will fix later

export function DetailModal(props: any) {
  const {
    // Add props here later
  } = props;

  return (
    <>
${jsx}
    </>
  );
}
`;
fs.writeFileSync('src/components/modals/DetailModal.tsx', content, 'utf8');
console.log('Created src/components/modals/DetailModal.tsx');
