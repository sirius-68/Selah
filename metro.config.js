const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Bibles ship as gzip files and are unpacked on the device when first opened.
config.resolver.assetExts.push('gz');

module.exports = config;
