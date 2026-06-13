# MyBank — Guide de déploiement

Architecture cible, procédures de déploiement, sécurité, maintenance et rollback.

---

## 1. Architecture finale

| Composant | Technologie | Hébergement | Coût |
|---|---|---|---|
| Frontend | React 18 + TypeScript + Vite 5 | **Vercel** (statique, sans Docker) | Gratuit |
| Backend | Symfony 7.3 / PHP 8.2 (Docker) | **Render** (web service Docker) | Gratuit |
| Base de données | MySQL 8 managé | **Aiven** (ou équivalent compatible Render) | Gratuit |
| Code source | Git | **GitHub** | Gratuit |
| CI/CD | GitHub Actions + auto-deploy Render/Vercel | GitHub | Gratuit |

### Diagramme

```mermaid
graph LR
    U[Utilisateur] -->|HTTPS| V[Vercel<br/>React SPA]
    U -->|HTTPS /api + JWT| R[Render<br/>nginx + PHP-FPM<br/>Symfony 7.3]
    R -->|TLS| M[(MySQL managé<br/>Aiven)]
    G[GitHub main] -->|auto-deploy| V
    G -->|auto-deploy| R
    G -->|GitHub Actions<br/>tests + builds| G
```

### Flux de déploiement

1. `git push origin main`
2. GitHub Actions (`.github/workflows/deploy.yml`) : PHPUnit, Vitest, lint, build Vite, build Docker.
3. Vercel détecte le push → build `frontend/` → publication CDN.
4. Render détecte le push → build du Dockerfile (stage `render`) → santé vérifiée sur `/api/health` → bascule sans coupure.

---

## 2. Docker

### Stages du `backend/Dockerfile`

| Stage | Contenu | Usage |
|---|---|---|
| `base` | PHP 8.2-FPM Alpine, extensions (intl, pdo_mysql, opcache, zip, apcu), Composer 2 | Socle |
| `dev` | Dépendances complètes, code monté en volume | `docker-compose.yml` |
| `prod` | `--no-dev`, autoloader classmap, OPcache sans revalidation, php.ini durci | `docker-compose.prod.yml` |
| `render` | `prod` + nginx + supervisord, écoute sur `$PORT` | **Render** (stage par défaut, dernier du fichier) |

### Développement local

```bash
docker compose up -d        # API → http://localhost:8080/api
                            # phpMyAdmin → http://localhost:8081
cd frontend && npm run dev  # Frontend → http://localhost:5173
```

Le compose de dev fournit : MySQL 8 (healthcheck), backend PHP-FPM (migrations automatiques au démarrage), nginx (gzip + headers de sécurité), phpMyAdmin. Tous les services ont `restart: unless-stopped`, un réseau dédié `mybank` et des volumes persistants.

### Production auto-hébergée (alternative à Render)

```bash
cp .env.prod.example .env   # remplir les secrets
docker compose -f docker-compose.prod.yml up -d --build
```

Services : `backend` (PHP-FPM, stage `prod`) + `nginx`. **Aucun MySQL conteneurisé** : `DATABASE_URL` pointe vers le MySQL managé.

---

## 3. Base de données — MySQL managé

Render ne propose pas de MySQL managé. Fournisseur recommandé : **Aiven** (plan gratuit, 1 Go, TLS obligatoire). Alternatives : Clever Cloud (dev), filess.io.

### Création (Aiven)

1. Créer un compte sur `aiven.io` → service **MySQL**, plan *Free*, région `eu-central` (proche de Render Frankfurt).
2. Récupérer hôte, port, utilisateur, mot de passe, nom de base.
3. Construire l'URL :

```
mysql://USER:PASSWORD@HOST:PORT/DBNAME?serverVersion=8.0&charset=utf8mb4
```

4. **TLS** : télécharger le certificat CA Aiven, l'ajouter dans Render en *Secret File* (`/etc/secrets/ca.pem`), définir `DATABASE_SSL_CA=/etc/secrets/ca.pem` et décommenter le bloc `dbal.options` dans `backend/config/packages/doctrine.yaml`.

### Migrations

Les migrations s'exécutent **automatiquement au démarrage du conteneur** (`backend/docker/entrypoint-prod.sh`) :

- attente de la base (30 tentatives max) ;
- `doctrine:migrations:migrate --no-interaction` si des migrations existent, sinon `doctrine:schema:update --force --complete`.

Manuellement :

```bash
# Générer une migration après modification d'une entité
docker exec mybank_backend php bin/console make:migration
# L'appliquer
docker exec mybank_backend php bin/console doctrine:migrations:migrate -n
```

### Seed (compte admin initial)

```bash
# 1. Créer un compte via l'API /api/register puis :
php bin/console app:user:promote admin@exemple.fr
```

Sur Render : onglet **Shell** du service → exécuter la même commande.

---

## 4. JWT — stratégie complète

### Principe

