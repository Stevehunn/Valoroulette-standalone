# Valoroulette

[English](README.md) · **Français** · [Español](README.es.md)

Valoroulette est une application de bureau Windows qui sélectionne aléatoirement un agent de VALORANT. Elle propose une flèche animée, l’exclusion d’agents, l’ajout d’agents personnalisés, un mode secret et les mises à jour via GitHub Releases.

L’interface est disponible en anglais, espagnol, français, allemand, portugais, chinois simplifié, japonais, coréen et italien. Choisissez la langue dans le menu ; elle est conservée entre les sessions. Les noms des agents ne sont pas traduits.

## Fonctionnalités

- Lancez la flèche pour sélectionner un agent disponible.
- Filtrez la roulette par un ou plusieurs rôles, ou excluez et réintégrez un rôle entier.
- Excluez l’agent sélectionné, réintégrez des agents individuellement ou réinitialisez toutes les exclusions.
- Ajoutez des agents personnalisés avec une image PNG.
- Activez le mode secret pour garantir l’agent de votre choix.
- Vérifiez les mises à jour GitHub ; les nouvelles versions sont téléchargées et installées automatiquement.
- Conservez les paramètres et images personnalisées après une mise à jour.

## Prérequis

- Windows 10 ou ultérieur (64 bits)
- Node.js 22.12 ou ultérieur et npm pour le développement ou la compilation

## Lancer depuis les sources

```powershell
git clone https://github.com/Stevehunn/Valoroulette-standalone.git
cd Valoroulette-standalone
npm ci
npm start
```

## Créer l’installateur Windows

```powershell
npm run dist
```

L’installateur NSIS et les métadonnées de mise à jour sont générés dans `dist/`. Pour utiliser les mises à jour intégrées, installez l’application avec cet installateur ; les anciennes versions portables doivent d’abord être remplacées manuellement.

## Publier une release

Le dépôt doit être public pour que l’application puisse télécharger les fichiers sans connexion à GitHub. Pour publier une mise à jour :

1. Incrémentez la version dans `package.json`.
2. Envoyez la modification sur GitHub.
3. Créez et publiez une GitHub Release avec un tag `v` correspondant (par exemple, la version `1.2.0` utilise le tag `v1.2.0`).
4. Le workflow `Build Windows release` crée l’installateur et ajoute à la release l’installateur, son fichier blockmap et `latest.yml`.

Le workflow vérifie que le tag correspond à la version. Dans l’application, l’utilisateur choisit **Vérifier les mises à jour** ; si une nouvelle version existe, son installateur est téléchargé et lancé automatiquement.

## Structure du projet

```text
main.js                     Processus principal Electron, stockage, mises à jour et boîtes de dialogue
preload.js                  Pont restreint entre le renderer et Electron
src/
  index.html                Structure de la fenêtre principale
  renderer.js               Roulette, menu et logique de l’interface
  style.css                 Styles de la fenêtre principale
data/agents.json            Liste de référence des agents intégrés
assets/agents/              Portraits des agents intégrés
.github/workflows/          Compilation et publication des releases
```

Les paramètres et images personnalisées sont stockés dans le dossier de données utilisateur d’Electron, et non dans le dossier d’installation.

## Licence

ISC. VALORANT et ses agents sont des marques de Riot Games ; ce projet n’est ni affilié à Riot Games ni approuvé par cette société.
