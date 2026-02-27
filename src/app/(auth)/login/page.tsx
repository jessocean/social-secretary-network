"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AUTH_CONFIG } from "@/lib/auth/config";

const COUNTRY_CODES = [
  { code: "+1", label: "US +1" },
  { code: "+44", label: "UK +44" },
  { code: "+61", label: "AU +61" },
  { code: "+91", label: "IN +91" },
  { code: "+81", label: "JP +81" },
  { code: "+49", label: "DE +49" },
  { code: "+33", label: "FR +33" },
  { code: "+86", label: "CN +86" },
  { code: "+55", label: "BR +55" },
  { code: "+52", label: "MX +52" },
];

export default function LoginPage() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = `${countryCode}${cleaned}`;
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send code.");
        return;
      }

      // Store phone for the verify page
      sessionStorage.setItem("auth_phone", fullPhone);
      router.push("/verify");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Branding */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg">
          <span className="text-2xl font-bold text-white">S</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Social Secretary
        </h1>
        <p className="text-sm text-muted-foreground">
          AI-powered social scheduling for busy parents
        </p>
      </div>

      <Card className="w-full border-0 shadow-lg">
        <CardHeader className="pb-4 pt-6 text-center">
          <h2 className="text-lg font-semibold">Sign in with your phone</h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ll send you a verification code
          </p>
        </CardHeader>
        <CardContent className="pb-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone number</Label>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-[100px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading || phone.replace(/\D/g, "").length < 7}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600"
              size="lg"
            >
              {isLoading ? "Sending..." : "Send verification code"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Dev mode indicator */}
      {AUTH_CONFIG.isDevMode && (
        <Badge variant="secondary" className="text-xs text-muted-foreground">
          Dev mode: any code works
        </Badge>
      )}
    </div>
  );
}
