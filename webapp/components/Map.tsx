"use client";
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';



const MapboxExample = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2hhcmxvdHRldjIxIiwiYSI6ImNtOTFwMXRweDAzaGYybG9kb2VjMmc4djIifQ.8ZGFYo70vsKGK6dyTIJ-QQ';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      maxZoom: 5.99,
      minZoom: 4,
      zoom: 5,
      center: [-75.789, 41.874],
      style: 'mapbox://styles/mapbox/dark-v11'
    });

//     mapRef.current.on('load', () => {
//       mapRef.current.addSource('radar', {
//         type: 'image',
//         url: 'https://docs.mapbox.com/mapbox-gl-js/assets/radar.gif',
//         coordinates: [
//           [-80.425, 46.437],
//           [-71.516, 46.437],
//           [-71.516, 37.936],
//           [-80.425, 37.936]
//         ]
//       });
//       mapRef.current.addLayer({
//         id: 'radar-layer',
//         type: 'raster',
//         source: 'radar',
//         paint: {
//           'raster-fade-duration': 0
//         }
//       });
//     });
  }, []);

  return <div id="map" ref={mapContainerRef} style={{ height: '100%' }}></div>;
};

export default MapboxExample;