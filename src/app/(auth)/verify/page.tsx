"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { ArrowLeft } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const storedPhone = sessionStorage.getItem("auth_phone");
    if (!storedPhone) {
      router.replace("/login");
      return;
    }
    setPhone(storedPhone);
    // Focus the first input
    inputRefs.current[0]?.focus();
  }, [router]);

  const submitCode = useCallback(
    async (otpCode: string) => {
      setError("");
      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, code: otpCode }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Invalid code. Please try again.");
          setCode(Array(6).fill(""));
          inputRefs.current[0]?.focus();
          return;
        }

        // Redirect based on onboarding status
        if (data.user?.onboardingComplete) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      } catch {
        setError("Something went wrong. Please try again.");
        setCode(Array(6).fill(""));
        inputRefs.current[0]?.focus();
      } finally {
        setIsLoading(false);
      }
    },
    [phone, router]
  );

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (digit && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        submitCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;

    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);

    // Focus appropriate input
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();

    // Auto-submit if 6 digits pasted
    if (pasted.length === 6) {
      submitCode(pasted);
    }
  };

  const maskedPhone = phone
    ? `${phone.slice(0, -4)}${"*".repeat(Math.max(0, phone.length - phone.indexOf(phone.slice(-4))))}`
    : "";

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Branding */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg">
          <span className="text-2xl font-bold text-white">S</span>
        </div>
      </div>

      <Card className="w-full border-0 shadow-lg">
        <CardHeader className="pb-4 pt-6 text-center">
          <h2 className="text-lg font-semibold">Enter verification code</h2>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{maskedPhone || phone}</span>
          </p>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex flex-col items-center gap-6">
            {/* OTP Inputs */}
            <div className="flex gap-2" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isLoading}
                  className="h-12 w-11 rounded-lg border-2 border-gray-200 bg-white text-center text-lg font-semibold text-gray-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {isLoading && (
              <p className="text-sm text-muted-foreground">Verifying...</p>
            )}

            {/* Back to login */}
            <Button
              variant="ghost"
              onClick={() => router.push("/login")}
              className="text-sm text-muted-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Use a different number
            </Button>
          </div>
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
