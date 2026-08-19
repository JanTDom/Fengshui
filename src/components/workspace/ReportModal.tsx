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
              <span>Wyniki kompleksowego audytu Feng Shui</span>
            </div>
            <h2>Raport strategiczny i zalecenia dla Twojego lokalu</h2>
          </div>
          <button type="button" className="checkout-close-btn" onClick={onClose} aria-label="Zamknij">
            <X size={20} />
          </button>
        </div>

        <div className="report-modal-body">
          {/* Executive Overview Header */}
          <div className="report-cover-box">
            <div className="report-score-block">
              <span className="score-label">Wskaźnik harmonii układu</span>
              <div className="score-number-row">
                <strong>{report.score}</strong>
                <span>/100</span>
              </div>
              <small>Poziom pewności: {confidenceLabel(report.confidence)}</small>
            </div>

            <div className="report-decision-block">
              <span className="decision-label">Rekomendacja decyzyjna</span>
              <p className="decision-text">{report.purchase_decision}</p>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="report-summary-box">
            <h3>Podsumowanie wykonawcze</h3>
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
              <span>{isDownloading ? "Generowanie i pobieranie PDF..." : "Pobierz pełny raport PDF (wydanie do druku)"}</span>
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
                Otwórz lub zapisz PDF w nowej karcie ↗
              </a>
            </div>
          ) : null}

          {downloadError ? (
            <div className="report-error-banner" style={{ background: "#FDF2F2", border: "1px solid #F87171", padding: "10px 14px", borderRadius: "8px", color: "#B91C1C", fontSize: "0.85rem", marginTop: "10px" }}>
              {downloadError}
            </div>
          ) : null}

          {/* 3 HIGHLIGHTS CARDS (ATUTY, WYZWANIA, ZALECENIA) */}
          {report.executive_summary_points ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginTop: "16px", marginBottom: "20px" }}>
              <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "8px", padding: "12px" }}>
                <strong style={{ display: "block", color: "#166534", fontSize: "0.82rem", textTransform: "uppercase", marginBottom: "6px" }}>
                  ✓ 3 Największe Atuty
                </strong>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.78rem", color: "#14532D", lineHeight: 1.45 }}>
                  {report.executive_summary_points.top_three_assets.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>

              <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "12px" }}>
                <strong style={{ display: "block", color: "#991B1B", fontSize: "0.82rem", textTransform: "uppercase", marginBottom: "6px" }}>
                  ⚠ 3 Kluczowe Wyzwania
                </strong>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.78rem", color: "#7F1D1D", lineHeight: 1.45 }}>
                  {report.executive_summary_points.top_three_challenges.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "8px", padding: "12px" }}>
                <strong style={{ display: "block", color: "#92400E", fontSize: "0.82rem", textTransform: "uppercase", marginBottom: "6px" }}>
                  ⚡ 5 Natychmiastowych Zaleceń
                </strong>
                <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.78rem", color: "#78350F", lineHeight: 1.45 }}>
                  {report.executive_summary_points.top_five_instant_actions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {/* CEL KONSULTACJI & METODOLOGIA */}
          {report.consultation_goal ? (
            <div style={{ background: "#FFFDFB", border: "1px solid #E0D7C6", borderRadius: "8px", padding: "14px 16px", marginTop: "16px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.72rem", color: "#C49544", fontWeight: 800, textTransform: "uppercase" }}>Cel Konsultacji & Metodologia Badawcza</span>
                <span style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 600 }}>Eva Wong · Stephen Skinner · Luan Tou · Ba Zhai · Xuan Kong</span>
              </div>
              <strong style={{ fontSize: "0.95rem", color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                {report.consultation_goal.primary_goal}
              </strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                {report.consultation_goal.focus_areas.map((f, i) => (
                  <span key={i} style={{ background: "rgba(196, 149, 68, 0.12)", color: "#8E601B", fontSize: "0.74rem", padding: "3px 8px", borderRadius: "6px", fontWeight: 600 }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* 9 BAGUA SECTORS MATRIX (SIATKA 9 STREF DOMU) */}
          {report.sector_map && report.sector_map.length > 0 ? (
            <div className="report-bagua-sectors-section" style={{ marginTop: "24px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--ink)", margin: 0 }}>Siatka 9 stref Bagua i wpływy roczne (Luo Shu 2026)</h3>
                <span style={{ fontSize: "0.75rem", background: "rgba(45, 90, 70, 0.1)", color: "#2D5A46", padding: "4px 8px", borderRadius: "6px", fontWeight: 700 }}>9 pałaców lokalu</span>
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

          {/* FLYING STARS NATAL CHART IF PRESENT */}
          {report.natal_chart ? (
            <div style={{ background: "#FAF8F4", border: "1px solid #D8CDB8", borderRadius: "8px", padding: "14px 16px", marginTop: "20px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--ink)", margin: 0 }}>Xuan Kong Fei Xing — Latające Gwiazdy Okresu 9 (2024–2043)</h3>
                <span style={{ fontSize: "0.72rem", color: "#8E601B", fontWeight: 700 }}>Fasada: {report.natal_chart.facing_direction} · Tył: {report.natal_chart.sitting_direction}</span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--ink)", lineHeight: 1.45, margin: "0 0 10px 0" }}>
                {report.natal_chart.period9_strategy}
              </p>
            </div>
          ) : null}

          {/* RESIDENT INTEL IN REPORT MODAL */}
          {report.resident_analysis && report.resident_analysis.length > 0 ? (
            <div className="report-residents-section" style={{ marginTop: "24px", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--ink)", marginBottom: "12px" }}>Weryfikacja ustawień mebli domowników (Kua i rok 2026)</h3>
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
            <div className="report-rooms-section" style={{ marginTop: "24px", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--ink)", marginBottom: "12px" }}>Audyt pomieszczenie po pomieszczeniu</h3>
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

          {/* 3 KEY FURNITURE PILLARS */}
          {report.furniture_recommendations && report.furniture_recommendations.length > 0 ? (
            <div style={{ marginTop: "24px", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--ink)", marginBottom: "12px" }}>3 Kluczowe filary meblowe (Łóżko, Biurko, Płyta)</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                {report.furniture_recommendations.slice(0, 4).map((f, idx) => (
                  <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E0D7C6", borderRadius: "8px", padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <strong style={{ fontSize: "0.88rem", color: "var(--ink)" }}>{f.item}</strong>
                      <span style={{ fontSize: "0.7rem", color: "#C49544", fontWeight: 700 }}>{f.orientation_role}</span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#41524B", margin: "4px 0 8px 0", lineHeight: 1.4 }}>{f.assessment}</p>
                    <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.75rem", color: "#2D3E38", lineHeight: 1.4 }}>
                      {f.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* PRIORITIZED ISSUES P1-P4 */}
          {report.prioritized_issues && report.prioritized_issues.length > 0 ? (
            <div style={{ marginTop: "24px", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--ink)", marginBottom: "12px" }}>Matryca problemów z priorytetami (P1–P4)</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {report.prioritized_issues.map((iss, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "12px", background: "#FBF9F4", border: "1px solid #E0D7C6", borderRadius: "8px", padding: "10px 14px" }}>
                    <span style={{
                      background: iss.code === "P1" ? "#DC2626" : iss.code === "P2" ? "#D97706" : iss.code === "P3" ? "#2563EB" : "#16A34A",
                      color: "#FFFFFF",
                      fontWeight: 800,
                      fontSize: "0.78rem",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      minWidth: "32px",
                      textAlign: "center"
                    }}>
                      {iss.code}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "0.86rem", color: "var(--ink)" }}>{iss.title}</strong>
                        <span style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600 }}>{iss.category}</span>
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "#41524B", margin: "2px 0 4px 0" }}>{iss.diagnosis}</p>
                      <small style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 700 }}>Korekta: {iss.remedy_action}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* 3-TIERED RECOMMENDATIONS */}
          {report.tiered_recommendations ? (
            <div style={{ marginTop: "24px", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--ink)", marginBottom: "12px" }}>3-Poziomowe rekomendacje korekt</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
                <div style={{ background: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "8px", padding: "12px" }}>
                  <strong style={{ display: "block", color: "#166534", fontSize: "0.82rem", textTransform: "uppercase", marginBottom: "6px" }}>
                    Poziom 1: Bez remontu (Koszt: 0 zł)
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.76rem", color: "#14532D", lineHeight: 1.45 }}>
                    {report.tiered_recommendations.no_renovation_quick_wins.map((r, i) => (
                      <li key={i}>{r.action}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: "8px", padding: "12px" }}>
                  <strong style={{ display: "block", color: "#92400E", fontSize: "0.82rem", textTransform: "uppercase", marginBottom: "6px" }}>
                    Poziom 2: Drobne ingerencje
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.76rem", color: "#78350F", lineHeight: 1.45 }}>
                    {report.tiered_recommendations.light_interventions.map((r, i) => (
                      <li key={i}>{r.action} ({r.cost})</li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: "#F9FAFB", border: "1px solid #D1D5DB", borderRadius: "8px", padding: "12px" }}>
                  <strong style={{ display: "block", color: "#374151", fontSize: "0.82rem", textTransform: "uppercase", marginBottom: "6px" }}>
                    Poziom 3: Prace architektoniczne
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.76rem", color: "#1F2937", lineHeight: 1.45 }}>
                    {report.tiered_recommendations.architectural_renovations.map((r, i) => (
                      <li key={i}>{r.action} ({r.cost})</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          {/* BEFORE AND AFTER SHIFTS */}
          {report.before_after_shifts && report.before_after_shifts.length > 0 ? (
            <div style={{ marginTop: "24px", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--ink)", marginBottom: "12px" }}>Zestawienie zmian przestrzennych „Przed” i „Po”</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {report.before_after_shifts.map((shift, idx) => (
                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "30px 1fr 1fr", gap: "10px", background: "#FFFFFF", border: "1px solid #E0D7C6", borderRadius: "8px", padding: "10px 12px", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, color: "#C49544", fontSize: "0.85rem" }}>[{shift.id}]</span>
                    <div>
                      <small style={{ color: "#DC2626", fontWeight: 700, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Przed:</small>
                      <span style={{ fontSize: "0.78rem", color: "#41524B" }}>{shift.before_state}</span>
                    </div>
                    <div>
                      <small style={{ color: "#16A34A", fontWeight: 700, display: "block", fontSize: "0.7rem", textTransform: "uppercase" }}>Po korekcie:</small>
                      <span style={{ fontSize: "0.78rem", color: "#10221F", fontWeight: 600 }}>{shift.after_recommendation}</span>
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
            <span>Raport zgodny ze standardami Szkoły Formy, Ba Zhai, Xuan Kong Fei Xing & Ergonomii Wnętrz.</span>
          </div>
          <button type="button" className="secondary-button" onClick={onClose}>
            Wróć do Studia Planowania
          </button>
        </div>
      </div>
    </div>
  );
}
