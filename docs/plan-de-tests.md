# Plan de tests — MyBank

## 1. Objectif

Vérifier que MyBank couvre l'ensemble des fonctionnalités exprimées par le client (auth, CRUD opérations, CRUD catégories) et reste fonctionnelle après chaque évolution du code, à travers une combinaison de tests unitaires, d'intégration, et de tests manuels d'acceptation.

## 2. Environnements

| Environnement   | Cible                       | Base de données       | Lancement                                                     |
|-----------------|-----------------------------|-----------------------|---------------------------------------------------------------|
| Dev local       | Docker Compose              | PostgreSQL 16 (conteneur) | `docker compose up`                                       |
| Test CI         | GitHub Actions (Ubuntu)     | Service `postgres:16` | `vendor/bin/phpunit` + `npm test`                             |
| Staging / Prod  | Serveur via Compose         | PostgreSQL 16         | `scripts/deploy.sh`                                           |

## 3. Niveaux de tests

### 3.1 Tests unitaires (backend)
- **Outil :** PHPUnit 10 (via `symfony/phpunit-bridge`).
- **Périmètre :** entités (`User`, `Operation`, `Category`), validation, sérialisation.
- **Exécution :** `vendor/bin/phpunit --testdox` (local) — automatique en CI.

### 3.2 Tests unitaires (frontend)
- **Outil :** Vitest + Testing Library.
- **Périmètre :** composants `Login`, `AuthContext`, `Operations`/`Categories` (rendering + interactions clés).
- **Exécution :** `npm test`.

### 3.3 Tests d'intégration (backend ↔ DB)
- **Outil :** PHPUnit `WebTestCase` avec un client HTTP simulé contre l'app Symfony, base PostgreSQL réelle.
- **Cas couvert :** parcours complet « register → login → POST category → POST operation → GET list → PUT → DELETE ».
- **Fichier :** [`backend/tests/Integration/OperationFlowTest.php`](../backend/tests/Integration/OperationFlowTest.php).

### 3.4 Tests d'acceptation (manuels)
Voir la matrice de cas en section 4.

## 4. Matrice des cas de test

| ID    | Fonctionnalité          | Pré-condition                | Action                                                       | Résultat attendu                                                         | Auto |
|-------|-------------------------|------------------------------|--------------------------------------------------------------|--------------------------------------------------------------------------|------|
| T-01  | Health check API        | App démarrée                 | `GET /api/health`                                            | `200 OK` + `{"status":"ok"}`                                             | ✅    |
| T-02  | Inscription valide      | Email unique                 | `POST /api/register` avec `{email, password ≥ 8}`           | `201`, user persisté                                                     | ✅    |
| T-03  | Inscription doublon     | Email déjà utilisé           | Idem T-02                                                    | `409 Email already in use`                                               | ✅    |
| T-04  | Mot de passe trop court | -                            | `password = "abc"`                                           | `400 Password must be at least 8 characters`                             | ✅    |
| T-05  | Login OK                | User existant                | `POST /api/login` valid                                      | `200` + `{token: "<JWT>"}`                                               | ✅    |
| T-06  | Login KO                | -                            | Mauvais password                                             | `401`                                                                    | ✅    |
| T-07  | Accès endpoint sans JWT | -                            | `GET /api/operations`                                        | `401 Unauthorized`                                                       | ✅    |
| T-08  | Création catégorie      | Logged in                    | `POST /api/categories {"title":"Food"}`                      | `201` + `{id, title:"Food"}`                                             | ✅    |
| T-09  | Liste catégories        | Au moins 1 catégorie         | `GET /api/categories`                                        | `200` + tableau, triées par titre                                        | ✅    |
| T-10  | Maj catégorie           | Catégorie existante          | `PUT /api/categories/{id} {"title":"Travel"}`                | `200` + titre mis à jour                                                 | ✅    |
| T-11  | Suppression catégorie   | Catégorie existante          | `DELETE /api/categories/{id}`                                | `204`, catégorie supprimée                                               | ✅    |
| T-12  | Création opération      | Catégorie créée              | `POST /api/operations {label, amount, date, categoryId}`    | `201` + objet complet avec catégorie                                     | ✅    |
| T-13  | Liste opérations        | Opérations existantes        | `GET /api/operations`                                        | `200` + tri par date desc                                                | ✅    |
| T-14  | Maj opération           | Opération existante          | `PUT /api/operations/{id} {"label":"…"}`                     | `200` + label mis à jour                                                 | ✅    |
| T-15  | Suppression opération   | Opération existante          | `DELETE /api/operations/{id}`                                | `204`                                                                    | ✅    |
| T-16  | Isolation utilisateur   | User B se log                | User B accède aux opérations de User A                       | `404 Not found` (ressources non visibles)                                | ✅    |
| T-17  | Cat. supprimée → ops    | Opération liée à une cat.   | Supprimer la catégorie                                       | Opération conservée, `category = null` (SET NULL)                        | ✅    |
| T-18  | Validation date         | -                            | `POST /api/operations {"date":"not-a-date"}`                 | `400 Invalid date format`                                                | ✅    |
| T-19  | Frontend - login UI     | -                            | Saisie + clic Sign in                                        | Redirection vers `/operations` + token en localStorage                   | ✅    |
| T-20  | Frontend - logout       | Connecté                     | Clic « Log out »                                             | Redirection `/login`, token supprimé                                     | M    |
| T-21  | Responsive mobile       | -                            | Ouvrir < 600px wide                                          | Nav et table s'adaptent (overflow-x sur table)                           | M    |
| T-22  | Tests de sécurité - XSS | -                            | Saisir `<script>alert(1)</script>` dans label                | Rendu en texte (React échappe par défaut), pas d'exécution               | M    |
| T-23  | Tests sécurité - SQLi   | -                            | Email = `' OR 1=1 --`                                        | Pas d'auth (Doctrine bind, pas de SQL concat)                            | M    |
| T-24  | CSRF / CORS             | Origin distinct              | `fetch` depuis `http://evil.example`                         | Bloqué (Nelmio CORS regex ne matche pas)                                 | M    |

Légende : ✅ = automatisé, M = manuel.

## 5. Critères d'acceptation

- 100 % des tests automatisés en vert sur la branche `main`.
- Pipeline CI sans erreur (PHPUnit + Vitest + builds Docker).
- Tous les cas manuels listés validés sur un environnement de staging avant tag de release.

## 6. Veille — sécurité et évolutions

- **Symfony Security advisories** : `composer audit` exécuté ponctuellement, et bulletins Symfony suivis.
- **npm audit** : `npm audit --omit=dev` sur le frontend.
- **CVE base** : Snyk DB et GitHub Dependabot Alerts activés sur le dépôt.
- **OWASP Top 10** : revue annuelle ; les contrôles présents couvrent A01 (Broken Access Control — chaque endpoint vérifie `owner === user`), A02 (Crypto — password hashing auto Symfony), A03 (Injection — Doctrine paramétré), A05 (Misconfig — CORS regex stricte, headers nginx), A07 (Auth — JWT signé RSA 4096).

## 7. Stratégie d'évolution du plan

Le plan est revu :
- à chaque ajout de fonctionnalité (nouvelles lignes dans la matrice),
- à chaque rotation majeure de dépendance (Symfony, React, PostgreSQL),
- après chaque incident en production (nouveau cas régression).
