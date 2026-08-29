import fs from 'fs';
let code = fs.readFileSync('src/components/OrderNotification.tsx', 'utf-8');

const newUseEffect = `  useEffect(() => {
    let mounted = true;
    const fetchLatest = async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('id, customer_name, items, created_at')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (mounted && data && data.length > 0) {
          processOrder(data[0]);
        }
      } catch (err) {}
    };
    
    fetchLatest();
    
    return () => {
      mounted = false;
    };
  }, []);`;

code = code.replace(/useEffect\(\(\) => \{[\s\S]*?fetchLatest\(\)\;[\s\S]*?return \(\) => \{[\s\S]*?\}\;\n  \}, \[\]\)\;/, newUseEffect);
fs.writeFileSync('src/components/OrderNotification.tsx', code);
