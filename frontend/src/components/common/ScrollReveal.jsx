import { useEffect, useRef, useState } from "react";

/**
 * Reusable wrapper component for elegant, performant viewport-triggered reveals.
 * Uses IntersectionObserver for 60fps/120fps GPU animations with zero scroll hijacking.
 * 
 * Props:
 * - as: HTML tag to render (default 'div')
 * - variant: 'fade-up' | 'fade-in' | 'scale-in' (default 'fade-up')
 * - delay: Delay in ms before animation starts
 * - duration: Duration in ms (default 650)
 * - threshold: Intersection threshold (default 0.1)
 * - rootMargin: Margin before element enters view (default '0px 0px -40px 0px')
 * - stagger: If true, automatically staggers direct children
 * - staggerInterval: Interval between children in ms (default 90)
 * - className: Additional CSS classes
 */
export default function ScrollReveal({
  as: Component = "div",
  variant = "fade-up",
  delay = 0,
  duration = 650,
  threshold = 0.08,
  rootMargin = "0px 0px -40px 0px",
  stagger = false,
  staggerInterval = 90,
  className = "",
  style = {},
  children,
  ...restProps
}) {
  const elementRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ||
        !("IntersectionObserver" in window)
    );
  });

  useEffect(() => {
    if (isRevealed) return;
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry], obs) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          obs.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [isRevealed, threshold, rootMargin]);

  const variantClass = `reveal-${variant}`;
  const statusClass = isRevealed ? "is-revealed" : "is-hidden";
  const staggerClass = stagger ? "reveal-stagger-parent" : "";

  const customStyle = {
    ...style,
    ...(delay > 0 ? { "--reveal-delay": `${delay}ms` } : {}),
    ...(duration !== 650 ? { "--reveal-duration": `${duration}ms` } : {}),
    ...(stagger ? { "--stagger-interval": `${staggerInterval}ms` } : {}),
  };

  return (
    <Component
      ref={elementRef}
      className={`reveal-wrapper ${variantClass} ${statusClass} ${staggerClass} ${className}`.trim()}
      style={customStyle}
      {...restProps}
    >
      {children}
    </Component>
  );
}
