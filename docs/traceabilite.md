# Table de traçabilité — kikchee

> Mettre à jour ce fichier à chaque fonctionnalité terminée.  
> **Règle :** une case non cochée = risque de pénalité à la correction.

**Légende :** ☐ = à faire | ☑ = fait

---

## Besoins fonctionnels

| BF-ID | Description | CDC § | Analyse | Backend | Frontend | Guide | Test |
|-------|-------------|-------|---------|---------|----------|-------|------|
| BF-01 | Inscription avec rôle | 3.1 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-02 | Connexion / déconnexion | 3.1 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-03 | Profil utilisateur | 3.1 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-04 | Créer une commande | 3.2 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-05 | Liste commandes client | 3.2 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-06 | Suivi commande (timeline) | 3.2 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-07 | Tarif estimé avant validation | 3.2 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-08 | Créer un colis | 3.3 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-09 | Associer colis à commande | 3.3 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-10 | Liste colis commerçant | 3.3 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-11 | Livraisons disponibles | 3.4 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-12 | Accepter une livraison | 3.4 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-13 | Mettre à jour statut livraison | 3.4 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-14 | Historique livreur | 3.4 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-15 | Tableau de bord admin | 3.5 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-16 | Gestion utilisateurs admin | 3.5 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-17 | Vue globale commandes/livraisons | 3.5 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-18 | Calcul tarif automatique | 3.6 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-19 | Suggestion livreur proche | 3.6 | ☑ | ☑ | ☑ | ☑ | ☐ |
| BF-20 | Estimation délai livraison | 3.6 | ☑ | ☑ | ☑ | ☑ | ☐ |

---

## Besoins non fonctionnels (échantillon)

| BNF-ID | Description | Implémenté | Documenté |
|--------|-------------|------------|-----------|
| BNF-03 | Mots de passe hashés bcrypt | ☐ | ☐ |
| BNF-04 | JWT avec expiration | ☐ | ☐ |
| BNF-05 | Contrôle accès par rôle | ☐ | ☐ |
| BNF-11 | Swagger / OpenAPI | ☐ | ☐ |
| BNF-12 | README installation | ☐ | ☐ |

---

## Documents livrables

| Document | Fichier | Statut |
|----------|---------|--------|
| Note de cadrage | `docs/00-note-de-cadrage.md` | ☑ v1.0 |
| Cahier des charges | `docs/01-cahier-des-charges.md` | ☑ v1.0 |
| Cahier d'analyse | `docs/02-cahier-analyse.md` | ☑ v1.0 |
| Guide d'utilisation | `docs/03-guide-utilisation.md` | ☑ v1.0 |
| Projet (code) | `backend/` + `frontend/` | ☑ MVP complet |

---

## Scénario de démo (checklist)

| Étape | Action | BF liés | OK |
|-------|--------|---------|-----|
| 1 | Client s'inscrit et se connecte | BF-01, BF-02 | ☑ |
| 2 | Client crée une commande, voit le tarif | BF-04, BF-07, BF-18 | ☑ |
| 3 | Commerçant crée et associe un colis | BF-08, BF-09 | ☑ |
| 4 | Livreur voit et accepte la livraison | BF-11, BF-12, BF-19 | ☑ |
| 5 | Livreur met à jour statut → livré | BF-13 | ☑ |
| 6 | Client suit la commande jusqu'à livré | BF-05, BF-06 | ☑ |
| 7 | Admin consulte stats et utilisateurs | BF-15, BF-16, BF-17 | ☑ |

---

*Dernière mise à jour : 27 mai 2026*
