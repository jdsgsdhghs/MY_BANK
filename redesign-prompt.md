<role>
Tu es un Lead Product Designer + ingénieur front-end senior, spécialisé dans les
interfaces de FINTECH et de BANQUE EN LIGNE. Tu as conçu des produits comme des
néobanques et des dashboards financiers. Tu maîtrises React, TypeScript et le CSS
moderne, et tu livres du code prêt à coller en production — pas des maquettes
théoriques. Ton goût : sobre, premium, rassurant, ultra-lisible.
</role>

<context>
Application : "MyBank", une web-app de gestion de finances personnelles (suivi des
revenus et dépenses, catégories, profil, administration des utilisateurs).
Je veux une REFONTE COMPLÈTE du design du front, SANS casser l'architecture technique.

Stack actuelle — à CONSERVER strictement :
- React 18 + TypeScript + Vite
- React Router 6 (routing par pages, voir App.tsx ci-dessous)
- CSS pur : un fichier global.css avec des variables CSS (:root) + un .css par
  composant/page. AUCUN framework UI (pas de Tailwind / MUI / Bootstrap / styled-
  components). Reste sur du CSS vanilla avec variables custom.
- Police actuelle : Inter via Google Fonts (tu peux en proposer une autre si elle
  est chargeable via Google Fonts).
- Backend REST consommé via un client `api` (fetch + JWT Bearer). NE PAS toucher
  aux appels API, aux routes, ni aux noms de props/handlers/états.
</context>

<banking_design_principles>
Cette app gère de l'argent : le design doit inspirer CONFIANCE et SÉCURITÉ, pas
faire "gadget". Applique impérativement ces principes propres au secteur bancaire :

1. CONFIANCE & SOBRIÉTÉ — esthétique calme et institutionnelle. Réduis les dégradés
   criards et les animations superflues. Mouvements discrets, jamais ludiques.
2. LISIBILITÉ DES MONTANTS (priorité n°1) — chiffres en `font-variant-numeric:
   tabular-nums`, alignés à droite, hiérarchie typographique forte. Signe +/-
   explicite, jamais la couleur seule. Crédit vs débit lisibles aussi en niveaux de
   gris (daltonisme). Devise formatée proprement (€).
3. DENSITÉ MAÎTRISÉE — un relevé d'opérations doit rester lisible avec beaucoup de
   lignes : lignes nettes, zébrage discret ou séparateurs fins, en-têtes ancrés.
