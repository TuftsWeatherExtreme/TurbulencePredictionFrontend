"use client";
import { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

function TimeSlider() {
  const currentTime = new Date().getTime();
  const timestamps = [...Array(9).keys()].map(
    (offset) => new Date(currentTime + offset * 60 * 60 * 1000),
  );

  const [currentTimestamp, setTimestamp] = useState<number[]>([0]);

  return (
    <Card>
      <CardContent>
        <div className="grid grid-rows-2">
          <div className="mx-1.5">
            <Slider
              min={0}
              max={timestamps.length - 1}
              step={1}
              orientation="horizontal"
              value={currentTimestamp}
              onValueChange={(value) => setTimestamp(value)}
            />
          </div>
          <div className="flex flex-row justify-between font-mono text-sm">
            {timestamps.map((timestamp, index) => {
              return (
                <div key={index} className="w-8 text-center">
                  {timestamp.getUTCHours().toString().padStart(2, "0")}Z
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TimeSlider;
