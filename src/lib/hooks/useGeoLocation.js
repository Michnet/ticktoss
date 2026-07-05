'use client';

import { useState, useEffect, useCallback } from 'react';
import useAppStore from '@/store/useAppStore';

/**
 * Geolocation hook.
 * Requests browser geolocation on demand (not on mount).
 * Stores result in Zustand for global access.
 */
export function useGeoLocation() {
  const { userLocation, setUserLocation } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [permission, setPermission] = useState('unknown'); // 'unknown'|'granted'|'denied'

  // Check permission state
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return;
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      setPermission(result.state);
      result.onchange = () => setPermission(result.state);
    });
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setPermission('granted');
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setPermission('denied');
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, [setUserLocation]);

  return {
    location: userLocation,
    loading,
    error,
    permission,
    requestLocation,
  };
}

/**
 * Haversine distance between two lat/lng points, in km.
 * @param {{ lat: number, lng: number }} a
 * @param {{ lat: number, lng: number }} b
 * @returns {number}
 */
export function haversineDistance(a, b) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}
