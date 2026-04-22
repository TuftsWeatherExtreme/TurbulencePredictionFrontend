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

// Demo GeoJSON paths — 16 steps at 30-min intervals (8 hours)
// Place your generated GeoJSONs in public/predictions/radar/ and public/predictions/satellite/
const NUM_STEPS = 16;
const RADAR_GEOJSON_PREFIX = "/predictions/radar/prediction_";
const SATELLITE_GEOJSON_PREFIX = "/predictions/satellite/prediction_";

function getGeoJsonUrl(prefix: string, step: number): string {
  return `${prefix}${step.toString().padStart(2, "0")}.geojson`;
}

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
  const [altFilterEnabled, setAltFilterEnabled] = useState<boolean>(true);

  // Flight levels shown in the UI (x100 ft)
  const flightLevelsFl100: number[] = [
    480, 420, 360, 300, 270, 240, 210, 180, 150, 120, 90, 60, 30, 10,
  ];
  const selectedFl100 = flightLevelsFl100[flightLevel] ?? flightLevelsFl100[0];
  const selectedAltFt = selectedFl100 * 100;

  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Shared style expression for severe_prob
  const severeProbExpr: any = ["to-number", ["get", "severe_prob"]];

  useEffect(() => {
    if (mapRef.current) return;

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

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    map.on("load", () => {
      // --- Satellite layer (heatmap-style, rendered underneath) ---
      map.addSource("satellite-preds", {
        type: "geojson",
        data: getGeoJsonUrl(SATELLITE_GEOJSON_PREFIX, 0),
      });

      map.addLayer({
        id: "satellite-preds-layer",
        type: "circle",
        source: "satellite-preds",
        paint: {
          "circle-opacity": [
            "interpolate",
            ["linear"],
            severeProbExpr,
            0, 0.0,
            0.2, 0.15,
            0.5, 0.4,
            1, 0.7,
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            severeProbExpr,
            0, 6,
            1, 14,
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            severeProbExpr,
            0, "rgba(100, 200, 255, 0.6)",
            0.3, "rgba(255, 255, 100, 0.7)",
            0.6, "rgba(255, 150, 50, 0.8)",
            1, "rgba(200, 30, 0, 0.9)",
          ],
          "circle-blur": 0.8,
          "circle-stroke-width": 0,
        },
      });

      // --- Radar layer (sharper points, on top) ---
      map.addSource("nexrad-preds", {
        type: "geojson",
        data: getGeoJsonUrl(RADAR_GEOJSON_PREFIX, 0),
      });

      map.addLayer({
        id: "nexrad-preds-layer",
        type: "circle",
        source: "nexrad-preds",
        paint: {
          "circle-opacity": [
            "interpolate",
            ["linear"],
            severeProbExpr,
            0, 0.0,
            0.2, 0.25,
            1, 0.95,
          ],
          "circle-radius": [
            "interpolate",
            ["linear"],
            severeProbExpr,
            0, 2,
            1, 8,
          ],
          "circle-color": [
            "interpolate",
            ["linear"],
            severeProbExpr,
            0, "rgba(47, 157, 245, 0.8)",
            0.5, "rgba(222, 221, 50, 0.9)",
            1, "rgba(144, 12, 0, 0.95)",
          ],
          "circle-stroke-color": "rgba(0, 0, 0, 0.25)",
          "circle-stroke-width": 1,
        },
      });

      // --- Click handlers ---
      map.on("click", "nexrad-preds-layer", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const coordinates = (feature.geometry as any).coordinates?.slice();
        const props = feature.properties as any;
        const html = [
          `<div style="font-size:12px; line-height:1.25;">`,
          `<div><b>NEXRAD Radar</b></div>`,
          `<div>p(severe): ${props?.severe_prob ? Number(props.severe_prob).toFixed(3) : "?"}</div>`,
          `<div>pred_class: ${props?.pred_class ?? "?"}</div>`,
          `<div>flight_level: ${props?.flight_level_ft ?? "?"} ft</div>`,
          `<div>time: ${props?.timestamp ?? "?"}</div>`,
          `</div>`,
        ].join("");
        new mapboxgl.Popup().setLngLat(coordinates).setHTML(html).addTo(map);
      });

      map.on("click", "satellite-preds-layer", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const coordinates = (feature.geometry as any).coordinates?.slice();
        const props = feature.properties as any;
        const html = [
          `<div style="font-size:12px; line-height:1.25;">`,
          `<div><b>Satellite</b></div>`,
          `<div>p(severe): ${props?.severe_prob ? Number(props.severe_prob).toFixed(3) : "?"}</div>`,
          `<div>pred_class: ${props?.pred_class ?? "?"}</div>`,
          `<div>time: ${props?.timestamp ?? "?"}</div>`,
          `</div>`,
        ].join("");
        new mapboxgl.Popup().setLngLat(coordinates).setHTML(html).addTo(map);
      });

      // Cursor changes
      for (const layer of ["nexrad-preds-layer", "satellite-preds-layer"]) {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // --- Update GeoJSON data when time slider changes ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;

    const step = Math.min(timeOffset, NUM_STEPS - 1);

    const radarSource = map.getSource("nexrad-preds") as mapboxgl.GeoJSONSource;
    if (radarSource) {
      fetch(getGeoJsonUrl(RADAR_GEOJSON_PREFIX, step))
        .then((res) => res.ok ? res.json() : null)
        .then((data) => { if (data) radarSource.setData(data); })
        .catch(() => {});
    }

    const satSource = map.getSource("satellite-preds") as mapboxgl.GeoJSONSource;
    if (satSource) {
      fetch(getGeoJsonUrl(SATELLITE_GEOJSON_PREFIX, step))
        .then((res) => res.ok ? res.json() : null)
        .then((data) => { if (data) satSource.setData(data); })
        .catch(() => {});
    }
  }, [timeOffset]);

  // --- Filter radar points by flight level ---
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

  // --- Toggle layer visibility based on source picker ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;

    const [satVisible, radarVisible] = sources;

    if (map.getLayer("satellite-preds-layer")) {
      map.setLayoutProperty(
        "satellite-preds-layer",
        "visibility",
        satVisible ? "visible" : "none",
      );
    }
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
