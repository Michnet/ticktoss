'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMapsLibrary } from '@vis.gl/react-google-maps';

const PlaceAutocomplete = ({ onPlaceSelect }) => {
  const [placeAutocomplete, setPlaceAutocomplete] = useState(null);
  const inputRef = useRef(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ['geometry', 'formatted_address'],
    };

    const autocomplete = new places.Autocomplete(inputRef.current, options);
    setPlaceAutocomplete(autocomplete);
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    placeAutocomplete.addListener('place_changed', () => {
      const place = placeAutocomplete.getPlace();
      if (place.geometry?.location) {
        onPlaceSelect(place);
      }
    });
  }, [onPlaceSelect, placeAutocomplete]);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <input
        ref={inputRef}
        className="tt-input"
        placeholder="Type an address to search..."
        style={{ width: '100%' }}
      />
    </div>
  );
};

const MapContent = ({ coordinates, setValue }) => {
  const geocodingLibrary = useMapsLibrary('geocoding');
  const [isGeocoding, setIsGeocoding] = useState(false);

  const reverseGeocode = useCallback(async (lat, lng) => {
    if (!geocodingLibrary) return;

    setIsGeocoding(true);
    try {
      const geocoder = new geocodingLibrary.Geocoder();
      const response = await geocoder.geocode({
        location: { lat, lng }
      });

      if (response.results && response.results[0]) {
        const formattedAddress = response.results[0].formatted_address;
        setValue('business_location', formattedAddress, { shouldValidate: true, shouldDirty: true });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocoding(false);
    }
  }, [geocodingLibrary, setValue]);

  const onMapClick = useCallback((event) => {
    const newLocation = {
      lat: event.detail.latLng.lat,
      lng: event.detail.latLng.lng,
    };
    setValue('pickup_lat', newLocation.lat, { shouldValidate: true });
    setValue('pickup_lng', newLocation.lng, { shouldValidate: true });
    reverseGeocode(newLocation.lat, newLocation.lng);
  }, [setValue, reverseGeocode]);

  const handleMarkerDragEnd = useCallback((event) => {
    const newLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    setValue('pickup_lat', newLocation.lat, { shouldValidate: true });
    setValue('pickup_lng', newLocation.lng, { shouldValidate: true });
    reverseGeocode(newLocation.lat, newLocation.lng);
  }, [setValue, reverseGeocode]);

  return (
    <>
      <Map
        reuseMaps={true}
        mapId='9d77a5741e66a10dd3dc9ef9'
        defaultZoom={10}
        defaultCenter={{ ...coordinates }}
        onClick={(e) => onMapClick(e)}
        gestureHandling="greedy"
      >
        <AdvancedMarker
          position={coordinates}
          draggable={true}
          onDragEnd={handleMarkerDragEnd}
        >
          <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
        </AdvancedMarker>
      </Map>

      {isGeocoding && (
        <div style={{ marginTop: '0.5rem', opacity: 0.7, fontSize: '0.85rem' }}>
          Getting address...
        </div>
      )}
    </>
  );
};

export default function MapInput({ setValue, watch }) {
  const latitude = watch('pickup_lat');
  const longitude = watch('pickup_lng');
  const address = watch('business_location');

  const [coordinates, setCoordinates] = useState({
    lat: latitude || 0.3152, // Kampala default
    lng: longitude || 32.5816
  });

  useEffect(() => {
    if (latitude && longitude) {
      setCoordinates({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  const handlePlaceSelect = useCallback((place) => {
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const formattedAddress = place.formatted_address;

    const options = { shouldDirty: true, shouldTouch: true, shouldValidate: true };
    setValue('pickup_lat', lat, options);
    setValue('pickup_lng', lng, options);
    setValue('business_location', formattedAddress, options);
  }, [setValue]);

  function handleMyLocation() {
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setValue('pickup_lat', newLocation.lat, { shouldValidate: true });
          setValue('pickup_lng', newLocation.lng, { shouldValidate: true });
        },
        (error) => {
          console.error("Error getting user location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API || '';

  return (
    <>
      <div style={{ marginBottom: '0.5rem' }}>
        <p style={{ color: 'var(--tt-muted)', fontSize: '0.85rem' }}>Drag the pin to the location on the map, or search the address below.</p>
      </div>
      
      <div style={{ marginBottom: '1rem', height: '300px', borderRadius: 'var(--tt-radius-md)', overflow: 'hidden', border: '1px solid var(--tt-border)' }}>
        <APIProvider apiKey={apiKey} libraries={['geocoding', 'places']}>
          <div style={{ padding: '0.5rem', background: 'var(--tt-surface)' }}>
            <PlaceAutocomplete onPlaceSelect={handlePlaceSelect} />
          </div>
          <MapContent coordinates={coordinates} setValue={setValue} />
        </APIProvider>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          {address && (
            <div>
              <span style={{ color: 'var(--tt-success)', marginRight: '0.5rem' }}>📍</span>
              <small style={{ opacity: 0.7 }}>{address}</small>
            </div>
          )}
        </div>
        <button
          className="tt-btn tt-btn-ghost"
          type="button"
          onClick={handleMyLocation}
          title="Use my location"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
        >
          📍 Use Current GPS
        </button>
      </div>
    </>
  );
}
