"use client";
import { useEffect, useMemo, useRef, useState } from "react";

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

// Two supported modes:
// 1) Step-based demo files: /predictions/{radar|satellite}/prediction_00..15.geojson
// 2) Monthly "preds_YYYY_MM" files: /predictions/preds_2024_12.geojson (radar-style schema)
const NUM_STEPS = 16;
const RADAR_GEOJSON_PREFIX = "/predictions/radar/prediction_";
const SATELLITE_GEOJSON_PREFIX = "/predictions/satellite/prediction_";

const RADAR_MONTHLY_GEOJSON = "/predictions/preds_radar_2024_12.geojson";
const SATELLITE_MONTHLY_GEOJSON = "/predictions/preds_satellite_2024_12.geojson";
const COMBINED_MONTHLY_GEOJSON = "/predictions/preds_combined_2024_12.geojson";

function getGeoJsonUrl(prefix: string, step: number): string {
  return `${prefix}${step.toString().padStart(2, "0")}.geojson`;
}

type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, any>;

function parseTimeMs(t: any): number | null {
  if (!t) return null;
  const raw = String(t);
  // If timestamp string has no timezone, treat it as UTC (our exports are typically UTC).
  const normalized =
    /^\d{4}-\d{2}-\d{2}T/.test(raw) && !/[zZ]|[+\-]\d{2}:?\d{2}$/.test(raw)
      ? `${raw}Z`
      : raw;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? ms : null;
}

function utcDayKeyFromIso(t: string): string | null {
  const ms = parseTimeMs(t);
  if (ms === null) return null;
  return new Date(ms).toISOString().slice(0, 10); // YYYY-MM-DD
}

