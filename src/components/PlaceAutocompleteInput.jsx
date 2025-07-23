// src/components/PlaceAutocompleteInput.jsx
import React, { useEffect, useRef } from "react";

const PlaceAutocompleteInput = ({ onPlaceSelected, placeholder = "Buscar dirección..." }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (!ref.current) return;

        // Verificamos si Google Maps ya está disponible
        if (window.google?.maps?.places?.PlaceAutocompleteElement) {
            const autocompleteElement = new window.google.maps.places.PlaceAutocompleteElement();
            ref.current.appendChild(autocompleteElement);

            autocompleteElement.addEventListener('gmp-placeautocomplete-placechanged', (event) => {
                const place = event.target.getPlace();
                onPlaceSelected(place);
            });
        } else {
            console.error('Google Maps Places API no está cargada todavía.');
        }
    }, []);

    return (
        <div ref={ref}>
            {/* El <place-autocomplete-element> se insertará aquí dinámicamente */}
        </div>
    );
};

export default PlaceAutocompleteInput;
