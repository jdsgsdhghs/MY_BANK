# Journal de développement — MyBank

> Projet #6 — CDA 3ᵉ année — L'École Multimédia — 2025

## 1. Comptes-rendus de développement

### Phase 1 — Mise en place du projet

**Initialisation**
- Création du dépôt GitHub `mybank`.
- Mise en place de la structure du repo (`backend/`, `frontend/`, `docker/`, `docs/`, `scripts/`, `.github/`).
- Choix techniques validés : Symfony 7 + React 18 + Vite + PostgreSQL 16 + JWT (Lexik bundle).

**Conception**
- Diagrammes UML (cas d'utilisation, classes, séquence) rédigés et joints au dossier de conception.
- Schéma base de données formalisé : `user` ─ `operation` ─ `category`, avec `operation.category_id ON DELETE SET NULL` pour que la suppression d'une catégorie ne casse pas l'historique.

**Backend Symfony**
- Squelette `composer.json` minimal (Symfony 7 + Doctrine + LexikJWT + NelmioCors + Maker).
- Entités `User`, `Category`, `Operation` annotées avec attributs Doctrine + groupes de sérialisation.
- 4 contrôleurs : `HealthController`, `RegistrationController`, `CategoryController`, `OperationController`.
- Configuration JWT (RSA 4096) avec génération automatique des clés au premier démarrage via `docker-entrypoint.sh`.

**Frontend React**
- Init Vite + TypeScript + React Router.
- `AuthContext` stocke le JWT en `localStorage` (clé `mybank_token`).
- Pages : `Login`, `Register`, `Operations`, `Categories` + layout commun avec NavLink.
- Styles via CSS variables (`global.css`) qui matérialisent la charte BankBank (`#156064`, `#00C49A`, `#F8E16C`, Montserrat).

### Phase 2 — Conteneurisation & CI/CD

**Docker**
- Multi-stage Dockerfile pour le backend (`dev` / `prod`) basé sur `php:8.2-fpm-alpine` + extensions `pdo_pgsql`, `intl`, `apcu`, `opcache`.
- Multi-stage Dockerfile pour le frontend (`dev` Vite / `builder` / `prod` Nginx servant le bundle).
- `docker-compose.yml` (dev) avec volumes pour le hot reload, healthcheck sur PostgreSQL.
- `docker-compose.prod.yml` (prod) qui tire les images depuis GHCR.

**CI/CD**
- `.github/workflows/ci.yml` : job `backend-tests` (PHPUnit avec service PostgreSQL), `frontend-tests` (Vitest + build), `docker-build` (vérifie que les images compilent).
- `.github/workflows/cd.yml` : publie les images sur `ghcr.io/jdsgsdhghs/mybank-*` et exécute `scripts/deploy.sh` en SSH sur le serveur cible.

### Phase 3 — Finalisation & documentation

- Rédaction du README (quickstart, API, structure, CI/CD).
- Plan de tests détaillé avec matrice T-01 → T-24.
- Captures à produire après stabilisation.

### Difficultés rencontrées & solutions

| # | Difficulté                                                                                    | Solution                                                                                                                                                       |
|---|-----------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | Les clés JWT doivent exister avant le premier `composer install` sinon l'app crashe au boot. | Génération à la volée dans `docker-entrypoint.sh` (idempotent, ne refait pas si déjà là), et étape équivalente dans le workflow CI.                            |
| 2 | Doctrine ne tolère pas `category` à `NULL` sur `Operation` par défaut.                       | Ajout explicite `#[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]`. Permet aussi de garder l'historique après suppression d'une catégorie.              |
| 3 | CORS bloque les appels du front (port 5173) vers l'API (port 8080).                          | Bundle `nelmio/cors`, regex `^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$` côté dev. En prod, la regex passe par la variable `CORS_ALLOW_ORIGIN`.             |
| 4 | Les variables `$` dans `docker-compose.yml` sont interprétées par Compose.                   | Doubler avec `$$` quand on veut une variable shell/regex littérale (`'^https?://localhost$$'`).                                                                |
| 5 | Sur Windows, le script `install.sh` ne s'exécute pas directement.                            | Exécuter avec `bash scripts/install.sh` (Git Bash fourni avec Git for Windows). Sinon les commandes peuvent être lancées une par une depuis PowerShell.        |
| 6 | Tests d'intégration : la base de test partage la connexion du dev.                           | `dbname_suffix: '_test'` dans `doctrine.yaml` sous `when@test:` + reset schéma dans `setUp()` via `SchemaTool`.                                                |

## 2. Documentation CI/CD

### 2.1 Installation de Docker

**Pourquoi Docker ?** L'application combine PHP-FPM, Nginx, Node, et PostgreSQL — installer tout cela à la main rend chaque poste différent et fragile. Docker garantit qu'un développeur (sur Windows), un job CI (sur Ubuntu) et la prod (Linux) exécutent **exactement les mêmes binaires**.

**Windows**
1. Télécharger Docker Desktop : <https://www.docker.com/products/docker-desktop>.
2. Installer, redémarrer.
3. Cocher *Use WSL 2 based engine* dans les paramètres.
4. Vérifier : `docker --version` et `docker compose version`.

**macOS**
1. Docker Desktop for Mac (Apple Silicon ou Intel) sur la même URL.
2. Glisser dans `/Applications`, lancer, accepter les permissions.
3. Vérifier : `docker --version`.

**Linux (Ubuntu/Debian)**
```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
docker --version && docker compose version
```

### 2.2 Pipeline CI/CD avec GitHub Actions

Un **pipeline CI/CD** automatise la chaîne de vérification → livraison : à chaque `push`, GitHub lance dans le cloud les tests + builds, et en cas de succès sur `main`, publie les images et déploie. On évite les régressions et on garantit que tout le monde déploie la même version.

**Fichier `ci.yml` — étapes**

```yaml
jobs:
  backend-tests:    # PostgreSQL en service, composer install, gen JWT, phpunit
  frontend-tests:  # node, npm install, npm run lint, npm test, npm run build
  docker-build:    # construit les images dev/prod pour valider les Dockerfiles
```

Phases couvertes :
1. **Installation des dépendances** (Composer côté PHP, npm côté React).
2. **Vérification du code et des tests** : PHPUnit (avec une vraie DB PostgreSQL en service Docker éphémère), Vitest, ESLint.
3. **Build** : les deux Dockerfiles sont construits — si une étape échoue, le PR est bloqué.

**Fichier `cd.yml` — étapes**

```yaml
jobs:
  publish:  # push images sur ghcr.io/jdsgsdhghs/mybank-*
  deploy:   # ssh + ./scripts/deploy.sh sur le serveur
```

### 2.3 Déploiement continu

Quand un commit arrive sur `main` :
1. Le job `publish` reconstruit les images `mybank-backend` et `mybank-frontend` puis les pousse sur GHCR (le registry GitHub) avec les tags `latest`, `sha-xxxxxx`, `main`.
2. Le job `deploy` se connecte en SSH au serveur cible.
3. Sur le serveur, `scripts/deploy.sh` exécute :
   ```bash
   docker compose -f docker-compose.prod.yml pull   # récupère les nouvelles images
   docker compose -f docker-compose.prod.yml up -d --remove-orphans   # redémarre
   docker image prune -f                            # nettoie
   ```
   Le compose de prod référence `ghcr.io/jdsgsdhghs/mybank-*:latest`, donc le `pull` ramène toujours la dernière image publiée.

### 2.4 Tests d'intégration

Le pipeline CI ne vérifie pas seulement la syntaxe : il exécute des **tests d'intégration** qui s'assurent que les briques (frontend, backend, DB) fonctionnent **ensemble**.

- Côté backend (`tests/Integration/OperationFlowTest.php`), un `WebTestCase` rejoue le parcours utilisateur complet contre une vraie PostgreSQL :
  1. Création d'un utilisateur en base.
  2. Login → récupération d'un JWT.
  3. Création d'une catégorie via l'API.
  4. Création d'une opération liée à cette catégorie.
  5. Listage / modification / suppression.
- Exemple concret demandé par le brief : *« tester qu'une nouvelle dépense peut être ajoutée via le frontend, envoyée au backend, et stockée dans la base »* — ce flux est validé par `testFullCrudFlow()`, à l'exception du clic UI (couvert séparément par Vitest dans `frontend/src/test/Login.test.tsx`).

À chaque `push` ou `pull_request`, GitHub Actions ré-exécute ces tests, signale les régressions, et bloque le merge si quelque chose casse.

## 3. Veille

| Sujet                          | Source                                                         |
|--------------------------------|----------------------------------------------------------------|
| Symfony / Doctrine             | <https://symfony.com/blog>, RSS releases GitHub                |
| React / Vite                   | <https://react.dev/blog>, <https://vitejs.dev/blog>            |
| Sécurité PHP                   | <https://www.php.net/security>, advisories GitHub              |
| Docker & CI                    | <https://docs.docker.com/engine/release-notes/>                |
| CVE / dépendances              | Dependabot, `composer audit`, `npm audit`                      |
| OWASP                          | <https://owasp.org/Top10/>                                     |
