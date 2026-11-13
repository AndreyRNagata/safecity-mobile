// Configuração do Metro.
// O expo-sqlite na web usa WebAssembly e SharedArrayBuffer, que exigem:
//  1) aceitar arquivos .wasm como asset; e
//  2) os cabeçalhos COEP/COOP no servidor de desenvolvimento.
// No Android/iOS (Expo Go) nada disso é necessário.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
