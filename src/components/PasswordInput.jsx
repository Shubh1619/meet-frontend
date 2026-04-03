import React, { forwardRef, useCallback, useMemo, useRef, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const PasswordInput = forwardRef(function PasswordInput(
  {
    className = "",
    containerClassName = "",
    toggleButtonClassName = "",
    iconClassName = "",
    showAriaLabel = "Show password",
    hideAriaLabel = "Hide password",
    ...inputProps
  },
  forwardedRef
) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null);

  const setRefs = useCallback(
    (node) => {
      inputRef.current = node;
      if (!forwardedRef) return;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
        return;
      }
      forwardedRef.current = node;
    },
    [forwardedRef]
  );

  const inputClassName = useMemo(() => className, [className]);
  const inputStyle = inputProps.style || {};
  const mergedInputStyle = useMemo(
    () => ({
      ...inputStyle,
      paddingRight: inputStyle.paddingRight ?? "48px",
    }),
    [inputStyle]
  );

  const onToggle = useCallback(() => {
    const target = inputRef.current;
    if (!target) {
      setVisible((prev) => !prev);
      return;
    }

    const wasFocused = document.activeElement === target;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const direction = target.selectionDirection || "none";

    setVisible((prev) => !prev);

    requestAnimationFrame(() => {
      if (!inputRef.current || !wasFocused) return;
      inputRef.current.focus({ preventScroll: true });
      if (start == null || end == null) return;
      try {
        inputRef.current.setSelectionRange(start, end, direction);
      } catch {
        // Some browsers may not support preserving selection on type switches.
      }
    });
  }, []);

  return (
    <div
      className={containerClassName}
      style={{ position: "relative", width: "100%" }}
    >
      <input
        {...inputProps}
        ref={setRefs}
        type={visible ? "text" : "password"}
        className={inputClassName}
        style={mergedInputStyle}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? hideAriaLabel : showAriaLabel}
        title={visible ? hideAriaLabel : showAriaLabel}
        className={toggleButtonClassName}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "44px",
          height: "100%",
          border: "none",
          background: "transparent",
          color: "#64748b",
          cursor: "pointer",
          borderRadius: "6px",
          padding: 0,
        }}
      >
        {visible ? <FiEyeOff className={iconClassName} size={18} style={{ display: "block" }} /> : <FiEye className={iconClassName} size={18} style={{ display: "block" }} />}
      </button>
    </div>
  );
});

export default PasswordInput;
