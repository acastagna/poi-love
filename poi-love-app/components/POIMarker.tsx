/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * POIMarker — il marcatore di un luogo sulla mappa.
 */
import { Marker } from 'react-native-maps';
import { POI } from '@/lib/types';
import PinCuore, { TierMarcatore } from './PinCuore';

interface Props {
  poi:      POI;
  onPress:  () => void;
  selected: boolean;
  mioUserId?: string | null;   // per colorare di rosso i MIEI luoghi
}

export default function POIMarker({ poi, onPress, selected, mioUserId }: Props) {
  // I tre livelli del founder: i MIEI rossi, chi seguo verde (arrivera'
  // col blocco dei profili), la community grigia e discreta.
  const tier: TierMarcatore =
    mioUserId && poi.author_id === mioUserId ? 'mio' : 'community';
  return (
    <Marker
      coordinate={{ latitude: poi.lat, longitude: poi.lng }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.78 }}
      tracksViewChanges={selected} // performance: non re-renderizza se non selezionato
    >
      <PinCuore
        titolo={poi.title_it || poi.title}
        love={poi.love_count || 0}
        selected={selected}
        tier={tier}
        ufficiale={poi.visibility === 'official' || !!poi.badge_official}
      />
    </Marker>
  );
}
