"use client";
import { useState } from "react";

import AircraftPicker from "@/components/controls/AircraftPicker";
import FlightLevelSlider from "@/components/controls/FlightLevelSlider";
import SourcePicker from "@/components/controls/SourcePicker";
import TimeSlider from "@/components/controls/TimeSlider";
import Map from "@/components/Map";

export default function Home() {
  const [flightLevel, setFlightLevel] = useState<number>(0);
  const [timeOffset, setTimeOffset] = useState<number>(0);
  const [sizeClass, setSizeClass] = useState<string>("l");
  const [sources, setSources] = useState<boolean[]>([true, true]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="absolute">
        <Map
          flightLevel={flightLevel}
          timeOffset={timeOffset}
          sizeClass={sizeClass}
          sources={sources}
        />
      </div>
      <div className="fixed left-0 p-4">
        <FlightLevelSlider
          flightLevel={flightLevel}
          setFlightLevel={setFlightLevel}
        />
      </div>
      <div className="fixed bottom-0 mx-auto w-full max-w-xl p-4">
        <TimeSlider timeOffset={timeOffset} setTimeOffset={setTimeOffset} />
      </div>
      <div className="fixed top-0 right-0 p-4 flex flex-row-reverse gap-4">
        <SourcePicker sources={sources} setSources={setSources} />
        <AircraftPicker sizeClass={sizeClass} setSizeClass={setSizeClass} />
      </div>
    </div>
  );
}
