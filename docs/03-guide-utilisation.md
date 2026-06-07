# Guide d'utilisation — kikchee

**Plateforme intelligente de logistique et de livraison multi-acteurs**

---

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 27 mai 2026 |
| **Application** | kikchee (web) |
| **URL locale** | http://localhost:5173 |

---

## Table des matières

1. [Introduction](#1-introduction)
2. [Prérequis et installation](#2-prérequis-et-installation)
3. [Connexion et comptes de démonstration](#3-connexion-et-comptes-de-démonstration)
4. [Guide Client (BF-04 à BF-07)](#4-guide-client)
5. [Guide Commerçant (BF-08 à BF-10)](#5-guide-commerçant)
6. [Guide Livreur (BF-11 à BF-14)](#6-guide-livreur)
7. [Guide Administrateur (BF-15 à BF-17)](#7-guide-administrateur)
8. [Scénario complet de bout en bout](#8-scénario-complet-de-bout-en-bout)
9. [FAQ et dépannage](#9-faq-et-dépannage)

---

## 1. Introduction

kikchee est une application web qui centralise la gestion des livraisons entre quatre types d'utilisateurs :

- **Client** — commande et suit une livraison
- **Commerçant** — prépare et associe des colis
- **Livreur** — accepte et effectue les livraisons
- **Administrateur** — supervise la plateforme

L'interface est en **français** et accessible via un navigateur web (Chrome, Firefox, Edge).

---

## 2. Prérequis et installation

### Prérequis

- Node.js 20+
- PostgreSQL 16 (base `apifirst`)
- Navigateur web récent

### Démarrer l'application

**Terminal 1 — Backend :**
```bash
cd backend
npm install
npm run db:push
npm run db:seed
npm run dev
```

**Terminal 2 — Frontend :**
```bash
cd frontend
npm install
npm run dev
```

Ouvrir : **http://localhost:5173**

Documentation API (Swagger) : **http://localhost:3000/api-docs**

---

## 3. Connexion et comptes de démonstration

### Se connecter

1. Ouvrir http://localhost:5173
2. Saisir **email** et **mot de passe**
3. Cliquer sur **Se connecter**
4. Vous êtes redirigé vers l'espace correspondant à votre rôle

### S'inscrire

1. Cliquer sur **S'inscrire**
2. Remplir le formulaire (prénom, nom, email, mot de passe)
3. Choisir un rôle : Client, Commerçant ou Livreur
4. Cliquer sur **S'inscrire**

> Le rôle **Administrateur** n'est pas disponible à l'inscription. Il est créé via le seed.

### Comptes de démonstration

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| client@demo.fr | Demo1234! | Client |
| merchant@demo.fr | Demo1234! | Commerçant |
| driver@demo.fr | Demo1234! | Livreur |
| admin@logiflow.fr | Admin1234! | Administrateur |

---

## 4. Guide Client

**Correspondance cahier des charges : BF-04, BF-05, BF-06, BF-07**

### 4.1 Créer une commande (BF-04, BF-07)

1. Se connecter en tant que **Client**
2. Cliquer sur **Nouvelle commande**
3. Remplir :
   - Adresse de collecte (rue, ville, code postal, latitude, longitude)
   - Adresse de livraison
   - Poids du colis (kg)
   - Description (optionnel)
4. Cliquer sur **Estimer le tarif** → le système affiche le prix et le délai (BF-18, BF-20)
5. Cliquer sur **Confirmer la commande**

[CAPTURE-01 : Formulaire nouvelle commande avec estimation]

### 4.2 Voir ses commandes (BF-05)

1. Depuis l'accueil client, cliquer sur **Mes commandes**
2. La liste affiche toutes vos commandes avec statut et tarif

[CAPTURE-02 : Liste des commandes client]

### 4.3 Suivre une commande (BF-06)

1. Dans **Mes commandes**, cliquer sur une commande
2. Consulter la **timeline** (historique des statuts)
3. La page se rafraîchit automatiquement toutes les 10 secondes

[CAPTURE-03 : Page suivi avec timeline]

---

## 5. Guide Commerçant

**Correspondance cahier des charges : BF-08, BF-09, BF-10**

### 5.1 Créer un colis (BF-08)

1. Se connecter en tant que **Commerçant**
2. Cliquer sur **Nouveau colis**
3. Saisir poids, dimensions (optionnel) et description
4. Cliquer sur **Créer le colis**

[CAPTURE-04 : Formulaire création colis]

### 5.2 Associer un colis à une commande (BF-09)

1. Aller dans **Mes colis**
2. Sur un colis non associé, choisir une commande dans la liste déroulante
3. Cliquer sur **Associer**

> Seules les commandes en attente sans colis apparaissent.

### 5.3 Marquer un colis comme prêt (BF-10)

1. Sur un colis déjà associé, cliquer sur **Marquer comme prêt**
2. Le statut passe à **Prêt** — le livreur verra l'indicateur « Colis prêt »

[CAPTURE-05 : Liste colis avec association et statut]

---

## 6. Guide Livreur

**Correspondance cahier des charges : BF-11, BF-12, BF-13, BF-14, BF-19**

### 6.1 Voir les livraisons disponibles (BF-11, BF-19)

1. Se connecter en tant que **Livreur**
2. Cliquer sur **Livraisons disponibles**
3. Les livraisons sont **triées par proximité** (distance en km)
4. Le système suggère le livreur le plus proche (BF-19)

[CAPTURE-06 : Liste livraisons triées par distance]

### 6.2 Accepter une livraison (BF-12)

1. Sur une livraison disponible, cliquer sur **Accepter la livraison**
2. La commande passe au statut **Assignée**

### 6.3 Mettre à jour le statut (BF-13)

1. Aller dans **Mes livraisons** → cliquer sur une livraison
2. **Démarrer (en route)** → statut *En cours de livraison*
3. **Marquer livré** → statut *Livrée*
4. Ou **Signaler un incident** en cas de problème

[CAPTURE-07 : Détail livraison avec boutons de statut]

### 6.4 Historique (BF-14)

1. Cliquer sur **Mes livraisons**
2. Consulter toutes les livraisons passées et en cours

---

## 7. Guide Administrateur

**Correspondance cahier des charges : BF-15, BF-16, BF-17**

### 7.1 Tableau de bord (BF-15)

1. Se connecter : `admin@logiflow.fr` / `Admin1234!`
2. Le tableau de bord affiche :
   - Nombre d'utilisateurs, commandes, livraisons terminées
   - Délai moyen de livraison
   - Répartition par statut et par rôle

[CAPTURE-08 : Tableau de bord admin]

### 7.2 Gérer les utilisateurs (BF-16)

1. Cliquer sur **Utilisateurs**
2. Voir la liste de tous les comptes
3. **Activer** ou **Désactiver** un compte (sauf admin)

> Un compte désactivé ne peut plus se connecter.

### 7.3 Vue globale (BF-17)

1. **Commandes** — toutes les commandes avec client, commerçant, livreur, statuts
2. **Livraisons** — toutes les livraisons avec dates et livreur assigné

[CAPTURE-09 : Liste utilisateurs admin]

---

## 8. Scénario complet de bout en bout

Durée estimée : **15 minutes**

| Étape | Acteur | Action | BF |
|-------|--------|--------|-----|
| 1 | Client | Se connecter, créer une commande, estimer et confirmer | BF-04, BF-07 |
| 2 | Commerçant | Créer un colis, l'associer à la commande, marquer prêt | BF-08, BF-09, BF-10 |
| 3 | Livreur | Voir livraisons disponibles, accepter | BF-11, BF-12, BF-19 |
| 4 | Livreur | Démarrer → Marquer livré | BF-13 |
| 5 | Client | Consulter le suivi → statut **Livrée** | BF-05, BF-06 |
| 6 | Admin | Vérifier stats, commandes et livraisons | BF-15, BF-17 |

---

## 9. FAQ et dépannage

### « Connexion impossible »
- Vérifier email et mot de passe
- Vérifier que le compte n'est pas désactivé par l'admin
- Vérifier que le backend tourne sur le port 3000

### « Impossible de charger les commandes »
- Vérifier la connexion PostgreSQL (`backend/.env`)
- Relancer : `npm run db:push && npm run db:seed`

### « Livraison déjà prise »
- Un autre livreur a accepté en premier — normal en concurrence

### Erreur CORS
- Vérifier que le frontend est sur http://localhost:5173
- Vérifier `CORS_ORIGIN` dans `backend/.env`

### API documentation
- Swagger : http://localhost:3000/api-docs

---

## Annexe — Correspondance BF ↔ Fonctionnalité

| BF | Fonctionnalité | Menu / Page |
|----|----------------|-------------|
| BF-01 | Inscription | /register |
| BF-02 | Connexion | /login |
| BF-03 | Profil | /profile |
| BF-04 | Créer commande | /client/orders/new |
| BF-05 | Liste commandes | /client/orders |
| BF-06 | Suivi commande | /client/orders/:id |
| BF-07 | Tarif estimé | /client/orders/new |
| BF-08 | Créer colis | /merchant/packages/new |
| BF-09 | Associer colis | /merchant/packages |
| BF-10 | Liste colis | /merchant/packages |
| BF-11 | Livraisons dispo | /driver/available |
| BF-12 | Accepter livraison | /driver/available |
| BF-13 | Mise à jour statut | /driver/deliveries/:id |
| BF-14 | Historique livreur | /driver/mine |
| BF-15 | Tableau de bord | /admin |
| BF-16 | Gestion users | /admin/users |
| BF-17 | Vue globale | /admin/orders, /admin/deliveries |
| BF-18 | Calcul tarif | Automatique (API) |
| BF-19 | Suggestion livreur | /driver/available |
| BF-20 | Estimation délai | Automatique (API) |

---

*Fin du guide d'utilisation — kikchee v1.0*
