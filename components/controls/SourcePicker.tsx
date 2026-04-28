"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function SourcePicker({
  source,
  setSource,
}: {
  source: string;
  setSource: (value: string) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-sm font-semibold text-center w-full">
        Data Source
      </div>

      <Select value={source} onValueChange={setSource}>
        <SelectTrigger size="sm" className="bg-background w-full">
          <SelectValue placeholder="Sources" />
        </SelectTrigger>

        <SelectContent align="end">
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="sat">Satellite</SelectItem>
          <SelectItem value="rad">Radar</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export default SourcePicker;