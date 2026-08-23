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
import RicercaMappa, { RisultatoRicerca } from '@/components/RicercaMappa';
import Svg, { Path } from 'react-native-svg';

/* Il piu' di Phosphor per il tasto Aggiungi (niente caratteri al posto delle icone). */
const PIU_PHOSPHOR = 'M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z';

export default function MapScreen() {
  const mapRef       = useRef<MapView>(null);
  const [pois,         setPois]         = useState<POI[]>([]);
  const [mappaErrore,  setMappaErrore]  = useState(false);
  const [selectedPOI,  setSelectedPOI]  = useState<POI | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [newPOICoord,  setNewPOICoord]  = useState<{ latitude: number; longitude: number } | null>(null);
  const [region,       setRegion]       = useState<Region>(Config.defaultRegion);
  const [mioUserId,    setMioUserId]    = useState<string | null>(null);

  // Chi sono: serve per colorare di rosso i MIEI luoghi sulla mappa
  useEffect(() => {
    import('@/lib/supabase').then(({ db }) =>
      db.auth.getSession().then(({ data }) => setMioUserId(data.session?.user?.id ?? null))
    ).catch(() => {});
  }, []);

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
      setMappaErrore(false);
      return result as POI[];
    } catch (err) {
      // La mappa che tace su un errore mostra un mondo vuoto e sembra vera:
      // un avviso discreto, e i marcatori gia' scaricati restano al loro posto.
      console.warn('fetchPOIs error:', err);
      setMappaErrore(true);
      return [] as POI[];
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
            mioUserId={mioUserId}
          />
        ))}
      </MapView>

      {/* La barra di ricerca, come nella webapp: nostri luoghi + indirizzi */}
      <RicercaMappa
        onScegli={(r: RisultatoRicerca) => {
          const dove: Region = {
            latitude: r.lat, longitude: r.lng,
            latitudeDelta: 0.015, longitudeDelta: 0.015,
          };
          mapRef.current?.animateToRegion(dove, 700);
          if (r.tipo === 'poi' && r.id) {
            const p = pois.find(x => x.id === r.id);
            if (p) setSelectedPOI(p);
            else fetchPOIs(dove).then(scaricati => {
              const t = (scaricati || []).find(x => x.id === r.id);
              if (t) setSelectedPOI(t);
            });
          }
        }}
      />

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="small" color={Colors.red} />
        </View>
      )}

      {/* La rete non risponde: lo si dice, non si finge una mappa vuota */}
      {mappaErrore && !loading && (
        <TouchableOpacity
          style={styles.erroreBadge}
          onPress={() => fetchPOIs(region)}
          activeOpacity={0.85}
        >
          <Text style={styles.erroreBadgeText}>Luoghi non aggiornati · tocca per riprovare</Text>
        </TouchableOpacity>
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
          <Svg width={26} height={26} viewBox="0 0 256 256">
            <Path d={PIU_PHOSPHOR} fill={Colors.white} />
          </Svg>
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
    top:             112,
    alignSelf:       'center',
    backgroundColor: Colors.background,
    borderRadius:    Radius.full,
    padding:         Spacing.sm,
    ...Shadow.sm,
  },
  erroreBadge: {
    position: 'absolute',
    top: 112,
    alignSelf: 'center',
    backgroundColor: 'rgba(212,43,43,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  erroreBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
