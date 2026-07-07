# Dossier de conception — MyBank

> Projet #6 — CDA 3ᵉ année — L'École Multimédia — 2025

## 1. Reformulation de la demande client

**Client :** BankBank, startup fondée par Georgia (ex-directrice financière), basée sur le constat que les jeunes peinent à gérer leur argent au quotidien.

**Produit :** *MyBank*, application web responsive (mobile / tablette / desktop, portrait + paysage), en **anglais**, permettant à un particulier :
- de **s'authentifier** sur son compte personnel ;
- de **gérer ses opérations** financières (CRUD complet : créer, lire, modifier, supprimer) ;
- de **classer ses opérations en catégories** qu'il définit lui-même ;
- de **modifier son profil** (changer son adresse email et/ou son mot de passe).

**Modèle métier :**
- Une **opération** = libellé + montant + date + catégorie (optionnelle).
- Une **catégorie** = titre.
- Un **utilisateur** ne voit et ne manipule que ses propres opérations et catégories.

**Contraintes techniques imposées :**
- Frontend en **React**, backend en **Symfony**.
- Application en anglais.
- Versionning Git/GitHub.
- Conteneurisation Docker.
- Testable + déployable rapidement (CI/CD).

**Charte graphique :**
- Typographie : **Inter** (texte courant) + **Spline Sans** (titres).
- Palette : `#A11A2E` (primaire, bordeaux) — `#7F1322` (bordeaux foncé) — `#C2703D` (accent, doré). Sémantique financière conservée : `#0C6B51` (crédits, vert) / `#BC3A2B` (débits, rouge). Thèmes clair **et** sombre.

**Schéma d'architecture :** voir [`docs/architecture.svg`](architecture.svg) — flux frontend (Vercel) ↔ API REST (Render) ↔ base MySQL managée, sécurité (HTTPS, JWT, CORS) et chaîne CI/CD.

## 2. Adresse GitHub

`https://github.com/jdsgsdhghs/MY_BANK`

## 3. Documents de conception de l'interface

> Maquettes vectorielles (SVG) dans [`docs/maquettes/`](maquettes/) : [zoning](maquettes/zoning.svg), [login](maquettes/wireframe-login.svg), [register](maquettes/wireframe-register.svg), [operations](maquettes/wireframe-operations.svg), [categories](maquettes/wireframe-categories.svg), [users](maquettes/wireframe-users.svg), [profile](maquettes/wireframe-profile.svg).

### 3.a Zoning

Tous les écrans suivent une grille à 3 zones :

```
┌──────────────────────────────────────────┐
│  HEADER  (logo + nav + logout)           │
├──────────────────────────────────────────┤
│                                          │
│  CONTENT (page-specific)                 │
│                                          │
├──────────────────────────────────────────┤
│  FOOTER  (optionnel)                     │
└──────────────────────────────────────────┘
```

### 3.b Wireframes

**Login**
```
┌──────────────────────────────┐
│        [M]  MyBank           │
│   Sign in to manage...       │
│   ┌────────────────────┐     │
│   │ Email              │     │
│   └────────────────────┘     │
│   ┌────────────────────┐     │
│   │ Password           │     │
│   └────────────────────┘     │
│   [    Sign in    ]          │
│   No account? Create one     │
└──────────────────────────────┘
```

**Operations (dashboard)**
```
┌──────────────────────────────────────────────┐
│ [M] MyBank   Operations  Categories   Logout │
├──────────────────────────────────────────────┤
│ Operations                  ┌── Net total ──┐│
│ Track your...               │   123.45 €    ││
│                             └───────────────┘│
│ ── New / Edit operation ─────────────────────│
│ [Label] [Amount] [Date] [Category]   [Add]   │
│ ── History ──────────────────────────────────│
│ Date | Label   | Category | Amount | Actions │
│ ...  | Lunch   | Food     | -12.50 | Edit Del│
└──────────────────────────────────────────────┘
```

**Categories**
```
┌──────────────────────────────────────────────┐
│ [Title input] [Add]                          │
│ ── Your categories ──                        │
│ • Food                          [Edit][Del]  │
│ • Transport                     [Edit][Del]  │
└──────────────────────────────────────────────┘
```

