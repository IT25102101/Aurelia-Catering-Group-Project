import { useEffect, useRef } from "react";

/**
 * Custom hook to trigger reveal animations when elements enter the viewport.
 * Uses native IntersectionObserver for maximum performance and zero scroll hijacking.
 * 
 * Features:
 * - Once-only triggering: automatically unobserves elements after they enter view
 * - Respects prefers-reduced-motion
 * - Immediate fallback if IntersectionObserver is not supported
 * - Root margin offset to trigger reveals comfortably before the user reaches the element
 */
export function useScrollReveal(options = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const container = containerRef.current || document;
    const elements = container.querySelectorAll(
      ".reveal-on-scroll, .reveal-fade-up, .reveal-stagger"
    );

    if (!elements || elements.length === 0) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((el) => {
        el.classList.add("is-revealed");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            // Stop observing once revealed — keeps performance optimal
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: options.rootMargin || "0px 0px -40px 0px",
        threshold: options.threshold !== undefined ? options.threshold : 0.08,
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [options.rootMargin, options.threshold]);

  return containerRef;
}
