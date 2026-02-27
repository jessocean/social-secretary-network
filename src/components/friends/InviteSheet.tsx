"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Copy,
  Share2,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface InviteSheetProps {
  open: boolean;
  onClose: () => void;
}

export function InviteSheet({ open, onClose }: InviteSheetProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate invite link immediately when sheet opens
  useEffect(() => {
    if (open && !inviteCode && !isGenerating) {
      generateInvite();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateInvite = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "full" }),
      });

      if (!res.ok) throw new Error("Failed to create invite");

      const data = await res.json();
      setInviteCode(data.code);
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
      text: "Join me on Social Secretary! Let's make scheduling hangouts effortless.",
      url: inviteUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
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
    setTimeout(() => {
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

        <SheetHeader className="px-5">
          <SheetTitle className="text-lg">Invite a friend</SheetTitle>
          <SheetDescription>
            Share this link with a friend to connect on Social Secretary.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-5 pb-6 pt-2">
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating invite link...
            </div>
          ) : inviteCode ? (
            <>
              <p className="text-xs text-muted-foreground">
                Your friend can choose to join fully or just share their calendar.
                Link expires in 7 days.
              </p>

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
                    <Check className="h-4 w-4 text-gray-700" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <Separator />

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
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
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
