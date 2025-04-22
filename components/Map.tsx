"use client";
import { useEffect, useRef } from "react";

// Import Mapbox and styles
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

enum Source {
  SATELLITE,
  RADAR,
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

  function getPath(source: Source, alt: number = 0, time: number = 0) {
    if (source === Source.RADAR) { // pull from the Radar folder
      return `/frames/radar/layer_${alt.toLocaleString()}_${time.toLocaleString()}.gif`
    }
    return `/frames/layer${alt.toLocaleString().padStart(5, "0")}.gif`
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

      // Satellite Data Layers
      mapRef.current?.addSource("satellite", {
        type: "image",
        url: getPath(Source.SATELLITE, props.flightLevel, props.timeOffset),
        coordinates: [
          [-131, 22],
          [-66, 22],
          [-66, 53],
          [-131, 53]
        ],
      });

      mapRef.current?.addLayer({
        id: "satellite-layer",
        type: "raster",
        source: "satellite",
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
      
      // Nexrad/Radar Data Layers
      mapRef.current?.addSource("radar", {
        type: "image",
        url: getPath(Source.RADAR, props.flightLevel, props.timeOffset),
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

  // update image(s) when flightLevel or timeOffset changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const radar_source = map.getSource("radar") as mapboxgl.ImageSource;
    const new_radar_image_url = getPath(Source.RADAR, props.flightLevel, props.timeOffset);
    if (radar_source) {
      radar_source.updateImage({
        url: new_radar_image_url,
      });
    }
    
    const satellite_source = map.getSource("satellite") as mapboxgl.ImageSource;
    const new_satellite_image_url = getPath(Source.SATELLITE, props.flightLevel, props.timeOffset);
    if (satellite_source) {
      satellite_source.updateImage({
        url: new_satellite_image_url,
      });
    }
  }, [props.flightLevel, props.timeOffset]);

  // update image(s) when sources change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    
    console.log("change of source", props.sources);

    // TODO: was not able to get this working following guide at
    // https://docs.mapbox.com/mapbox-gl-js/example/toggle-layers/
    
  }, [props.sources]);


  return (
    <>
      <div id="map" className="map-container w-screen h-screen" />
    </>
  );
}

export default Map;
