import React from "react";

const groupTitle = {
  fontSize: 12, letterSpacing: .6, textTransform: "uppercase",
  color: "var(--muted)", margin: "16px 0 8px"
};

const item = {
  display: "flex", alignItems: "center",
  height: 36, padding: "0 10px", borderRadius: 8,
  cursor: "pointer", color: "var(--text)"
};

const itemHover = { background: "rgba(255,255,255,.06)" };

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 260, background: "var(--panel-1)", height: "calc(100vh - 64px)",
        borderRight: "1px solid var(--border)", padding: 12, boxSizing: "border-box", overflow: "auto"
      }}
    >
      <div style={groupTitle}>STO Planner</div>
      {["Overview", "Work Package", "MAC"].map((label) => (
        <div
          key={label}
          style={item}
          onMouseEnter={(e)=>Object.assign(e.currentTarget.style,item,itemHover)}
          onMouseLeave={(e)=>Object.assign(e.currentTarget.style,item)}
        >
          {label}
        </div>
      ))}

      <div style={groupTitle}>STO Execution</div>
      {["Coordinator Update", "QA/QC", "Inbox"].map((label) => (
        <div
          key={label}
          style={item}
          onMouseEnter={(e)=>Object.assign(e.currentTarget.style,item,itemHover)}
          onMouseLeave={(e)=>Object.assign(e.currentTarget.style,item)}
        >
          {label}
        </div>
      ))}
    </aside>
  );
}
