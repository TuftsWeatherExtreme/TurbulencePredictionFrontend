"use client"
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

import 'mapbox-gl/dist/mapbox-gl.css';

const MapboxExample = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN; 

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      maxZoom: 5.99,
      minZoom: 2.5,
      zoom: 3.5,
      center: [-98.5, 37.7],
    });

    mapRef.current.on('load', () => {

      mapRef.current.addSource('radar', {
        type: 'image',
        url: 'https://docs.mapbox.com/mapbox-gl-js/assets/radar.gif',
        coordinates: [
          [-131, 53],
          [-66, 53],
          [-66, 22],
          [-131, 22]
        ]
      });

      mapRef.current.addLayer({
        id: 'radar-layer',
        type: 'raster',
        source: 'radar',
        paint: {
          'raster-fade-duration': 0
        }
      });



    }, []);
  });


  


  return (
    <div
      id="map"
      className="map-container"
      style={{ height: '100%' }}
      ref={mapContainerRef}
    />
  );
};

export default MapboxExample;