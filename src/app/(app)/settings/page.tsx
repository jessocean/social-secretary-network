"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, CalendarDays, RefreshCw, Unlink, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CALENDAR_MODE = process.env.NEXT_PUBLIC_CALENDAR_MODE || "mock";

interface CalendarStatus {
  connected: boolean;
  calendarId?: string;
  lastSyncAt?: string;
}

export default function SettingsPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatus>({
    connected: false,
  });
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (CALENDAR_MODE !== "google") {
      setLoadingCalendar(false);
      return;
    }

    fetch("/api/calendar/status")
      .then((r) => r.json())
      .then((data) => setCalendarStatus(data))
      .catch(() => {})
      .finally(() => setLoadingCalendar(false));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Synced ${data.count} events from Google Calendar`);
        // Refresh status
        const statusRes = await fetch("/api/calendar/status");
        const statusData = await statusRes.json();
        setCalendarStatus(statusData);
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch {
      toast.error("Failed to sync calendar");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/calendar/connection", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCalendarStatus({ connected: false });
        toast.success("Google Calendar disconnected");
      } else {
        toast.error(data.error || "Disconnect failed");
      }
    } catch {
      toast.error("Failed to disconnect calendar");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      localStorage.clear();
    } catch {}
    await new Promise((r) => setTimeout(r, 800));
    setDeleting(false);
    setShowDeleteConfirm(false);
    toast.success("Account deleted. All data has been removed.");
    window.location.href = "/";
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>

      {CALENDAR_MODE === "google" && (
        <Card className="mb-4">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 text-gray-500" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  Google Calendar
                </h3>
                {loadingCalendar ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Checking connection...
                  </p>
                ) : calendarStatus.connected ? (
                  <>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Connected to {calendarStatus.calendarId || "primary calendar"}
                    </p>
                    {calendarStatus.lastSyncAt && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Last synced:{" "}
                        {new Date(calendarStatus.lastSyncAt).toLocaleString()}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSync}
                        disabled={syncing}
                      >
                        {syncing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        {syncing ? "Syncing..." : "Re-sync"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        {disconnecting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Unlink className="h-4 w-4" />
                        )}
                        {disconnecting ? "Disconnecting..." : "Disconnect"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Not connected. Connect to sync your availability.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        window.location.href =
                          "/api/auth/google/authorize?returnTo=/settings";
                      }}
                    >
                      <CalendarDays className="h-4 w-4" />
                      Connect Google Calendar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-red-200">
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Delete my account
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Permanently delete your account, remove all connections, and erase your data.
                This cannot be undone.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete my account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete your account, remove all friend
              connections, and erase all your data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Yes, delete my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
