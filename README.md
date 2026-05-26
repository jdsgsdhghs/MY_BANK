# MyBank

> Application web pour gérer ses dépenses personnelles — Projet #6 CDA 3ème année, L'École Multimédia.

MyBank is a personal expense tracker. Authenticated users can record operations (label, amount, date, category) and group them by category. Built with React (frontend) + Symfony (API) + MySQL, fully containerised with Docker, and tested + deployed with GitHub Actions.

---

## Stack

| Layer        | Tech                                          |
|--------------|-----------------------------------------------|
| Frontend     | React 18 + Vite + TypeScript + React Router   |
| Backend      | Symfony 7 + Doctrine ORM 3 + Lexik JWT bundle |
| Database     | MySQL 8.0                                      |
| Reverse proxy| Nginx                                          |
| Containers   | Docker + Docker Compose                        |
| CI / CD      | GitHub Actions + GHCR (image registry)         |
| Tests        | PHPUnit (backend), Vitest + Testing Library    |

---

## Quick start

### Prerequisites
- Docker Desktop 24+ (with Docker Compose v2)
- Git

Optional (for running outside containers):
- Node.js 20+, PHP 8.2+, Composer 2.

### One-shot bootstrap

```bash
git clone https://github.com/jdsgsdhghs/MY_BANK.git
cd MY_BANK
bash scripts/install.sh
```

The script will:
1. Build all images.
2. Install Composer & npm dependencies.
3. Generate the JWT keypair.
4. Create the database schema.
5. Start the full stack.

Then open:
- Frontend: <http://localhost:5173>
- Backend API health: <http://localhost:8080/api/health>

### Manual start

```bash
docker compose up -d
```

The backend entrypoint waits for MySQL, generates the JWT keypair, and runs `doctrine:schema:update`.

### Creating a user

Register from the UI (Register page) or via the API:
```bash
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'
```

### Default credentials (dev only)

| Service | Value |
|---|---|
| MySQL user | `mybank_user` |
| MySQL password | `mybank` |
| MySQL root password | `root` |
| Database | `mybank` |

---

## API reference

| Method | Path                       | Auth | Description                          |
|--------|----------------------------|------|--------------------------------------|
| GET    | `/api/health`              | -    | Service health probe                 |
| POST   | `/api/register`            | -    | Create a user                        |
| POST   | `/api/login`               | -    | Returns `{ token: "<JWT>" }`         |
| GET    | `/api/operations`          | JWT  | List current user's operations       |
| POST   | `/api/operations`          | JWT  | Create operation                     |
| GET    | `/api/operations/{id}`     | JWT  | Get one operation                    |
| PUT    | `/api/operations/{id}`     | JWT  | Update operation                     |
| DELETE | `/api/operations/{id}`     | JWT  | Delete operation                     |
| GET    | `/api/categories`          | JWT  | List categories                      |
| POST   | `/api/categories`          | JWT  | Create category                      |
| PUT    | `/api/categories/{id}`     | JWT  | Update category                      |
| DELETE | `/api/categories/{id}`     | JWT  | Delete category                      |

Authenticated requests must include `Authorization: Bearer <JWT>`.

---

## Running tests

### Backend
```bash
docker compose exec backend vendor/bin/phpunit --testdox
```

### Frontend
```bash
docker compose exec frontend npm test
```

Both suites run automatically on every push/PR through `.github/workflows/ci.yml`.

---

## CI / CD

- **CI** (`ci.yml`): On every push & PR, runs PHPUnit (against a MySQL 8.0 service), Vitest, then builds both Docker images.
- **CD** (`cd.yml`): On pushes to `main` and on tags `v*`, builds and pushes images to GHCR (`ghcr.io/jdsgsdhghs/mybank-backend` and `mybank-frontend`). A `deploy` job then SSHes into the production server and runs `scripts/deploy.sh`.

### Required secrets (Settings → Secrets and variables → Actions)
- `DEPLOY_HOST` — production host
- `DEPLOY_USER` — SSH user
- `DEPLOY_SSH_KEY` — private SSH key
- `DEPLOY_PATH` — path on the server
- `APP_SECRET`, `JWT_PASSPHRASE`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` — used by the prod compose file

If `DEPLOY_HOST` is unset the deploy step is skipped — the images are still published.

---

## Production deployment

On the target server (one-time):
```bash
git clone https://github.com/jdsgsdhghs/MY_BANK.git
cd MY_BANK
cp .env.prod.example .env
# edit .env to set secrets
docker compose -f docker-compose.prod.yml up -d
```

On subsequent releases, the CD pipeline runs `scripts/deploy.sh` for you.

---

## Documentation

- [Dossier de conception](docs/dossier-de-conception.md)
- [Journal de développement](docs/journal-de-developpement.md)
- [Plan de tests](docs/plan-de-tests.md)

---

## License

MIT
