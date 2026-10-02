import React, { useState, useEffect } from "react";
import DashboardSidebar from "./DashboardSidebar";

/**
 * Top-level layout shell for all Aurelia staff dashboards.
 * Provides sticky responsive sidebar, mobile backdrop overlay, and structured main workspace.
 */
export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  // Lock body scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  function handleToggleSidebar() {
    setSidebarOpen((prev) => !prev);
  }

  function handleCloseSidebar() {
    setSidebarOpen(false);
  }

  // Clone direct children if they are DashboardHeader to automatically supply onToggleSidebar
  const enrichedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type && child.type.name === "DashboardHeader") {
      return React.cloneElement(child, {
        onToggleSidebar: child.props.onToggleSidebar || handleToggleSidebar,
      });
    }
    return child;
  });

  return (
    <div className="dashboard-layout">
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="dashboard-mobile-backdrop"
          onClick={handleCloseSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />

      {/* Main Workspace Area */}
      <main className="dashboard-main">
        {enrichedChildren}
      </main>
    </div>
  );
}
