import { useEffect, useMemo, useState } from "react";
import "./../styles/pages.css";
import "./ActivityLogs.css";
import { getSessionToken } from "../services/auth";

interface ActivityLog {
  log_id: string;
  timestamp?: string;
  action: string;
  section: string;
  status: string;
  details?: string;
}

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

function formatDateTime(value?: string): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(value?: string): boolean {
  if (!value) return false;

  const date = new Date(value);
  const today = new Date();

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getStatusClass(status: string): string {
  const normalized = status.trim().toUpperCase();

  if (normalized === "SUCCESS") return "activity-status-success";
  if (normalized === "FAILED" || normalized === "ERROR") {
    return "activity-status-error";
  }

  return "activity-status-neutral";
}

function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectionFilter, setSectionFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLogs() {
    if (!API_URL) {
      setError(
        "Apps Script URL is not configured. Check VITE_APPS_SCRIPT_URL."
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const sessionToken = getSessionToken();

      if (!sessionToken) {
        throw new Error(
          "Authentication required. Please log in again."
        );
      }

      const response = await fetch(
        `${API_URL}?action=getActivityLogs&limit=100&session_token=${encodeURIComponent(
          sessionToken
        )}`
      );

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}.`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          data.error ||
            data.message ||
            "Unable to load activity logs."
        );
      }

      setLogs(Array.isArray(data.logs) ? data.logs : []);
    } catch (loadError) {
      console.error("Failed to load activity logs:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load activity logs."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const sections = useMemo(() => {
    return Array.from(
      new Set(
        logs
          .map((log) => log.section?.trim())
          .filter(Boolean)
      )
    ).sort();
  }, [logs]);

  const statuses = useMemo(() => {
    return Array.from(
      new Set(
        logs
          .map((log) => log.status?.trim().toUpperCase())
          .filter(Boolean)
      )
    ).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return logs.filter((log) => {
      const searchableText = [
        log.action,
        log.section,
        log.status,
        log.details,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      const matchesSection =
        sectionFilter === "ALL" || log.section === sectionFilter;

      const normalizedStatus = log.status?.trim().toUpperCase();

      const matchesStatus =
        statusFilter === "ALL" || normalizedStatus === statusFilter;

      return matchesSearch && matchesSection && matchesStatus;
    });
  }, [logs, searchTerm, sectionFilter, statusFilter]);

  const todayCount = logs.filter((log) => isToday(log.timestamp)).length;

  return (
    <main className="teacher-page activity-page">
      <div className="container">
        <header className="teacher-header activity-header">
          <div>
            <span className="page-label">Teacher Dashboard</span>
            <h1>Activity Logs</h1>
            <p>
              View teacher actions and updates in one place.
            </p>
          </div>

          <button
            type="button"
            className="activity-refresh-button"
            onClick={loadLogs}
            disabled={isLoading}
          >
            <span aria-hidden="true">↻</span>
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        <section className="activity-stats">
          <div className="activity-stat-card">
            <span className="activity-stat-label">Total Loaded</span>
            <strong>{logs.length}</strong>
          </div>

          <div className="activity-stat-card">
            <span className="activity-stat-label">Today</span>
            <strong>{todayCount}</strong>
          </div>

          <div className="activity-stat-card">
            <span className="activity-stat-label">Showing</span>
            <strong>{filteredLogs.length}</strong>
          </div>
        </section>

        <section className="page-card activity-card">
          <div className="activity-toolbar">
            <div className="activity-search-wrap">
              <label htmlFor="activity-search">Search activity</label>
              <input
                id="activity-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search actions, sections or details..."
              />
            </div>

            <div className="activity-filter-wrap">
              <label htmlFor="activity-section">Section</label>
              <select
                id="activity-section"
                value={sectionFilter}
                onChange={(event) => setSectionFilter(event.target.value)}
              >
                <option value="ALL">All sections</option>
                {sections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>

            <div className="activity-filter-wrap">
              <label htmlFor="activity-status">Status</label>
              <select
                id="activity-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading && (
            <div className="activity-state">
              <div className="activity-spinner" aria-hidden="true" />
              <h3>Loading activity logs...</h3>
              <p>Fetching the latest teacher actions.</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="activity-state activity-state-error">
              <div className="activity-state-icon" aria-hidden="true">
                !
              </div>
              <h3>Unable to load activity logs</h3>
              <p>{error}</p>
              <button
                type="button"
                className="page-button page-button-primary"
                onClick={loadLogs}
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && filteredLogs.length === 0 && (
            <div className="activity-state">
              <div className="activity-state-icon" aria-hidden="true">
                ✓
              </div>
              <h3>
                {logs.length === 0
                  ? "No activity logs yet"
                  : "No matching activity"
                }
              </h3>
              <p>
                {logs.length === 0
                  ? "Teacher actions will appear here automatically after the Activity Logs module is enabled."
                  : "Try changing your search or filters."
                }
              </p>
            </div>
          )}

          {!isLoading && !error && filteredLogs.length > 0 && (
            <div className="table-wrapper activity-table-wrapper">
              <table className="data-table activity-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Section</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.log_id}>
                      <td className="activity-date-cell">
                        {formatDateTime(log.timestamp)}
                      </td>

                      <td>
                        <div className="activity-action-title">
                          {log.action || "—"}
                        </div>
                        {log.details && (
                          <div className="activity-details">
                            {log.details}
                          </div>
                        )}
                      </td>

                      <td>
                        <span className="activity-section-badge">
                          {log.section || "—"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`activity-status ${getStatusClass(
                            log.status
                          )}`}
                        >
                          {log.status || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ActivityLogs;
