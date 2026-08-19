import { useRef, useState } from "react";
import { ArrowRight, FileCheck2, FileText, FileUp, ShieldCheck, Sparkles, UploadCloud, Zap } from "lucide-react";

interface HeroSectionProps {
  onStartAnalysis: () => void;
  onViewReportDetails: () => void;
  onUploadPlanFile?: (file: File) => void;
  onTrySamplePlan?: () => void;
}

export function HeroSection({
  onStartAnalysis,
  onViewReportDetails,
  onUploadPlanFile,
  onTrySamplePlan
}: HeroSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (onUploadPlanFile) {
        onUploadPlanFile(file);
      } else {
        onStartAnalysis();
      }
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (onUploadPlanFile) {
        onUploadPlanFile(file);
      } else {
        onStartAnalysis();
      }
    }
  }

  function triggerFileInput() {
    fileInputRef.current?.click();
  }

  return (
    <section className="mkt-hero" id="top">
      <div className="mkt-container">
        <div className="mkt-hero-grid">
          {/* Left Column: Value proposition & CTAs */}
          <div className="mkt-hero-copy">
            <div className="mkt-eyebrow">
              <Sparkles size={16} />
              <span>Wielometodowy Silnik AI & Architektura Wnętrz</span>
            </div>
            <h1 className="mkt-hero-title">Sprawdź swój dom według zasad Feng Shui</h1>
            <p className="mkt-hero-lead">
              Wgraj rzut mieszkania lub domu (PDF, PNG, JPG). Inteligentna platforma łączy klasyczną
              Szkołę Formy (Luan Tou), siatkę 9 stref Bagua i orientację kompasową ze współczesną
              ergonomią, doświetleniem i bezkosztowymi korektami mebli.
            </p>

            <div className="mkt-hero-actions">
              <button
                className="mkt-btn-primary"
                type="button"
                onClick={onStartAnalysis}
              >
                <span>Rozpocznij analizę Feng Shui</span>
                <ArrowRight size={18} />
              </button>
              <button
                className="mkt-btn-secondary"
                type="button"
                onClick={onViewReportDetails}
              >
                <span>Zobacz przykładowy raport</span>
                <FileText size={18} />
              </button>
            </div>

            <div className="mkt-trust-strip">
              <div className="mkt-trust-item">
                <ShieldCheck size={18} />
                <span>Zero pseudonauki i magicznych obietnic</span>
              </div>
              <div className="mkt-trust-divider" />
              <div className="mkt-trust-item">
                <FileCheck2 size={18} />
                <span>Profesjonalny raport PDF od 39 zł</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Dropzone with Frosted Floor Plan Blueprint */}
          <div
            className={`mkt-hero-dropzone-card ${isDragOver ? "drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            role="button"
            tabIndex={0}
            aria-label="Wgraj plan swojego lokalu"
          >
            {/* Background architectural illustration with soft mist overlay */}
            <div className="mkt-dropzone-bg-illustration" />
            <div className="mkt-dropzone-mist-overlay" />

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.heif"
              style={{ display: "none" }}
            />

            <div className="mkt-dropzone-content">
              <div className="mkt-dropzone-head-badge">
                <Sparkles size={15} />
                <span>Studio Planowania Przestrzennego</span>
              </div>

              <div className="mkt-upload-icon-circle">
                <UploadCloud size={38} />
              </div>

              <h2 className="mkt-dropzone-title">Wgraj rzut swojego mieszkania lub domu</h2>
              <p className="mkt-dropzone-subtitle">
                Przeciągnij plik PDF, JPG, PNG tutaj lub kliknij, aby wybrać z dysku
              </p>

              <div className="mkt-format-pills">
                <span className="mkt-pill">PDF</span>
                <span className="mkt-pill">PNG</span>
                <span className="mkt-pill">JPG / Zdjęcie</span>
                <span className="mkt-pill">WEBP</span>
              </div>

              <div className="mkt-dropzone-action-btn">
                <FileUp size={18} />
                <span>Wybierz plik rzutu z dysku</span>
              </div>

              <div
                className="mkt-dropzone-sample-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onTrySamplePlan) {
                    onTrySamplePlan();
                  } else {
                    onStartAnalysis();
                  }
                }}
              >
                <Zap size={14} />
                <span>Nie masz pliku? Wypróbuj na przykładowym planie (64 m²)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
