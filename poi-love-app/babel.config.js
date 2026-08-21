module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated 4: l'attrezzo di compilazione dei worklet si e' spostato
      // nel pacchetto react-native-worklets. Deve restare l'ULTIMO plugin.
      'react-native-worklets/plugin',
    ],
  };
};
