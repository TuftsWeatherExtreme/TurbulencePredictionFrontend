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
      minZoom: 4,
      zoom: 5,
      center: [-75.789, 41.874],
    });

    mapRef.current.on('load', () => {



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