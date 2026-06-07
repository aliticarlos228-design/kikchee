# Note de cadrage — kikchee

> Document interne (Étape 0). Base pour le cahier des charges et le cahier d'analyse.

**Auteur :** Projet solo (1 développeur)  
**Date :** 27 mai 2026  
**Durée estimée :** 6 à 8 semaines

---

## 1. Nom et vision

| Élément | Décision |
|---------|----------|
| **Nom** | kikchee |
| **Type** | Plateforme web de logistique et livraison multi-acteurs |
| **Approche** | API-first (backend REST documenté, frontend consommateur) |

**Problème adressé :** Coordination difficile entre clients, commerçants et livreurs sans outil centralisé (suivi, tarification, affectation).

**Solution :** Une application web unique avec 4 espaces par rôle, connectés à une API REST commune.

---

## 2. Stack technique retenue

| Couche | Technologie | Justification (solo) |
|--------|-------------|----------------------|
| Backend | **Node.js + Express** | Écosystème riche, rapide à prototyper |
| Base de données | **PostgreSQL** | Relationnel, robuste, gratuit |
| ORM | **Prisma** | Migrations simples, typage |
| Auth | **JWT** + bcrypt | Standard pour API REST |
| Frontend | **React + Vite** | Composants réutilisables, communauté large |
| UI | **Tailwind CSS** | Mise en page rapide sans designer |
| API docs | **Swagger (OpenAPI)** | Cohérent avec approche API-first |
| Versionning | **Git + GitHub** | Historique et remise |

**Environnement de dev :** Windows 10, VS Code / Cursor.

---

## 3. Acteurs (4 rôles)

| Rôle | Code | Description |
|------|------|-------------|
| Client | `client` | Commande une livraison, suit son colis |
| Commerçant | `merchant` | Crée et gère les colis à expédier |
| Livreur | `driver` | Accepte et effectue les livraisons |
| Administrateur | `admin` | Supervise la plateforme, stats, utilisateurs |

---

## 4. Fonctionnalités MVP (liste fermée)

Numérotation **BF-xx** — chaque ID sera traçable dans CDC, analyse, code et guide.

### Authentification & comptes

| ID | Fonctionnalité | Acteur |
|----|----------------|--------|
| BF-01 | S'inscrire en choisissant un rôle | Tous |
| BF-02 | Se connecter / se déconnecter | Tous |
| BF-03 | Consulter et modifier son profil | Tous |

### Client

| ID | Fonctionnalité | Acteur |
|----|----------------|--------|
| BF-04 | Créer une commande de livraison (adresse départ/arrivée, description) | Client |
| BF-05 | Voir la liste de ses commandes | Client |
| BF-06 | Suivre le statut d'une commande en temps réel (polling) | Client |
| BF-07 | Voir le tarif estimé avant validation | Client |

### Commerçant

| ID | Fonctionnalité | Acteur |
|----|----------------|--------|
| BF-08 | Créer un colis (poids, dimensions, description) | Commerçant |
| BF-09 | Associer un colis à une commande / livraison | Commerçant |
| BF-10 | Voir la liste de ses colis et leur statut | Commerçant |

### Livreur

| ID | Fonctionnalité | Acteur |
|----|----------------|--------|
| BF-11 | Voir les livraisons disponibles (non assignées) | Livreur |
| BF-12 | Accepter une livraison | Livreur |
| BF-13 | Mettre à jour le statut (en route, livré, incident) | Livreur |
| BF-14 | Voir l'historique de ses livraisons | Livreur |

### Administrateur

| ID | Fonctionnalité | Acteur |
|----|----------------|--------|
| BF-15 | Voir le tableau de bord (stats globales) | Admin |
| BF-16 | Lister / activer / désactiver les utilisateurs | Admin |
| BF-17 | Voir toutes les commandes et livraisons | Admin |

### Intelligence (système)

| ID | Fonctionnalité | Acteur |
|----|----------------|--------|
| BF-18 | Calcul automatique du tarif (distance + poids + zone) | Système |
| BF-19 | Suggestion du livreur le plus proche (distance Haversine) | Système |
| BF-20 | Estimation du délai de livraison | Système |

**Total : 20 besoins fonctionnels** — réaliste pour 1 personne en 6–8 semaines.

---

## 5. Périmètre EXCLU (ne pas promettre dans les cahiers)

| Exclusion | Raison |
|-----------|--------|
| Application mobile native (iOS/Android) | Hors scope solo |
| Paiement en ligne réel (Stripe, etc.) | Complexité légale et technique |
| Géolocalisation GPS temps réel (carte live) | Remplacé par statuts + adresses |
| Chat en direct client-livreur | Optionnel, non MVP |
| Intelligence artificielle / machine learning | Remplacé par algorithmes déterministes simples |
| Multi-langue | Français uniquement |
| Déploiement cloud production | Local + README suffisant ; démo sur machine dev |

---

## 6. Statuts métier (cycle de vie)

```
Commande :  DRAFT → PENDING → ASSIGNED → IN_TRANSIT → DELIVERED → CANCELLED
Colis :     CREATED → READY → PICKED_UP → DELIVERED
Livraison : AVAILABLE → ACCEPTED → IN_PROGRESS → COMPLETED / FAILED
```

---

## 7. Critères de succès (pour moi)

- [ ] Les 20 BF-xx sont implémentés et testés manuellement
- [ ] Table de traçabilité 100 % cochée
- [ ] Scénario complet jouable en 15 min (client → commerçant → livreur → admin)
- [ ] 4 documents remis : CDC, analyse, guide, code

---

## 8. Planning prévisionnel (8 semaines)

| Semaine | Objectif | Livrable |
|---------|----------|----------|
| S1 | Cadrage + CDC | `01-cahier-des-charges.md` |
| S2 | Analyse UML + API + BDD | `02-cahier-analyse.md` |
| S3 | Setup + Auth + modèles | Backend base |
| S4 | API commandes, colis, tarif | Backend métier |
| S5 | Frontend 4 rôles | Interface MVP |
| S6 | Livraisons + admin + algo | MVP complet |
| S7 | Tests, bugs, polish | Projet stable |
| S8 | Guide utilisation + relecture | Remise finale |

---

## 9. Prochaine étape

→ **Étape 1 :** Rédiger le cahier des charges complet (`docs/01-cahier-des-charges.md`)
