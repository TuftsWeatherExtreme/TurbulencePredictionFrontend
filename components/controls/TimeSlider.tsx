"use client";

import { Card, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

function TimeSlider({
  timeOffset,
  setTimeOffset,
}: {
  timeOffset: number;
  setTimeOffset: (value: number) => void;
}) {
  const currentTime = new Date().getTime();
  const timestamps = [...Array(9).keys()].map(
    (offset) => new Date(currentTime + offset * 60 * 60 * 1000),
  );

  return (
    <Card>
      <CardContent>
        <div className="grid grid-rows-2 gap-y-0">
          <div className="mx-1.5 h-4">
            <Slider
              min={0}
              max={timestamps.length - 1}
              step={1}
              orientation="horizontal"
              value={[timeOffset]}
              onValueChange={(value) => setTimeOffset(value[0])}
            />
          </div>
          <div className="flex flex-row justify-between font-mono text-sm h-0">
            {timestamps.map((timestamp, index) => {
              return (
                <div key={index} className="w-8 text-center">
                  {timestamp.getUTCHours().toString().padStart(2, "0")}Z
                  {index === 0 ? "\n(Now)" : ""}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      <CardHeader className="flex justify-center">
        <CardTitle>Time (Zulu)</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default TimeSlider;
