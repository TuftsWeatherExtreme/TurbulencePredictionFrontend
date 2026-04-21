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
import Legend from "@/components/controls/Legend";
import { Button } from "@/components/ui/button";

const DEFAULT_NEXRAD_GEOJSON_URL = "/predictions/preds_2024_12.geojson";

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
  // Altitude filter toggle
  const [altFilterEnabled, setAltFilterEnabled] = useState<boolean>(true);
  const [nexradUrl] = useState<string>(
    process.env.NEXT_PUBLIC_NEXRAD_GEOJSON_URL ?? DEFAULT_NEXRAD_GEOJSON_URL,
  );

  // Flight levels shown in the UI (×100 ft). The slider value is the *index* into this array.
  const flightLevelsFl100: number[] = [
    480, 420, 360, 300, 270, 240, 210, 180, 150, 120, 90, 60, 30, 10,
  ];
  const selectedFl100 = flightLevelsFl100[flightLevel] ?? flightLevelsFl100[0];
  const selectedAltFt = selectedFl100 * 100;

  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    // Prevent re-initializing the map
    if (mapRef.current) return;

    // Initialize the map
    const map = new mapboxgl.Map({
      container: "map",
      style: "mapbox://style/mapbox/light-v11",
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
    mapRef.current = map;

    // Disable rotation
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    map.on("load", () => {
      // NEXRAD predictions (GeoJSON points)
      map.addSource("nexrad-preds", {
        type: "geojson",
        data: nexradUrl,
      });

      // NOTE: Mapbox coerces feature.properties values to strings, so we use a
      // dedicated numeric property exported from Python.
      const severeProbExpr: any = ["to-number", ["get", "severe_prob"]];

      map.addLayer({
        id: "nexrad-preds-layer",
        type: "circle",
        source: "nexrad-preds",
        paint: {
          "circle-opacity": [
            "interpolate",
            ["linear"],
            severeProbExpr,
            0,
            0.0,
            0.2,
            0.25,
            1,
            0.95,
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            severeProbExpr,
            0,
            2,
            1,
            8,
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            severeProbExpr,
            0,
            "rgba(47, 157, 245, 0.8)",
            0.5,
            "rgba(222, 221, 50, 0.9)",
            1,
            "rgba(144, 12, 0, 0.95)",
          ],
          "circle-stroke-color": "rgba(0, 0, 0, 0.25)",
          "circle-stroke-width": 1,
        },
      });

      map.on("click", "nexrad-preds-layer", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const coordinates = (feature.geometry as any).coordinates?.slice();
        const props = feature.properties as any;
        const html = [
          `<div style="font-size:12px; line-height:1.25;">`,
          `<div><b>NEXRAD severe</b></div>`,
          `<div>p(severe): ${props?.severe_prob ? Number(props.severe_prob).toFixed(3) : "?"}</div>`,
          `<div>pred_class: ${props?.pred_class ?? "?"}</div>`,
          `<div>flight_level_ft: ${props?.flight_level_ft ?? "?"}</div>`,
          `<div>pirep_time: ${props?.pirep_time ?? "?"}</div>`,
          `</div>`,
        ].join("");

        new mapboxgl.Popup().setLngLat(coordinates).setHTML(html).addTo(map);
      });

      map.on("mouseenter", "nexrad-preds-layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "nexrad-preds-layer", () => {
        map.getCanvas().style.cursor = "";
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

  // Filter points by selected flight level (ALT is stored in feet in GeoJSON).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const applyFilter = () => {
      if (!map.getLayer("nexrad-preds-layer")) return;
      if (!altFilterEnabled) {
        map.setFilter("nexrad-preds-layer", null);
        return;
      }
      const altExpr: any = ["to-number", ["get", "flight_level_ft"]];
      const bandFt = 2000;
      map.setFilter("nexrad-preds-layer", [
        "all",
        [">=", altExpr, selectedAltFt - bandFt],
        ["<=", altExpr, selectedAltFt + bandFt],
      ]);
    };

    if (!map.loaded()) {
      map.once("load", applyFilter);
      return;
    }

    applyFilter();
  }, [selectedAltFt, altFilterEnabled]);

  // Keep the UI toggles; only radar affects visibility for now (since satellite raster was removed, and satellite predictions are not yet implemented).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.loaded()) return;

    const radarVisible = sources[1];
    if (map.getLayer("nexrad-preds-layer")) {
      map.setLayoutProperty(
        "nexrad-preds-layer",
        "visibility",
        radarVisible ? "visible" : "none",
      );
    }
  }, [sources]);

  return (
    <>
      <div id="map" className="map-container w-screen h-screen absolute" />
      <div className="fixed left-0 p-4">
        <FlightLevelSlider
          flightLevel={flightLevel}
          setFlightLevel={setFlightLevel}
        />
        <div className="mt-2 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAltFilterEnabled((v) => !v)}
          >
            Alt filter: {altFilterEnabled ? "On" : "Off"}
          </Button>
        </div>
      </div>
      <div className="fixed bottom-0 mx-auto w-full max-w-xl p-4">
        <TimeSlider timeOffset={timeOffset} setTimeOffset={setTimeOffset} />
      </div>
      <div className="fixed top-0 right-0 p-4 flex flex-row-reverse gap-4">
        <SourcePicker sources={sources} setSources={setSources} />
        <AircraftPicker sizeClass={sizeClass} setSizeClass={setSizeClass} />
      </div>
      <div className="fixed right-0 p-4">
        <Legend />
      </div>
    </>


  );
}

export default Map;
