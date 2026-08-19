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

  async function handleDownloadPdf() {
    if (!report) return;
    try {
      await downloadReportPdf(report, {
        planFile: planFile ?? null,
        northAngleDeg,
        planMarkers
      });
      triggerBrandConfetti();
    } catch (err) {
      console.error("Błąd generowania PDF:", err);
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
              className="primary-button pdf-download-btn"
              onClick={handleDownloadPdf}
            >
              <Download size={18} />
              <span>Pobierz Pełny Raport PDF (Wydanie Gotowe do Druku)</span>
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
              <span>Nowy audyt</span>
            </button>
          </div>

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
