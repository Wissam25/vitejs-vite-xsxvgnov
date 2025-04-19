// ===================================================================
// Planning des inscriptions TPL – v10 (boutons désinscription par participant)
// • Affiche chaque inscrit avec un bouton “✖” pour le supprimer
// • Utilisation d’un handler removeEntry(id)
// ===================================================================

import { useState, useEffect, useMemo } from "react";

/* ---------------------- LISTE DES PUBLICATIONS ---------------------- */
const publicationsText = `Publications à exposer (Mars - Avril 2025):
展示​书刊 (2025 年 3 月- 4月)
Brochure Vivez pour toujours   永远享受美好的生命 （体验​版）
Réveillez-vous ! no 1 de 2022 - Un monde dans la tourmente : Comment tenir bon
《警醒！》2022年第1期 - “世界一片混乱，怎样好好生活”

Publications à garder à portée de main （不会​展示​出来:
Reviens à Jéhovah 《回到​耶和华​身边》册子
Des revues et d’autres publications dans des langues qui sont souvent demandées
《守望台》2019年第1期 “你知道上帝是谁吗？”`;

/* --------------------------- LIEUX/HORAIRES --------------------------- */
const venues = [
  { name: "Marché La Courneuve – 8 Mai 1945", map: "https://www.google.com/maps?q=48.9302,2.3969", slots: ["08:00‑09:00","09:00‑10:00","10:00‑11:00","11:00‑12:00"] },
  { name: "Bobigny Pablo‑Picasso / Tunnel", map: "https://www.google.com/maps?q=48.9063,2.4458", slots: ["15:00‑16:00","16:00‑17:00","17:00‑18:30"] },
  { name: "La Courneuve – Six Routes", map: "https://www.google.com/maps?q=48.9343,2.3922", slots: ["08:30‑09:30","09:30‑10:30"] },
];

/* -------------------------- UTILITAIRES DATE -------------------------- */
const today = new Date();
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const fmt = (d) => d.toISOString().split("T")[0];
const dowFr = (d) => d.toLocaleDateString("fr-FR", { weekday: "long" });
const weekNum = (d) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
};

/* ---------------------------- COMPOSANT ---------------------------- */
export default function PlanningApp() {
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState("");

  // Charger / sauvegarder localStorage
  useEffect(() => { setEntries(JSON.parse(localStorage.getItem("inscriptions") || "[]")); }, []);
  useEffect(() => { localStorage.setItem("inscriptions", JSON.stringify(entries)); }, [entries]);

  /* ---------------------- CALENDRIER 30 JOURS ---------------------- */
  const calendar = useMemo(() => {
    const rows = [];
    for (let i = 0; i <= 30; i++) {
      const dateObj = addDays(today, i);
      const dateStr = fmt(dateObj);
      const dow = dowFr(dateObj);
      const week = weekNum(dateObj);
      venues.forEach((v) => {
        v.slots.forEach((slot) => {
          const listEntries = entries.filter(e => e.date === dateStr && e.venue === v.name && e.slot === slot);
          rows.push({
            dateStr,
            dow,
            week,
            venue: v.name,
            slot,
            map: v.map,
            listEntries,
            count: listEntries.length,
          });
        });
      });
    }
    return rows;
  }, [entries]);

  /* -------------------- CALCUL rowSpan -------------------- */
  const computeSpans = (rows, keyFn) => {
    const spans = {};
    let prev = null, span = 0;
    rows.forEach((r, idx) => {
      const cur = keyFn(r);
      if (cur !== prev) {
        if (span > 0) spans[idx - span] = span;
        span = 1; prev = cur;
      } else {
        span += 1;
      }
    });
    if (span > 0) spans[rows.length - span] = span;
    return spans;
  };
  const dateSpans  = computeSpans(calendar, r => r.dateStr);
  const venueSpans = computeSpans(calendar, r => r.dateStr + "|" + r.venue);

  /* ------------------------- INSCRIPTION ------------------------- */
  const signUp = (row) => {
    if (!name.trim()) return alert("Merci d’entrer votre nom.");
    if (row.count >= 2) return;
    setEntries([...entries, { id: Date.now(), name: name.trim(), date: row.dateStr, venue: row.venue, slot: row.slot }]);
  };

  /* --------------------- SUPPRIMER ENTRÉE --------------------- */
  const removeEntry = (id) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  /* ----------------------------- CSS ----------------------------- */
  const css = {
    page: { fontFamily: "Arial, sans-serif", maxWidth: 1100, margin: "0 auto", padding: 24 },
    input: { padding: 8, fontSize: 16, width: 300, marginBottom: 16 },
    btn: { padding: "4px 8px", fontSize: 14, cursor: "pointer", border: 0, borderRadius: 4 },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { background: "#eee", padding: 8, border: "1px solid #ddd" },
    td: { padding: 8, border: "1px solid #ddd", fontSize: 14, verticalAlign: "top" },
    pre: { whiteSpace: "pre-wrap", background: "#fff", padding: 12, borderRadius: 8, marginBottom: 24, border: "1px solid #ddd" },
    listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    removeBtn: { background: "#dc3545", color: "#fff", marginLeft: 8 },
  };

  /* ------------------------- RENDU ------------------------- */
  let currentWeek = null;
  const bodyRows = [];

  calendar.forEach((r, idx) => {
    if (r.week !== currentWeek) {
      currentWeek = r.week;
      bodyRows.push(
        <tr key={`week-${currentWeek}`} style={{ background: "#dfe6ef" }}>
          <td colSpan={8} style={{ ...css.td, fontWeight: "bold" }}>Semaine {currentWeek}</td>
        </tr>
      );
    }
    bodyRows.push(
      <tr key={`${idx}-${r.slot}`} style={{ opacity: r.count >= 2 ? 0.45 : 1 }}>
        {dateSpans[idx] && <td style={css.td} rowSpan={dateSpans[idx]}>{r.dateStr}</td>}
        {dateSpans[idx] && <td style={css.td} rowSpan={dateSpans[idx]}>{r.dow.charAt(0).toUpperCase() + r.dow.slice(1)}</td>}
        {venueSpans[idx] && <td style={css.td} rowSpan={venueSpans[idx]}>{r.venue}</td>}
        <td style={css.td}>{r.slot}</td>
        <td style={css.td}>
          {r.listEntries.length > 0 ? (
            r.listEntries.map(e => (
              <div key={e.id} style={css.listItem}>
                <span>{e.name}</span>
                <button style={{...css.btn, ...css.removeBtn}} onClick={() => removeEntry(e.id)}>✖</button>
              </div>
            ))
          ) : (
            "—"
          )}
        </td>
        <td style={css.td}>{2 - r.count} / 2</td>
        <td style={css.td}><a href={r.map} target="_blank" rel="noopener noreferrer" style={{ color: "#1b77ff" }}>📍</a></td>
        <td style={css.td}>
          {r.count < 2 ? (
            <button style={{...css.btn, background: "#28a745", color: "#fff"}} onClick={() => signUp(r)}>S'inscrire</button>
          ) : (
            <span>Complet</span>
          )}
        </td>
      </tr>
    );
  });

  return (
    <div style={css.page}>
      <h1>Planning des inscriptions TPL</h1>
      <pre style={css.pre}>{publicationsText}</pre>

      <input style={css.input} placeholder="Votre nom" value={name} onChange={e => setName(e.target.value)} />

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
        <tbody>{bodyRows}</tbody>
      </table>
    </div>
  );
}
