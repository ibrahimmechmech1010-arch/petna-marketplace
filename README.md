# Petna — Marketplace animalier

Marketplace en français pour la découverte d'animaux à adopter, les produits pour animaux, les services locaux et les conseils de soin. Les pages peuvent utiliser Supabase lorsqu'un projet est configuré ; elles gardent le contenu de démonstration en son absence.

## Lancer le prototype

Ouvrez `index.html` dans un navigateur. Aucune installation ni étape de compilation n'est nécessaire.

## Pages

- `index.html` — accueil et découverte du projet
- `adoption.html` — annonces et formulaires d'intérêt simulés
- `boutique.html` — catalogue, panier et commande de démonstration
- `services.html` — annuaire de professionnels fictifs
- `conseils.html` — articles de démonstration
- `admin.html` — tableau de bord de gestion en mode démonstration

Sans configuration Supabase, les interactions utilisent des données fictives. Les commandes, paiements, contacts et demandes d'adoption ne sont alors pas transmis à un service réel.

La page d’administration fonctionne en mode local tant que Supabase n'est pas configuré. Dans ce mode, ses ajouts, modifications et statuts sont enregistrés uniquement dans le navigateur. Une fois Supabase configuré, l'accès administrateur utilise Supabase Auth et les changements passent par les politiques RLS.

## Supabase

- Le schéma initial, les politiques Row Level Security et les tables d'annonces, catalogue, professionnels, articles, demandes et commandes se trouvent dans `supabase/migrations/`.
- Le contenu public de démonstration est dans `supabase/seed.sql`. Il utilise uniquement des commandes LMD (`INSERT ... ON CONFLICT`) et des identifiants fixes pour éviter les doublons.
- Le projet est préparé dans `supabase/config.toml`. Créez ou connectez un projet Supabase, liez le dépôt avec le CLI, puis appliquez la migration avec `supabase db push`.
- Remplissez `url` et `publishableKey` dans `js/supabase-config.js` à partir des paramètres API du projet. La clé publishable est destinée au navigateur et reste limitée par RLS. N'utilisez jamais une clé `secret` ou `service_role` dans le site.
- Créez le compte initial dans Supabase Auth, puis attribuez-lui le rôle admin depuis le SQL Editor : `update public.profiles p set role = 'admin' from auth.users u where p.id = u.id and u.email = 'VOTRE_EMAIL';`. La migration `20261102120000_allow_admin_bootstrap.sql` permet cette promotion initiale depuis le SQL Editor.
- Le catalogue public lit les entrées publiées. Les formulaires adoption et partenariat créent des demandes dans Supabase lorsqu'il est configuré. Le paiement et la création de commandes restent simulés.

Le navigateur charge `supabase-js` depuis jsDelivr uniquement lorsque l'URL et la clé publishable sont renseignées.

Pour un nouveau projet de démonstration, `supabase db push --include-seed` applique les migrations puis insère les contenus d’exemple. N’utilisez pas ce jeu de démonstration pour remplacer les données d’un site en production.

## Déploiement

Site statique : publiez la racine du dépôt sur Netlify, sans commande de build. Le point d'entrée est `index.html`.
