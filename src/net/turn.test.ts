import { describe, expect, it } from 'vitest'
import { turnServers } from './turn'

describe('les réglages TURN', () => {
  it('construit la liste quand les trois valeurs sont là', () => {
    expect(turnServers('turn:a.example:3478', 'moi', 'secret')).toEqual([
      { urls: ['turn:a.example:3478'], username: 'moi', credential: 'secret' },
    ])
  })

  it('accepte plusieurs URLs séparées par des virgules', () => {
    const out = turnServers('turn:a.example:3478,turns:a.example:443', 'moi', 'secret')
    expect(out?.[0].urls).toEqual(['turn:a.example:3478', 'turns:a.example:443'])
  })

  it('rogne les espaces d’un copier-coller', () => {
    // Une espace collée à l'identifiant fait répondre 401 au relais, et l'échec
    // est alors mot pour mot celui d'une absence de TURN.
    const out = turnServers(' turn:a.example:3478 \n', ' moi ', ' secret ')
    expect(out).toEqual([
      { urls: ['turn:a.example:3478'], username: 'moi', credential: 'secret' },
    ])
  })

  it('survit à une virgule finale', () => {
    // Une chaîne vide dans `urls` fait lever RTCPeerConnection à la
    // construction : c'est toute la mise en relation qui tombe, pour une virgule.
    expect(turnServers('turn:a.example:3478,', 'moi', 'secret')?.[0].urls).toEqual([
      'turn:a.example:3478',
    ])
  })

  it('rend undefined s’il manque une valeur — on joue sans relais', () => {
    expect(turnServers(undefined, 'moi', 'secret')).toBeUndefined()
    expect(turnServers('turn:a.example:3478', undefined, 'secret')).toBeUndefined()
    expect(turnServers('turn:a.example:3478', 'moi', undefined)).toBeUndefined()
    expect(turnServers('', 'moi', 'secret')).toBeUndefined()
    expect(turnServers('turn:a.example:3478', '  ', 'secret')).toBeUndefined()
  })
})
