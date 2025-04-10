import FlightLevelSlider from "@/components/controls/FlightLevelSlider";
import TimeSlider from "@/components/controls/TimeSlider";
import Map from "@/components/Map";
import SourcePicker from "@/components/SourcePicker";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="absolute">
        <Map />
      </div>
      <div className="fixed left-0 p-4">
        <FlightLevelSlider />
      </div>
      <div className="fixed bottom-0 mx-auto w-full max-w-xl p-4">
        <TimeSlider />
      </div>
      <div className="fixed top-0 right-0 p-4">
        <SourcePicker />
      </div>
    </div>
  );
}