function dayLabelFromDayKey(dayKey: string): string {
  // YYYY-MM-DD -> MM/DD/YY
  const mm = dayKey.slice(5, 7);
  const dd = dayKey.slice(8, 10);
  const yy = dayKey.slice(2, 4);
  return `${mm}/${dd}/${yy}`;
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
  // Default to a mid/high cruise level so the map isn't empty by default.
  const [flightLevel, setFlightLevel] = useState<number>(8);
  const [timeOffset, setTimeOffset] = useState<number>(0);
  const [sizeClass, setSizeClass] = useState<string>("all");
  const [source, setSource] = useState<boolean[]>([true, true]);
  const handleSourceChange = (value: string) => {
    if (value === "all") setSource([true, true]);
    else if (value === "sat") setSource([true, false]);
    else if (value === "rad") setSource([false, true]);
  };
  const [altFilterEnabled, setAltFilterEnabled] = useState<boolean>(true);
  const [timeFilterEnabled, setTimeFilterEnabled] = useState<boolean>(true);
  const [useMonthlyFiles, setUseMonthlyFiles] = useState<boolean>(true);

  const [radarMonthly, setRadarMonthly] = useState<FeatureCollection | null>(null);
  const [satMonthly, setSatMonthly] = useState<FeatureCollection | null>(null);
  const [combinedMonthly, setCombinedMonthly] =
    useState<FeatureCollection | null>(null);

  // Flight levels shown in the UI (x100 ft)
  const flightLevelsFl100: number[] = [
    480, 420, 360, 300, 270, 240, 210, 180, 150, 120, 90, 60, 30, 10,
  ];
  const selectedFl100 = flightLevelsFl100[flightLevel] ?? flightLevelsFl100[0];
  const selectedAltFt = selectedFl100 * 100;

  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Shared style expression for severe_prob
  const severeProbExpr: any = ["to-number", ["get", "severe_prob"]];

  const allDays = useMemo(() => {
    if (!useMonthlyFiles) return [];
    const days = new Set<string>();
    const addFrom = (fc: FeatureCollection | null) => {
      for (const f of fc?.features ?? []) {
        const t = (f as any)?.properties?.pirep_time;
        if (typeof t !== "string") continue;
        const dayKey = utcDayKeyFromIso(t);
        if (dayKey) days.add(dayKey);
      }
    };
    addFrom(radarMonthly);
    addFrom(satMonthly);
    addFrom(combinedMonthly);
    return Array.from(days).sort();
  }, [radarMonthly, satMonthly, combinedMonthly, useMonthlyFiles]);

  const dayLabels = useMemo(() => allDays.map(dayLabelFromDayKey), [allDays]);
  const selectedDayKey = useMemo(() => {
    if (!useMonthlyFiles) return null;
    if (allDays.length === 0) return null;
    const idx = Math.min(Math.max(timeOffset, 0), allDays.length - 1);
    return allDays[idx] ?? null;
  }, [allDays, timeOffset, useMonthlyFiles]);

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
        data: useMonthlyFiles ? SATELLITE_MONTHLY_GEOJSON : getGeoJsonUrl(SATELLITE_GEOJSON_PREFIX, 0),
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
        data: useMonthlyFiles ? RADAR_MONTHLY_GEOJSON : getGeoJsonUrl(RADAR_GEOJSON_PREFIX, 0),
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

      // --- Combined layer (used when Source = All) ---
      map.addSource("combined-preds", {
        type: "geojson",
        data: COMBINED_MONTHLY_GEOJSON,
      });

      map.addLayer({
        id: "combined-preds-layer",
        type: "circle",
        source: "combined-preds",
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
      map.on("click", "combined-preds-layer", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const coordinates = (feature.geometry as any).coordinates?.slice();
        const props = feature.properties as any;
        const timeStr = props?.pirep_time ?? props?.timestamp ?? "N/A";
        const src = String(props?.source ?? "N/A");
        const html = [
          `<div style="font-size:12px; line-height:1.25;">`,
          `<div><b>Combined</b></div>`,
          `<div>Source: ${src} </div>`,
          `<div>Probability of Severe Turbluence: ${props?.severe_prob != null ? Number(props.severe_prob).toFixed(3) : "N/A"}</div>`,
          `<div>nexrad_prob: ${props?.nexrad_prob != null ? Number(props.nexrad_prob).toFixed(3) : "N/A"}</div>`,
          `<div>sat_prob: ${props?.sat_prob != null ? Number(props.sat_prob).toFixed(3) : "N/A"}</div>`,
          `<div>pred_class: ${props?.pred_class ?? "N/A"}</div>`,
          `<div>Flight Level: ${props?.flight_level_ft ?? "N/A"} ft</div>`,
          `<div>PIREP Time: ${timeStr}</div>`,
          `</div>`,
        ].join("");
        new mapboxgl.Popup().setLngLat(coordinates).setHTML(html).addTo(map);
      });

      map.on("click", "nexrad-preds-layer", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const coordinates = (feature.geometry as any).coordinates?.slice();
        const props = feature.properties as any;
        const timeStr = props?.pirep_time ?? props?.timestamp ?? "?";
        const aircraftClassRaw = String(props?.aircraft_class ?? "").toLowerCase();
        const aircraftClassLabel =
          aircraftClassRaw === "l"
            ? "Light"
            : aircraftClassRaw === "m"
              ? "Medium"
              : aircraftClassRaw === "h"
                ? "Heavy"
                : "?";
        const html = [
          `<div style="font-size:12px; line-height:1.25;">`,
          `<div><b>NEXRAD Radar</b></div>`,
          `<div>Probability of Severe Turbluence: ${props?.severe_prob ? Number(props.severe_prob).toFixed(3) : "?"}</div>`,
          `<div>Aircraft Size: ${aircraftClassLabel}</div>`,
          `<div>Flight Level: ${props?.flight_level_ft ?? "?"} ft</div>`,
          `<div>PIREP Time: ${timeStr}</div>`,
          `</div>`,
        ].join("");
        new mapboxgl.Popup().setLngLat(coordinates).setHTML(html).addTo(map);
      });

      map.on("click", "satellite-preds-layer", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const coordinates = (feature.geometry as any).coordinates?.slice();
        const props = feature.properties as any;
        const timeStr = props?.pirep_time ?? props?.timestamp ?? "?";
        const aircraftClassRaw = String(props?.aircraft_class ?? "").toLowerCase();
        const aircraftClassLabel =
          aircraftClassRaw === "l"
            ? "Light"
            : aircraftClassRaw === "m"
              ? "Medium"
              : aircraftClassRaw === "h"
                ? "Heavy"
                : "?";
        const html = [
          `<div style="font-size:12px; line-height:1.25;">`,
          `<div><b>Satellite</b></div>`,
          `<div>Probability of Severe Turbluence: ${props?.severe_prob ? Number(props.severe_prob).toFixed(3) : "?"}</div>`,
          `<div>Aircraft Size: ${aircraftClassLabel}</div>`,
          `<div>Flight Level: ${props?.flight_level_ft ?? "?"} ft</div>`,
          `<div>PIREP Time: ${timeStr}</div>`,
          `</div>`,
        ].join("");
        new mapboxgl.Popup().setLngLat(coordinates).setHTML(html).addTo(map);
      });

      // Cursor changes
      for (const layer of [
        "combined-preds-layer",
        "nexrad-preds-layer",
        "satellite-preds-layer",
      ]) {
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

  // --- Load monthly GeoJSONs into memory (for slider filtering) ---
  useEffect(() => {
    if (!useMonthlyFiles) return;
    const load = async () => {
      try {
        const [rad, sat, comb] = await Promise.all([
          fetch(RADAR_MONTHLY_GEOJSON).then((r) => (r.ok ? r.json() : null)),
          fetch(SATELLITE_MONTHLY_GEOJSON).then((r) => (r.ok ? r.json() : null)),
          fetch(COMBINED_MONTHLY_GEOJSON).then((r) => (r.ok ? r.json() : null)),
        ]);
        if (rad?.type === "FeatureCollection") setRadarMonthly(rad);
        if (sat?.type === "FeatureCollection") setSatMonthly(sat);
        if (comb?.type === "FeatureCollection") setCombinedMonthly(comb);
      } catch {
        // ignore
      }
    };
    load();
  }, [useMonthlyFiles]);

  // --- Update GeoJSON data when time slider changes ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.loaded()) return;

    const combinedSource = map.getSource("combined-preds") as mapboxgl.GeoJSONSource;
    if (combinedSource && useMonthlyFiles) {
      const dayKey = selectedDayKey;
      const fc = combinedMonthly;
      if (fc && (!dayKey || !timeFilterEnabled)) {
        combinedSource.setData(fc as any);
      } else if (dayKey && fc) {
        const filtered: FeatureCollection = {
          type: "FeatureCollection",
          features: (fc.features ?? []).filter((f: any) => {
            const t = f?.properties?.pirep_time;
            if (typeof t !== "string") return false;
            return utcDayKeyFromIso(t) === dayKey;
          }),
        };
        combinedSource.setData(filtered as any);
      }
    }

    const radarSource = map.getSource("nexrad-preds") as mapboxgl.GeoJSONSource;
    if (radarSource) {
      if (useMonthlyFiles) {
        const dayKey = selectedDayKey;
        const fc = radarMonthly;
        if (fc && (!dayKey || !timeFilterEnabled)) {
          // Data not indexed yet (or no valid timestamps) — show everything rather than nothing.
          radarSource.setData(fc as any);
        } else if (dayKey && fc) {
          const filtered: FeatureCollection = {
            type: "FeatureCollection",
            features: (fc.features ?? []).filter((f: any) => {
              const t = f?.properties?.pirep_time;
              if (typeof t !== "string") return false;
              return utcDayKeyFromIso(t) === dayKey;
            }),
          };
          radarSource.setData(filtered as any);
        }
      } else {
        const step = Math.min(timeOffset, NUM_STEPS - 1);
        fetch(getGeoJsonUrl(RADAR_GEOJSON_PREFIX, step))
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) radarSource.setData(data);
          })
          .catch(() => {});
      }
    }

    const satSource = map.getSource("satellite-preds") as mapboxgl.GeoJSONSource;
    if (satSource) {
      if (useMonthlyFiles) {
        const dayKey = selectedDayKey;
        const fc = satMonthly;
        if (fc && (!dayKey || !timeFilterEnabled)) {
          satSource.setData(fc as any);
        } else if (dayKey && fc) {
          const filtered: FeatureCollection = {
            type: "FeatureCollection",
            features: (fc.features ?? []).filter((f: any) => {
              const t = f?.properties?.pirep_time;
              if (typeof t !== "string") return false;
              return utcDayKeyFromIso(t) === dayKey;
            }),
          };
          satSource.setData(filtered as any);
        }
      } else {
        const step = Math.min(timeOffset, NUM_STEPS - 1);
        fetch(getGeoJsonUrl(SATELLITE_GEOJSON_PREFIX, step))
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) satSource.setData(data);
          })
          .catch(() => {});
      }
    }
  }, [
    timeOffset,
    radarMonthly,
    satMonthly,
    combinedMonthly,
    selectedDayKey,
    useMonthlyFiles,
    timeFilterEnabled,
  ]);

  // --- Filter points by flight level (radar + satellite) ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const applyFilter = () => {
      const altExpr: any = ["to-number", ["get", "flight_level_ft"]];
      const bandFt = 2000;
      const altFilterExpr: any = altFilterEnabled
        ? [
            "all",
            [">=", altExpr, selectedAltFt - bandFt],
            ["<=", altExpr, selectedAltFt + bandFt],
          ]
        : null;

      // Aircraft size filter (AircraftPicker values: "all" | "l" | "m" | "h").
      // Fail open for older GeoJSONs that don't include aircraft_class.
      const aircraftExpr: any =
        sizeClass === "all"
          ? true
          : [
              "any",
              ["!", ["has", "aircraft_class"]],
              ["==", ["get", "aircraft_class"], sizeClass],
            ];

      const filterExpr: any =
        altFilterExpr === null ? aircraftExpr : ["all", aircraftExpr, altFilterExpr];

      if (map.getLayer("nexrad-preds-layer")) {
        map.setFilter("nexrad-preds-layer", filterExpr);
      }
      if (map.getLayer("satellite-preds-layer")) {
        map.setFilter("satellite-preds-layer", filterExpr);
      }
      if (map.getLayer("combined-preds-layer")) {
        map.setFilter("combined-preds-layer", filterExpr);
      }
    };

    if (!map.loaded()) {
      map.once("load", applyFilter);
      return;
    }
    applyFilter();
  }, [selectedAltFt, altFilterEnabled, sizeClass]);

  // --- Toggle layer visibility based on source picker ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyVisibility = () => {
      const [satVisible, radarVisible] = source;
      const showCombined = satVisible && radarVisible;

      if (map.getLayer("satellite-preds-layer")) {
        map.setLayoutProperty(
          "satellite-preds-layer",
          "visibility",
          !showCombined && satVisible ? "visible" : "none",
        );
      }
      if (map.getLayer("nexrad-preds-layer")) {
        map.setLayoutProperty(
          "nexrad-preds-layer",
          "visibility",
          !showCombined && radarVisible ? "visible" : "none",
        );
      }
      if (map.getLayer("combined-preds-layer")) {
        map.setLayoutProperty(
          "combined-preds-layer",
          "visibility",
          showCombined ? "visible" : "none",
        );
      }
    };

    if (!map.loaded()) {
      map.once("load", applyVisibility);
      return;
    }
    applyVisibility();
  }, [source]);

  const derivedSource =
  source[0] && source[1]
    ? "all"
    : source[0]
    ? "sat"
    : source[1]
    ? "rad"
    : "all"; // fallback safety

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
        <TimeSlider
          timeOffset={timeOffset}
          setTimeOffset={setTimeOffset}
          numSteps={useMonthlyFiles ? Math.max(1, allDays.length) : NUM_STEPS}
          labels={useMonthlyFiles ? dayLabels : undefined}
        />
        {useMonthlyFiles ? (
          <div className="mt-2 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTimeFilterEnabled((v) => !v)}
            >
              Time filter: {timeFilterEnabled ? "On" : "Off"}
            </Button>
          </div>
        ) : null}
      </div>
      <div className="fixed top-0 right-0 p-4 flex flex-row-reverse gap-4">
        <SourcePicker source={derivedSource} setSource={handleSourceChange} />
        <AircraftPicker sizeClass={sizeClass} setSizeClass={setSizeClass} />
      </div>
      <div className="fixed right-0 p-4">
        <Legend />
      </div>
    </>
  );
}

export default Map;
