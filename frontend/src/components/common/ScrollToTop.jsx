import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Ensures clean, predictable navigation across routes:
 * 1. Resets scroll position to top when switching pages, eliminating jarring jumps.
 * 2. Smoothly scrolls to target hash anchors (e.g. #about, #events) when targeted.
 * 3. Respects user's prefers-reduced-motion OS preference.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If navigating to an in-page anchor hash
    if (hash) {
      const targetId = hash.replace("#", "");
      const element = document.getElementById(targetId);
      if (element) {
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        element.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
        return;
      }
    }

    // Default: Reset to top cleanly when navigating to a new route
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });
  }, [pathname, hash]);

  return null;
}
