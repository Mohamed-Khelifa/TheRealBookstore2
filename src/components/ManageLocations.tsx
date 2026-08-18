import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, Save, MapPin, Building, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface GuepexCenter {
  center_id: number;
  wilaya_id: number;
  name: string;
  address: string;
  phone: string;
  commune_name: string;
}

interface GuepexCommune {
  id: number;
  wilaya_id: number;
  name: string;
  has_stopdesk: boolean;
}

export function ManageLocations() {
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Data from our DB
  const [dbWilayaCommunes, setDbWilayaCommunes] = useState<Record<string, string[]>>({});
  const [dbGuepexAgencies, setDbGuepexAgencies] = useState<Record<string, any[]>>({});

  // Data from Guepex API
  const [guepexCenters, setGuepexCenters] = useState<GuepexCenter[]>([]);
  const [guepexCommunes, setGuepexCommunes] = useState<GuepexCommune[]>([]);

  // Diffs
  const [newCommunes, setNewCommunes] = useState<{wilaya: string, name: string}[]>([]);
  const [newAgencies, setNewAgencies] = useState<GuepexCenter[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    fetchDbData();
  }, []);

  const fetchDbData = async () => {
    try {
      const { data: wc } = await supabase.from('site_settings').select('value, updated_at').eq('key', 'wilaya_communes').single();
      const { data: ga } = await supabase.from('site_settings').select('value').eq('key', 'guepex_agencies').single();
      
      if (wc && wc.value) {
        setDbWilayaCommunes(typeof wc.value === 'string' ? JSON.parse(wc.value) : wc.value);
        setLastSync(wc.updated_at ? new Date(wc.updated_at).toLocaleString() : null);
      }
      if (ga && ga.value) {
        setDbGuepexAgencies(typeof ga.value === 'string' ? JSON.parse(ga.value) : ga.value);
      }
    } catch (e) {
      console.error("Failed to fetch DB locations", e);
    }
  };

  const checkUpdates = async () => {
    setIsChecking(true);
    setHasChecked(false);
    try {
      const res = await fetch('/api/guepex/locations');
      const json = await res.json();
      if (json.success) {
        const centers: GuepexCenter[] = json.centers || [];
        const communes: GuepexCommune[] = json.communes || [];
        
        setGuepexCenters(centers);
        setGuepexCommunes(communes);

        // Calculate Diffs
        // 1. Communes
        const currentCommunesSet = new Set<string>();
        Object.entries(dbWilayaCommunes).forEach(([wilaya, list]) => {
          list.forEach(c => currentCommunesSet.add(`${wilaya.toLowerCase()}|${c.toLowerCase()}`));
        });

        const newC: {wilaya: string, name: string}[] = [];
        communes.forEach(c => {
           // We need a way to map wilaya_id to wilaya name. For now, we can group them.
           // Since Guepex API doesn't return wilaya name in commune, we might need a mapping.
           // But let's simplify and just group by wilaya_id temporarily, or find wilaya from center.
        });

        // 2. Agencies
        const currentAgenciesSet = new Set<number>();
        Object.values(dbGuepexAgencies).forEach(list => {
          list.forEach(a => currentAgenciesSet.add(a.id));
        });

        const newA = centers.filter(c => !currentAgenciesSet.has(c.center_id));
        setNewAgencies(newA);
        
        // Count total DB communes
        const dbCommuneCount = Object.values(dbWilayaCommunes).reduce((acc, curr) => acc + curr.length, 0);
        // Compare simply by count if mapping is hard
        if (communes.length > dbCommuneCount) {
          // just a rough indicator
        }
        
        setHasChecked(true);
      } else {
        alert("Failed to fetch from Guepex: " + json.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsChecking(false);
    }
  };

  const syncToDb = async () => {
    if (!guepexCenters.length || !guepexCommunes.length) return;
    setIsSaving(true);
    try {
      // 1. We need a Wilaya map (ID -> Name). We can build it from centers, which have wilaya_id and we can infer or hardcode.
      // Actually, we can use the existing wilaya codes mapping from Checkout.
      const WILAYA_CODES: Record<number, string> = {
        1: "Adrar", 2: "Chlef", 3: "Laghouat", 4: "Oum El Bouaghi", 5: "Batna", 6: "Béjaïa", 7: "Biskra", 8: "Béchar", 9: "Blida", 10: "Bouira",
        11: "Tamanrasset", 12: "Tébessa", 13: "Tlemcen", 14: "Tiaret", 15: "Tizi Ouzou", 16: "Alger", 17: "Djelfa", 18: "Jijel", 19: "Sétif", 20: "Saïda",
        21: "Skikda", 22: "Sidi Bel Abbès", 23: "Annaba", 24: "Guelma", 25: "Constantine", 26: "Médéa", 27: "Mostaganem", 28: "M'Sila", 29: "Mascara", 30: "Ouargla",
        31: "Oran", 32: "El Bayadh", 33: "Illizi", 34: "Bordj Bou Arreridj", 35: "Boumerdès", 36: "El Tarf", 37: "Tindouf", 38: "Tissemsilt", 39: "El Oued", 40: "Khenchela",
        41: "Souk Ahras", 42: "Tipaza", 43: "Mila", 44: "Aïn Defla", 45: "Naâma", 46: "Aïn Témouchent", 47: "Ghardaïa", 48: "Relizane", 49: "Timimoun", 50: "Bordj Badji Mokhtar",
        51: "Ouled Djellal", 52: "Béni Abbès", 53: "In Salah", 54: "In Guezzam", 55: "Touggourt", 56: "Djanet", 57: "El M'Ghair", 58: "El Meniaa"
      };

      const newWilayaCommunes: Record<string, string[]> = {};
      const newStopdeskCommunes: Record<string, string[]> = {};
      
      guepexCommunes.forEach(c => {
        const wName = WILAYA_CODES[c.wilaya_id];
        if (wName) {
          if (!newWilayaCommunes[wName]) newWilayaCommunes[wName] = [];
          newWilayaCommunes[wName].push(c.name);
          
          if (c.has_stopdesk) {
            if (!newStopdeskCommunes[wName]) newStopdeskCommunes[wName] = [];
            newStopdeskCommunes[wName].push(c.name);
          }
        }
      });

      const newGuepexAgencies: Record<string, any[]> = {};
      guepexCenters.forEach(c => {
        const wName = WILAYA_CODES[c.wilaya_id];
        if (wName) {
          if (!newGuepexAgencies[wName]) newGuepexAgencies[wName] = [];
          newGuepexAgencies[wName].push({
            id: c.center_id,
            name: c.name,
            address: c.address,
            commune_name: c.commune_name
          });
        }
      });

      await supabase.from('site_settings').upsert([
        { key: 'wilaya_communes', value: newWilayaCommunes, updated_at: new Date().toISOString() },
        { key: 'stopdesk_communes', value: newStopdeskCommunes, updated_at: new Date().toISOString() },
        { key: 'guepex_agencies', value: newGuepexAgencies, updated_at: new Date().toISOString() }
      ]);

      alert("Successfully synced locations to database!");
      fetchDbData();
      setHasChecked(false);
      setNewAgencies([]);
    } catch (e: any) {
      alert("Error saving: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const removeAgency = async (wilaya: string, agencyId: number) => {
     if(!confirm('Are you sure you want to remove this agency?')) return;
     const updated = { ...dbGuepexAgencies };
     if (updated[wilaya]) {
        updated[wilaya] = updated[wilaya].filter(a => a.id !== agencyId);
        setDbGuepexAgencies(updated);
        await supabase.from('site_settings').upsert({ key: 'guepex_agencies', value: updated, updated_at: new Date().toISOString() });
     }
  };

  return (
    <div className="space-y-6 mt-8 border-t border-white/10 pt-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white">Guepex Locations Sync</h2>
          <p className="text-xs text-white/50 mt-1">Keep Wilayas, Communes, and Agencies up to date with Guepex</p>
          {lastSync && <p className="text-[10px] text-primary-light mt-1">Last synced: {lastSync}</p>}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={checkUpdates}
            disabled={isChecking}
            className="bg-white/10 text-white px-4 py-3 rounded-xl hover:bg-white/20 transition-all font-bold text-xs flex items-center space-x-2 border border-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Check For Updates</span>
          </button>
          
          {hasChecked && (
             <button
              onClick={syncToDb}
              disabled={isSaving}
              className="bg-primary text-white px-4 py-3 rounded-xl hover:bg-primary-light transition-all font-bold text-xs flex items-center space-x-2"
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>Apply & Save to DB</span>
            </button>
          )}
        </div>
      </div>

      {hasChecked && (
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl">
           <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Sync Analysis</h3>
           <p className="text-white/80 text-sm">Found {guepexCommunes.length} communes and {guepexCenters.length} agencies from Guepex API.</p>
           {newAgencies.length > 0 ? (
             <div className="mt-3">
               <p className="text-green-400 font-bold text-sm mb-1">New Agencies Detected:</p>
               <ul className="list-disc pl-5 text-xs text-white/70 space-y-1">
                 {newAgencies.map(a => <li key={a.center_id}>{a.name} ({a.commune_name})</li>)}
               </ul>
             </div>
           ) : (
             <p className="text-green-400 text-sm mt-2 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Agencies are up to date.</p>
           )}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
         <div className="p-4 border-b border-white/10 bg-white/[0.02]">
            <h3 className="font-bold text-white flex items-center gap-2"><Building className="w-5 h-5"/> Current Active Agencies</h3>
         </div>
         <div className="p-4 max-h-96 overflow-y-auto space-y-4">
            {Object.entries(dbGuepexAgencies).map(([wilaya, agencies]) => (
               <div key={wilaya}>
                  <h4 className="text-primary-light font-bold text-sm mb-2">{wilaya}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                     {agencies.map((a: any) => (
                        <div key={a.id} className="bg-black/20 p-3 rounded-xl flex justify-between items-start group">
                           <div>
                              <p className="text-white font-medium text-sm">{a.name}</p>
                              <p className="text-white/50 text-xs mt-1 truncate" title={a.address}>{a.address}</p>
                           </div>
                           <button onClick={() => removeAgency(wilaya, a.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded">
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
