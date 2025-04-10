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

function Map() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    // Prevent re-initializing the map
    if (!mapContainerRef.current || mapRef.current) return;

    function getPath(source: Source, alt: number = 0, time: number = 0) {
      // return `<PATH TO IMAGE HERE>/${alt}${time}${source.toString()}`
      return "https://docs.mapbox.com/mapbox-gl-js/assets/radar.gif";
    }

    // Initialize the map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current as HTMLDivElement,
      // style: "mapbox://style/mapbox/standard",
      projection: "globe",
      bounds: [
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
        url: "https://docs.mapbox.com/mapbox-gl-js/assets/radar.gif",
        coordinates: [
          // [-131, 22],
          // [-131, 53],
          // [-66, 22],
          // [-66, 53]
          [-80.425, 46.437],
          [-71.516, 46.437],
          [-71.516, 37.936],
          [-80.425, 37.936],
        ],
      });

      mapRef.current?.addLayer({
        id: "radar-layer",
        type: "raster",
        source: "radar",
        paint: { "raster-fade-duration": 0 },
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
      <div
        id="map"
        className="map-container w-full h-screen"
        ref={mapContainerRef}
      />
    </>
  );
}

export default Map;
