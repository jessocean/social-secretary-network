"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConfirmationFlowProps {
  participantName: string;
  proposalTitle: string;
  onConfirm: () => void;
  onDecline: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConfirmationFlow({
  participantName,
  proposalTitle,
  onConfirm,
  onDecline,
}: ConfirmationFlowProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"replied" | "confirm">("replied");

  const firstName = participantName.split(" ")[0];

  const handleOpen = () => {
    setStep("replied");
    setOpen(true);
  };

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
    setStep("replied");
  };

  const handleDecline = () => {
    onDecline();
    setOpen(false);
    setStep("replied");
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="border-gray-300 text-gray-700 hover:bg-gray-50"
        onClick={handleOpen}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        She replied
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          {step === "replied" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">
                  {firstName} replied!
                </DialogTitle>
                <DialogDescription className="text-center">
                  About: <span className="font-medium text-gray-700">{proposalTitle}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center gap-4 py-4">
                <p className="text-sm text-gray-600 text-center">
                  Can {firstName} make it?
                </p>
                <Button
                  className="w-full bg-gray-900 hover:bg-gray-800"
                  size="lg"
                  onClick={() => setStep("confirm")}
                >
                  Tell me what she said
                </Button>
              </div>
            </>
          )}

          {step === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">
                  Can {firstName} make it?
                </DialogTitle>
                <DialogDescription className="text-center">
                  {proposalTitle}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3 py-4">
                <Button
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                  size="lg"
                  onClick={handleConfirm}
                >
                  <ThumbsUp className="h-5 w-5" />
                  Yes, she can make it!
                </Button>

                <Button
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                  size="lg"
                  onClick={handleDecline}
                >
                  <ThumbsDown className="h-5 w-5" />
                  No, she can&apos;t
                </Button>

                <Button
                  variant="ghost"
                  className="text-gray-500"
                  size="sm"
                  onClick={() => setStep("replied")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
