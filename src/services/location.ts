import Geolocation from '@react-native-community/geolocation';

export interface Coords {
  latitude: number;
  longitude: number;
}

Geolocation.setRNConfiguration({
  // Permissions are handled by the permission store, not by this library.
  skipPermissionRequests: true,
  authorizationLevel: 'whenInUse',
  locationProvider: 'auto',
});

const TIMEOUT_MS = 15000;
const MAX_AGE_MS = 60000;

export function getCurrentCoords(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      error => reject(new Error(error.message)),
      {
        enableHighAccuracy: false,
        timeout: TIMEOUT_MS,
        maximumAge: MAX_AGE_MS,
      },
    );
  });
}

/** "12.9716,77.5946" — a generic string, no reverse geocoding. */
export function formatCoords({ latitude, longitude }: Coords): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}
