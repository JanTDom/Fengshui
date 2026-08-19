import { useState, useEffect } from "react";
import { LandingPage } from "./components/marketing/LandingPage";
import { AccessGateModal } from "./components/checkout/AccessGateModal";
import { FengShuiWorkspace } from "./components/workspace/FengShuiWorkspace";
import type { PropertyKey } from "./data";

export default function App() {
  const [workspaceActive, setWorkspaceActive] = useState<boolean>(() => {
    // Check if user previously had an active project session in URL or localStorage
    const params = new URLSearchParams(window.location.search);
    return params.get("workspace") === "true";
  });

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("full");
  const [propertyKey, setPropertyKey] = useState<PropertyKey>("flat");
  const [userEmail, setUserEmail] = useState("");
  const [hasUnlockedAccess, setHasUnlockedAccess] = useState(false);

  // Sync workspace state to URL query parameter cleanly
  useEffect(() => {
    const url = new URL(window.location.href);
    if (workspaceActive) {
      url.searchParams.set("workspace", "true");
    } else {
      url.searchParams.delete("workspace");
    }
    window.history.replaceState({}, "", url.toString());
  }, [workspaceActive]);

  function handleOpenCheckout(planId?: string) {
    if (planId) {
      setSelectedPlanId(planId);
    }
    setCheckoutModalOpen(true);
  }

  function handleUnlockWorkspace(details: {
    email: string;
    planId: string;
    propertyKey: PropertyKey;
  }) {
    setUserEmail(details.email);
    setSelectedPlanId(details.planId);
    setPropertyKey(details.propertyKey);
    setHasUnlockedAccess(true);
    setWorkspaceActive(true);
  }

  return (
    <div className="app-root">
      {workspaceActive ? (
        <FengShuiWorkspace
          userEmail={userEmail}
          selectedPlanId={selectedPlanId}
          propertyKey={propertyKey}
          onExitToHome={() => setWorkspaceActive(false)}
        />
      ) : (
        <LandingPage
          onOpenCheckout={handleOpenCheckout}
          onEnterWorkspaceDirectly={hasUnlockedAccess ? () => setWorkspaceActive(true) : undefined}
          hasActiveProject={hasUnlockedAccess}
        />
      )}

      <AccessGateModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        selectedPlanId={selectedPlanId}
        onSelectPlanId={setSelectedPlanId}
        onUnlockWorkspace={handleUnlockWorkspace}
      />
    </div>
  );
}