**Users (admin only)**
```
┌──────────────────────────────────────────────┐
│ [M] MyBank  Operations  Categories  Users  L │
├──────────────────────────────────────────────┤
│ Users                                        │
│ Manage accounts and admin privileges.        │
│ ── New / Edit user ──────────────────────────│
│ [Email]  [Password]  [ ] Administrator       │
│ [ Create ]  [ Cancel ]                       │
│ ── All users ────────────────────────────────│
│ • alice@x.com    [User]            [Edit][Del]│
│ • bob@x.com      [Admin] [You]     [Edit][ ─ ]│
└──────────────────────────────────────────────┘
```

**Profile (tout utilisateur authentifié)**
```
┌──────────────────────────────────────────────┐
│ [M] MyBank  Operations Categories ... Profile│
├──────────────────────────────────────────────┤
│ My profile                                   │
│ Update your email address and password.      │
│ ── [User] / [Admin] ─────────────────────────│
│ ┌────────────────────────┐                   │
│ │ Email                  │                   │
│ └────────────────────────┘                   │
│ ── Leave blank to keep current password ─────│
│ ┌────────────────────────┐                   │
│ │ New password           │                   │
│ └────────────────────────┘                   │
│ ┌────────────────────────┐                   │
│ │ Confirm new password   │                   │
│ └────────────────────────┘                   │
│ ┌────────────────────────┐                   │
│ │ Current password       │ (confirmation)    │
│ └────────────────────────┘                   │
│ [ Save changes ]                             │
└──────────────────────────────────────────────┘
```

### 3.c Maquettes

Les **wireframes basse-fidélité** sont fournis au format **SVG** dans [`docs/maquettes/`](maquettes/) (un fichier par écran, voir le tableau ci-dessus). La **maquette haute-fidélité** correspond à l'application réelle : captures d'écran à placer dans `docs/screenshots/`.

> NB : Les maquettes reprennent la palette bordeaux (`#A11A2E / #7F1322 / #C2703D`) et la typographie Inter + Spline Sans. Les composants visuels exacts (jetons de couleur, thèmes clair/sombre) sont implémentés dans `frontend/src/styles/global.css`, qui fait foi.

### 3.d Enchaînement des écrans

```
       ┌─────────┐         ┌──────────┐
       │  Login  │ ◄────── │ Register │
       └────┬────┘         └──────────┘
            │ (success)
            ▼
   ┌──────────────┐  ┌────────────┐  ┌──────────┐  ┌──────────────┐
   │  Operations  │◄►│ Categories │◄►│ Profile  │◄►│    Users     │
   │  (default)   │  │            │  │          │  │ (admin only) │
   └──────────────┘  └────────────┘  └──────────┘  └──────────────┘
            │
            ▼ (logout)
       ┌─────────┐
       │  Login  │
       └─────────┘
```

L'accès à `Users` est conditionné par `ROLE_ADMIN` :
- côté frontend, le lien n'apparaît dans la nav que si l'utilisateur est admin, et la route est gardée par `AdminRoute` (redirection vers `/operations` sinon) ;
- côté backend, toutes les routes `/api/admin/**` sont protégées par `IsGranted('ROLE_ADMIN')` et par `access_control` dans `security.yaml`.

Routes effectives (React Router) :
- `/login` (public)
- `/register` (public)
- `/operations` (protégée — redirection vers `/login` si non auth)
- `/categories` (protégée)
- `/profile` (protégée — tout utilisateur authentifié)
- `/users` (protégée — admin uniquement, redirection vers `/operations` si non admin)
- `/` → redirige vers `/operations`

## 4. Schémas de conception UML

> Versions vectorielles (SVG) dans [`docs/diagrammes/`](diagrammes/) : [cas d'utilisation](diagrammes/cas-utilisation.svg), [classes](diagrammes/classes.svg), [séquence (création d'une opération)](diagrammes/sequence-creation-operation.svg).

### 4.a Diagramme de cas d'utilisation

