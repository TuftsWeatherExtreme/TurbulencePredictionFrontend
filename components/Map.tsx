"use client";
import { useEffect, useRef, useState } from "react";

// Import Mapbox and styles
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Import controls
import AircraftPicker from "@/components/controls/AircraftPicker";
import FlightLevelSlider from "@/components/controls/FlightLevelSlider";
import SourcePicker from "@/components/controls/SourcePicker";
import TimeSlider from "@/components/controls/TimeSlider";

enum Source {
  SATELLITE = "sat",
  RADAR = "rad",
}

// Check for access token
if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  throw new Error(
    "Mapbox API key is not defined in the environment variables.",
  );
}
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function Map() {
  const [flightLevel, setFlightLevel] = useState<number>(0);
  const [timeOffset, setTimeOffset] = useState<number>(0);
  const [sizeClass, setSizeClass] = useState<string>("l");
  const [sources, setSources] = useState<boolean[]>([true, true]);

  const mapRef = useRef<mapboxgl.Map | null>(null);

  function getPath(source: Source) {
    return `/frames/${source.toString()}/frame${timeOffset}/alt${flightLevel.toString().padStart(2, "0")}.gif`
  }

  useEffect(() => {
    // Prevent re-initializing the map
    if (mapRef.current) return;

    // Initialize the map
    mapRef.current = new mapboxgl.Map({
      container: "map",
      style: "mapbox://style/mapbox/standard",
      projection: "albers",
      bounds: [
        [-131, 22],
        [-66, 53],
      ],
      maxBounds: [
        [-131, 22],
        [-66, 53],
      ],
    });

    // Disable rotation
    mapRef.current.dragRotate.disable();
    mapRef.current.touchZoomRotate.disableRotation();

    // Add raster layers
    mapRef.current.on("load", () => {

      // Satellite layers

      mapRef.current.addSource("sat-source", {
        type: "image",
        url: getPath(Source.SATELLITE),
        coordinates: [
          [-131, 22],
          [-66, 22],
          [-66, 53],
          [-131, 53]
        ],
      });

      mapRef.current.addLayer({
        id: "sat-layer",
        type: "raster",
        source: "sat-source",
        paint: {
          "raster-fade-duration": 0,
          "raster-color": [
              "interpolate",
              ["linear"],
              ["raster-value"],
              0.0,
              "rgba(35, 23, 27, 0)",
              0.2,
              "rgba(47, 157, 245, 1)",
              0.4,
              "rgba(76, 248, 132, 1)",
              0.6,
              "rgba(222, 221, 50, 1)",
              0.8,
              "rgba(246, 95, 24, 1)",
              1.0,
              "rgba(144, 12, 0, 1)",
          ],
          "raster-color-range": [0, 1],
        },
      });

      // Radar Layers

      mapRef.current?.addSource("rad-source", {
        type: "image",
        url: getPath(Source.RADAR),
        coordinates: [
          [-131, 22],
          [-66, 22],
          [-66, 53],
          [-131, 53]
        ],
      });

      mapRef.current.addLayer({
        id: "rad-layer",
        type: "raster",
        source: "rad-source",
        paint: {
          "raster-fade-duration": 0,
          "raster-color": [
              "interpolate",
              ["linear"],
              ["raster-value"],
              0.0,
              "rgba(35, 23, 27, 0)",
              0.2,
              "rgba(47, 157, 245, 1)",
              0.4,
              "rgba(76, 248, 132, 1)",
              0.6,
              "rgba(222, 221, 50, 1)",
              0.8,
              "rgba(246, 95, 24, 1)",
              1.0,
              "rgba(144, 12, 0, 1)",
          ],
          "raster-color-range": [0, 1],
        },
      });

    });

    // Clean up map
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle source changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.loaded()) {
      map.setLayoutProperty("sat-layer", "visibility", sources[0] ? "visible" : "none");
      map.setLayoutProperty("rad-layer", "visibility", sources[1] ? "visible" : "none");

      const bothVisible = sources[0] && sources[1];
      const opacity = bothVisible ? 0.5 : 1.0;

      map.setPaintProperty("sat-layer", "raster-opacity", sources[0] ? opacity : 0);
      map.setPaintProperty("rad-layer", "raster-opacity", sources[1] ? opacity : 0);
    }
  }, [sources]);

  // Handle altitude/time offset changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.loaded()) {
      if (map.getSource("sat-layer") || map.getSource("sat-source")) {
        map.getSource("sat-source").updateImage({ url: getPath(Source.SATELLITE) })
      }

      if (map.getSource("rad-layer") || map.getSource("rad-source")) {
        map.getSource("rad-source").updateImage({ url: getPath(Source.RADAR) })
      }
    }
  }, [flightLevel, timeOffset])

  return (
    <>
      <div id="map" className="map-container w-screen h-screen absolute" />
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
        {/*<AircraftPicker sizeClass={sizeClass} setSizeClass={setSizeClass} />*/}
      </div>
      <div className="fixed bottom-80 right-0 m-4 p-4 bg-white bg-opacity-80 rounded shadow text-sm space-y-1">
        <div className="font-bold">Risk Probability</div>
        <div className="flex items-center gap-2"><span className="w-4 h-4" style={{ backgroundColor: "rgba(47, 157, 245, 1)" }} /> Very Low (0.2)</div>
        <div className="flex items-center gap-2"><span className="w-4 h-4" style={{ backgroundColor: "rgba(76, 248, 132, 1)" }} /> Low (0.4)</div>
        <div className="flex items-center gap-2"><span className="w-4 h-4" style={{ backgroundColor: "rgba(222, 221, 50, 1)" }} /> Medium (0.6)</div>
        <div className="flex items-center gap-2"><span className="w-4 h-4" style={{ backgroundColor: "rgba(246, 95, 24, 1)" }} /> High (0.8)</div>
        <div className="flex items-center gap-2"><span className="w-4 h-4" style={{ backgroundColor: "rgba(144, 12, 0, 1)" }} /> Very High (1.0)</div>
       </div>
    </>

  
  );
}

export default Map;
