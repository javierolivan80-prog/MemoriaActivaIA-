"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function Modal({
  onClose,
  children,
  labelledBy,
  closeOnBackdrop = true,
  backdrop = "default",
  contentClassName = "w-full max-w-sm rounded-2xl bg-surface p-6 shadow-soft",
}: {
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
  closeOnBackdrop?: boolean;
  backdrop?: "default" | "dark";
  contentClassName?: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = contentRef.current;
    const initialFocusTarget =
      container?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? container;
    initialFocusTarget?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !container) return;

      const focusables = container.querySelectorAll<HTMLElement>(
        FOCUSABLE_SELECTOR
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className={`animate-backdrop-in fixed inset-0 z-50 flex items-center justify-center p-4 ${
        backdrop === "dark" ? "bg-black/70" : "bg-black/50"
      }`}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`animate-modal-in ${contentClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
