import React from "react";

export default function ActionButton({children, variant="filled", onClick, className}){
  const cls = variant === "filled" ? "btn" : "btn ghost";
  return (
    <button onClick={onClick} className={`${cls} ${className || ""}`}>
      {children}
    </button>
  );
}
