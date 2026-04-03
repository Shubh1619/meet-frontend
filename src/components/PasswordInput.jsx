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

  const inputClassName = useMemo(
    () => `${className} pr-11`,
    [className]
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
    <div className={`relative ${containerClassName}`}>
      <input
        {...inputProps}
        ref={setRefs}
        type={visible ? "text" : "password"}
        className={inputClassName}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? hideAriaLabel : showAriaLabel}
        title={visible ? hideAriaLabel : showAriaLabel}
        className={[
          "absolute inset-y-0 right-0 inline-flex items-center justify-center px-3",
          "text-slate-500 transition-colors duration-150 hover:text-slate-700",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-r-lg",
          toggleButtonClassName,
        ].join(" ")}
      >
        {visible ? <FiEyeOff className={`h-4 w-4 ${iconClassName}`} /> : <FiEye className={`h-4 w-4 ${iconClassName}`} />}
      </button>
    </div>
  );
});

export default PasswordInput;
