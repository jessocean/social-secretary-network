"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  CalendarDays,
  Copy,
  Share2,
  Check,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

interface InviteSheetProps {
  open: boolean;
  onClose: () => void;
}

type InviteType = "full" | "calendar_only";
type Step = "choose" | "share";

export function InviteSheet({ open, onClose }: InviteSheetProps) {
  const [step, setStep] = useState<Step>("choose");
  const [inviteType, setInviteType] = useState<InviteType | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSelectType = async (type: InviteType) => {
    setInviteType(type);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) throw new Error("Failed to create invite");

      const data = await res.json();
      setInviteCode(data.code);
      setStep("share");
    } catch {
      toast.error("Failed to create invite link. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const inviteUrl =
    typeof window !== "undefined" && inviteCode
      ? `${window.location.origin}/invite/${inviteCode}`
      : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Invite link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success("Invite link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "Join Social Secretary",
      text:
        inviteType === "full"
          ? "Join me on Social Secretary! Let's make scheduling hangouts effortless."
          : "Share your calendar with me on Social Secretary so we can find time to hang out.",
      url: inviteUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled share - not an error
        if ((err as Error).name !== "AbortError") {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after animation
    setTimeout(() => {
      setStep("choose");
      setInviteType(null);
      setInviteCode(null);
      setCopied(false);
    }, 300);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0">
        {/* Drag handle */}
        <div className="flex justify-center pb-2 pt-1">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {step === "choose" && (
          <>
            <SheetHeader className="px-5">
              <SheetTitle className="text-lg">Invite a friend</SheetTitle>
              <SheetDescription>
                Choose how you want your friend to connect with you.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-3 px-5 pb-6 pt-2">
              {/* Full member option */}
              <button
                className="w-full text-left"
                onClick={() => handleSelectType("full")}
                disabled={isGenerating}
              >
                <Card className="py-0 transition-all hover:border-indigo-300 hover:shadow-md active:scale-[0.98]">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          Full member
                        </span>
                        <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px]">
                          Recommended
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Your friend joins Social Secretary and gets their own AI
                        scheduling assistant. Best for close friends you see
                        regularly.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>

              {/* Calendar-only option */}
              <button
                className="w-full text-left"
                onClick={() => handleSelectType("calendar_only")}
                disabled={isGenerating}
              >
                <Card className="py-0 transition-all hover:border-blue-300 hover:shadow-md active:scale-[0.98]">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <CalendarDays className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-gray-900">
                        Calendar only
                      </span>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Your friend shares calendar availability without joining.
                        Good for acquaintances or busy friends who want less
                        commitment.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>

              {isGenerating && (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating invite link...
                </div>
              )}
            </div>
          </>
        )}

        {step === "share" && inviteCode && (
          <>
            <SheetHeader className="px-5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setStep("choose");
                    setInviteCode(null);
                    setInviteType(null);
                  }}
                  className="rounded-lg p-1 hover:bg-gray-100"
                >
                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <SheetTitle className="text-lg">Share invite link</SheetTitle>
              </div>
              <SheetDescription>
                {inviteType === "full"
                  ? "Send this link to invite a friend to join Social Secretary."
                  : "Send this link to request calendar access from a friend."}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 px-5 pb-6 pt-2">
              {/* Invite type indicator */}
              <div className="flex items-center gap-2">
                {inviteType === "full" ? (
                  <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                    <Users className="mr-1 h-3 w-3" />
                    Full member invite
                  </Badge>
                ) : (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    <CalendarDays className="mr-1 h-3 w-3" />
                    Calendar only invite
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  Expires in 7 days
                </span>
              </div>

              {/* URL display */}
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={inviteUrl}
                  className="h-9 flex-1 bg-gray-50 font-mono text-xs"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-9 w-9 shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <Separator />

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share link
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCopy}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? "Copied!" : "Copy link"}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
