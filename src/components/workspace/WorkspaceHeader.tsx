import { CheckCircle2, ChevronLeft, Download, FileUp, Sparkles } from "lucide-react";

interface WorkspaceHeaderProps {
  projectTitle: string;
  onUpdateProjectTitle: (title: string) => void;
  onExitToHome: () => void;
  onLoadSamplePlan: () => void;
  hasPlan: boolean;
  isSaving?: boolean;
}

export function WorkspaceHeader({
  projectTitle,
  onUpdateProjectTitle,
  onExitToHome,
  onLoadSamplePlan,
  hasPlan,
  isSaving
}: WorkspaceHeaderProps) {
  return (
    <header className="workspace-header">
      <div className="workspace-header-left">
        <button
          type="button"
          className="workspace-back-btn"
          onClick={onExitToHome}
          title="Powrót do strony głównej"
        >
          <ChevronLeft size={18} />
          <span>Strona główna</span>
        </button>

        <div className="workspace-divider" />

        <div className="workspace-brand">
          <span className="brand-mark mini" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className="workspace-brand-text">e-fengshui.pl</span>
        </div>

        <div className="workspace-project-title-box">
          <input
            type="text"
            className="workspace-project-title-input"
            value={projectTitle}
            onChange={(e) => onUpdateProjectTitle(e.target.value)}
            placeholder="Nazwa projektu (np. Mój Dom)"
          />
        </div>
      </div>

      <div className="workspace-header-right">
        <div className="workspace-save-status">
          <CheckCircle2 size={14} className="save-icon" />
          <span>{isSaving ? "Zapisuję..." : "Zapisano automatycznie"}</span>
        </div>

        {!hasPlan ? (
          <button
            type="button"
            className="secondary-button compact-btn sample-load-btn"
            onClick={onLoadSamplePlan}
          >
            <Sparkles size={14} />
            <span>Załaduj przykładowy rzut</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
