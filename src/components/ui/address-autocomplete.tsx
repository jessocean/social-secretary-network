"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useAddressSearch } from "@/hooks/useAddressSearch";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: { address: string; lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
}

function truncateDisplayName(name: string): string {
  const parts = name.split(", ");
  return parts.slice(0, 4).join(", ");
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search for an address...",
  className,
}: AddressAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { results, isLoading } = useAddressSearch(value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open dropdown when results arrive
  useEffect(() => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  }, [results]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          className={cn("bg-white pr-8", className)}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        {isLoading && (
          <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {results.map((result) => (
            <li key={result.placeId}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-100 active:bg-gray-200"
                onClick={() => {
                  const address = truncateDisplayName(result.displayName);
                  onChange(address);
                  onSelect({ address, lat: result.lat, lng: result.lng });
                  setIsOpen(false);
                }}
              >
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="text-gray-900">
                  {truncateDisplayName(result.displayName)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
