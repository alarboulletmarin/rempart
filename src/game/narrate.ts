/**
 * Le récit de la révélation. C'est le moment fort de l'app : une phrase qui
 * dit ce qui vient de se passer, du point de vue de celui qui regarde.
 *
 * Le moteur ne produit que des faits (RoundEvent) ; le texte est fabriqué ici,
 * parce qu'il dépend de qui lit l'écran — « ta frappe » pour l'un est
 * « la frappe de Léa » pour l'autre.
 */
import type { T } from '../i18n'
import type { GameState, PlayerId, RoundEvent, RoundOutcome } from './types'

export type Tone = 'clay' | 'green' | 'ink'

export interface Narration {
  /** Le titre du panneau, en Bricolage. */
  headline: string
  /** La ligne de détail sous le titre. */
  detail: string
  /** La matière du panneau : terre cuite pour un dégât, vert atelier pour une défense. */
  tone: Tone
}

/**
 * Le récit se dit en phrases entières, une par point de vue.
 *
 * On l'écrivait par collage : un sujet (« Tu » ou le prénom), un verbe accordé
 * à la main (« as » ou « a »), un possessif choisi au passage. Ça tenait en
 * français, et uniquement en français — « Tu » + « as frappé » n'a pas de
 * traduction, seule la phrase entière en a une. Chaque cas a donc autant de
 * clés qu'il a de lecteurs possibles : celui qui a frappé, celui qui a pris le
 * coup, et celui qui regarde les deux.
 */
export function narrate(
  state: GameState,
  outcome: RoundOutcome,
  viewerId: PlayerId | null,
  t: T,
): Narration {
  const nom = (id: PlayerId) => state.players.find((p) => p.id === id)?.name ?? '?'
  const moi = (id: PlayerId) => id === viewerId

  const ev = outcome.events

  /** « — et Frapper t'est interdit la manche prochaine. », ou rien. */
  const verrou = (id: PlayerId) => {
    const cartes = outcome.outcomes
      .find((o) => o.playerId === id)
      ?.played.map((c) => t(`carte.${c.card}` as const))
    if (!cartes || cartes.length === 0) return ''
    const params = { cartes: t.liste(cartes), nom: nom(id) }
    return ' ' + t.n(moi(id) ? 'recit.verrou.moi' : 'recit.verrou.autre', cartes.length, params)
  }

  // 1 · Un piège qui se retourne contre son attaquant : le fait le plus marquant.
  const retournees = ev.filter((e): e is Extract<RoundEvent, { t: 'retournee' }> => e.t === 'retournee')
  const retour = retournees.find((e) => moi(e.from)) ?? retournees[0]
  if (retour) {
    // `from` a frappé, `to` avait piégé : c'est `from` qui perd la brique.
    const vue = moi(retour.from) ? 'moiAuteur' : moi(retour.to) ? 'moiPiegeur' : 'autres'
    const params = { auteur: nom(retour.from), piegeur: nom(retour.to) }
    return {
      headline: t(`recit.retourne.titre.${vue}` as const, params),
      detail:
        t.n(`recit.retourne.detail.${vue}` as const, retour.amount, params) +
        (vue === 'moiAuteur' ? verrou(retour.from) : ''),
      tone: 'clay',
    }
  }

  // 2 · Un blocage qui annule plusieurs frappes.
  const annuleesPar = new Map<PlayerId, number>()
  for (const e of ev) if (e.t === 'annulee') annuleesPar.set(e.to, (annuleesPar.get(e.to) ?? 0) + 1)
  const meilleur = [...annuleesPar.entries()].sort((a, b) => b[1] - a[1])[0]
  if (meilleur && meilleur[1] > 0) {
    const [qui, n] = meilleur
    const vue = moi(qui) ? 'moi' : 'autre'
    return {
      headline: t(`recit.bloc.titre.${n > 1 ? 'tout' : 'une'}.${vue}` as const, { nom: nom(qui) }),
      detail: t.n(`recit.bloc.detail.${vue}` as const, n, {
        nom: nom(qui),
        carte: t('carte.bloquer'),
      }),
      tone: 'green',
    }
  }

  // 3 · Des frappes qui passent.
  const passees = ev.filter((e): e is Extract<RoundEvent, { t: 'frappe' }> => e.t === 'frappe')
  if (passees.length > 0) {
    const surMoi = passees.find((e) => moi(e.to))
    const e = surMoi ?? passees[0]
    const total = passees.filter((x) => x.to === e.to).reduce((n, x) => n + x.amount, 0)
    const params = { nom: nom(e.from), cible: nom(e.to) }
    return {
      // Le possessif du titre s'accorde avec le NOMBRE de briques, jamais avec
      // la personne : « tes briques » quand il en tombe deux, « ta brique »
      // quand il n'en tombe qu'une.
      headline: surMoi
        ? t.n('recit.frappe.titre.surMoi', total, params)
        : t(`recit.frappe.titre.${moi(e.from) ? 'parMoi' : 'autres'}` as const, params),
      // Et le détail se dit au lecteur, comme tout le reste de ce fichier :
      // « Tu perds » quand c'est son mur, le prénom quand c'est celui d'un autre.
      detail:
        t.n(`recit.frappe.detail.${moi(e.to) ? 'moi' : 'autre'}` as const, total, {
          nom: nom(e.to),
        }) + verrou(e.from),
      tone: 'clay',
    }
  }

  // 4 · Une manche sans dégâts : ce sont les réparations qui comptent.
  const reparations = ev.filter(
    (e): e is Extract<RoundEvent, { t: 'reparation' }> => e.t === 'reparation' && e.amount > 0,
  )
  if (reparations.length > 0) {
    const e = reparations.find((r) => moi(r.who)) ?? reparations[0]
    const params = { nom: nom(e.by), cible: nom(e.who) }
    const titre =
      e.by !== e.who
        ? moi(e.by)
          ? t('recit.repare.titre.equipe.parMoi', params)
          : moi(e.who)
            ? t('recit.repare.titre.equipe.pourMoi', params)
            : t('recit.repare.titre.equipe.autres', params)
        : t(`recit.repare.titre.seul.${moi(e.who) ? 'moi' : 'autre'}` as const, params)
    return { headline: titre, detail: t.n('recit.repare.detail', e.amount), tone: 'green' }
  }

  // 5 · Personne n'a rien fait passer.
  return { headline: t('recit.rien.titre'), detail: t('recit.rien.detail'), tone: 'ink' }
}

