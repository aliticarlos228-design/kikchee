# Cahier des charges — kikchee

**Plateforme intelligente de logistique et de livraison multi-acteurs**

---

| | |
|---|---|
| **Projet** | kikchee |
| **Version du document** | 1.0 |
| **Date** | 27 mai 2026 |
| **Auteur** | [Votre nom] |
| **Type de projet** | Application web — développement solo |
| **Approche** | API-first (REST) |

---

## Table des matières

1. [Introduction](#1-introduction)
2. [Présentation du projet](#2-présentation-du-projet)
3. [Besoins fonctionnels](#3-besoins-fonctionnels)
4. [Besoins non fonctionnels](#4-besoins-non-fonctionnels)
5. [Contraintes](#5-contraintes)
6. [Planning prévisionnel](#6-planning-prévisionnel)
7. [Critères d'acceptation](#7-critères-dacceptation)
8. [Glossaire](#8-glossaire)

---

## 1. Introduction

### 1.1 Contexte et problématique

La livraison de colis implique plusieurs acteurs (clients, commerçants, livreurs) qui doivent coordonner leurs actions. En l'absence d'outil centralisé, les échanges se font par téléphone ou messagerie, ce qui entraîne :

- Manque de visibilité sur l'état des livraisons ;
- Erreurs de tarification ;
- Difficulté à affecter un livreur disponible ;
- Absence de statistiques pour piloter l'activité.

### 1.2 Objectifs du projet

| Objectif | Description |
|----------|-------------|
| **O1** | Centraliser la gestion des commandes et livraisons sur une plateforme web unique |
| **O2** | Offrir à chaque acteur un espace adapté à son rôle |
| **O3** | Automatiser le calcul des tarifs et la suggestion de livreur |
| **O4** | Permettre le suivi du statut d'une livraison de bout en bout |
| **O5** | Fournir à l'administrateur une vue d'ensemble et des indicateurs |

### 1.3 Périmètre

#### Inclus

- Application web responsive (4 rôles utilisateur)
- API REST documentée (Swagger)
- Base de données relationnelle
- Authentification sécurisée par rôle
- Algorithmes de tarification et d'affectation livreur
- Documentation : cahier des charges, cahier d'analyse, guide d'utilisation

#### Exclus

- Application mobile native
- Paiement en ligne réel
- Géolocalisation GPS en temps réel sur carte
- Chat instantané entre acteurs
- Machine learning / IA avancée
- Support multilingue (français uniquement)

---

## 2. Présentation du projet

### 2.1 Description générale

**kikchee** est une plateforme web de logistique multi-acteurs. Elle permet à un **client** de commander une livraison, à un **commerçant** de préparer des colis, à un **livreur** d'accepter et d'effectuer les livraisons, et à un **administrateur** de superviser l'ensemble.

L'architecture repose sur une **API REST** (approche API-first) consommée par une interface web React. Les fonctions « intelligentes » du système incluent le calcul automatique du tarif, la suggestion du livreur le plus proche et l'estimation du délai de livraison.

### 2.2 Public cible (acteurs)

| Acteur | Profil | Besoin principal |
|--------|--------|------------------|
| **Client** | Particulier ou entreprise demandant une livraison | Commander et suivre |
| **Commerçant** | Boutique, entrepôt, expéditeur | Gérer les colis à envoyer |
| **Livreur** | Coursier, transporteur indépendant | Trouver et réaliser des livraisons |
| **Administrateur** | Gestionnaire de la plateforme | Superviser, statistiques, utilisateurs |

### 2.3 Scénario type

1. Un **client** crée une commande avec adresse de départ et d'arrivée.
2. Le **système** calcule le tarif et estime le délai.
3. Un **commerçant** associe un colis à la commande et le marque comme prêt.
4. Le **système** suggère le livreur le plus proche.
5. Un **livreur** accepte la livraison et met à jour le statut jusqu'à « livré ».
6. Le **client** consulte le suivi à chaque étape.
7. L'**administrateur** visualise les statistiques globales.

---

## 3. Besoins fonctionnels

Chaque besoin est identifié par un code **BF-xx** pour assurer la traçabilité avec le cahier d'analyse, le code source et le guide d'utilisation.

### 3.1 Authentification et gestion de compte

| ID | Besoin | Acteur | Priorité |
|----|--------|--------|----------|
| **BF-01** | S'inscrire en choisissant un rôle (client, commerçant, livreur) | Tous | Must |
| **BF-02** | Se connecter et se déconnecter | Tous | Must |
| **BF-03** | Consulter et modifier son profil (nom, téléphone, adresse) | Tous | Must |

**BF-01 — Détail :** L'utilisateur fournit email, mot de passe, nom et rôle. Le mot de passe est hashé côté serveur. Un compte admin est créé manuellement ou par seed.

**BF-02 — Détail :** Authentification par token JWT. Session expirée renvoie une erreur 401.

**BF-03 — Détail :** Page profil avec formulaire de mise à jour. Email non modifiable après inscription.

### 3.2 Espace Client

| ID | Besoin | Acteur | Priorité |
|----|--------|--------|----------|
| **BF-04** | Créer une commande de livraison (adresses, description, poids) | Client | Must |
| **BF-05** | Voir la liste de ses commandes avec statut | Client | Must |
| **BF-06** | Suivre le statut détaillé d'une commande | Client | Must |
| **BF-07** | Voir le tarif estimé avant validation de la commande | Client | Must |

**BF-04 — Détail :** Formulaire : adresse pickup, adresse delivery, description colis, poids (kg). Validation des champs obligatoires.

**BF-06 — Détail :** Affichage chronologique des changements de statut (timeline).

**BF-07 — Détail :** Appel à l'algorithme de tarification (BF-18) avant soumission finale.

### 3.3 Espace Commerçant

| ID | Besoin | Acteur | Priorité |
|----|--------|--------|----------|
| **BF-08** | Créer un colis (poids, dimensions, description) | Commerçant | Must |
| **BF-09** | Associer un colis à une commande existante | Commerçant | Must |
| **BF-10** | Voir la liste de ses colis et leur statut | Commerçant | Must |

**BF-08 — Détail :** Colis indépendant ou lié ultérieurement à une commande.

**BF-09 — Détail :** Liste déroulante des commandes en attente de colis.

### 3.4 Espace Livreur

| ID | Besoin | Acteur | Priorité |
|----|--------|--------|----------|
| **BF-11** | Voir les livraisons disponibles (non assignées) | Livreur | Must |
| **BF-12** | Accepter une livraison | Livreur | Must |
| **BF-13** | Mettre à jour le statut (en route, livré, incident) | Livreur | Must |
| **BF-14** | Voir l'historique de ses livraisons | Livreur | Must |

**BF-11 — Détail :** Liste filtrée, triée par proximité (BF-19).

**BF-13 — Détail :** Statuts autorisés : `ACCEPTED` → `IN_PROGRESS` → `COMPLETED` ou `FAILED`.

### 3.5 Espace Administrateur

| ID | Besoin | Acteur | Priorité |
|----|--------|--------|----------|
| **BF-15** | Tableau de bord : nombre commandes, livraisons, utilisateurs, délai moyen | Admin | Must |
| **BF-16** | Lister, activer et désactiver les comptes utilisateurs | Admin | Must |
| **BF-17** | Voir toutes les commandes et livraisons (lecture seule) | Admin | Must |

### 3.6 Fonctions intelligentes (système)

| ID | Besoin | Acteur | Priorité |
|----|--------|--------|----------|
| **BF-18** | Calcul automatique du tarif (distance + poids + zone) | Système | Must |
| **BF-19** | Suggestion du livreur le plus proche du point de collecte | Système | Must |
| **BF-20** | Estimation du délai de livraison (minutes) | Système | Should |

**BF-18 — Règle métier :**  
`tarif = tarif_base + (distance_km × coef_distance) + (poids_kg × coef_poids) + supplément_zone`

**BF-19 — Règle métier :**  
Calcul de distance Haversine entre position du livreur et adresse de collecte ; tri ascendant.

**BF-20 — Règle métier :**  
`délai_estimé = (distance_km / vitesse_moyenne_kmh) × 60 + marge_préparation`

### 3.7 Cas d'utilisation (résumé)

| Code | Nom | Acteur principal |
|------|-----|------------------|
| CU-01 | S'inscrire | Utilisateur |
| CU-02 | Se connecter | Utilisateur |
| CU-03 | Créer une commande | Client |
| CU-04 | Suivre une commande | Client |
| CU-05 | Gérer les colis | Commerçant |
| CU-06 | Accepter une livraison | Livreur |
| CU-07 | Mettre à jour le statut livraison | Livreur |
| CU-08 | Consulter le tableau de bord | Admin |
| CU-09 | Gérer les utilisateurs | Admin |

---

## 4. Besoins non fonctionnels

### 4.1 Performance

| ID | Exigence |
|----|----------|
| BNF-01 | Temps de réponse API < 2 secondes en conditions normales (local) |
| BNF-02 | Interface utilisable sur écran ≥ 1280 px et tablette |

### 4.2 Sécurité

| ID | Exigence |
|----|----------|
| BNF-03 | Mots de passe hashés (bcrypt, cost ≥ 10) |
| BNF-04 | Authentification JWT avec expiration (ex. 24 h) |
| BNF-05 | Contrôle d'accès par rôle sur chaque endpoint |
| BNF-06 | Validation et sanitisation des entrées utilisateur |

### 4.3 Ergonomie et accessibilité

| ID | Exigence |
|----|----------|
| BNF-07 | Interface en français |
| BNF-08 | Messages d'erreur explicites |
| BNF-09 | Navigation claire par rôle (menu dédié) |

### 4.4 Maintenabilité

| ID | Exigence |
|----|----------|
| BNF-10 | Code structuré (controllers, services, models) |
| BNF-11 | Documentation API Swagger à jour |
| BNF-12 | README avec instructions d'installation |

### 4.5 Compatibilité

| ID | Exigence |
|----|----------|
| BNF-13 | Navigateurs : Chrome, Firefox, Edge (versions récentes) |
| BNF-14 | Node.js LTS, PostgreSQL 14+ |

---

## 5. Contraintes

### 5.1 Contraintes techniques

- Développement en **solo** : stack unifiée JavaScript (Node + React)
- Hébergement local pour la démonstration (pas de cloud obligatoire)
- Pas de service tiers payant (cartes, SMS)

### 5.2 Contraintes temporelles

- Durée totale estimée : **6 à 8 semaines**
- Livrables documentaires avant ou en parallèle du code selon le planning

### 5.3 Contraintes réglementaires

- Respect du RGPD : minimisation des données, pas de revente
- Données de démo fictives pour la soutenance

---

## 6. Planning prévisionnel

| Phase | Semaine | Tâches | Livrable |
|-------|---------|--------|----------|
| **Phase 1 — Conception** | S1 | Cahier des charges | Ce document |
| | S2 | Cahier d'analyse, UML, API | `02-cahier-analyse.md` |
| **Phase 2 — Backend** | S3 | Setup, BDD, auth JWT | API auth fonctionnelle |
| | S4 | Commandes, colis, tarif, livraisons | API métier complète |
| **Phase 3 — Frontend** | S5 | Pages client + commerçant | Interface partielle |
| | S6 | Pages livreur + admin + algo | MVP complet |
| **Phase 4 — Finalisation** | S7 | Tests, corrections, Swagger | Projet stable |
| | S8 | Guide d'utilisation, relecture | Remise finale |

---

## 7. Critères d'acceptation

Le projet est considéré comme **accepté** si :

| # | Critère | Vérification |
|---|---------|--------------|
| CA-01 | Les 20 besoins BF-01 à BF-20 sont implémentés | Table de traçabilité |
| CA-02 | Chaque rôle accède uniquement à ses fonctionnalités | Tests manuels par rôle |
| CA-03 | Scénario complet jouable sans erreur | Démo 15 minutes |
| CA-04 | API documentée via Swagger | URL `/api-docs` |
| CA-05 | Cahier d'analyse cohérent avec le code | Revue croisée |
| CA-06 | Guide d'utilisation avec procédures par rôle | Document PDF/MD |
| CA-07 | README : installation et lancement en < 30 min | Test sur machine vierge |
| CA-08 | Aucun besoin documenté absent du code | Audit traçabilité |

---

## 8. Glossaire

| Terme | Définition |
|-------|------------|
| **API REST** | Interface de programmation utilisant HTTP (GET, POST, PATCH, DELETE) |
| **JWT** | JSON Web Token — jeton d'authentification stateless |
| **Colis (Package)** | Unité physique expédiée, avec poids et dimensions |
| **Commande (Order)** | Demande de livraison d'un client |
| **Livraison (Delivery)** | Affectation d'une commande à un livreur |
| **Statut** | État courant dans le cycle de vie (commande, colis, livraison) |
| **Haversine** | Formule de calcul de distance entre deux points GPS |
| **MVP** | Minimum Viable Product — version minimale fonctionnelle |
| **Must / Should** | Priorité MoSCoW : indispensable / souhaitable |

---

*Document validé pour passage à l'étape 2 — Cahier d'analyse.*
