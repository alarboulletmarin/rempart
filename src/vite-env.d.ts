/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /**
   * Serveur TURN, optionnel mais recommandé pour jouer à distance en 4G/5G.
   *
   * Sans lui, deux joueurs derrière un NAT symétrique ne peuvent pas se
   * joindre : le jeu marche entre deux box internet, pas toujours entre deux
   * téléphones en données mobiles. Voir `.env.example`.
   */
  readonly VITE_TURN_URLS?: string
  readonly VITE_TURN_USER?: string
  readonly VITE_TURN_PASS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
