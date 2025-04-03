import TimeSlider from "@/components/TimeSlider";
import FlightLevelSlider from "@/components/FlightLevelSlider"; 
import MapboxExample from "@/components/Map"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 gap-6 sm:p-20">
      
    
      {/* Buttons */}
      <div className="flex gap-4 mb-4">
        <button className="px-4 py-2 bg-blue-500 text-white rounded">Overall</button>
        <button className="px-4 py-2 bg-blue-500 text-white rounded">NEXRAD</button>
        <button className="px-4 py-2 bg-blue-500 text-white rounded">Satellite</button>
      </div>

      {/* Slider on the Left for Flight Level */}
      <FlightLevelSlider />

      {/* Slider on the Bottom for Time */}
      <TimeSlider />
      
      {/* Map */}
      <MapboxExample /> 


    </div>
  );
}