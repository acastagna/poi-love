/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * POIMarker — il marcatore di un luogo sulla mappa.
 */
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { POI } from '@/lib/types';
import { Colors, Typography, Shadow } from '@/constants/theme';

interface Props {
  poi:      POI;
  onPress:  () => void;
  selected: boolean;
}

export default function POIMarker({ poi, onPress, selected }: Props) {
  return (
    <Marker
      coordinate={{ latitude: poi.lat, longitude: poi.lng }}
      onPress={onPress}
      tracksViewChanges={selected} // performance: non re-renderizza se non selezionato
    >
      <View style={[styles.marker, selected && styles.markerSelected]}>
        <Text style={styles.markerIcon}>📍</Text>
        {selected && (
          <View style={styles.label}>
            <Text style={styles.labelText} numberOfLines={1}>{poi.title}</Text>
          </View>
        )}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    alignItems: 'center',
  },
  markerSelected: {
    transform: [{ scale: 1.3 }],
  },
  markerIcon: {
    fontSize: 28,
  },
  label: {
    backgroundColor: Colors.red,
    borderRadius:    4,
    paddingHorizontal: 6,
    paddingVertical:   2,
    marginTop:       2,
    maxWidth:        120,
    ...Shadow.sm,
  },
  labelText: {
    fontSize:   Typography.xs,
    fontWeight: Typography.semibold,
    color:      Colors.white,
  },
});
