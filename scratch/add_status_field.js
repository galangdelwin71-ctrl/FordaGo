const fs = require('fs');
const path = require('path');

const root = 'c:/Users/delwi/OneDrive/Desktop/caps/fordaGo/fordaGo';
const dataPath = path.join(root, 'frontend/src/app/data/equipment-guides.data.ts');
let content = fs.readFileSync(dataPath, 'utf8');

// Add status?: string to EquipmentFullGuide interface:
content = content.replace(
  'export interface EquipmentFullGuide {\n  id: number;\n  equipmentId: number;\n  name: string;\n  category: string;\n  imageUrl?: string;',
  'export interface EquipmentFullGuide {\n  id: number;\n  equipmentId: number;\n  name: string;\n  category: string;\n  status?: string;\n  imageUrl?: string;'
);

// Add status: 'available' to each item in EQUIPMENT_GUIDES_MAP:
content = content.replace(/imageUrl: /g, "status: 'available',\n    imageUrl: ");

fs.writeFileSync(dataPath, content, 'utf8');
console.log('Added status to EquipmentFullGuide in equipment-guides.data.ts');
