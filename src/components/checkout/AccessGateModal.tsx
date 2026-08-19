import { useState } from "react";
import { AlertCircle, Check, Lock, ShieldCheck, Sparkles, X, Zap } from "lucide-react";
import { pricePlans, propertyTypes, type PropertyKey } from "../../data";

interface AccessGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlanId: string;
  onSelectPlanId: (planId: string) => void;
  onUnlockWorkspace: (details: {
    email: string;
    planId: string;
    propertyKey: PropertyKey;
  }) => void;
}

export function AccessGateModal({
  isOpen,
  onClose,
  selectedPlanId,
  onSelectPlanId,
  onUnlockWorkspace
}: AccessGateModalProps) {
  const [email, setEmail] = useState("");
  const [propertyKey, setPropertyKey] = useState<PropertyKey>("flat");
  const [paymentMethod, setPaymentMethod] = useState<"blik" | "p24" | "card">("blik");
  const [blikCode, setBlikCode] = useState("");
  const [consentDigitalDelivery, setConsentDigitalDelivery] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const currentPlan = pricePlans.find((p) => p.id === selectedPlanId) || pricePlans[1];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setErrorMessage("Wprowadź prawidłowy adres e-mail, aby otrzymać raport.");
      return;
    }

    if (!consentDigitalDelivery) {
      setErrorMessage("Zaznacz zgodę na natychmiastowe dostarczenie treści cyfrowych.");
      return;
    }

    if (paymentMethod === "blik" && blikCode.replace(/\s/g, "").length !== 6 && blikCode.length > 0 && isNaN(Number(blikCode))) {
      setErrorMessage("Kod BLIK musi składać się z 6 cyfr.");
      return;
    }

    setIsProcessing(true);

    // Simulate instant payment gateway verification and unlock
    setTimeout(() => {
      setIsProcessing(false);
      onUnlockWorkspace({
        email,
        planId: currentPlan.id,
        propertyKey
      });
      onClose();
    }, 600);
  }

  return (
    <div className="checkout-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="checkout-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="checkout-modal-header">
          <div className="checkout-modal-title">
            <div className="checkout-badge">
              <Sparkles size={16} />
              <span>Dostęp do Studia Planowania</span>
            </div>
            <h2>Wybierz pakiet i przejdź do analizy</h2>
          </div>
          <button type="button" className="checkout-close-btn" onClick={onClose} aria-label="Zamknij">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="checkout-form">
          {/* Plan Selector */}
          <div className="checkout-plan-selector">
            {pricePlans.map((plan) => (
              <label
                key={plan.id}
                className={`checkout-plan-option ${plan.id === selectedPlanId ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="planId"
                  value={plan.id}
                  checked={plan.id === selectedPlanId}
                  onChange={() => onSelectPlanId(plan.id)}
                />
                <div className="checkout-plan-info">
                  <div className="checkout-plan-top">
                    <strong>{plan.title}</strong>
                    <span className="checkout-plan-price">{plan.price}</span>
                  </div>
                  <small>{plan.note}</small>
                </div>
              </label>
            ))}
          </div>

          <div className="checkout-fields-grid">
            <label className="checkout-field">
              <span>Twój adres e-mail (do wysyłki raportu PDF)</span>
              <input
                type="email"
                placeholder="jan.kowalski@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </label>

            <label className="checkout-field">
              <span>Typ analizowanej nieruchomości</span>
              <select
                value={propertyKey}
                onChange={(e) => setPropertyKey(e.target.value as PropertyKey)}
              >
                {propertyTypes.map((pt) => (
                  <option key={pt.key} value={pt.key}>
                    {pt.title} ({pt.short})
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Payment Method Selector */}
          <div className="checkout-payment-methods">
            <span className="checkout-section-label">Metoda płatności:</span>
            <div className="payment-options-grid">
              <button
                type="button"
                className={`payment-option-btn ${paymentMethod === "blik" ? "active" : ""}`}
                onClick={() => setPaymentMethod("blik")}
              >
                <strong>BLIK</strong>
                <small>kod 6-cyfrowy</small>
              </button>
              <button
                type="button"
                className={`payment-option-btn ${paymentMethod === "p24" ? "active" : ""}`}
                onClick={() => setPaymentMethod("p24")}
              >
                <strong>Przelewy24</strong>
                <small>szybki przelew</small>
              </button>
              <button
                type="button"
                className={`payment-option-btn ${paymentMethod === "card" ? "active" : ""}`}
                onClick={() => setPaymentMethod("card")}
              >
                <strong>Karta / Apple Pay</strong>
                <small>Visa / Mastercard</small>
              </button>
            </div>

            {paymentMethod === "blik" ? (
              <div className="blik-input-box">
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  placeholder="Wpisz 6-cyfrowy kod BLIK (np. 123456)"
                  value={blikCode}
                  onChange={(e) => setBlikCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            ) : null}
          </div>

          {/* Legal Compliance Checkbox */}
          <label className="checkout-legal-consent">
            <input
              type="checkbox"
              checked={consentDigitalDelivery}
              onChange={(e) => setConsentDigitalDelivery(e.target.checked)}
            />
            <span>
              Akceptuję <a href="/regulamin.html" target="_blank" rel="noopener noreferrer">Regulamin</a> oraz{" "}
              <a href="/polityka-prywatnosci.html" target="_blank" rel="noopener noreferrer">Politykę prywatności</a>.{" "}
              Wyrażam zgodę na natychmiastowe dostarczenie treści cyfrowej przed upływem 14 dni na odstąpienie od umowy
              i przyjmuję do wiadomości, że tracę prawo do odstąpienia od umowy z chwilą wygenerowania raportu
              (art. 38 ust. 1 pkt 13 ustawy o prawach konsumenta).
            </span>
          </label>

          {errorMessage ? (
            <div className="checkout-error-banner" role="alert">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <div className="checkout-modal-footer">
            <button
              type="submit"
              className="primary-button full-width checkout-submit-btn"
              disabled={isProcessing}
            >
              <Lock size={16} />
              <span>
                {isProcessing
                  ? "Weryfikacja płatności..."
                  : `Opłać ${currentPlan.price} przez Przelewy24`}
              </span>
            </button>

            <div className="checkout-guarantee">
              <ShieldCheck size={16} />
              <span>Płatność Przelewy24 / BLIK · Sprzedawca: Multinewsroom (NIP: 5252189241)</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
