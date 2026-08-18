import fs from 'fs';

let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

const parseVal = (val: string) => {
  return "typeof " + val + " === 'string' ? JSON.parse(" + val + ") : " + val;
}

content = content.replace(
  /if \(wc\) setAllWilayaCommunes\(wc\.value\);\n\s*if \(sc\) setAllStopdeskCommunes\(sc\.value\);\n\s*if \(ga\) setAllGuepexAgencies\(ga\.value\);/,
  `if (wc) setAllWilayaCommunes(typeof wc.value === 'string' ? JSON.parse(wc.value) : wc.value);
        if (sc) setAllStopdeskCommunes(typeof sc.value === 'string' ? JSON.parse(sc.value) : sc.value);
        if (ga) setAllGuepexAgencies(typeof ga.value === 'string' ? JSON.parse(ga.value) : ga.value);`
);

fs.writeFileSync('src/pages/Checkout.tsx', content);

// Also need to check SpecialRequest.tsx
let content2 = fs.readFileSync('src/pages/SpecialRequest.tsx', 'utf8');
content2 = content2.replace(
  /if \(wc\) setAllWilayaCommunes\(wc\.value\);\n\s*if \(sc\) setAllStopdeskCommunes\(sc\.value\);/,
  `if (wc) setAllWilayaCommunes(typeof wc.value === 'string' ? JSON.parse(wc.value) : wc.value);
        if (sc) setAllStopdeskCommunes(typeof sc.value === 'string' ? JSON.parse(sc.value) : sc.value);`
);
fs.writeFileSync('src/pages/SpecialRequest.tsx', content2);

// Also ManageLocations.tsx
let content3 = fs.readFileSync('src/components/ManageLocations.tsx', 'utf8');
content3 = content3.replace(
  /if \(wc && wc\.value\) \{\n\s*setDbWilayaCommunes\(wc\.value\);/,
  `if (wc && wc.value) {\n        setDbWilayaCommunes(typeof wc.value === 'string' ? JSON.parse(wc.value) : wc.value);`
);
content3 = content3.replace(
  /if \(ga && ga\.value\) \{\n\s*setDbGuepexAgencies\(ga\.value\);/,
  `if (ga && ga.value) {\n        setDbGuepexAgencies(typeof ga.value === 'string' ? JSON.parse(ga.value) : ga.value);`
);
fs.writeFileSync('src/components/ManageLocations.tsx', content3);

