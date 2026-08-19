import { useState } from "react";
import { AlertCircle, CheckCircle2, Download, RotateCcw, Sparkles, X, ShieldCheck } from "lucide-react";
import type { AuditConfidence, AuditReport, PlanMarker } from "../../auditTypes";
import { downloadReportJson, downloadReportPdf } from "../../lib/auditClient";
import { triggerBrandConfetti } from "../../lib/confetti";

interface ReportModalProps {
  report: AuditReport | null;
  isOpen: boolean;
  onClose: () => void;
  onNewAudit: () => void;
  planFile: File | null;
  northAngleDeg: number;
  planMarkers: PlanMarker[];
}

function confidenceLabel(confidence: AuditConfidence) {
  if (confidence === "high") return "Wysoka (pełne dane wejściowe)";
  if (confidence === "medium") return "Średnia (częściowe dane)";
  return "Wstępna / orientacyjna";
}

export function ReportModal({
  report,
  isOpen,
  onClose,
  onNewAudit,
  planFile,
  northAngleDeg,
  planMarkers
}: ReportModalProps) {
  if (!isOpen || !report) return null;

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);

  async function handleDownloadPdf() {
    if (!report || isDownloading) return;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const res = await downloadReportPdf(report, {
        planFile: planFile ?? null,
        northAngleDeg,
        planMarkers
      });
      if (res?.blobUrl) {
        setGeneratedPdfUrl(res.blobUrl);
      }
      triggerBrandConfetti();
    } catch (err: any) {
      console.error("Błąd generowania PDF:", err);
      setDownloadError(`Błąd generowania PDF: ${err?.message || "Spróbuj ponownie"}.`);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="report-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="report-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <div className="report-modal-title">
            <div className="report-badge">
              <Sparkles size={16} />
              <span>Wyniki Kompleksowego Audytu Feng Shui</span>
            </div>
            <h2>Raport Strategiczny i Zalecenia dla Twojego Lokalu</h2>
          </div>
          <button type="button" className="checkout-close-btn" onClick={onClose} aria-label="Zamknij">
            <X size={20} />
          </button>
        </div>

        <div className="report-modal-body">
          {/* Executive Overview Header */}
          <div className="report-cover-box">
            <div className="report-score-block">
              <span className="score-label">Wskaźnik Harmonii Układu</span>
              <div className="score-number-row">
                <strong>{report.score}</strong>
                <span>/100</span>
              </div>
              <small>Poziom pewności: {confidenceLabel(report.confidence)}</small>
            </div>

            <div className="report-decision-block">
              <span className="decision-label">Rekomendacja Decyzyjna</span>
              <p className="decision-text">{report.purchase_decision}</p>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="report-summary-box">
            <h3>Podsumowanie Wykonawcze</h3>
            <p>{report.executive_summary}</p>
          </div>

          {/* Action Bar with Download PDF */}
          <div className="report-actions-bar">
            <button
              type="button"
              className={`primary-button pdf-download-btn ${isDownloading ? "loading" : ""}`}
              onClick={handleDownloadPdf}
              disabled={isDownloading}
            >
              <Download size={18} />
              <span>{isDownloading ? "Generowanie i pobieranie PDF..." : "Pobierz Pełny Raport PDF (Wydanie do Druku)"}</span>
            </button>

            <button
              type="button"
              className="secondary-button compact-btn"
              onClick={() => downloadReportJson(report)}
            >
              <Download size={15} />
              <span>Eksportuj JSON</span>
            </button>

            <button
              type="button"
              className="ghost-button compact-btn"
              onClick={onNewAudit}
            >
              <RotateCcw size={15} />
              <span>Nowa analiza</span>
            </button>
          </div>

          {generatedPdfUrl ? (
            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", background: "rgba(45, 90, 70, 0.08)", border: "1px solid #2D5A46", padding: "10px 14px", borderRadius: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CheckCircle2 size={18} color="#2D5A46" />
                <span style={{ fontSize: "0.86rem", color: "#10221F", fontWeight: 600 }}>Plik PDF został pomyślnie utworzony:</span>
              </div>
              <a
                href={generatedPdfUrl}
                download={`plan-harmonii-raport-${Date.now()}.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: "#2D5A46", color: "#FFFFFF", padding: "6px 14px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}
              >
                Otwórz / Zapisz PDF w nowej karcie ↗
              </a>
            </div>
          ) : null}

          {downloadError ? (
            <div className="report-error-banner" style={{ background: "#FDF2F2", border: "1px solid #F87171", padding: "10px 14px", borderRadius: "8px", color: "#B91C1C", fontSize: "0.85rem", marginTop: "10px" }}>
              {downloadError}
            </div>
          ) : null}

          {/* 9 BAGUA SECTORS MATRIX (SIATKA 9 STREF DOMU) */}
          {report.sector_map && report.sector_map.length > 0 ? (
            <div className="report-bagua-sectors-section" style={{ marginTop: "24px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--ink)", margin: 0 }}>Siatka 9 Stref Bagua & Wpływy Roczne (Luo Shu 2026)</h3>
                <span style={{ fontSize: "0.75rem", background: "rgba(45, 90, 70, 0.1)", color: "#2D5A46", padding: "4px 8px", borderRadius: "6px", fontWeight: 700 }}>9 Pałaców Lokalu</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                {report.sector_map.map((sec, idx) => (
                  <div key={idx} style={{ background: "#FBF9F4", border: "1px solid var(--line)", borderRadius: "8px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "0.78rem", color: "#C59642", textTransform: "uppercase" }}>{sec.direction} {sec.trigram ? `· ${sec.trigram}` : ""}</strong>
                      <span style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 600 }}>Żywioł: {sec.element}</span>
                    </div>
                    <span style={{ fontSize: "0.86rem", fontWeight: 800, color: "var(--ink)" }}>{sec.sector}</span>
                    <small style={{ fontSize: "0.74rem", color: "#2E7D5A", fontWeight: 600 }}>Obecna funkcja: {sec.current_use}</small>
                    <p style={{ fontSize: "0.75rem", color: "var(--ink-soft)", margin: "4px 0 0 0", lineHeight: 1.35 }}>{sec.assessment || sec.advice}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* RESIDENT INTEL IN REPORT MODAL */}
          {report.resident_analysis && report.resident_analysis.length > 0 ? (
            <div className="report-residents-section" style={{ marginTop: "24px", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--ink)", marginBottom: "12px" }}>Weryfikacja Ustawień Mebli Domowników (Kua & Rok 2026)</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                {report.resident_analysis.map((res, idx) => (
                  <article key={idx} style={{ background: "#FFFFFF", border: "1px solid var(--line)", borderRadius: "10px", padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <strong style={{ fontSize: "0.95rem", color: "var(--ink)" }}>{res.name} ({res.role})</strong>
                      <span style={{ background: "rgba(197, 150, 66, 0.15)", color: "#C59642", fontWeight: 800, fontSize: "0.72rem", padding: "3px 8px", borderRadius: "99px" }}>
                        {res.kua_number ? `Kua ${res.kua_number} (${res.element})` : res.group}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--ink)", whiteSpace: "pre-line", lineHeight: 1.5, margin: "0 0 10px 0" }}>
                      {res.placement_advice}
                    </div>
                    {res.favorable_directions?.length ? (
                      <div style={{ fontSize: "0.75rem", color: "#2E7D5A", fontWeight: 600, background: "rgba(46, 125, 90, 0.08)", padding: "6px 8px", borderRadius: "6px" }}>
                        ✨ Kierunki sprzyjające: {res.favorable_directions.join(" · ")}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {/* Key Room Diagnostics */}
          {report.room_recommendations && report.room_recommendations.length > 0 ? (
            <div className="report-rooms-section">
              <h3>Diagnoza Stref i Pomieszczeń</h3>
              <div className="report-rooms-grid">
                {report.room_recommendations.map((room, idx) => (
                  <article key={idx} className="report-room-card">
                    <div className="room-card-head">
                      <strong>{room.room} ({room.function})</strong>
                      <span className="room-sector-tag">{room.method}</span>
                    </div>
                    <p className="room-assessment">{room.diagnosis}</p>
                    {room.recommendations && room.recommendations.length > 0 ? (
                      <div className="room-remedy-box">
                        <strong>Zalecenia:</strong>
                        <p>{room.recommendations.join(" · ")}</p>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {/* Priority Actions */}
          {report.priority_actions && report.priority_actions.length > 0 ? (
            <div className="report-remedies-section">
              <h3>Kluczowe Działania o Najwyższym Wpływie</h3>
              <div className="remedies-list">
                {report.priority_actions.map((action, idx) => (
                  <div key={idx} className="remedy-item">
                    <div className="remedy-num">{idx + 1}</div>
                    <div className="remedy-content">
                      <div className="remedy-head">
                        <strong>{action.title}</strong>
                        <span className="remedy-priority priority-wysoki">
                          Wpływ: {action.impact}
                        </span>
                      </div>
                      <p>{action.why}</p>
                      <small className="remedy-impact">Metoda: {action.method} · Nakład pracy: {action.effort}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="report-modal-footer">
          <div className="report-footer-info">
            <ShieldCheck size={16} />
            <span>Raport oparty na tradycyjnych zasadach Szkoły Formy, Bagua i nowoczesnej ergonomii.</span>
          </div>
          <button type="button" className="secondary-button" onClick={onClose}>
            Wróć do Studia Planowania
          </button>
        </div>
      </div>
    </div>
  );
}
