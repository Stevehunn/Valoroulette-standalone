# Valoroulette

**English** · [Français](README.fr.md) · [Español](README.es.md)

Valoroulette is a Windows desktop app that randomly selects a VALORANT agent. It includes a spinning pointer, agent exclusions, custom agents, a secret target mode, and GitHub release updates.

## Features

- Spin the pointer to select from available agents.
- Exclude a selected agent, restore individual agents, or reset all exclusions.
- Add custom agents with PNG portraits.
- Optionally guarantee a chosen agent with Secret Mode.
- Check GitHub Releases for updates; available updates download and install automatically.
- Keep settings and custom portraits across app upgrades.

## Requirements

- Windows 10 or later (64-bit)
- Node.js 22.12 or later and npm, for development or building

## Run from source

```powershell
git clone https://github.com/Stevehunn/Valoroulette-standalone.git
cd Valoroulette-standalone
npm ci
npm start
```

## Build the Windows installer

```powershell
npm run dist
```

The NSIS installer and update metadata are written to `dist/`. Install the app with this installer to use in-app updates; older portable builds must first be replaced manually.

## Publish a release

The repository must be public so the app can download release files without a GitHub login. To publish an update:

1. Increase the `version` in `package.json`.
2. Push the change to GitHub.
3. Create and publish a GitHub Release with a matching `v` tag (for example, version `1.2.0` uses tag `v1.2.0`).
4. The `Build Windows release` workflow builds the installer and uploads it, its blockmap, and `latest.yml` to the release.

The version check in the workflow prevents releases with a mismatched tag. Users select **Check for updates** in the app menu; the installer downloads and launches automatically when a newer release is found.

## Project layout

```text
main.js                     Electron main process, persistence, updates, and dialogs
preload.js                  Restricted bridge between the renderer and Electron
src/
  index.html                Main window markup
  renderer.js               Roulette, menu, and UI behavior
  style.css                 Main window styles
data/agents.json            Canonical list of built-in agents
assets/agents/              Built-in agent portraits
.github/workflows/          Release build and upload workflow
```

User settings and custom images are stored in Electron's per-user data directory, not in the installation folder.

## License

ISC. VALORANT and its agents are trademarks of Riot Games; this project is not affiliated with or endorsed by Riot Games.
