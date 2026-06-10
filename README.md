# 🎯 Valorant Roulette - Standalone

Une application de roulette des agents Valorant en standalone (exécutable Windows). 

Sélectionnez aléatoirement un agent parmi tous les agents disponibles, avec des fonctionnalités avancées comme l'exclusion d'agents, l'ajout d'agents personnalisés et un mode secret.

![Valorant Roulette](assets/icons/icon.ico)

---

## ✨ Fonctionnalités

- 🎡 **Roulette interactive** : Agents affichés en cercle avec un curseur animé
- 🎲 **Sélection aléatoire** : Animation fluide avec ralentissement progressif
- 🚫 **Système d'exclusion** : Retirez des agents de la roulette et réintégrez-les
- ➕ **Agents personnalisés** : Ajoutez vos propres agents avec nom et image PNG
- 🔒 **Mode secret** : Activez un mode garantissant un agent spécifique avec un raccourci clavier : Ctrl + Shift + A
- 💾 **Sauvegarde automatique** : L'état est conservé entre les sessions
- 🖼️ **Affichage du gagnant** : L'agent sélectionné s'affiche en grand au centre

---

## 📋 Prérequis

- **Node.js** (version 18 ou supérieure)
- **npm** (installé avec Node.js)
- **Git** (optionnel, pour cloner le projet)

---

## 🚀 Installation

### 1. Cloner le projet


```bash
git clone https://github.com/votre-username/Valoroulette-standalone.git
cd Valoroulette-standalone
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Lancer l'application en développement

```bash
npm start
```

## Executable

# Installer electron-packager (si pas déjà fait)

```bash
npm install electron-packager --save-dev
```

# Créer l'exécutable

```bash
npm run pack
```

------------------------------------------------------------------

### Info sur le Projet

# Structure du Projet

Valoroulette-standalone/
├── main.js                      # Processus principal Electron
├── preload.js                   # Pont sécurisé IPC
├── package.json                 # Configuration Node/Electron
├── README.md                    # Documentation
├── .gitignore                   # Fichiers ignorés par Git
│
├── assets/
│   ├── agents/                  # Images des agents (PNG)
│   │   ├── Jett.png
│   │   ├── Phoenix.png
│   │   └── ...
│   ├── custom/                  # Images des agents personnalisés
│   └── icons/                   # Icône de l'application
│       └── icon.ico
│
├── data/
│   └── agents.json              # Liste des agents par défaut
│
└── src/
    ├── index.html               # Interface principale
    ├── style.css                # Styles de l'application
    ├── renderer.js              # Logique de la roulette
    ├── secret.html              # Fenêtre du mode secret
    └── secret.js                # Logique du mode secret


# 🛠️ Technologies utilisées
Electron : Framework pour applications desktop

Canvas API : Rendu graphique de la roulette

Electron Packager : Création d'exécutables

Electron Builder : Packaging et distribution

# Commande

Commande	    Description
npm start	    Lance l'application en développement
npm run pack	Crée un exécutable portable avec Electron Packager
npm run dist	Crée un exécutable avec Electron Builder

# 📄 Licence
ISC License