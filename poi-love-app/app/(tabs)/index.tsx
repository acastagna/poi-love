/**
 * POI•LOVE — Schermata Mappa (home)
 *
 * Features:
 * - MapView Google Maps con layer POI
 * - Geolocalizzazione utente
 * - Tap su marker → card POI
 * - FAB "+" → AddPOISheet (< 90 sec flow)
 * - Fetch POI nel bounding box visibile
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { fetchPOIsInRegion } from '@/lib/supabase';
import { POI } from '@/lib/types';
import { Config } from '@/constants/config';
import { Colors, Spacing, Radius, Typography, Shadow } from '@/constants/theme';
import POIMarker from '@/components/POIMarker';
import AddPOISheet from '@/components/AddPOISheet';
import POIDetailCard from '@/components/POIDetailCard';

export default function MapScreen() {
  const mapRef       = useRef<MapView>(null);
  const [pois,         setPois]         = useState<POI[]>([]);
  const [selectedPOI,  setSelectedPOI]  = useState<POI | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [newPOICoord,  setNewPOICoord]  = useState<{ latitude: number; longitude: number } | null>(null);
  const [region,       setRegion]       = useState<Region>(Config.defaultRegion);

  // GPS al primo avvio
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const userRegion: Region = {
        latitude:       loc.coords.latitude,
        longitude:      loc.coords.longitude,
        latitudeDelta:  0.03,
        longitudeDelta: 0.03,
      };
      setRegion(userRegion);
      mapRef.current?.animateToRegion(userRegion, 800);
    })();
  }, []);

  // Fetch POI quando la mappa cambia regione
  const fetchPOIs = useCallback(async (r: Region) => {
    try {
      setLoading(true);
      const delta  = 0.01;
      const result = await fetchPOIsInRegion(
        r.latitude - r.latitudeDelta / 2 - delta,
        r.latitude + r.latitudeDelta / 2 + delta,
        r.longitude - r.longitudeDelta / 2 - delta,
        r.longitude + r.longitudeDelta / 2 + delta,
      );
      setPois(result as POI[]);
    } catch (err) {
      console.warn('fetchPOIs error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ricarica POI quando la tab torna in focus
  useFocusEffect(
    useCallback(() => {
      fetchPOIs(region);
    }, [region])
  );

  function handleRegionChangeComplete(r: Region) {
    setRegion(r);
    fetchPOIs(r);
  }

  // Long press sulla mappa → apri AddPOISheet con coordinate
  function handleLongPress(e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) {
    setNewPOICoord(e.nativeEvent.coordinate);
    setSelectedPOI(null);
    setShowAddSheet(true);
  }

  function handleAddButtonPress() {
    // Usa il centro mappa come coordinata di default
    setNewPOICoord({
      latitude:  region.latitude,
      longitude: region.longitude,
    });
    setSelectedPOI(null);
    setShowAddSheet(true);
  }

  return (
    <View style={styles.container}>
      {/* Mappa */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        onLongPress={handleLongPress}
        onPress={() => setSelectedPOI(null)}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={mapStyle}
      >
        {pois.map(poi => (
          <POIMarker
            key={poi.id}
            poi={poi}
            onPress={() => setSelectedPOI(poi)}
            selected={selectedPOI?.id === poi.id}
          />
        ))}
      </MapView>

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="small" color={Colors.red} />
        </View>
      )}

      {/* Card POI selezionato */}
      {selectedPOI && (
        <POIDetailCard
          poi={selectedPOI}
          onClose={() => setSelectedPOI(null)}
        />
      )}

      {/* FAB Aggiungi POI */}
      {!selectedPOI && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddButtonPress}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      {/* Sheet aggiunta POI */}
      {showAddSheet && newPOICoord && (
        <AddPOISheet
          coordinate={newPOICoord}
          onClose={() => setShowAddSheet(false)}
          onSaved={(newPoi) => {
            setShowAddSheet(false);
            setPois(prev => [newPoi, ...prev]);
          }}
        />
      )}
    </View>
  );
}

// Custom map style — beige warm per coerenza col brand
const mapStyle = [
  { elementType: 'geometry',       stylers: [{ color: '#f0ebe1' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6B6154' }] },
  { featureType: 'water',          elementType: 'geometry', stylers: [{ color: '#b8d4e8' }] },
  { featureType: 'road',           elementType: 'geometry', stylers: [{ color: '#e0d9cc' }] },
  { featureType: 'road.highway',   elementType: 'geometry', stylers: [{ color: '#d4c9b5' }] },
  { featureType: 'poi.park',       elementType: 'geometry', stylers: [{ color: '#d4e8c8' }] },
  { featureType: 'poi',            elementType: 'labels',   stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingBadge: {
    position:        'absolute',
    top:             60,
    alignSelf:       'center',
    backgroundColor: Colors.background,
    borderRadius:    Radius.full,
    padding:         Spacing.sm,
    ...Shadow.sm,
  },
  fab: {
    position:        'absolute',
    bottom:          32,
    right:           24,
    width:           56,
    height:          56,
    borderRadius:    28,
    backgroundColor: Colors.red,
    alignItems:      'center',
    justifyContent:  'center',
    ...Shadow.lg,
  },
  fabIcon: {
    fontSize:   32,
    color:      Colors.white,
    fontWeight: Typography.bold,
    lineHeight: 36,
  },
});
