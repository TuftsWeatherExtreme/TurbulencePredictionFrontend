"use client";
import { useEffect, useRef } from "react";

// Import Mapbox and styles
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

enum Source {
  RADAR,
  SATELLITE,
}

// Check for access token
if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  throw new Error(
    "Mapbox API key is not defined in the environment variables.",
  );
}
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function Map(props: {
  flightLevel: number;
  timeOffset: number;
  sizeClass: string;
  sources: boolean[];
}) {
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    // Prevent re-initializing the map
    if (mapRef.current) return;

    function getPath(source: Source, alt: number = 0, time: number = 0) {
      return `/frames/layer${alt.toLocaleString().padStart(5, "0")}.gif`
    }

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

    // Add raster layer
    mapRef.current.on("load", () => {
      mapRef.current?.addSource("radar", {
        type: "image",
        url: getPath("source", props.flightLevel, props.timeOffset),
        coordinates: [
          [-131, 22],
          [-66, 22],
          [-66, 53],
          [-131, 53]
        ],
      });

      mapRef.current?.addLayer({
        id: "radar-layer",
        type: "raster",
        source: "radar",
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

  return (
    <>
      <div id="map" className="map-container w-screen h-screen" />
    </>
  );
}

export default Map;