- Lexik JWT signe les tokens en **RS256** avec une paire de clés RSA 4096.
- `config/jwt/*.pem` est **gitignoré** (`backend/.gitignore`) et exclu de l'image (`backend/.dockerignore`). Les clés ne sont **jamais versionnées ni copiées dans l'image**.

### Génération (une seule fois, en local)

```bash
openssl genpkey -out private.pem -aes256 -algorithm rsa -pkeyopt rsa_keygen_bits:4096 -pass pass:VOTRE_PASSPHRASE
openssl pkey -in private.pem -out public.pem -pubout -passin pass:VOTRE_PASSPHRASE
```

### Stockage en production (Render)

Encoder en base64 puis coller dans les variables Render :

```bash
base64 -w0 private.pem   # → JWT_PRIVATE_KEY_BASE64
base64 -w0 public.pem    # → JWT_PUBLIC_KEY_BASE64
```

L'entrypoint les matérialise au démarrage dans `config/jwt/` (permissions 640, propriétaire `www-data`).

**Sans ces variables**, l'entrypoint génère des clés éphémères : l'API fonctionne, mais tous les tokens sont invalidés à chaque redéploiement. Acceptable en démo, pas en production.

### Rotation des clés

1. Générer une nouvelle paire ; 2. Mettre à jour les 3 variables Render (`JWT_*`) ; 3. Redéployer. Les anciens tokens deviennent invalides (les utilisateurs se reconnectent).

---

## 5. Render — backend

### Création du service

1. Pousser le repo sur GitHub.
2. Dashboard Render → **New → Blueprint** → sélectionner le repo : `render.yaml` est détecté et le service `mybank-backend` est créé (runtime Docker, `rootDir: backend`, plan free, région Frankfurt).
   - Ou manuellement : **New → Web Service** → repo → Root Directory `backend` → Runtime Docker.
3. Le **dernier stage** du Dockerfile (`render`) est construit par défaut : nginx + PHP-FPM + supervisord, à l'écoute sur `$PORT` (fourni par Render).

### Variables à renseigner (dashboard → Environment)

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL du MySQL managé (section 3) |
| `CORS_ALLOW_ORIGIN` | `^https://VOTRE-APP\.vercel\.app$` |
| `JWT_PRIVATE_KEY_BASE64` / `JWT_PUBLIC_KEY_BASE64` | clés encodées (section 4) |
| `APP_SECRET`, `JWT_PASSPHRASE` | générées automatiquement par le blueprint |
| `TRUSTED_PROXIES` | `127.0.0.1,REMOTE_ADDR` (déjà dans le blueprint) |

### Build & santé

- Healthcheck Render : `GET /api/health` → `{"status":"ok"}` (zéro downtime : l'ancienne version reste en ligne tant que la nouvelle n'est pas saine).
- L'offre gratuite **met le service en veille après 15 min d'inactivité** : la première requête suivante prend 30–60 s (cold start). Limitation assumée du plan gratuit.

### Monitoring & logs

