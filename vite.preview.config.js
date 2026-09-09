/**
 * Production-serving config for w.s3v.no.
 *
 * Upstream registers all 26 data proxies as `configureServer` (dev-server only)
 * middleware, so `vite preview` on a build serves the static bundle with every
 * live layer dead. Exposing the dev server publicly instead is not an option:
 * it is a key broker with filesystem transforms attached.
 *
 * This copies each proxy plugin's dev hook onto the preview hook, so the built
 * bundle in dist/ is served by Vite's preview server with the proxies mounted.
 * Nothing upstream is modified, so `git pull` stays clean.
 *
 * Run: vite build && vite preview --config vite.preview.config.js
 */
import base from './vite.config.js';

// server.restart() exists only on a dev server. It is called from the Provider
// Settings write path, which is loopback-only and refuses proxied requests, so
// it is unreachable through the tunnel - but an undefined call there would throw
// inside a timer and take the process down. Hand it a no-op instead.
const withRestart = (server) => new Proxy(server, {
  get: (target, key) => (key === 'restart' && !target.restart
    ? async () => {}
    : target[key]),
});

export default async (env) => {
  const config = await base(env);
  config.plugins = config.plugins
    .flat(Infinity)
    .map((plugin) => {
      if (!plugin?.configureServer || plugin.configurePreviewServer) return plugin;
      if (String(plugin.name || '').includes('cesium')) return plugin; // build copies its assets
      return {
        ...plugin,
        configurePreviewServer: (server) => plugin.configureServer(withRestart(server)),
      };
    });
  config.preview = {
    host: process.env.HOST || '127.0.0.1',
    port: parseInt(process.env.PORT, 10) || 4173,
    // Cloudflare Tunnel passes the real Host through; Provider Settings rejects
    // it on that basis alone, on top of already refusing proxied requests.
    allowedHosts: ['localhost', '127.0.0.1', 'w.s3v.no'],
    headers: config.server?.headers,
  };
  return config;
};
