"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding, ONBOARDING_STEPS } from "@/hooks/useOnboarding";
import { ConnectCalendar } from "@/components/onboarding/ConnectCalendar";
import { CalendarReview } from "@/components/onboarding/CalendarReview";
import { ConstraintsEditor } from "@/components/onboarding/ConstraintsEditor";
import { PreferencesEditor } from "@/components/onboarding/PreferencesEditor";
import { LocationPicker } from "@/components/onboarding/LocationPicker";
import { WeatherPrefs } from "@/components/onboarding/WeatherPrefs";
import { ReviewComplete } from "@/components/onboarding/ReviewComplete";

export default function OnboardingPage() {
  const router = useRouter();
  const onboarding = useOnboarding();

  const handleComplete = async () => {
    const success = await onboarding.save();
    if (success) {
      router.push("/dashboard");
    }
  };

  const renderStep = () => {
    switch (onboarding.currentStepId) {
      case "connect":
        return (
          <ConnectCalendar
            onNext={onboarding.next}
            onBack={onboarding.back}
          />
        );
      case "calendar":
        return (
          <CalendarReview
            data={onboarding.data.calendar}
            onChange={(d) => onboarding.updateStepData("calendar", d)}
            onNext={onboarding.next}
            onBack={onboarding.back}
          />
        );
      case "constraints":
        return (
          <ConstraintsEditor
            data={onboarding.data.constraints}
            onChange={(d) => onboarding.updateStepData("constraints", d)}
            onNext={onboarding.next}
            onBack={onboarding.back}
          />
        );
      case "preferences":
        return (
          <PreferencesEditor
            data={onboarding.data.preferences}
            onChange={(d) => onboarding.updateStepData("preferences", d)}
            onNext={onboarding.next}
            onBack={onboarding.back}
          />
        );
      case "locations":
        return (
          <LocationPicker
            data={onboarding.data.locations}
            onChange={(d) => onboarding.updateStepData("locations", d)}
            onNext={onboarding.next}
            onBack={onboarding.back}
          />
        );
      case "weather":
        return (
          <WeatherPrefs
            data={onboarding.data.weather}
            onChange={(d) => onboarding.updateStepData("weather", d)}
            onNext={onboarding.next}
            onBack={onboarding.back}
          />
        );
      case "review":
        return (
          <ReviewComplete
            data={onboarding.data}
            onChange={() => {}}
            onNext={handleComplete}
            onBack={onboarding.back}
            onComplete={handleComplete}
            isSaving={onboarding.isSaving}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-white">
      {/* Header with progress */}
      <div className="sticky top-0 z-10 bg-white/95 px-4 pb-4 pt-6 backdrop-blur-sm">
        {/* Step indicator */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Step {onboarding.currentStep + 1} of {onboarding.totalSteps}
          </span>
          <span className="text-xs font-medium text-gray-700">
            {ONBOARDING_STEPS[onboarding.currentStep]?.label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gray-900 transition-all duration-500 ease-out"
            style={{ width: `${onboarding.progress}%` }}
          />
        </div>

        {/* Step dots */}
        <div className="mt-3 flex justify-between">
          {ONBOARDING_STEPS.map((step, i) => (
            <button
              key={step.id}
              onClick={() => onboarding.goToStep(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === onboarding.currentStep
                  ? "bg-gray-900"
                  : i < onboarding.currentStep
                    ? "bg-gray-400"
                    : "bg-gray-200"
              }`}
              aria-label={`Go to ${step.label}`}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-4 pb-8">
        <Suspense>{renderStep()}</Suspense>
      </div>
    </div>
  );
}
