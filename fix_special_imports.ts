import fs from 'fs';
let content = fs.readFileSync('src/pages/SpecialRequest.tsx', 'utf8');
content = content.replace("import { useState } from 'react';", "import React, { useState, useEffect } from 'react';");
fs.writeFileSync('src/pages/SpecialRequest.tsx', content);
