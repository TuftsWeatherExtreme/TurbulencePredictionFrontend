"use client";

import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

const NUM_STEPS = 16;
const STEP_MINUTES = 30;

function TimeSlider({
  timeOffset,
  setTimeOffset,
}: {
  timeOffset: number;
  setTimeOffset: (value: number) => void;
}) {
  // Show labels at every 2-hour mark (every 4 steps)
  const labelIndices = [0, 4, 8, 12, 15];
  const formatLabel = (step: number) => {
    const hours = (step * STEP_MINUTES) / 60;
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
              max={NUM_STEPS - 1}
              step={1}
              orientation="horizontal"
              value={[timeOffset]}
              onValueChange={(value) => setTimeOffset(value[0])}
            />
          </div>
          <div className="flex flex-row justify-between font-mono text-sm h-0">
            {labelIndices.map((idx) => (
              <div key={idx} className="w-8 text-center">
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
