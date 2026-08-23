/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * RicercaMappa — la barra di ricerca in cima alla mappa, come nella webapp:
 * prima i luoghi di POI•LOVE (nostro database), sotto gli indirizzi del
 * mondo (Nominatim, con l'etichetta di cortesia: una richiesta al secondo
 * e il nostro nome nel presentarsi). Toccando un risultato la mappa vola li'.
 */
import { useRef, useState } from 'react';
import {
  View, TextInput, Text, TouchableOpacity, StyleSheet,
  Keyboard, ActivityIndicator, FlatList,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { db } from '@/lib/supabase';
import { Colors, Typography, Radius, Shadow } from '@/constants/theme';

/* La lente di Phosphor (magnifying-glass, viewBox 256). */
const LENTE_PHOSPHOR =
  'M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,' +
  '11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z';

export interface RisultatoRicerca {
  tipo:   'poi' | 'posto';
  id?:    string;
  nome:   string;
  sotto:  string;
  lat:    number;
  lng:    number;
}

interface Props {
  onScegli: (r: RisultatoRicerca) => void;
}

let _ultimaNominatim = 0;

export default function RicercaMappa({ onScegli }: Props) {
  const [testo, setTesto]         = useState('');
  const [risultati, setRisultati] = useState<RisultatoRicerca[]>([]);
  const [cerco, setCerco]         = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cambia(t: string) {
    setTesto(t);
    if (timer.current) clearTimeout(timer.current);
    if (t.trim().length < 3) { setRisultati([]); return; }
    timer.current = setTimeout(() => cerca(t.trim()), 450);
  }

  async function cerca(q: string) {
    setCerco(true);
    const trovati: RisultatoRicerca[] = [];
    // 1) I nostri luoghi, in tutte le lingue del titolo.
    try {
      const like = `%${q.replace(/[%_]/g, '')}%`;
      const { data } = await db
        .from('pois')
        .select('id,title,title_it,title_sq,title_en,city,lat,lng,love_count')
        .or(`title.ilike.${like},title_it.ilike.${like},title_sq.ilike.${like},title_en.ilike.${like}`)
        .in('visibility', ['community', 'official'])
        .eq('is_approved', true)
        .is('removed_at', null)
        .order('love_count', { ascending: false })
        .limit(5);
      (data ?? []).forEach((p: any) => trovati.push({
        tipo: 'poi', id: p.id, nome: p.title_it || p.title,
        sotto: p.city || 'POI•LOVE', lat: p.lat, lng: p.lng,
      }));
    } catch {}
    // 2) Gli indirizzi del mondo, col garbo dovuto a Nominatim.
    try {
      const attesa = 1100 - (Date.now() - _ultimaNominatim);
      if (attesa > 0) await new Promise(r => setTimeout(r, attesa));
      _ultimaNominatim = Date.now();
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`,
        { headers: { 'User-Agent': 'POI-LOVE/1.0 (https://poilove.com; info@321.it)' } },
      );
      if (r.ok) {
        const posti = await r.json();
        (posti ?? []).forEach((p: any) => trovati.push({
          tipo: 'posto', nome: String(p.display_name || '').split(',')[0],
          sotto: String(p.display_name || '').split(',').slice(1, 3).join(',').trim(),
          lat: parseFloat(p.lat), lng: parseFloat(p.lon),
        }));
      }
    } catch {}
    setRisultati(trovati);
    setCerco(false);
  }

  function scegli(r: RisultatoRicerca) {
    Keyboard.dismiss();
    setRisultati([]);
    setTesto('');
    onScegli(r);
  }

  return (
    <View style={styles.blocco} pointerEvents="box-none">
      <View style={styles.barra}>
        <Svg width={18} height={18} viewBox="0 0 256 256">
          <Path d={LENTE_PHOSPHOR} fill="#8A8177" />
        </Svg>
        <TextInput
          style={styles.campo}
          value={testo}
          onChangeText={cambia}
          placeholder="Cerca un POI o un luogo (es. Blloku, Tirana)..."
          placeholderTextColor="#9A9187"
          returnKeyType="search"
          autoCorrect={false}
        />
        {cerco && <ActivityIndicator size="small" color={Colors.red} />}
        {!cerco && testo.length > 0 && (
          <TouchableOpacity onPress={() => { setTesto(''); setRisultati([]); }} hitSlop={10}>
            <Text style={styles.pulisci}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {risultati.length > 0 && (
        <View style={styles.tendina}>
          <FlatList
            data={risultati}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(r, i) => r.tipo + (r.id ?? i)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.riga} onPress={() => scegli(item)}>
                <View style={[styles.pallino, item.tipo === 'poi' ? styles.pallinoPoi : styles.pallinoPosto]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rigaNome} numberOfLines={1}>{item.nome}</Text>
                  <Text style={styles.rigaSotto} numberOfLines={1}>{item.sotto}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  blocco: {
    position: 'absolute',
    top: 56,
    left: 12,
    right: 12,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: Radius.full ?? 24,
    paddingHorizontal: 14,
    height: 46,
    ...Shadow.md,
  },
  campo: {
    flex: 1,
    fontSize: Typography.sm ?? 14,
    color: '#333',
  },
  pulisci: {
    fontSize: 16,
    color: '#9A9187',
    paddingHorizontal: 4,
  },
  tendina: {
    marginTop: 6,
    backgroundColor: '#fff',
    borderRadius: 14,
    maxHeight: 280,
    overflow: 'hidden',
    ...Shadow.md,
  },
  riga: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,.08)',
  },
  pallino: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pallinoPoi:   { backgroundColor: Colors.red },
  pallinoPosto: { backgroundColor: '#8A8177' },
  rigaNome: {
    fontSize: Typography.sm ?? 14,
    fontWeight: Typography.semibold,
    color: '#333',
  },
  rigaSotto: {
    fontSize: Typography.xs ?? 12,
    color: '#8A8177',
  },
});
