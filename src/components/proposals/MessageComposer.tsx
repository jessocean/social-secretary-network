"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Copy, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MessageComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: {
    title: string;
    type: string;
    startTime: string;
    locationName?: string;
  };
  friendName: string;
}

// ---------------------------------------------------------------------------
// Template generator
// ---------------------------------------------------------------------------

function generateTemplate(
  type: string,
  friendName: string,
  startTime: string,
  locationName?: string
): string {
  const date = new Date(startTime);
  const dayName = format(date, "EEEE");
  const timeStr = format(date, "h:mm a");
  const location = locationName ? ` at ${locationName}` : "";
  const firstName = friendName.split(" ")[0];

  const templates: Record<string, string> = {
    coffee: `Hey ${firstName}! Want to grab coffee on ${dayName} at ${timeStr}${location}? I was thinking we could catch up -- it's been a while! Let me know if that works for you.`,

    playground: `Hey ${firstName}! We're heading to the playground on ${dayName} around ${timeStr}${location}. Would you and the kids want to join? The weather looks great! Let me know!`,

    playdate_home: `Hey ${firstName}! Would you and the little ones want to come over for a playdate on ${dayName} at ${timeStr}? We'll have snacks and the kids can play. Let me know!`,

    dinner: `Hey ${firstName}! We'd love to get together for dinner on ${dayName} at ${timeStr}${location}. Are you free? Would be so nice to catch up over a meal!`,

    park: `Hey ${firstName}! Want to hang out at the park on ${dayName} around ${timeStr}${location}? We can bring snacks and let the kids run around. Let me know!`,

    class: `Hey ${firstName}! There's a class on ${dayName} at ${timeStr}${location} -- want to go together? It could be fun! Let me know if you're interested.`,

    walk: `Hey ${firstName}! Want to go for a walk on ${dayName} around ${timeStr}${location}? It would be nice to get some fresh air and catch up. Let me know!`,

    other: `Hey ${firstName}! Want to hang out on ${dayName} at ${timeStr}${location}? It's been too long -- would love to see you! Let me know if you're free.`,
  };

  return templates[type] ?? templates.other;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageComposer({
  open,
  onOpenChange,
  proposal,
  friendName,
}: MessageComposerProps) {
  const defaultMessage = useMemo(
    () =>
      generateTemplate(
        proposal.type,
        friendName,
        proposal.startTime,
        proposal.locationName
      ),
    [proposal.type, friendName, proposal.startTime, proposal.locationName]
  );

  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Message copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy. Please select and copy manually.");
    }
  };

  const handleReset = () => {
    setMessage(defaultMessage);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-gray-700" />
            Message to {friendName}
          </SheetTitle>
          <SheetDescription>
            Copy this message to send via text, WhatsApp, or any messaging app.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 space-y-3">
          {/* Event context badge */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {proposal.title}
            </Badge>
            {proposal.locationName && (
              <Badge variant="outline" className="text-xs">
                {proposal.locationName}
              </Badge>
            )}
          </div>

          {/* Editable message */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[140px] resize-none text-sm leading-relaxed"
            placeholder="Type your message..."
          />

          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-gray-600 hover:text-gray-700 font-medium"
          >
            Reset to template
          </button>
        </div>

        <SheetFooter className="gap-2 px-4 pt-2">
          <Button
            onClick={handleCopy}
            className="w-full bg-gray-900 hover:bg-gray-800"
            size="lg"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy to clipboard
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
