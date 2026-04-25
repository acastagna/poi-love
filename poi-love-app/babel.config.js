module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Richiesto da react-native-reanimated — deve essere l'ULTIMO plugin
      'react-native-reanimated/plugin',
    ],
  };
};
