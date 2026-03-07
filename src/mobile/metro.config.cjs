const { getDefaultConfig } = require('expo/metro-config');
const { withSentryConfig } = require('@sentry/react-native/metro');

const config = getDefaultConfig(__dirname, {
    isCSSEnabled: true,
});

config.resolver.sourceExts.push('mjs');

module.exports = withSentryConfig(config);