```
                ┌─────────────────────────────┐
                │           MyBank            │
                │  ┌───────────────────────┐  │
   ┌────────┐   │  │  Register             │  │
   │ User   │───┼──│  Login                │  │
   │ (Actor)│   │  │  CRUD operations      │  │
   └───▲────┘   │  │  CRUD categories      │  │
       │        │  │  Edit own profile     │  │
       │        │  │   (email, password)   │  │
       │        │  │  Logout               │  │
       │        │  └───────────────────────┘  │
       │ extends│  ┌───────────────────────┐  │
   ┌───┴────┐   │  │  List users           │  │
   │ Admin  │───┼──│  Create user          │  │
   │ (Actor)│   │  │  Update user (email,  │  │
   └────────┘   │  │   password, roles)    │  │
                │  │  Delete user          │  │
                │  └───────────────────────┘  │
                └─────────────────────────────┘
```

L'acteur **Admin** hérite de **User** (un admin est un utilisateur authentifié qui dispose en plus du rôle `ROLE_ADMIN`). Il accède à tous les cas d'utilisation de `User` plus la gestion des utilisateurs. Règle métier : un admin ne peut pas supprimer son propre compte.

### 4.b Diagramme de classes

```
┌──────────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│        User          │ 1     * │    Operation     │ *     1 │    Category      │
├──────────────────────┤◄────────├──────────────────┤────────►├──────────────────┤
│ -id: int             │  owner  │ -id: int         │ category│ -id: int         │
│ -email: string       │         │ -label: string   │         │ -title: string   │
│ -password: hash      │         │ -amount: decimal │         │ -owner: User     │
│ -roles: string[]     │         │ -date: date      │         │                  │
│  (ROLE_USER          │         │ -owner: User     │         ├──────────────────┤
│   | ROLE_ADMIN)      │         │ -category: Cat?  │         │ +getTitle()      │
├──────────────────────┤         ├──────────────────┤         │ +setTitle()      │
│ +getRoles()          │         │ +getLabel()      │         └──────────────────┘
│ +setRoles()          │         │ +setLabel()      │
│ +getUserIdentifier() │         │ +getAmount()     │
└──────────────────────┘         │ +setAmount()     │
                                 │ +getDate()       │
                                 │ +setDate()       │
                                 └──────────────────┘
```

Multiplicités :
- 1 `User` → 0..* `Operation` (composition, `orphanRemoval`).
- 1 `User` → 0..* `Category` (composition, `orphanRemoval`).
- 1 `Category` ◄── 0..* `Operation` (association optionnelle, `onDelete: SET NULL`).

Rôles applicatifs (hiérarchie déclarée dans `security.yaml`) :
- `ROLE_USER` — implicitement ajouté à tous les utilisateurs authentifiés.
- `ROLE_ADMIN` — accorde l'accès à `/api/admin/**` et à la page `/users`. Hérite de `ROLE_USER`.

### 4.c Diagramme de séquence — Création d'une opération

```
User    Browser/React    fetch         API (Symfony)     DB
 │         │              │                  │            │
 │ submit  │              │                  │            │
 ├────────►│              │                  │            │
 │         │ POST /ops    │                  │            │
 │         ├─────────────►│ POST /api/ops    │            │
 │         │              ├─────────────────►│            │
 │         │              │                  │ JWT verify │
 │         │              │                  │ validate   │
 │         │              │                  │ INSERT     │
 │         │              │                  ├───────────►│
 │         │              │                  │ ok         │
 │         │              │                  │◄───────────┤
 │         │              │ 201 + JSON       │            │
 │         │              │◄─────────────────┤            │
 │         │ refresh list │                  │            │
 │ render  │              │                  │            │
 │◄────────┤              │                  │            │
```

### 4.d Diagramme de séquence — Création d'un utilisateur par un admin

