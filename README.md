# kikchee

Plateforme intelligente de logistique et de livraison multi-acteurs.

## Base de données

Le projet utilise **PostgreSQL 16**, base **`apifirst`** :

| Champ | Valeur |
|-------|--------|
| Host | `localhost` |
| Port | `5432` |
| User | `postgres` |
| Database | `apifirst` |

## Démarrage rapide

### 1. Préparer la base (pgAdmin)

Dans **Query Tool** sur `apifirst`, exécutez une fois :

```sql
DROP TABLE IF EXISTS users CASCADE;
```

> La table de test (`id`, `name`, `email`) est remplacée par le schéma complet kikchee (users avec rôles, commandes, colis, livraisons…).

### 2. Configurer le backend

Éditez `backend/.env` et remplacez `VOTRE_MOT_DE_PASSE` par votre mot de passe PostgreSQL :

```
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/apifirst?schema=public"
```

Puis :

```bash
cd backend
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

API : http://localhost:3000  
Swagger : http://localhost:3000/api-docs

### 3. Lancer le frontend

```bash
cd frontend
npm install
npm run dev
```

Interface : http://localhost:5173

## Comptes de démo (après seed)

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@logiflow.fr | Admin1234! | admin |
| client@demo.fr | Demo1234! | client |
| merchant@demo.fr | Demo1234! | commerçant |
| driver@demo.fr | Demo1234! | livreur |

## Vérification avant déploiement

```bash
cd backend && npm run build
cd ../frontend && npm run build
cd ../backend && npx tsx scripts/e2e-verify.ts
```

Tous les tests doivent être **OK** (admin, client, commerçant, livreur, chat, filtres véhicule).

## Hébergement gratuit (0 €)

Pour une démo ou un petit trafic sans payer :

| Composant | Service gratuit | Notes |
|-----------|-----------------|-------|
| **Base de données** | [Neon](https://neon.tech) ou [Supabase](https://supabase.com) | PostgreSQL gratuit (limites de stockage / connexions) |
| **Backend API** | [Render](https://render.com) (free tier) | Le serveur **s'endort** après ~15 min sans requête → 1re requête lente |
| **Frontend** | [Vercel](https://vercel.com), [Netlify](https://netlify.com) ou [Cloudflare Pages](https://pages.cloudflare.com) | Build depuis GitHub, HTTPS automatique |

**Ordre conseillé :**
1. Créer la base Postgres sur Neon → copier `DATABASE_URL`
2. Déployer le backend sur Render (build `npm ci && npm run build`, start `npm start`, variables d'env)
3. Déployer le frontend sur Vercel avec `VITE_API_URL=https://votre-api.onrender.com/api`
4. Mettre l'URL Vercel dans `CORS_ORIGIN` du backend

**Important :** le GPS sur mobile exige **HTTPS** (fourni par Vercel/Netlify). En local uniquement : même Wi‑Fi + IP du PC — pas accessible depuis Internet.

Alternative : **Railway** ou **Fly.io** (crédits gratuits limités).

## Déploiement (production)

### Prérequis
- Serveur Linux (VPS) ou PaaS (Railway, Render, Fly.io)
- PostgreSQL accessible (Neon, Supabase, ou Postgres sur le VPS)
- Node.js 20+

### 1. Backend

```bash
cd backend
npm ci
npm run build
npm run db:generate
# Sur le serveur, avec DATABASE_URL de production :
npx prisma db push
npx prisma db seed   # une seule fois
npm start            # port 3000
```

Variables `.env` production :

```
DATABASE_URL=postgresql://...
JWT_SECRET=une-cle-longue-et-aleatoire-min-32-caracteres
PORT=3000
CORS_ORIGIN=https://votredomaine.com,https://www.votredomaine.com
```

### 2. Frontend

**Option A — même domaine (recommandé)**  
Nginx sert `frontend/dist` et proxy `/api` → backend :

```nginx
server {
  listen 80;
  server_name votredomaine.com;
  root /var/www/kikchee/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

Pas besoin de `VITE_API_URL` — le frontend utilise `/api`.

**Option B — domaine API séparé**

```bash
cd frontend
# .env.production : VITE_API_URL=https://api.votredomaine.com/api
npm run build
# Déployer le dossier dist/ (Netlify, Vercel, Nginx…)
```

### 3. HTTPS
Utilisez **Certbot** (Let's Encrypt) sur Nginx, ou l’HTTPS automatique de votre hébergeur.

### 4. Process manager (VPS)
```bash
npm install -g pm2
cd backend && pm2 start dist/index.js --name kikchee-api
pm2 save && pm2 startup
```

### 5. Mobile (même Wi‑Fi en dev)
En production : ouvrez `https://votredomaine.com` — la géolocalisation GPS nécessite **HTTPS** (sauf localhost).

## Livrables académiques

| Document | Fichier | Statut |
|----------|---------|--------|
| Note de cadrage | [docs/00-note-de-cadrage.md](docs/00-note-de-cadrage.md) | ✅ |
| Cahier des charges | [docs/01-cahier-des-charges.md](docs/01-cahier-des-charges.md) | ✅ |
| Cahier d'analyse | [docs/02-cahier-analyse.md](docs/02-cahier-analyse.md) | ✅ |
| Guide d'utilisation | [docs/03-guide-utilisation.md](docs/03-guide-utilisation.md) | ✅ |
| Table de traçabilité | [docs/traceabilite.md](docs/traceabilite.md) | 🔄 |

## État du développement

```
Étape 0 ✅ Cadrage
Étape 1 ✅ Cahier des charges
Étape 2 ✅ Cahier d'analyse
Étape 3 ✅ Backend + Auth + Commandes client
Étape 4 ✅ Colis commerçant + Livraisons livreur
Étape 5 ✅ Admin (BF-15 à BF-17)
Étape 6 ✅ Guide d'utilisation
Étape 7 ⏳ Captures d'écran + relecture finale
Étape 5 ⏳ Guide d'utilisation
```

## Structure

```
APIfirst/
├── backend/     # API REST (Express + Prisma)
├── frontend/    # Interface React
└── docs/        # Cahiers académiques
```
