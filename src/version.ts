/**
 * L'identité de la version, et où aller la lire.
 *
 * `__APP_VERSION__` est remplacé à la compilation par le numéro écrit dans
 * `package.json` (voir `vite.config.ts`) : écrit deux fois, il aurait divergé
 * dès la première publication, et c'est l'écran Réglages qui aurait menti.
 */
export const VERSION: string = __APP_VERSION__

export const DEPOT = 'https://github.com/alarboulletmarin/rempart'
export const CHANGELOG = `${DEPOT}/blob/main/CHANGELOG.md`
