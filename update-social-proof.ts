import fs from 'fs';

let code = fs.readFileSync('src/components/SocialProof.tsx', 'utf-8');

// Replace the useEffect
const newUseEffect = `  useEffect(() => {
    let mounted = true;
    const fetchRecentActivity = async () => {
      try {
        const [ordersRes, reviewsRes] = await Promise.all([
          supabase.from('orders').select('id, customer_name, wilaya, items, created_at').order('created_at', { ascending: false }).limit(3),
          supabase.from('reviews').select('id, user_name, book_id, created_at').order('created_at', { ascending: false }).limit(3)
        ]);

        if (!mounted) return;
        
        let acts: Activity[] = [];
        
        if (ordersRes.data) {
          ordersRes.data.forEach((o: any) => {
            acts.push({
              id: o.id,
              name: o.customer_name?.split(' (')[0] || 'Someone',
              city: o.wilaya || 'Algeria',
              action: 'bought',
              book: typeof o.items === 'string' ? (JSON.parse(o.items)[0]?.title || 'a book') : (o.items?.[0]?.title || 'a book'),
              timestamp: o.created_at
            });
          });
        }
        
        if (reviewsRes.data && reviewsRes.data.length > 0) {
          // We need book titles for reviews. We can skip it to save egress or fetch it.
          // To save egress, just say "a book"
          reviewsRes.data.forEach((r: any) => {
            acts.push({
              id: r.id,
              name: r.user_name || 'A reader',
              city: 'A reader',
              action: 'reviewed',
              book: 'a book',
              timestamp: r.created_at
            });
          });
        }

        acts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(acts.slice(0, 5));
        
        if (acts.length > 0) {
          setCurrentIndex(0);
          setIsVisible(true);
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          hideTimerRef.current = setTimeout(() => {
            setIsVisible(false);
          }, 7000);
        }
      } catch (err) {}
    };

    fetchRecentActivity();

    return () => {
      mounted = false;
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);`;

code = code.replace(/useEffect\(\(\) => \{[\s\S]*?return \(\) => \{[\s\S]*?\}\;\n  \}, \[\]\)\;/, newUseEffect);

fs.writeFileSync('src/components/SocialProof.tsx', code);
