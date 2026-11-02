# Valoroulette

[English](README.md) · [Français](README.fr.md) · **Español** · [Changelog](CHANGELOG.md)

Valoroulette es una aplicación de escritorio para Windows que selecciona aleatoriamente un agente de VALORANT. Incluye una flecha animada, exclusión de agentes, agentes personalizados, un modo secreto y actualizaciones mediante GitHub Releases.

La interfaz está disponible en inglés, español, francés, alemán, portugués, chino simplificado, japonés, coreano e italiano. Elige el idioma en el menú; se guardará para próximas sesiones. Los nombres de los agentes no se traducen.

## Funciones

- Gira la flecha para elegir entre los agentes disponibles.
- Filtra la ruleta por uno o varios roles, o excluye y restaura un rol completo.
- Excluye al agente seleccionado, restaura agentes individualmente o restablece todas las exclusiones.
- Añade agentes personalizados con retratos PNG.
- Activa el modo secreto para garantizar el agente que elijas.
- Comprueba si hay actualizaciones en GitHub; las nuevas versiones se descargan e instalan automáticamente.
- Conserva la configuración y las imágenes personalizadas tras actualizar la aplicación.

## Requisitos

- Windows 10 o posterior (64 bits)
- Node.js 22.12 o posterior y npm para desarrollar o compilar

## Ejecutar desde el código fuente

```powershell
git clone https://github.com/Stevehunn/Valoroulette-standalone.git
cd Valoroulette-standalone
npm ci
npm start
```

## Crear el instalador de Windows

```powershell
npm run dist
```

El instalador NSIS y los metadatos de actualización se generan en `dist/`. Para usar las actualizaciones integradas, instala la aplicación con este instalador; primero tendrás que sustituir manualmente las versiones portátiles antiguas.

## Publicar una release

El repositorio debe ser público para que la aplicación pueda descargar los archivos sin iniciar sesión en GitHub. Para publicar una actualización:

1. Aumenta la versión en `package.json`.
2. Envía el cambio a GitHub.
3. Crea y publica una GitHub Release con una etiqueta `v` que coincida (por ejemplo, la versión `1.2.0` usa la etiqueta `v1.2.0`).
4. El workflow `Build Windows release` compila el instalador y sube a la release el instalador, su archivo blockmap y `latest.yml`.

El workflow comprueba que la etiqueta coincida con la versión. En la aplicación, el usuario selecciona **Buscar actualizaciones**; si hay una versión nueva, el instalador se descarga y se inicia automáticamente.

## Estructura del proyecto

```text
main.js                     Proceso principal de Electron, almacenamiento, actualizaciones y diálogos
preload.js                  Puente restringido entre el renderer y Electron
src/
  index.html                Estructura de la ventana principal
  renderer.js               Ruleta, menú y lógica de la interfaz
  style.css                 Estilos de la ventana principal
data/agents.json            Lista de referencia de agentes integrados
assets/agents/              Retratos de agentes integrados
.github/workflows/          Compilación y publicación de releases
```

La configuración y las imágenes personalizadas se guardan en la carpeta de datos de usuario de Electron, no en la carpeta de instalación.

## Licencia

ISC. VALORANT y sus agentes son marcas registradas de Riot Games; este proyecto no está afiliado ni cuenta con el respaldo de Riot Games.