```
Admin   Browser/React    fetch          API (Symfony)            DB
 │         │              │                  │                    │
 │ submit  │              │                  │                    │
 ├────────►│              │                  │                    │
 │         │ POST /users  │                  │                    │
 │         ├─────────────►│ POST /api/admin/users                 │
 │         │              ├─────────────────►│                    │
 │         │              │                  │ JWT verify         │
 │         │              │                  │ check ROLE_ADMIN   │
 │         │              │                  │ validate payload   │
 │         │              │                  │ check email unique │
 │         │              │                  ├───────────────────►│
 │         │              │                  │                 ok │
 │         │              │                  │◄───────────────────┤
 │         │              │                  │ hash password      │
 │         │              │                  │ INSERT user        │
 │         │              │                  ├───────────────────►│
 │         │              │                  │                 ok │
 │         │              │                  │◄───────────────────┤
 │         │              │ 201 + user JSON  │                    │
 │         │              │◄─────────────────┤                    │
 │         │ refresh list │                  │                    │
 │ render  │              │                  │                    │
 │◄────────┤              │                  │                    │
```

Cas d'erreur gérés :
- `403 Forbidden` si l'appelant n'a pas `ROLE_ADMIN` (filtré par `access_control` + `#[IsGranted]`).
- `400 Bad Request` si email/password manquant ou password < 8 caractères.
- `409 Conflict` si l'email est déjà utilisé.
- À la suppression : `400` si l'admin tente de supprimer son propre compte.

### 4.e Diagramme de séquence — Modification de son profil

```
User    Browser/React    fetch          API (Symfony)            DB
 │         │              │                  │                    │
 │ submit  │              │                  │                    │
 ├────────►│              │                  │                    │
 │         │ PUT /profile │                  │                    │
 │         ├─────────────►│ PUT /api/profile │                    │
 │         │              ├─────────────────►│                    │
 │         │              │                  │ JWT verify         │
 │         │              │                  │ check currentPwd   │
 │         │              │                  │ (isPasswordValid)  │
 │         │              │                  │ check email unique │
 │         │              │                  ├───────────────────►│
 │         │              │                  │                 ok │
 │         │              │                  │◄───────────────────┤
 │         │              │                  │ hash new password  │
 │         │              │                  │ UPDATE user        │
 │         │              │                  ├───────────────────►│
 │         │              │                  │                 ok │
 │         │              │                  │◄───────────────────┤
 │         │              │                  │ create fresh JWT   │
 │         │              │ 200 + user+token │                    │
 │         │              │◄─────────────────┤                    │
 │         │ login(token) │  (MAJ contexte)  │                    │
 │ render  │              │                  │                    │
 │◄────────┤              │                  │                    │
```

Cas d'erreur gérés :
- `403 Forbidden` si le mot de passe actuel est absent ou incorrect (`isPasswordValid`).
- `400 Bad Request` si aucun champ à modifier, ou si le nouveau mot de passe < 8 caractères.
- `409 Conflict` si le nouvel email est déjà utilisé par un autre compte.

> L'email étant embarqué dans le JWT (payload `email`/`roles`), l'API renvoie un **token rafraîchi** après mise à jour. Le frontend appelle `login(token)` pour resynchroniser l'identité sans déconnexion.

### 4.f Diagramme d'activité — Parcours utilisateur

```
                           ● Start
                           │
                           ▼
                  ┌──────────────────┐
                  │  Open MyBank     │
                  └────────┬─────────┘
                           │
                           ▼
                     ◇ Has account?
                    /              \
                  no                yes
                   │                 │
                   ▼                 ▼
             ┌──────────┐      ┌──────────┐
             │ Register │      │  Login   │
             └────┬─────┘      └────┬─────┘
                  │                 │
                  └────────┬────────┘
                           │
                           ▼
                       ◇ Auth OK?
                      /          \
                    no            yes
                     │             │
                     ▼             ▼
              (back to Login) ┌──────────────┐
                              │  Store JWT   │
                              └──────┬───────┘
                                     │
                                     ▼
                              ◇ Has ROLE_ADMIN?
                             /                 \
                           no                   yes
                            │                    │
                            ▼                    ▼
                  ┌──────────────────┐  ┌──────────────────┐
                  │ Show nav:        │  │ Show nav:        │
                  │ Operations,      │  │ Operations,      │
                  │ Categories,      │  │ Categories,      │
                  │ Profile          │  │ Profile, Users   │
                  └────────┬─────────┘  └────────┬─────────┘
                           │                     │
                           └──────────┬──────────┘
                                      │
                                      ▼
                          ┌───────────────────────┐
                          │ Browse / CRUD          │◄────┐
                          │  - Operations          │     │ continue
                          │  - Categories          │     │
                          │  - Users (admin only) │     │
                          └───────────┬───────────┘     │
                                      │                 │
                                      ▼                 │
                                ◇ Logout?               │
                                 /       \──────────────┘
                               yes        no
                                │
                                ▼
                         ┌──────────────┐
                         │ Clear JWT    │
                         └──────┬───────┘
                                │
                                ▼
                              ◉ End
```

