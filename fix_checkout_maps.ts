import fs from 'fs';

let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

// Replace the single activeCommunesMap setter
const replacement1 = `
  const [allWilayaCommunes, setAllWilayaCommunes] = useState<Record<string, string[]>>({});
  const [allStopdeskCommunes, setAllStopdeskCommunes] = useState<Record<string, string[]>>({});
`;
content = content.replace("const [activeCommunesMap, setActiveCommunesMap] = useState<Record<string, string[]>>({});", "const [activeCommunesMap, setActiveCommunesMap] = useState<Record<string, string[]>>({});\n" + replacement1);

const replacement2 = `
        if (wc) setAllWilayaCommunes(wc.value);
        if (sc) setAllStopdeskCommunes(sc.value);
        if (ga) setAllGuepexAgencies(ga.value);
`;
content = content.replace(/if \(wc\) setActiveCommunesMap\(wc\.value\);\n        if \(ga\) setAllGuepexAgencies\(ga\.value\);/, replacement2);

// Add useEffect to derive activeCommunesMap
const replacement3 = `
  useEffect(() => {
    const map = formData.shipping_method === 'office' ? allStopdeskCommunes : allWilayaCommunes;
    setActiveCommunesMap(map);
    if (Object.keys(map).length > 0) {
      setActiveWilayas(Object.keys(map).sort());
    }
  }, [formData.shipping_method, allStopdeskCommunes, allWilayaCommunes]);
`;

content = content.replace("// Derive active communes and wilayas based on shipping method", replacement3);
content = content.replace(/if \(wc && wc\.value\) \{\n          const wList = Object\.keys\(wc\.value\)\.sort\(\);\n          setActiveWilayas\(wList\);\n        \}/, "");

fs.writeFileSync('src/pages/Checkout.tsx', content);
