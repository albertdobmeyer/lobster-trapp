import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePrerequisites } from "@/hooks/usePrerequisites";
import { useManifests } from "@/hooks/useManifests";
import { useAppContext } from "@/lib/AppContext";
import WelcomeStep from "@/components/wizard/WelcomeStep";
import PrerequisitesStep from "@/components/wizard/PrerequisitesStep";
import SubmodulesStep from "@/components/wizard/SubmodulesStep";
import ConfigStep from "@/components/wizard/ConfigStep";
import SetupComponentsStep from "@/components/wizard/SetupComponentsStep";
import CompleteStep from "@/components/wizard/CompleteStep";

type Step = "welcome" | "prerequisites" | "submodules" | "config" | "setup-components" | "complete";

const STEP_ORDER: Step[] = [
  "welcome",
  "prerequisites",
  "submodules",
  "config",
  "setup-components",
  "complete",
];

export default function Setup() {
  const [step, setStep] = useState<Step>("welcome");
  const { report, checking, initializing, check, initSubs, createConfig } =
    usePrerequisites();
  const { components } = useManifests();
  const { updateSettings } = useAppContext();
  const navigate = useNavigate();

  // Run check when moving past welcome
  useEffect(() => {
    if (step === "prerequisites" && !report && !checking) {
      check();
    }
  }, [step, report, checking, check]);

  const currentIndex = STEP_ORDER.indexOf(step);

  function goNext() {
    if (currentIndex < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[currentIndex + 1]);
    }
  }

  function goBack() {
    if (currentIndex > 0) {
      setStep(STEP_ORDER[currentIndex - 1]);
    }
  }

  async function handleFinish() {
    await updateSettings({ wizardCompleted: true });
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Progress indicator */}
      {step !== "welcome" && (
        <div className="px-8 pt-6">
          <div className="flex items-center gap-1 max-w-lg mx-auto">
            {STEP_ORDER.slice(1, -1).map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full ${
                  i < currentIndex - 1
                    ? "bg-blue-500"
                    : i === currentIndex - 1
                      ? "bg-blue-500"
                      : "bg-gray-800"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-6">
        {step === "welcome" && <WelcomeStep onNext={goNext} />}
        {step === "prerequisites" && (
          <PrerequisitesStep
            report={report}
            checking={checking}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === "submodules" && (
          <SubmodulesStep
            report={report}
            initializing={initializing}
            onInit={initSubs}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === "config" && (
          <ConfigStep
            report={report}
            onCreateConfig={createConfig}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === "setup-components" && (
          <SetupComponentsStep
            components={components}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === "complete" && (
          <CompleteStep components={components} onFinish={handleFinish} />
        )}
      </div>
    </div>
  );
}
