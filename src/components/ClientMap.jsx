// src/components/ClientMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

const ClientMap = ({ lat, lng, onDragEnd }) => {
    const mapRef = useRef(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setReady(true), 300);
        return () => clearTimeout(timeout);
    }, [lat, lng]);

    return (
        <div style={{ height: '400px', width: '100%' }}>
            {ready && (
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={{ lat, lng }}
                    zoom={16}
                    onLoad={(map) => {
                        mapRef.current = map;
                        setTimeout(() => {
                            window.google.maps.event.trigger(map, 'resize');
                            map.panTo({ lat, lng });
                        }, 300);
                    }}
                >
                    <Marker
                        position={{ lat, lng }}
                        draggable
                        onLoad={() => console.log('📍 Marker cargado correctamente', lat, lng)}
                        onDragEnd={(e) => {
                            const newLat = e.latLng.lat();
                            const newLng = e.latLng.lng();
                            onDragEnd(newLat, newLng);
                        }}
                        options={{
                            optimized: false,
                            visible: true,
                            zIndex: 9999,
                        }}
                    />
                </GoogleMap>
            )}
        </div>
    );
};

export default ClientMap;
