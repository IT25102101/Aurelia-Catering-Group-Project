import DashboardLoadingState from "./DashboardLoadingState";
import DashboardEmptyState from "./DashboardEmptyState";

/**
 * Reusable DashboardTable component providing a consistent table container,
 * responsive horizontal scrolling, loading spinner, and empty-state handling.
 */
export default function DashboardTable({
  title,
  headerAction,
  headers = [],
  children,
  loading = false,
  empty = false,
  emptyTitle = "No records found",
  emptyDesc = "There are currently no items to display in this list.",
  className = "",
}) {
  return (
    <div className={`dashboard-table-container ${className}`}>
      {(title || headerAction) && (
        <div className="dashboard-table-container__header">
          {title && <h3 className="dashboard-table-container__title">{title}</h3>}
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      {loading ? (
        <DashboardLoadingState />
      ) : empty ? (
        <DashboardEmptyState title={emptyTitle} description={emptyDesc} />
      ) : (
        <div className="dashboard-table-scroll">
          <table className="dashboard-table">
            {headers.length > 0 && (
              <thead>
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} style={typeof h === "object" ? h.style : undefined}>
                      {typeof h === "object" ? h.label : h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
