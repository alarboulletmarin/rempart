import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Rempart — PWA front-only : aucun backend, aucun compte, aucun tracking.
// Le service worker met en cache l'app entière pour un fonctionnement hors ligne.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'assets/*.svg',
        'icon.svg',
        'icon-32.png',
        'apple-touch-icon.png',
      ],
      workbox: {
        // Tout l'applicatif est mis en cache : le jeu doit démarrer hors ligne.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
        // Sans cela, la toute première visite reste non contrôlée : le worker
        // s'installe, précache, et n'attrape la page qu'au chargement suivant.
        // Quelqu'un qui ouvre le jeu puis descend dans le métro trouverait une
        // page blanche.
        clientsClaim: true,
        // Les polices Google sont mises en cache à la première visite ; ensuite
        // l'app tient hors ligne. C'est le seul `fetch` du jeu — la
        // signalisation Nostr et le TURN ne passent pas par là.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'rempart-fontes',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        // L'identité de l'app aux yeux du navigateur, indépendante de
        // `start_url` : sans elle, changer un jour la page d'arrivée ferait de
        // l'app une seconde app, à installer à côté de la première.
        id: './',
        name: 'Rempart',
        short_name: 'Rempart',
        description:
          'Chacun choisit en secret une carte parmi quatre. La carte jouée est interdite la manche suivante.',
        lang: 'fr',
        dir: 'ltr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#E4D7BE',
        theme_color: '#E4D7BE',
        categories: ['games'],
        /*
         * `any` et `maskable` sont deux dessins, pas deux usages du même.
         *
         * Un système qui applique son gabarit ne garde que le cercle inscrit à
         * 80 % du côté : servir l'icône `any` en maskable, comme on le faisait,
         * c'était laisser rogner les deux briques des bouts, qui touchent
         * justement ce cercle. Le fichier `-maskable` reprend le même mur, plus
         * petit, pour que le rognage ne tombe que sur du fond. L'`any` garde sa
         * pleine largeur, pour les systèmes qui affichent le fichier tel quel.
         */
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
