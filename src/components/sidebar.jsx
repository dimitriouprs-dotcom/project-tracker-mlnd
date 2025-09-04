import React from "react";

export default function Sidebar() {
  return (
    <aside
      style={{
        width: "240px",
        backgroundColor: "var(--panel-1)",
        color: "white",
        height: "100vh",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>STO Planner</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        <li style={{ margin: "8px 0", cursor: "pointer" }}>Overview</li>
        <li style={{ margin: "8px 0", cursor: "pointer" }}>Work Package</li>
        <li style={{ margin: "8px 0", cursor: "pointer" }}>MAC</li>
      </ul>

      <h3 style={{ margin: "20px 12px", fontSize: "16px" }}>STO Execution</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        <li style={{ margin: "8px 0", cursor: "pointer" }}>Coordinator Update</li>
        <li style={{ margin: "8px 0", cursor: "pointer" }}>QA/QC</li>
      </ul>
    </aside>
  );
}
