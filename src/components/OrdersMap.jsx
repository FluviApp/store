import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';

const OrdersMap = ({ locations }) => {
    const mapRef = useRef(null);
    const [ready, setReady] = useState(false);

    // Esperamos a que las coordenadas cambien para actualizar el mapa
    useEffect(() => {
        const timeout = setTimeout(() => setReady(true), 300);
        return () => clearTimeout(timeout);
    }, [locations]);

    return (
        <div style={{ height: '100%', width: '100%' }}>
            {ready && (
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={locations.length > 0 ? { lat: locations[0].lat, lng: locations[0].lng } : { lat: 0, lng: 0 }} // Centro en el primer pin
                    zoom={12}
                    onLoad={(map) => {
                        mapRef.current = map;
                        // Aseguramos que el mapa reciba el tamaño correcto al cargar
                        setTimeout(() => {
                            window.google.maps.event.trigger(map, 'resize');
                            // Si tienes coordenadas, el mapa se moverá al primer pin
                            if (locations.length > 0) {
                                map.panTo({ lat: locations[0].lat, lng: locations[0].lng });
                            }
                        }, 300);
                    }}
                >
                    {/* Mostrar un marcador por cada ubicación de pedidos */}
                    {locations.map((location, index) => (
                        <Marker
                            key={index}
                            position={{ lat: location.lat, lng: location.lng }}
                            draggable={false} // Los marcadores no se arrastrarán en este caso
                            onLoad={() => console.log(`📍 Marker cargado correctamente en lat: ${location.lat}, lng: ${location.lng}`)}
                            options={{
                                optimized: false,
                                visible: true,
                                zIndex: 9999,
                            }}
                        />
                    ))}
                </GoogleMap>
            )}
        </div>
    );
};

export default OrdersMap;
