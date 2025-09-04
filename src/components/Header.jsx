import React from "react";

export default function Header() {
  const bar = {
    position: "sticky", top: 0, zIndex: 1000,
    height: 64, display: "flex", alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    background: "var(--blue)", color: "white",
    borderBottom: "1px solid #0b2544"
  };

  const left = { display: "flex", alignItems: "center", gap: 12 };
  const right = { display: "flex", alignItems: "center", gap: 8 };

  const btn = {
    height: 32, padding: "0 12px",
    background: "transparent",
    color: "white",
    border: "1px solid rgba(255,255,255,.35)",
    borderRadius: 8, cursor: "pointer",
    fontSize: 13
  };

  const pill = {
    height: 32, background: "rgba(255,255,255,.1)",
    color: "white", border: "1px solid rgba(255,255,255,.2)",
    borderRadius: 16, padding: "0 12px", fontSize: 13
  };

  return (
    <header style={bar}>
      <div style={left}>
        <img src="/logo.png" alt="logo" style={{ height: 28 }} />
        <div style={{ fontWeight: 700, letterSpacing: .3 }}>
          Project Tracker
        </div>
        <span style={{opacity:.8,fontSize:13}}>GSD BEE 2025</span>
      </div>

      <div style={right}>
        <select defaultValue="default" style={pill}>
          <option value="default">Default · NONE</option>
          <option value="layout-a">Layout A</option>
          <option value="layout-b">Layout B</option>
        </select>

        <button style={btn} title="Filter">Filter</button>
        <button style={btn} title="Reset Layout">Reset Layout</button>
        <button style={btn} title="Manage Layout">Manage Layout</button>
      </div>
    </header>
  );
}
