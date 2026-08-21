/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.it · https://321.al
 *
 * L'accesso: email e password, oppure Google.
 *
 * Tutto passa dal NOSTRO servizio accessi (GoTrue su poilove.com/db/auth).
 * Google: si apre il suo foglio nel browser di sistema, al ritorno l'app
 * riceve i gettoni sul deep link poilove:// (ammesso nella lista del server
 * il 21/08/2026) e li consegna al client. La registrazione via email entra
 * subito: il server conferma da solo, senza email di verifica.
 */
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/supabase';
import { Config } from '@/constants/config';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

/** I gettoni arrivano nel frammento dell'URL di ritorno (#access_token=…&…). */
function gettoniDaUrl(url: string): { access_token: string; refresh_token: string } | null {
  const frammento = url.split('#')[1] ?? url.split('?')[1] ?? '';
  const p = new URLSearchParams(frammento);
  const access_token = p.get('access_token');
  const refresh_token = p.get('refresh_token');
  return access_token && refresh_token ? { access_token, refresh_token } : null;
}

/** Gli errori del servizio accessi, in parole nostre. */
function inParole(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'Email o password sbagliate';
  if (/user already registered/i.test(msg))   return 'Questa email ha gia un account: entra invece di registrarti';
  if (/password should be at least/i.test(msg)) return 'La password deve avere almeno 6 caratteri';
  if (/rate limit/i.test(msg))                return 'Troppi tentativi: aspetta un minuto';
  if (/network/i.test(msg))                   return 'Rete assente: controlla la connessione';
  return msg;
}

export default function LoginScreen() {
  const [modo,     setModo]     = useState<'entra' | 'registrati'>('entra');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function conEmail() {
    if (!email.trim() || !password) {
      setError('Servono email e password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = modo === 'entra'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });
      if (error) throw error;
      // Il cambio di schermata lo fa il listener di sessione nel layout.
    } catch (err: unknown) {
      setError(inParole(err instanceof Error ? err.message : 'Errore di accesso'));
    } finally {
      setLoading(false);
    }
  }

  async function conGoogle() {
    setLoading(true);
    setError(null);
    try {
      const redirectTo = makeRedirectUri({ scheme: Config.linkingScheme, path: 'auth-callback' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) throw new Error('Il servizio accessi non ha risposto');

      const esito = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (esito.type !== 'success' || !esito.url) return;   // annullato da lui: nessun errore

      const gettoni = gettoniDaUrl(esito.url);
      if (!gettoni) throw new Error('Google non ha consegnato i gettoni: riprova');
      const { error: errSet } = await supabase.auth.setSession(gettoni);
      if (errSet) throw errSet;
    } catch (err: unknown) {
      setError(inParole(err instanceof Error ? err.message : 'Errore di accesso'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>
          POI<Text style={styles.logoDot}>•</Text>LOVE
        </Text>
        <Text style={styles.claim}>La mappa fatta dalle persone</Text>

        {/* Entra / Registrati */}
        <View style={styles.switchRow}>
          {(['entra', 'registrati'] as const).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.switchBtn, modo === m && styles.switchBtnOn]}
              onPress={() => { setModo(m); setError(null); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.switchText, modo === m && styles.switchTextOn]}>
                {m === 'entra' ? 'Entra' : 'Registrati'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="email"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="password"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          autoComplete={modo === 'entra' ? 'current-password' : 'new-password'}
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={conEmail}
        />

        <TouchableOpacity
          style={[styles.mainBtn, loading && styles.btnDisabled]}
          onPress={conEmail}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Text style={styles.mainBtnText}>{modo === 'entra' ? 'Entra' : 'Crea l’account'}</Text>}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>oppure</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.googleBtn, loading && styles.btnDisabled]}
          onPress={conGoogle}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.googleBtnText}>Continua con Google</Text>
        </TouchableOpacity>

        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.legal}>
          Entrando accetti le condizioni d'uso e l'informativa privacy su poilove.com
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
  logo:      { fontSize: 40, fontWeight: '900', textAlign: 'center', color: Colors.textPrimary, letterSpacing: 1 },
  logoDot:   { color: Colors.red },
  claim:     { textAlign: 'center', color: Colors.textMuted, marginTop: 6, marginBottom: Spacing.xl, fontSize: 14 },
  switchRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 4, marginBottom: Spacing.lg },
  switchBtn:     { flex: 1, paddingVertical: 10, borderRadius: Radius.sm, alignItems: 'center' },
  switchBtnOn:   { backgroundColor: Colors.white, ...Shadow.sm },
  switchText:    { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  switchTextOn:  { color: Colors.textPrimary },
  input: {
    backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: Colors.textPrimary, marginBottom: Spacing.sm,
  },
  mainBtn: {
    backgroundColor: Colors.red, borderRadius: Radius.md, paddingVertical: 15,
    alignItems: 'center', marginTop: Spacing.sm, ...Shadow.md,
  },
  mainBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  dividerRow:  { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 12, color: Colors.textMuted, fontSize: 12 },
  googleBtn: {
    backgroundColor: Colors.white, borderRadius: Radius.md, paddingVertical: 15,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  googleBtnText: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  error: { color: Colors.red, textAlign: 'center', marginTop: Spacing.md, fontSize: 13, fontWeight: '600' },
  legal: { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.xl, fontSize: 11, lineHeight: 16 },
});