- **Logs** : Dashboard → service → onglet *Logs* (nginx, PHP-FPM, Symfony et migrations y arrivent tous, stdout/stderr).
- **Metrics** : onglet *Metrics* (CPU, RAM, temps de réponse).
- **Alerting** : Settings → *Notifications* (e-mail/Slack en cas d'échec de déploiement ou de healthcheck).
- **Shell** : onglet *Shell* pour exécuter `php bin/console` en production.

---

## 6. Vercel — frontend

### Connexion GitHub

1. `vercel.com` → **Add New → Project** → importer le repo GitHub.
2. **Root Directory : `frontend`** (monorepo). Framework *Vite* détecté automatiquement ; `frontend/vercel.json` impose build (`npm run build`), sortie (`dist`), rewrites SPA et headers de sécurité.

### Variables

| Variable | Valeur | Environnement |
|---|---|---|
| `VITE_API_URL` | `https://mybank-backend.onrender.com/api` | Production + Preview |

> Toute variable exposée au navigateur doit être préfixée `VITE_`. Ne jamais y mettre de secret : le bundle est public.

### Build & domaine

- Chaque push sur `main` → déploiement production ; chaque PR → URL de preview.
- Domaine par défaut : `https://VOTRE-APP.vercel.app`. Domaine personnalisé : Settings → *Domains* (penser à mettre à jour `CORS_ALLOW_ORIGIN` côté Render).
- Le routing SPA est géré par le rewrite `/(.*) → /index.html` (hors `/assets/`), donc `F5` sur `/operations` fonctionne.

---

## 7. CI/CD — GitHub Actions

`.github/workflows/deploy.yml`, déclenché sur push/PR vers `main` et `develop` :

| Job | Contenu |
|---|---|
| `backend-tests` | PHP 8.2 + MySQL 8 service, `composer install` (avec cache), génération de clés JWT CI, création du schéma de test, **PHPUnit** |
| `frontend-tests` | Node 20, `npm ci`, **ESLint**, **Vitest**, **build Vite** (vérification déployabilité Vercel) |
| `docker-build` | Build des stages `prod` et `render` du Dockerfile Symfony (cache GitHub Actions) |

Le déploiement effectif est délégué aux intégrations natives **GitHub → Render** et **GitHub → Vercel** (auto-deploy sur `main`). Pour bloquer un déploiement si la CI échoue : Render → Settings → *Auto-Deploy* → « After CI Checks Pass », et Vercel → Settings → Git → *Ignored Build Step* si besoin.

---

## 8. Sécurité

### En place

- **Transport** : HTTPS partout (TLS terminé par Vercel et Render), HSTS un an.
- **Headers OWASP** (nginx + Vercel) : `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy: default-src 'none'` sur l'API.
- **CORS** : liste blanche par regex (`CORS_ALLOW_ORIGIN`), méthodes et headers restreints (`nelmio_cors.yaml`).
- **Authentification** : JWT RS256 (clés RSA 4096 hors Git), TTL 1 h, mots de passe hachés par l'algorithme auto de Symfony (bcrypt/argon2).
- **Rate limiting** : `login_throttling` — 5 tentatives/minute par e-mail + IP (`symfony/rate-limiter`), IP réelle obtenue via `trusted_proxies`.
- **Cookies** : l'API est 100 % stateless — aucune session, aucun cookie côté Symfony, donc pas de CSRF applicable à l'API.
- **Durcissement PHP prod** : `expose_php=Off`, `display_errors=Off`, OPcache sans revalidation, exécution PHP limitée à `index.php` (nginx), fichiers cachés bloqués.
- **Secrets** : uniquement en variables d'environnement Render/Vercel ; `.env` versionné ne contient que des valeurs de dev.

### Faiblesses connues (à arbitrer)

1. **JWT stocké en `localStorage`** côté front : vulnérable au XSS (mitigé par la CSP et l'absence d'HTML injecté). Alternative plus robuste : cookie `HttpOnly; Secure; SameSite=None` + protection CSRF — nécessite un refactor backend/frontend.
2. **Pas de refresh token** : TTL 1 h, l'utilisateur se reconnecte ensuite. `gesdinet/jwt-refresh-token-bundle` est l'évolution naturelle.
3. **Plan gratuit Render** : cold start ~30–60 s après veille ; pas de SLA.
4. **`/api/register` non throttlé** : le rate limiter ne couvre que `/api/login`. Ajouter un limiteur nommé (`framework.rate_limiter`) sur l'inscription si l'app est exposée publiquement.

---

## 9. Déploiement initial — checklist

1. **MySQL** : créer le service Aiven, noter `DATABASE_URL` (section 3).
2. **JWT** : générer les clés, les encoder en base64 (section 4).
3. **GitHub** : pousser `main`.
4. **Render** : New → Blueprint → renseigner `DATABASE_URL`, `CORS_ALLOW_ORIGIN` (placeholder en attendant l'URL Vercel), `JWT_*_BASE64`. Vérifier `https://mybank-backend.onrender.com/api/health`.
5. **Vercel** : importer le repo (root `frontend`), définir `VITE_API_URL`. Noter l'URL finale.
6. **CORS** : mettre à jour `CORS_ALLOW_ORIGIN` sur Render avec l'URL Vercel exacte → redéploiement automatique.
7. **Seed** : créer le premier compte via l'UI, le promouvoir admin via le Shell Render (`php bin/console app:user:promote …`).
8. **Test de bout en bout** : inscription, connexion, opération, catégorie, admin.

---

## 10. Rollback

### Render

Dashboard → service → onglet **Deploys** → déploiement précédent → **Rollback**. L'image Docker précédente est restaurée instantanément (pas de rebuild).

> Attention : les migrations déjà appliquées ne sont pas annulées. Pour une migration destructive, écrire la migration inverse (`php bin/console doctrine:migrations:migrate prev` en Shell Render) **avant** le rollback applicatif.

### Vercel

Dashboard → projet → **Deployments** → déploiement sain → **Promote to Production**. Instantané (CDN).

### Base de données

Aiven : sauvegardes automatiques quotidiennes (PITR selon plan). Avant toute migration risquée : `mysqldump` manuel.

```bash
mysqldump --single-transaction -h HOST -P PORT -u USER -p DBNAME > backup_$(date +%F).sql
```

---

## 11. Maintenance

| Tâche | Fréquence | Commande / lieu |
|---|---|---|
| Mise à jour dépendances PHP | mensuelle | `composer update` + CI verte avant merge |
| Mise à jour dépendances npm | mensuelle | `npm update` / `npm audit fix` |
| Rotation `APP_SECRET` / clés JWT | semestrielle ou après incident | section 4 |
| Vérification des sauvegardes DB | mensuelle | console Aiven |
| Surveillance cold starts / quotas | continue | dashboards Render & Vercel |
| Revue des logs d'erreurs | hebdomadaire | Render → Logs |

### Garder le service éveillé (optionnel)

Le plan gratuit Render s'endort après 15 min. Un ping externe (UptimeRobot, cron-job.org — gratuits) sur `/api/health` toutes les 10 min maintient l'API chaude et fournit en bonus une supervision de disponibilité.
