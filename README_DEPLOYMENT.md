# Guide de déploiement — MyBank

Ce document décrit l'architecture de production, le processus de déploiement, la sécurité, la maintenance et les procédures de restauration de l'application **MyBank**.

---

# 1. Architecture de production

## Vue d'ensemble

| Composant       | Technologie                    | Hébergement |
| --------------- | ------------------------------ | ----------- |
| Frontend        | React 18 + TypeScript + Vite   | Vercel      |
| Backend         | Symfony 7.3 / PHP 8.2 (Docker) | Render      |
| Base de données | MySQL 8 managé                 | Aiven       |
| Dépôt Git       | GitHub                         | GitHub      |
| CI/CD           | GitHub Actions                 | GitHub      |

L'application est composée d'un frontend React déployé sur Vercel et d'une API Symfony exécutée dans un conteneur Docker sur Render. Les données sont stockées dans une base MySQL managée hébergée chez Aiven.

---

## Architecture

```mermaid
graph LR
    U[Utilisateur]

    U -->|HTTPS| V[Vercel<br>Frontend React]

    U -->|HTTPS /api| R[Render<br>Symfony]

    R -->|TLS| DB[(MySQL<br>Aiven)]

    Git[GitHub]

    Git -->|Push main| V
    Git -->|Push main| R

    Git -->|GitHub Actions| CI[Tests + Build Docker]
```

---

# 2. Déploiement continu

Le déploiement est entièrement automatisé.

## Étapes

1. Le développeur pousse son code sur la branche **main**.
2. GitHub Actions exécute :

   * PHPUnit
   * Vitest
   * ESLint
   * Build Vite
   * Build Docker
3. Si les tests réussissent :

   * Vercel déploie automatiquement le frontend.
   * Render reconstruit l'image Docker du backend.
4. Le backend effectue un contrôle de santé (`/api/health`).
5. Si le contrôle est valide, la nouvelle version est mise en production sans interruption.

---

# 3. Conteneur Docker

Le Dockerfile est découpé en plusieurs stages.

| Stage  | Rôle                             |
| ------ | -------------------------------- |
| base   | PHP + extensions                 |
| dev    | Développement local              |
| prod   | Image optimisée                  |
| render | Image finale utilisée par Render |

## Développement

```bash
docker compose up -d

cd frontend
npm run dev
```

Services disponibles :

* Backend Symfony
* MySQL
* phpMyAdmin
* Nginx

---

# 4. Base de données

La base MySQL est hébergée sur **Aiven**.

Le backend s'y connecte grâce à :

```text
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DBNAME
```

Les migrations Doctrine sont exécutées automatiquement lors du démarrage du conteneur.

---

# 5. Authentification JWT

L'API utilise **LexikJWTAuthenticationBundle**.

## Fonctionnement

* Signature RS256
* Clés RSA 4096 bits
* Durée de vie du token : 1 heure

Les clés privées ne sont jamais présentes dans le dépôt Git.

En production, elles sont stockées dans les variables d'environnement Render.

---

# 6. Déploiement du backend (Render)

## Étapes

1. Connecter le dépôt GitHub.
2. Créer un Web Service Docker.
3. Définir les variables d'environnement.
4. Lancer le premier déploiement.

Variables principales :

* DATABASE_URL
* APP_SECRET
* JWT_PRIVATE_KEY_BASE64
* JWT_PUBLIC_KEY_BASE64
* CORS_ALLOW_ORIGIN

Render surveille automatiquement le dépôt GitHub.

Chaque push sur **main** déclenche un nouveau déploiement.

---

# 7. Déploiement du frontend (Vercel)

Le frontend est connecté directement au dépôt GitHub.

Chaque push déclenche :

* installation des dépendances
* build Vite
* publication sur le CDN Vercel

Variable obligatoire :

```
VITE_API_URL=https://mybank-backend.onrender.com/api
```

---

# 8. Pipeline CI/CD

GitHub Actions comporte trois étapes principales.

| Job            | Description                    |
| -------------- | ------------------------------ |
| backend-tests  | PHPUnit                        |
| frontend-tests | ESLint + Vitest + Build        |
| docker-build   | Construction de l'image Docker |

Si les tests échouent, le déploiement est interrompu.

---

# 9. Sécurité

Les principales mesures de sécurité sont :

* HTTPS sur tous les services
* JWT RS256
* Hachage des mots de passe
* CORS restreint
* Rate Limiting
* Headers HTTP OWASP
* Variables d'environnement pour tous les secrets
* Aucune clé privée dans Git

## Limites connues

* JWT stocké dans le Local Storage
* Pas de Refresh Token
* Cold Start sur Render Free
* Route d'inscription non limitée

---

# 10. Déploiement initial

1. Créer la base MySQL.
2. Générer les clés JWT.
3. Pousser le dépôt sur GitHub.
4. Déployer le backend sur Render.
5. Déployer le frontend sur Vercel.
6. Configurer CORS.
7. Créer le premier administrateur.
8. Tester l'application.

---

# 11. Rollback

## Backend

Depuis Render :

Deploys → Rollback

## Frontend

Depuis Vercel :

Deployments → Promote to Production

## Base de données

Avant toute migration importante :

```bash
mysqldump --single-transaction ...
```

---

# 12. Maintenance

| Opération                    | Fréquence       |
| ---------------------------- | --------------- |
| Mise à jour Composer         | Mensuelle       |
| Mise à jour npm              | Mensuelle       |
| Rotation des clés JWT        | Tous les 6 mois |
| Vérification des sauvegardes | Mensuelle       |
| Contrôle des logs            | Hebdomadaire    |
| Surveillance Render/Vercel   | Continue        |

---

# 13. Supervision

Pour éviter le **cold start** du plan gratuit Render, un service comme **UptimeRobot** peut appeler automatiquement :

```
/api/health
```

toutes les dix minutes.

Cela permet également de surveiller la disponibilité de l'API.
