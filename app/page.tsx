import FlightLevelSlider from "@/components/controls/FlightLevelSlider";
import TimeSlider from "@/components/controls/TimeSlider";
import Map from "@/components/Map";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="absolute">
        <Map />
      </div>
      <div className="fixed left-0 p-4">
        <FlightLevelSlider />
      </div>
      <div className="absolute bottom-0 mx-auto w-full max-w-xl p-4">
        <TimeSlider />
      </div>
    </div>
  );
}
