import { useEffect, useState } from "react";
import { API_BASE_URL } from "./api/config.js";

export default function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((r) => r.json())
      .then((d) => setStatus(d.status))
      .catch(() => setStatus("backend not reachable"));
  }, []);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>AURELIA Catering &amp; Events</h1>
      <p>Backend status: {status}</p>
    </main>
  );
}
