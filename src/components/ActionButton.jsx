import React from "react";

export default function ActionButton({
  children,
  variant = "filled",
  onClick,
  className,
  style,
  type = "button",
  ...rest
}) {
  const cls = variant === "filled" ? "btn" : "btn ghost";

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${cls} ${className || ""}`.trim()}
      style={style}
      {...rest}
    >
      {children}
    </button>
  );
}
