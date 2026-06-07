import { COMMISSION_RATE } from './payment';
import { BRAND } from './togo';

export const DRIVER_TERMS_TITLE = `Conditions partenaire livreur — Redevance ${BRAND.name}`;

const pct = Math.round(COMMISSION_RATE * 100);

export const DRIVER_TERMS_SECTIONS = [
  {
    title: 'Objet',
    body: `En vous inscrivant comme livreur sur ${BRAND.name}, vous acceptez d'effectuer des courses de livraison pour le compte de la plateforme, au bénéfice des clients et commerçants inscrits.`,
  },
  {
    title: 'Encaissement des courses',
    body: `Pour chaque course, vous encaissez auprès du client ou du destinataire le montant total affiché sur la mission (espèces ou Mobile Money). Vous confirmez ensuite le paiement reçu dans l'application.`,
  },
  {
    title: `Redevance plateforme (${pct} %)`,
    body: `Sur chaque course payée et confirmée, vous reversez à ${BRAND.name} une redevance de ${pct} % du montant de la course. Exemple : course à 5 000 FCFA → redevance de ${Math.round(5000 * COMMISSION_RATE).toLocaleString('fr-FR')} FCFA due à la plateforme ; votre net sur cette course est de ${Math.round(5000 * (1 - COMMISSION_RATE)).toLocaleString('fr-FR')} FCFA.`,
  },
  {
    title: 'Suivi et transparence',
    body: `Le menu « Redevances » de votre espace livreur affiche, course par course, le montant encaissé, votre net et le total dû à ${BRAND.name}. L'administration dispose du même suivi côté gestion.`,
  },
  {
    title: 'Reversement',
    body: `Vous vous engagez à régler périodiquement la redevance cumulée selon les modalités communiquées par ${BRAND.name} (versement Mobile Money, espèces au bureau, ou autre moyen convenu).`,
  },
  {
    title: 'Acceptation',
    body: `En cochant « J'accepte les conditions livreur » lors de l'inscription, ou en cliquant sur « J'accepte » sur cette page, vous reconnaissez avoir lu et accepté l'ensemble de ces conditions.`,
  },
];

export const DRIVER_TERMS_FOOTER = `${BRAND.name} · ${BRAND.country} · Document mis à jour pour les partenaires livreurs.`;
