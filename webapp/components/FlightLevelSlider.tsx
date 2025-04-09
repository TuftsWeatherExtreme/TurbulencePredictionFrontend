"use client";
import { useState } from "react";

export default function FlightLevelSlider() {
  const flight_levels = ["480", "420", "360", "300", "270", "240", "210", "180", "150", "120", "090", "060", "030", "010", ">180", "<180"];
  const [sliderIndex, setSliderIndex] = useState(8); // Default to 180 (180 is index 7)

  const handleFlightLevelSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = Number(e.target.value);
    setSliderIndex(index);
    console.log(`FlightLevelSlider moved to flight level: ${flight_levels[index]}`);
  };

  return (
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center bg-gray-200 p-2 rounded-md">
      {/* Title Box (Centered Above Slider) */}
      <div className="bg-gray-300 text-center text-sm font-semibold py-1 px-2 rounded w-[60px] mb-2">
        MSL
      </div>

      {/* Slider and Labels */}
      <div className="flex items-center">
        {/* Slider Container */}
        <div className="h-[400px] flex items-center pl-1">
          <input
            id="customSlider"
            type="range"
            min="0"
            max={flight_levels.length - 1}
            step="1"
            value={sliderIndex}
            onChange={(e) => handleFlightLevelSliderChange(e)}
            className="absolute -translate-x-1/2 w-[400px] rotate-[-90deg]  bg-transparent cursor-pointer"
          />
        </div>

        {/* Labels and Tick Marks */}
        <div className="h-[400px] flex flex-col justify-between">
          {flight_levels.map((val, index) => (
            <div key={index} className="flex items-center">
              <div className="w-2 h-[2px] bg-gray-500"></div> {/* Tick Mark */}
              <span className="text-sm w-10 pl-2">{val}</span> {/* Label */}
            </div>
          ))}
        </div>


      </div>
    </div>
  );
}
