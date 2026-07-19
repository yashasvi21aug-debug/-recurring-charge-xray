import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/upload";

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | scanning | done | error
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("Couldn't load scan history:", err);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus("idle");
    setResults([]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("scanning");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Server responded with an error.");
      }

      const data = await response.json();
      setResults(data.recurring_charges || []);
      setStatus("done");
      fetchHistory();
    } catch (err) {
      setErrorMsg("Couldn't analyze the file. Make sure both servers are running.");
      setStatus("error");
    }
  };

  const totalMonthly = results.reduce((sum, r) => sum + (r.avg_amount || 0), 0);

  const formatDate = (isoLike) => {
    const d = new Date(isoLike.replace(" ", "T") + "Z");
    return d.toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="page">
      <header className="header">
        <span className="eyebrow">Recurring Charge X-Ray</span>
        <h1>See what's quietly repeating.</h1>
        <p className="subtitle">
          Upload a transaction CSV. We'll scan it for subscriptions and recurring
          charges hiding in plain sight.
        </p>
      </header>

      <section className={`scan-panel ${status === "scanning" ? "is-scanning" : ""}`}>
        {status === "scanning" && <div className="scan-line"></div>}

        <div className="upload-row">
          <label className="file-input">
            <input type="file" accept=".csv" onChange={handleFileChange} />
            {file ? file.name : "Choose a CSV file"}
          </label>

          <button
            className="scan-button"
            onClick={handleUpload}
            disabled={!file || status === "scanning"}
          >
            {status === "scanning" ? "Scanning..." : "Scan for charges"}
          </button>
        </div>

        {status === "error" && <p className="error-text">{errorMsg}</p>}
      </section>

      {status === "done" && (
        <section className="results">
          <div className="summary-strip">
            <div>
              <span className="summary-label">Recurring charges found</span>
              <span className="summary-value">{results.length}</span>
            </div>
            <div>
              <span className="summary-label">Estimated monthly total</span>
              <span className="summary-value accent">₹{totalMonthly.toFixed(0)}</span>
            </div>
          </div>

          {results.length === 0 ? (
            <p className="empty-state">No recurring charges detected in this file.</p>
          ) : (
            <ul className="charge-list">
              {results.map((r, i) => (
                <li className="charge-row" key={i} style={{ animationDelay: `${i * 90}ms` }}>
                  <div className="charge-main">
                    <span className="merchant">{r.merchant}</span>
                    <span className="occurrences">{r.occurrences}x seen</span>
                  </div>
                  <div className="charge-meta">
                    <span className="amount">₹{r.avg_amount}</span>
                    <span className="interval">every ~{r.avg_interval_days}d</span>
                    <span className="confidence-badge">{r.confidence}% match</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {history.length > 0 && (
        <section className="history">
          <h2 className="history-title">Past scans</h2>
          <ul className="history-list">
            {history.map((scan) => (
              <li className="history-row" key={scan.id}>
                <div className="history-main">
                  <span className="history-filename">{scan.filename}</span>
                  <span className="history-date">{formatDate(scan.created_at)}</span>
                </div>
                <span className="history-count">
                  {scan.results.length} charge{scan.results.length !== 1 ? "s" : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default App;