/** La ligne « Frapper sur Nour » affichée sur chaque joueur à la révélation. */
export function playedLabel(
  state: GameState,
  playerId: PlayerId,
  outcome: RoundOutcome,
  t: T,
): string {
  const o = outcome.outcomes.find((x) => x.playerId === playerId)
  if (!o || o.played.length === 0) return o ? t('recit.joue.rien') : ''
  return o.played
    .map((c) => {
      const carte = t(`carte.${c.card}` as const)
      if (c.card !== 'frapper' || !c.target) return carte
      const cible = state.players.find((p) => p.id === c.target)
      return cible ? t('recit.joue.sur', { carte, cible: cible.name }) : carte
    })
    .join(' + ')
}

/**
 * Ce qui tombe sur un mur, et de quel côté.
 *
 * La brique qui tombe est le seul mouvement de la révélation qui porte deux
 * informations à la fois : **sur quel mur** le coup atterrit — c'est
 * l'emplacement qui bascule — et **d'où il vient** — c'est le sens de la
 * chute. Une brique frappée par quelqu'un d'assis avant soi tombe vers la
 * droite, et l'inverse : le regard remonte au coupable sans qu'on ait à
 * l'écrire.
 *
 * Dérivé des faits de la manche, comme le récit : le moteur ne sait rien de
 * l'écran, et deux joueurs qui regardent la même manche voient tomber les
 * mêmes briques.
 */
export function chute(
  state: GameState,
  outcome: RoundOutcome,
  playerId: PlayerId,
): { slots: number[]; sens: 1 | -1 } {
  const o = outcome.outcomes.find((x) => x.playerId === playerId)
  const apres = state.players.find((p) => p.id === playerId)?.wall
  const slots: number[] = []
  if (o && apres) {
    for (let i = 0; i < apres.length; i++) {
      if (apres[i] === 'broken' && o.wallBefore[i] !== 'broken') slots.push(i)
    }
  }

  // D'où vient le coup : la frappe reçue, ou — pour qui s'est fait retourner sa
  // propre frappe — le piège qui la lui a renvoyée.
  const frappe = outcome.events.find(
    (e): e is Extract<RoundEvent, { t: 'frappe' }> => e.t === 'frappe' && e.to === playerId,
  )
  const retournee = outcome.events.find(
    (e): e is Extract<RoundEvent, { t: 'retournee' }> => e.t === 'retournee' && e.from === playerId,
  )
  const depuis = frappe?.from ?? retournee?.to
  const place = (id?: PlayerId) => state.players.find((p) => p.id === id)?.seat

  const dOu = place(depuis)
  const ici = place(playerId)
  // Sans coupable identifié — une carte de manche qui rogne les murs — la
  // brique tombe vers la droite, comme un objet qu'on pousse.
  const sens: 1 | -1 = dOu === undefined || ici === undefined || dOu < ici ? 1 : -1
  return { slots, sens }
}
