/**
 * POI•LOVE — Schermata Login
 *
 * Google OAuth via Supabase + expo-auth-session.
 * Funziona su iOS, Android e Web senza SDK nativi aggiuntivi.
 */
import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/constants/theme';

// Necessario per completare il flow OAuth su mobile
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function signInWithGoogle() {
    try {
      setLoading(true);
      setError(null);

      // Costruisci redirect URI in base alla piattaforma
      const redirectTo = makeRedirectUri({
        scheme:   'poilove',
        path:     'auth/callback',
        // Su web usa l'origin corrente
        ...(Platform.OS === 'web' ? { preferLocalhost: true } : {}),
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt:      'consent',
          },
        },
      });

      if (error) throw error;

      // Apri il browser per il login Google
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

        if (result.type === 'success' && result.url) {
          // Estrai la sessione dall'URL di callback
          const params = new URL(result.url);
          const access_token  = params.searchParams.get('access_token')
                             ?? params.hash.split('access_token=')[1]?.split('&')[0];
          const refresh_token = params.searchParams.get('refresh_token')
                             ?? params.hash.split('refresh_token=')[1]?.split('&')[0];

          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore di accesso';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoArea}>
        <Image
          source={{ uri: 'https://poilove.com/img/logo-completo.svg' }}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>
          Mappa i luoghi che ami.{'\n'}Condividili con chi ami.
        </Text>
      </View>

      {/* CTA */}
      <View style={styles.ctaArea}>
        <TouchableOpacity
          style={[styles.googleBtn, loading && styles.btnDisabled]}
          onPress={signInWithGoogle}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.textPrimary} size="small" />
          ) : (
            <>
              {/* Icona Google SVG inline via testo — sostituire con PhosphorIcon se disponibile */}
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleBtnText}>Continua con Google</Text>
            </>
          )}
        </TouchableOpacity>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <Text style={styles.disclaimer}>
          Accedendo accetti i{' '}
          <Text style={styles.link}>Termini di servizio</Text>
          {' '}e la{' '}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        POI•LOVE — Cultural Bridge OS{'\n'}
        Open source · MIT License
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    justifyContent:  'space-between',
    paddingTop:      80,
    paddingBottom:   48,
  },
  logoArea: {
    alignItems: 'center',
    gap:        Spacing.lg,
  },
  logo: {
    width:  200,
    height: 80,
  },
  tagline: {
    fontSize:   Typography.lg,
    fontWeight: Typography.medium,
    color:      Colors.textPrimary,
    textAlign:  'center',
    lineHeight: Typography.lg * Typography.normal,
  },
  ctaArea: {
    gap: Spacing.md,
  },
  googleBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.white,
    borderRadius:    Radius.md,
    paddingVertical: Spacing.md,
    gap:             Spacing.sm,
    ...Shadow.md,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    fontSize:   Typography.md,
    fontWeight: Typography.bold,
    color:      '#4285F4',
  },
  googleBtnText: {
    fontSize:   Typography.md,
    fontWeight: Typography.semibold,
    color:      Colors.textPrimary,
  },
  errorText: {
    fontSize:  Typography.sm,
    color:     Colors.error,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize:  Typography.xs,
    color:     Colors.textMuted,
    textAlign: 'center',
  },
  link: {
    color:      Colors.blue,
    fontWeight: Typography.medium,
  },
  footer: {
    fontSize:  Typography.xs,
    color:     Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.xs * Typography.normal,
  },
});
