"use client";

import { useState } from "react";
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
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    // Clear all local data
    try {
      localStorage.clear();
    } catch {}
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    setDeleting(false);
    setShowDeleteConfirm(false);
    toast.success("Account deleted. All data has been removed.");
    // Redirect to landing page
    window.location.href = "/";
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>

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
