"use client";

import { useRouter } from "next/navigation";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Filter, SortAsc } from "lucide-react";
import { useState } from "react";

interface FilterControlsProps {
  addressUrl: string;  // Just pass the base URL instead of raw address
  currentFilter: string;
  currentSort: string;
  currentPage: number;
}

export function FilterControls({ 
  addressUrl, 
  currentFilter, 
  currentSort, 
  currentPage 
}: FilterControlsProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  
  const createUrl = (newParams: Record<string, string | number>) => {
    const params = new URLSearchParams();
    
    // Add current params
    if (currentFilter) params.set('filter', currentFilter);
    if (currentSort) params.set('sort', currentSort);
    if (currentPage) params.set('page', currentPage.toString());
    
    // Override with new params
    Object.entries(newParams).forEach(([key, value]) => {
      params.set(key, value.toString());
    });
    
    return `${addressUrl}?${params.toString()}`;
  };

  const handleChange = (key: string, value: string) => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push(createUrl({ [key]: value, page: 1 }));
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <div className="flex items-center">
        <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
        <Select
          value={currentFilter}
          onValueChange={(value) => handleChange('filter', value)}
          disabled={isNavigating}
        >
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center">
        <SortAsc className="h-4 w-4 mr-2 text-muted-foreground" />
        <Select
          value={currentSort}
          onValueChange={(value) => handleChange('sort', value)}
          disabled={isNavigating}
        >
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="highest">Highest Amount</SelectItem>
            <SelectItem value="lowest">Lowest Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}