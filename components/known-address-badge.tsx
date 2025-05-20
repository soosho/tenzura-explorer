"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getKnownAddress } from "@/config/known-addresses";
import { CreditCard } from "lucide-react";

interface AddressBadgeProps {
  address: string;
  showIcon?: boolean;
}

export function KnownAddressBadge({ address, showIcon = true }: AddressBadgeProps) {
  const knownAddress = getKnownAddress(address);
  
  if (!knownAddress) return null;
  
  // Define the allowed variant types
  type BadgeVariant = "default" | "outline" | "secondary" | "destructive";

  // Different badge variants based on address type with proper typing
  const variantMap: Record<string, BadgeVariant> = {
    developer: "default",
    exchange: "outline",
    funding: "secondary",
    team: "destructive",
    foundation: "secondary",
    other: "outline"
  };
  
  // Now this will be correctly typed
  const variant = variantMap[knownAddress.type] || "default";
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="ml-2">
            {showIcon && <CreditCard className="h-3 w-3 mr-1" />}
            {knownAddress.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{knownAddress.description || knownAddress.label}</p>
          {knownAddress.verified && <p className="text-xs text-green-500">Verified</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}