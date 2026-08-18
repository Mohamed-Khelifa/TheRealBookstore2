import fs from 'fs';
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');
content = "import { ManageLocations } from '../components/ManageLocations';\n" + content;
fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
