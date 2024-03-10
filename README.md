# Jimmu's Factory Launcher

## What is this?
This is a launcher for the game Minecraft on the Jimmu's Factory's modpack. It is designed to be a simple, easy to use launcher that can be used by anyone.

## How do I use it?
Simply download the latest release from the [releases page](https://github.com/Dragonir44/JFLauncher/releases)

## How do I build it?
1. Clone the repository
2. Run `npm install`
3. Run `npm run buildW`
4. The built files will be in the `dist` folder

## How do I contribute?
1. Fork the repository
2. Make your changes
3. Make a pull request
4. Wait for it to be reviewed
5. If it is accepted, it will be merged into the main branch
6. Your changes will be in the next release

## How do I report a bug?
1. Go to the [issues page](https://github.com/Dragonir44/JFLauncher/issues)
2. Click the "New Issue" button
3. Fill out the form
4. Submit the issue

## How do I request a feature?
1. Go to the [issues page](https://github.com/Dragonir44/JFLauncher/issues)
2. Click the "New Issue" button
3. Fill out the form
4. Submit the issue

## Troubleshooting (generated by Copilote for some of it)
### The launcher won't open
Try running the launcher as an administrator. If that doesn't work, try reinstalling the launcher.

### The launcher won't install the modpack
Try running the launcher as an administrator. If that doesn't work, try reinstalling the launcher.

### The launcher won't update
Try running the launcher as an administrator. If that doesn't work, try reinstalling the launcher.

### The launcher won't launch the game
Try running the launcher as an administrator. If that doesn't work, try reinstalling the launcher.

### The launcher won't download the modpack
Try running the launcher as an administrator. If that doesn't work, try reinstalling the launcher.

### An alert box prevent me to download and install the launcher
This is a security feature of Windows. You can click on "More info" and then "Run anyway" to run the launcher.
The reason why Windows and your browser are blocking the launcher is because it is not signed by a trusted authority, I haven't the found currently to sign the app for the moment (a self signed certificate is badly not enough for Windows).

## QA
### Why is the launcher not signed?
I don't have the funds to sign the launcher. Maybe I will create a patreon or something similar in the future if you want to help me a little bit.

### Why the launcher don't self update?
It's because of the same reason as the previous question, GitHub don't allow to download automatically if the app is not signed.

### Can I use the launcher for my own modpack?
Yes, If you have the knowledge to do it, you can fork the project and change the manifest.json link to your own. You can also change the name of the launcher and the icon, but credit me somewhere in the launcher or in the repo.

## TODO

- [x] Add a way to change the channel of the modpack
- [x] Add java managment
- [x] Create a manifest with news and update infos
  - [x] Add news panel
  - [x] Make news panel dynamic
- [x] Change the way the modpack is installed
  - [x] Change the way the modpack is downloaded
    - [x] Download modpack folder from link
    - [x] Unzip and move in the root folder of the game
- [ ] Add a way to change the version of the modpack
  - [ ] Add a version selector update via manifest
  - [ ] Add a "latest" option to always get the latest version
- [ ] Change the style of the launcher
- [ ] Add a way to manage skins
- [x] Add a way to change the language of the launcher
- [x] Add a ping check to the server
- [x] Add a progress bar
- [x] Hide window when game launched
- [x] Show window when game closed


## Credits
### Inspiration
[ReactMCLauncher by dd060606](https://github.com/dd060606/ReactMCLauncher)

### First base
[SlashDev](https://www.youtube.com/playlist?list=PLVL4NfPFCyboclv5EhQOj-P6rfXNOmNe-)