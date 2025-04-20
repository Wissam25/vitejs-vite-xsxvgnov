// ===================================================================
// Planning des inscriptions TPL – v12 (jour correct + date longue)
// ===================================================================

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nnmpvcpetybyulfuagnr.supabase.co';

const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubXB2Y3BldHlieXVsZnVhZ25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNjAzMTcsImV4cCI6MjA2MDczNjMxN30.8j2USyByfFaI1KFh7_vOEeS4R0y7ZiMG2ehxug4-OfM';                    // 

const supabase = createClient(supabaseUrl, supabaseKey);

/* ---------------------- LISTE DES PUBLICATIONS ---------------------- */
const publicationsText = `Publications à exposer (Mars - Avril 2025):
展示​书刊 (2025 年 3 月- 4月)
Brochure Vivez pour toujours   永远享受美好的生命 （体验​版）
Réveillez-vous ! no 1 de 2022 - Un monde dans la tourmente : Comment tenir bon
《警醒！》2022年第1期 - "世界一片混乱，怎样好好生活"

Publications à garder à portée de main （不会​展示​出来:
Reviens à Jéhovah 《回到​耶和华​身边》册子
Des revues et d'autres publications dans des langues qui sont souvent demandées
《守望台》2019年第1期 "你知道上帝是谁吗？"`;

/* --------------------------- LIEUX/HORAIRES --------------------------- */
const venues = [
  { name: "Marché La Courneuve – 8 Mai 1945", map: "https://www.google.com/maps?q=48.9302,2.3969", slots: ["08:00‑09:00","09:00‑10:00","10:00‑11:00","11:00‑12:00"] },
  { name: "Bobigny Pablo‑Picasso / Tunnel", map: "https://www.google.com/maps?q=48.9063,2.4458", slots: ["15:00‑16:00","16:00‑17:00","17:00‑18:30"] },
  { name: "La Courneuve – Six Routes", map: "https://www.google.com/maps?q=48.9343,2.3922", slots: ["08:30‑09:30","09:30‑10:30"] },
];

/* ------------------------ AIDE FORMATAGE DATE ------------------------ */
const fmtISO = (d) => d.toISOString().split("T")[0];
const fmtLongFR = (dateStr) => {
  const [y, m, day] = dateStr.split("-").map(Number);
  const d = new Date(y, m - 1, day, 0, 0, 0); // local midnight
  const txt = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
};
const weekdayFR = (dateStr) => {
  const [y, m, day] = dateStr.split("-").map(Number);
  const d = new Date(y, m - 1, day, 0, 0, 0);
  const w = d.toLocaleDateString("fr-FR", { weekday: "long" });
  return w.charAt(0).toUpperCase() + w.slice(1);
};
const weekNum = (dateStr) => {
  const [y, m, day] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, day));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