4. SÉCURITÉ VISIBLE — sur les écrans sensibles (login, mot de passe, profil, admin),
   renforce les signaux de sécurité (libellés clairs, états de validation, messages
   d'erreur explicites mais non alarmistes).
5. ACCESSIBILITÉ NIVEAU BANCAIRE — contraste AA minimum (AAA visé sur les montants
   et le texte courant), focus visibles au clavier, labels reliés, cibles tactiles
   ≥ 44px, `prefers-reduced-motion` respecté.
6. HIÉRARCHIE & ÉTATS — soigne les états vides ("aucune opération"), chargements
   (skeletons plutôt que "Loading..."), succès/erreur. Un produit bancaire ne laisse
   jamais l'utilisateur dans le doute.
7. DARK MODE — fournis un thème clair ET un thème sombre via variables CSS
   (`@media (prefers-color-scheme: dark)`), car la lisibilité financière de nuit
   compte. Le dark mode doit garder les mêmes garanties de contraste.
</banking_design_principles>

<current_source_code>
Voici le code RÉEL et COMPLET du front actuel. C'est ta source de vérité : ne
suppose rien au-delà de ces fichiers, n'invente aucun écran ni aucune fonctionnalité.

=== src/App.tsx (routing — NE PAS MODIFIER la logique) ===
Routes : /login, /register (publics) ; sous Layout protégé : /operations (défaut),
/categories, /profile, /users (admin seulement). Redirections : index -> /operations,
non-admin sur /users -> /operations, catch-all -> /.

=== src/api/client.ts (entités — pour info, NE PAS MODIFIER) ===
Operation { id:number; label:string; amount:string; date:string;
            category:{id:number;title:string}|null }
Category  { id:number; title:string }
AdminUser { id:number; email:string; roles:string[] }
Profile   { id:number; email:string; roles:string[] }
api.get/post/put/delete vers VITE_API_URL (def http://localhost:8080/api), JWT Bearer.

=== src/components/Layout.tsx ===
Header sticky : brand (carré "M" + "MyBank"), nav NavLink (Operations, Categories,
Users[admin], Profile) avec classe "active", bouton "Log out" (.btn-ghost).
<main className="container"><Outlet/></main>.

=== src/styles/global.css (DESIGN SYSTEM à réécrire) ===
@import Inter. Variables :root :
--color-primary #4f46e5 / --color-primary-dark #4338ca / --color-secondary #06b6d4 /
--color-accent #f59e0b / --color-text #0f172a / --color-text-muted #64748b /
--color-bg #f1f5f9 / --color-surface #fff / --color-border #e2e8f0 /
--color-danger #ef4444 / --color-success #10b981 / --color-warning #f59e0b.
Gradients (primary indigo->violet->cyan, card, success, danger). Radius 8/14/20/28.
Shadows sm/md/lg/glow. Transitions fast/base.
Classes globales fournies : button + .btn-primary/.btn-secondary/.btn-ghost/.btn-danger,
input/select/textarea (focus glow), .card, .container (max 1200px), .field + label
(uppercase, muted), .alert/.alert-error/.alert-success, keyframes slideDown/fadeIn.

=== Écrans (résumé fidèle du rendu actuel) ===
- Login / Register (Auth.css) : .auth-shell plein écran avec dégradé animé +
  halos radiaux ; .auth-card centrée (max 440px, glassmorphism, radius xl) ;
  brand "M" + h1 MyBank ; sous-titre ; formulaire email + password ; bouton pleine
  largeur ; lien bas de carte. Register ajoute validation min 8 caractères.
- Operations (Operations.css) : .page-header avec titre en dégradé + carte .summary
  "Net total" (dégradé primaire, gros chiffre). Carte formulaire (label, montant
  number, date, select catégorie) en grille responsive 2fr/1fr/1fr/1fr. Carte
  "History" : tableau (Date, Label, Category, Amount aligné droite coloré
  vert/rouge, actions Edit/Delete via composant TouchableOpacity). États
  loading / vide. Titres de carte avec barre dégradée ::before.
- Categories (Categories.css) : page-header (titre dégradé cyan), carte formulaire
  (titre), carte liste (puces dégradées, hover translateX, actions Edit/Delete).
- Profile (Profile.css) : page-header, carte max 520px, badge rôle (Admin/User),
  formulaire email + nouveau mdp + confirmation + mot de passe actuel (séparés par
  <hr>), bouton "Save changes" avec état submitting. Alertes erreur/succès.
- Users / admin (Users.css) : page-header, carte formulaire (email, password,
  checkbox Administrator) grille 4 colonnes desktop, carte liste utilisateurs
  (email + badges Admin/User/"You", hover translateX, actions Edit/Delete ;
  Delete désactivé sur soi-même).
- TouchableOpacity (composant bouton réutilisable) : variants primary/danger/ghost,
  effet d'opacité au press + scale(0.96) actif, focus-visible. UTILISÉ dans les
  listes/tableaux — conserve ses variants et son API.

NOTE : si tu veux le contenu intégral d'un fichier .tsx ou .css précis, demande-le
moi et je te le colle ; ne devine pas ce qui n'est pas décrit ici.
</current_source_code>

<references>
Direction de goût visée (inspiration, pas copie) : la sobriété premium de Stripe
Dashboard et Linear, la clarté des montants de Revolut / N26 / Qonto. Objectif :
"banque privée moderne" — épuré, typographie soignée, confiance avant l'esbroufe.
</references>

<task>
Refonds l'ensemble du design en respectant TOUS les principes bancaires ci-dessus.
Tu ne changes QUE le rendu et le style — jamais la logique, les routes, les appels
API, ni les noms de classes utilisés dans le TSX (sauf à les renommer de façon
cohérente dans le .tsx ET le .css en même temps).

Livrables attendus, dans CET ordre :
1. Une nouvelle DIRECTION ARTISTIQUE (mood + justification "pourquoi ça inspire
   confiance pour une banque").
2. Le nouveau global.css COMPLET : palette claire + sombre via variables, typo,
   radius, ombres, boutons, inputs, cards, alerts, badges, states. Commenté.
3. La refonte écran par écran : pour chacun, le .css réécrit (et le .tsx seulement
   si le markup doit évoluer — ex. skeletons, états vides, structure du tableau),
   en gardant la même logique et les mêmes handlers.
</task>

<constraints>
- Stack figée : React 18 + Vite + CSS pur + variables CSS. Rien d'autre.
- N'invente aucun écran, donnée ou fonctionnalité hors du périmètre fourni.
- Préserve l'accessibilité (labels, aria-live sur alertes, focus, contrastes).
- Responsive mobile-first, breakpoints cohérents (≈ 600 / 768 / 1024px).
- Respecte prefers-reduced-motion et prefers-color-scheme.
- Si une information te manque pour bien faire, POSE-MOI LA QUESTION avant de coder.
</constraints>

<deliverable_format>
Étape 1 — propose 3 directions artistiques distinctes adaptées à une banque :
juste, pour chacune, un NOM, une phrase de mood, et la PALETTE en hex (clair + sombre).
ARRÊTE-TOI là et attends que je choisisse.
Étape 2 — une fois mon choix donné, produis le global.css en artifact, puis chaque
écran un par un, dans des artifacts séparés. N'écris pas tout le code d'un seul coup.
Critères de réussite que tu dois viser : contraste AA/AAA, montants en tabular-nums,
dark mode complet, états vides + skeletons, zéro régression de logique.
</deliverable_format>
</content>
</invoke>
