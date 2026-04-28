"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function AircraftPicker({
  sizeClass,
  setSizeClass,
}: {
  sizeClass: string;
  setSizeClass: (value: string) => void;
}) {
  return (
    <div className="flex flex-col items-center">
        <div className="text-sm font-semibold text-center w-full">
            Aircraft Size
        </div>

        <Select value={sizeClass} onValueChange={(value) => setSizeClass(value)}>
        <SelectTrigger size="sm" className="bg-background w-full">
            <SelectValue placeholder="Aircraft Size" />
        </SelectTrigger>

        <SelectContent align="end">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="l">Light</SelectItem>
            <SelectItem value="m">Medium</SelectItem>
            <SelectItem value="h">Heavy</SelectItem>
        </SelectContent>
        </Select>
    </div>

  );
}

export default AircraftPicker;
