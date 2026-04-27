"use client";

import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

const DEFAULT_NUM_STEPS = 16;
const DEFAULT_STEP_MINUTES = 30;

function TimeSlider({
  timeOffset,
  setTimeOffset,
  numSteps = DEFAULT_NUM_STEPS,
  labels,
}: {
  timeOffset: number;
  setTimeOffset: (value: number) => void;
  numSteps?: number;
  labels?: string[];
}) {
  const effectiveNumSteps = labels?.length ? labels.length : numSteps;
  const max = Math.max(0, effectiveNumSteps - 1);
  const safeOffset = Math.min(Math.max(timeOffset, 0), max);

  const rawLabelIndices = [0, Math.floor(max / 4), Math.floor(max / 2), Math.floor((3 * max) / 4), max];
  const labelIndices = Array.from(new Set(rawLabelIndices)).sort((a, b) => a - b);

  const formatLabel = (step: number) => {
    if (labels?.length) return labels[step] ?? "";
    const hours = (step * DEFAULT_STEP_MINUTES) / 60;
    if (step === 0) return "T+0";
    return `+${hours}h`;
  };

  return (
    <Card>
      <CardContent>
        <div className="grid grid-rows-2 gap-y-0">
          <div className="mx-1.5 h-4">
            <Slider
              min={0}
              max={max}
              step={1}
              orientation="horizontal"
              value={[safeOffset]}
              onValueChange={(value) => setTimeOffset(value[0] ?? 0)}
            />
          </div>
          <div className="flex flex-row justify-between font-mono text-sm h-0">
            {labelIndices.map((idx) => (
              <div key={idx} className="w-12 text-center">
                {formatLabel(idx)}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardHeader className="flex justify-center">
        <CardTitle>Forecast Time</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default TimeSlider;