/* ---------------------------- COMPOSANT ---------------------------- */
export default function PlanningApp() {
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState("");


useEffect(() => {
  // 1) Charger tout ce qui est déjà dans la base Supabase
  supabase.from('inscriptions').select('*').then(({ data }) => {
    setEntries(data || []);
  });

  // 2) Surveiller en "live" les nouvelles inscriptions et suppressions
  const sub = supabase
    .channel('inscriptions')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inscriptions' },
      payload => {
        if (payload.eventType === 'INSERT') {
          setEntries(current => [...current, payload.new]);
        }
        if (payload.eventType === 'DELETE') {
          setEntries(current => current.filter(e => e.id !== payload.old.id));
        }
      }
    )
    .subscribe();

  // 3) Quand on quitte la page, on arrête l'écoute
  return () => supabase.removeChannel(sub);
}, []);  // ← ce "[]" veut dire "une seule fois, quand la page s'ouvre"

  /* Génère 30 jours */
  const calendar = [];
  const today = new Date();
  for (let i = 0; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const iso = fmtISO(d);
    const week = weekNum(iso);
    venues.forEach(v => v.slots.forEach(slot => {
      const list = entries.filter(e => e.date === iso && e.venue === v.name && e.slot === slot);
      calendar.push({ iso, week, venue: v.name, slot, map: v.map, list, count: list.length });
    }));
  }

  /* rowSpan helpers */
  const spanCalc = (rows, keyFn) => {
    const m = {}; let prev=null, span=0;
    rows.forEach((r,i)=>{const k=keyFn(r);if(k!==prev){if(span) m[i-span]=span; span=1; prev=k;} else span++;});
    if(span) m[rows.length-span]=span; return m; };
  const dateSpans  = spanCalc(calendar, r => r.iso);
  const venueSpans = spanCalc(calendar, r => r.iso + "|" + r.venue);

  /* actions */
  const signUp = (row) => {
    if (!name.trim()) return alert("Veuillez saisir votre nom.");
    if (row.count >= 2) return;
    setEntries([...entries, { id: Date.now(), name: name.trim(), date: row.iso, venue: row.venue, slot: row.slot }]);
  };
  const removeEntry = (id) => setEntries(entries.filter(e => e.id !== id));

  /* styles */
  const css = {
    page:{fontFamily:"Arial, sans-serif",maxWidth:1100,margin:"0 auto",padding:24},
    input:{padding:8,fontSize:16,width:300,marginBottom:16},
    btn:{padding:"4px 8px",fontSize:14,cursor:"pointer",border:0,borderRadius:4},
    table:{width:"100%",borderCollapse:"collapse"},
    th:{background:"#eee",padding:8,border:"1px solid #ddd"},
    td:{padding:8,border:"1px solid #ddd",fontSize:14,verticalAlign:"top"},
    pre:{whiteSpace:"pre-wrap",background:"#fff",padding:12,borderRadius:8,marginBottom:24,border:"1px solid #ddd"},
    list:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4},
    rm:{background:"#dc3545",color:"#fff",marginLeft:8}
  };

  /* rendu */
  let cw=null; const rows=[];
  calendar.forEach((r,i)=>{
    if(r.week!==cw){cw=r.week;rows.push(<tr key={'w'+cw} style={{background:'#dfe6ef'}}><td colSpan={8} style={{...css.td,fontWeight:'bold'}}>Semaine {cw}</td></tr>);} 
    rows.push(
      <tr key={i+r.slot} style={{opacity:r.count>=2?0.45:1}}>
        {dateSpans[i]&&<td style={css.td} rowSpan={dateSpans[i]}>{fmtLongFR(r.iso)}</td>}
        {dateSpans[i]&&<td style={css.td} rowSpan={dateSpans[i]}>{weekdayFR(r.iso)}</td>}
        {venueSpans[i]&&<td style={css.td} rowSpan={venueSpans[i]}>{r.venue}</td>}
        <td style={css.td}>{r.slot}</td>
        <td style={css.td}>
          {r.list.length? r.list.map(e=> <div key={e.id} style={css.list}><span>{e.name}</span><button style={{...css.btn,...css.rm}} onClick={()=>removeEntry(e.id)}>✖</button></div>): '—'}
        </td>
        <td style={css.td}>{2-r.count} / 2</td>
        <td style={css.td}><a href={r.map} target="_blank" rel="noopener noreferrer" style={{color:'#1b77ff'}}>📍</a></td>
        <td style={css.td}>{r.count<2&&<button style={{...css.btn,background:'#28a745',color:'#fff'}} onClick={()=>signUp(r)}>S'inscrire</button>}</td>
      </tr>
    );
  });

  return (
    <div style={css.page}>
      <h1>Planning des inscriptions TPL</h1>
      <pre style={css.pre}>{publicationsText}</pre>
      <input style={css.input} placeholder="Votre nom" value={name} onChange={e=>setName(e.target.value)}/>
      <table style={css.table}>
        <thead>
          <tr>
            <th style={css.th}>Date</th>
            <th style={css.th}>Jour</th>
            <th style={css.th}>Lieu</th>
            <th style={css.th}>Horaire</th>
            <th style={css.th}>Inscrits</th>
            <th style={css.th}>Places</th>
            <th style={css.th}>Carte</th>
            <th style={css.th}></th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}