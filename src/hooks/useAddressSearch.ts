"use client";

import { useState, useEffect, useRef } from "react";

export interface AddressResult {
  placeId: number;
  displayName: string;
  lat: number;
  lng: number;
}

export function useAddressSearch(query: string) {
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(async () => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          setResults([]);
          return;
        }

        const data: AddressResult[] = await res.json();
        setResults(data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

  return { results, isLoading };
}
