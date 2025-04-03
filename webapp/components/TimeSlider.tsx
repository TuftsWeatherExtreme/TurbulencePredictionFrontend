"use client";
import { useState } from "react";

export default function TimeSlider() {
  // Function to generate the time labels
  const generateTimeLabels = (): string[] => {
    const now = new Date();
    now.setUTCMinutes(0, 0, 0); // Set to the previous full hour

    return Array.from({ length: 6 }, (_, i) => {
      const futureHour = new Date(now);
      futureHour.setUTCHours(now.getUTCHours() + i);
      return (futureHour.toISOString().substring(11, 16) + " UTC " + futureHour.toISOString().substring(0, 10)); // Format "HH:MM UTC YYYY-MM-DD"
    });
  };

  const times = generateTimeLabels();
  const labels = times.map(time => time.substring(0, 2) + "Z"); // retrieve only HHz
  const [sliderIndex, setSliderIndex] = useState(0);


  const handleTimeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = Number(e.target.value);
    setSliderIndex(index);
    console.log(`TimeSlider moved to time ${times[index]}`);
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center bg-gray-200 p-2">
      {/* Date/Time Box (Centered Above Slider) */}
      <div className="bg-gray-300 text-center text-sm font-semibold py-1 px-2 rounded w-[200px] mb-4">
        {times[sliderIndex]}
      </div>

      
      {/* Slider and Labels */}
      <div className="flex flex-col items-center">
        {/* Slider Container */}
        <div className="w-[400px] flex items-center">
          <input
            id="customSlider"
            type="range"
            min="0"
            max={labels.length - 1}
            step="1"
            value={sliderIndex}
            onChange={(e) => handleTimeSliderChange(e)}
            className="absolute w-[400px] bg-transparent cursor-pointer"
          />
        </div>

      {/* Labels and Tick Marks */}
      <div className="w-[400px] flex flex-row justify-between">
        {labels.map((val, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="w-[2px] h-4 bg-gray-500"></div> {/* Tick Mark */}
            <span className="text-sm mt-1">{val}</span> {/* Time (HHZ) */}
          </div>
        ))}
      </div>


      </div>
    </div>
  );
}
