"use client";

import { useState, useCallback, useMemo } from "react";

export const ONBOARDING_STEPS = [
  { id: "calendar", label: "Calendar" },
  { id: "constraints", label: "Constraints" },
  { id: "preferences", label: "Preferences" },
  { id: "locations", label: "Locations" },
  { id: "weather", label: "Weather" },
  { id: "openhouse", label: "Open House" },
  { id: "contacts", label: "Contacts" },
  { id: "review", label: "Review" },
] as const;

export type StepId = (typeof ONBOARDING_STEPS)[number]["id"];

export interface CalendarEvent {
  id: string;
  title: string;
  day: string; // "mon", "tue", etc.
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  isBusy: boolean;
}

export interface Constraint {
  id: string;
  type: "sleep" | "nap" | "transit" | "work" | "custom";
  label: string;
  days: string[];
  startTime: string;
  endTime: string;
}

export interface Location {
  id: string;
  label: string;
  type: "home" | "playground" | "cafe" | "park" | "other";
  address: string;
  hostingOk: boolean;
}

export interface OnboardingData {
  calendar: {
    events: CalendarEvent[];
  };
  constraints: {
    items: Constraint[];
    transitBuffer: number;
  };
  preferences: {
    engagementTypes: string[];
    maxEventsPerWeek: number;
    preferMornings: boolean;
    preferAfternoons: boolean;
    preferEvenings: boolean;
    preferWeekends: boolean;
  };
  locations: {
    items: Location[];
  };
  weather: {
    weatherSensitive: boolean;
    rainAlternative: string;
  };
  openhouse: {
    day: string;
    startTime: string;
    endTime: string;
    note: string;
  };
  contacts: Record<string, unknown>;
  review: Record<string, unknown>;
}

const DEFAULT_DATA: OnboardingData = {
  calendar: {
    events: [],
  },
  constraints: {
    items: [
      {
        id: "default-sleep",
        type: "sleep",
        label: "Sleep",
        days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
        startTime: "22:00",
        endTime: "07:00",
      },
    ],
    transitBuffer: 30,
  },
  preferences: {
    engagementTypes: [],
    maxEventsPerWeek: 3,
    preferMornings: false,
    preferAfternoons: true,
    preferEvenings: false,
    preferWeekends: true,
  },
  locations: {
    items: [],
  },
  weather: {
    weatherSensitive: false,
    rainAlternative: "",
  },
  openhouse: {
    day: "",
    startTime: "",
    endTime: "",
    note: "",
  },
  contacts: {},
  review: {},
};

export function useOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);
  const [isSaving, setIsSaving] = useState(false);

  const totalSteps = ONBOARDING_STEPS.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const isComplete = currentStep >= totalSteps;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const currentStepInfo = ONBOARDING_STEPS[currentStep];
  const currentStepId = currentStepInfo?.id as StepId | undefined;

  const next = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const back = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
      }
    },
    [totalSteps]
  );

  const updateStepData = useCallback(
    <K extends StepId>(stepId: K, stepData: Partial<OnboardingData[K]>) => {
      setData((prev) => ({
        ...prev,
        [stepId]: { ...prev[stepId], ...stepData },
      }));
    },
    []
  );

  const save = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error("Failed to save onboarding data");
      }

      return true;
    } catch (err) {
      console.error("Failed to save onboarding:", err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [data]);

  return useMemo(
    () => ({
      currentStep,
      currentStepId,
      currentStepInfo,
      totalSteps,
      progress,
      isFirstStep,
      isLastStep,
      isComplete,
      isSaving,
      data,
      next,
      back,
      goToStep,
      updateStepData,
      save,
    }),
    [
      currentStep,
      currentStepId,
      currentStepInfo,
      totalSteps,
      progress,
      isFirstStep,
      isLastStep,
      isComplete,
      isSaving,
      data,
      next,
      back,
      goToStep,
      updateStepData,
      save,
    ]
  );
}
