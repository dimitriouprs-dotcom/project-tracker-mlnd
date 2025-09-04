import React from "react";

export default function Header() {
  return (
    <header
      style={{
        backgroundColor: "var(--blue)",
        color: "white",
        padding: "12px 24px",
        fontSize: "18px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>📊 Project Tracker MLND</div>
      <div style={{ fontSize: "14px", opacity: 0.8 }}>
        Logged in as <strong>Admin</strong>
      </div>
    </header>
  );
}
