import { FileUp, Sparkles, UploadCloud, ShieldCheck } from "lucide-react";
import type { ChangeEvent } from "react";

interface EmptyWorkspaceStateProps {
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onLoadSamplePlan: () => void;
}

export function EmptyWorkspaceState({
  onFileSelect,
  onLoadSamplePlan
}: EmptyWorkspaceStateProps) {
  return (
    <div className="empty-workspace-container">
      <div className="empty-workspace-card">
        <div className="empty-workspace-icon-box">
          <UploadCloud size={44} />
        </div>

        <h2>Zacznij od planu swojego domu</h2>
        <p>
          Wgraj rzut mieszkania, domu lub lokalu w formacie PDF, PNG, JPG lub zdjęcie ze smartfona.
          Następnie oznacz kluczowe meble i kierunek północy, aby uruchomić pełną analizę Feng Shui.
        </p>

        <div className="empty-workspace-actions">
          <label className="primary-button large upload-plan-btn">
            <FileUp size={18} />
            <span>Wybierz plik rzutu z dysku</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.heif,application/pdf,image/png,image/jpeg,image/webp,image/heic,image/heif"
              onChange={onFileSelect}
              style={{ display: "none" }}
            />
          </label>

          <button
            type="button"
            className="secondary-button sample-quick-btn"
            onClick={onLoadSamplePlan}
          >
            <Sparkles size={16} />
            <span>Wypróbuj na przykładowym rzucie (64 m²)</span>
          </button>
        </div>

        <div className="empty-workspace-hints">
          <div className="hint-pill">
            <ShieldCheck size={14} />
            <span>Obsługuje PDF deweloperski, PNG, JPG oraz HEIC do 10 MB</span>
          </div>
        </div>
      </div>
    </div>
  );
}