Notes :
- Les actions `Users (admin only)` sont gardées côté frontend par `AdminRoute` et côté backend par `IsGranted('ROLE_ADMIN')` — un utilisateur standard qui tenterait l'URL `/users` est redirigé vers `/operations`.
- L'action `Browse / CRUD` agrège les opérations classiques (créer, lister, éditer, supprimer) sur les trois ressources accessibles selon le rôle.
- La décision `Auth OK?` couvre à la fois l'échec du `Login` (mauvais identifiants → 401) et celui du `Register` (email déjà utilisé → 409).

## 5. Schéma de base de données

MySQL 8.0 (moteur InnoDB, `utf8mb4`). Version vectorielle (SVG) : [`docs/diagrammes/base-de-donnees.svg`](diagrammes/base-de-donnees.svg). Schéma logique :

```
┌────────────────────────────────────┐
│ user                               │
├────────────────────────────────────┤
│ id        INT PK AUTO_INCREMENT    │
│ email     VARCHAR(180) UNIQUE      │
│ roles     JSON                     │
│ password  VARCHAR(255)             │
└────────────────────────────────────┘
            │
            │ 1
            │
            │ *
┌────────────────────────────────────┐     ┌────────────────────────────────────┐
│ operation                          │     │ category                           │
├────────────────────────────────────┤     ├────────────────────────────────────┤
│ id          INT PK AUTO_INCREMENT  │     │ id        INT PK AUTO_INCREMENT    │
│ label       VARCHAR(150)           │     │ title     VARCHAR(100)             │
│ amount      DECIMAL(12,2)          │     │ owner_id  INT NOT NULL FK→user.id  │
│ date        DATE                   │     └────────────────────────────────────┘
│ owner_id    INT NOT NULL FK→user.id│                          ▲
│ category_id INT NULL FK→category.id│──────────────────────────┘
│            ON DELETE SET NULL                                  *
└────────────────────────────────────┘
```

Indexes : unique sur `user.email`, FK indexées par défaut (InnoDB). En production, la base est un **MySQL managé externe** (ex. Aiven, TLS obligatoire) — voir `README_DEPLOYMENT.md`.

## 6. Adresse du dépôt GitHub / Docker

- GitHub : `https://github.com/jdsgsdhghs/MY_BANK`
- Images Docker (publiées par CD) :
  - `ghcr.io/jdsgsdhghs/mybank-backend:latest`
  - `ghcr.io/jdsgsdhghs/mybank-frontend:latest`

Contenu du dépôt :
- **Scripts de déploiement** : `scripts/install.sh` (bootstrap dev), `scripts/deploy.sh` (prod pull+restart).
- **Scripts CI** : `.github/workflows/ci.yml` et `.github/workflows/cd.yml`.
- **Configurations Docker** : `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` (dev), `docker-compose.prod.yml`.
- **Code applicatif** : `backend/` (Symfony) et `frontend/` (React).

## 7. Plan de tests

Voir [plan-de-tests.md](plan-de-tests.md).

## 8. README

Voir [`README.md`](../README.md) à la racine du dépôt.

## 9. Captures d'écran

À placer dans `docs/screenshots/` après les premières démos :
- `login.png`
- `register.png`
- `operations-list.png`
- `operation-edit.png`
- `categories.png`
- `profile.png`
- `mobile-operations.png`
