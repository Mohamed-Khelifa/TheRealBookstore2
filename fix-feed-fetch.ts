import fs from 'fs';

let code = fs.readFileSync('src/pages/LiveDeliveryFeed.tsx', 'utf-8');

const fetchLogic = `  const fetchOrders = async () => {
    setRefreshing(true);
    try {
      const [ordersRes, parcelsRes] = await Promise.all([
        fetchAllRows('orders', '*', 'created_at', false),
        fetch('/api/guepex-parcels?page_size=300').catch(() => null)
      ]);
      
      let parcelsMap: Record<string, any> = {};
      if (parcelsRes && parcelsRes.ok) {
         const pData = await parcelsRes.json().catch(() => null);
         const parcelArray = pData?.data || [];
         parcelArray.forEach((p: any) => {
           if (p.order_id) parcelsMap[p.order_id] = p;
           else if (p.tracking) parcelsMap[p.tracking] = p;
         });
      }
      
      if (ordersRes.data) {
        const merged = ordersRes.data.map(o => {
          // Since the DB doesn't have guepex columns natively, we map them here
          const parcel = parcelsMap[o.id] || parcelsMap[o.tracking_code || ''];
          if (parcel) {
            return {
              ...o,
              tracking_code: parcel.tracking || o.tracking_code,
              guepex_status: parcel.last_status,
              guepex_reason: parcel.reason
            };
          }
          return o;
        });
        setOrders(merged);
      }
      
      if (activeTab === 'WEBHOOKS') {
        await fetchWebhookLogs();
      }
    } catch (err) {
      console.error('Error fetching live delivery data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };`;

code = code.replace(/const fetchOrders = async \(\) => \{[\s\S]*?\}\;\n\n  const fetchWebhookLogs/, fetchLogic + '\n\n  const fetchWebhookLogs');

// Fix useEffects
const oldUseEffects = `  useEffect(() => {
    fetchOrders();
  }, [activeTab]);`;

const newUseEffects = `  useEffect(() => {
    fetchOrders();
  }, []);
  
  useEffect(() => {
    if (activeTab === 'WEBHOOKS' && webhookLogs.length === 0) {
      fetchWebhookLogs();
    }
  }, [activeTab]);`;

code = code.replace(oldUseEffects, newUseEffects);

fs.writeFileSync('src/pages/LiveDeliveryFeed.tsx', code);
