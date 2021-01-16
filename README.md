# twitch-airtable-chatwatch

## Overview
This app will login to a specific Twitch.tv channel and watch for users entering the `!play` command in chat.

Each user that enters this command will be added to an AirTable that can be used to provide auto-completion of Twitch usernames.

Data will be batched up and pushed into AirTable on a configurable interval (default: 5 seconds).  If there is more than one player that entered `!play` during the interval, the data will be inserted as a single row with multiple comma-separated usernames.

## Installation
### Windows
**Download & double-click to run the pre-compiled version that comes with NodeJS bundled in or run from source using below steps:**

1.	Install NodeJS 14+ from https://nodejs.org/en/ (LTS release reccomended).
	* The "Tools for Native Modules" isn't required to use this app, so this can be left unchecked during installation.
2.	Download the app using a git pull or by downloading a ZIP file of the repo from github and extracting to a folder.
3.	Run the "Node.js command prompt" shortcut that is now in the start menu
	* This just runs `C:\Program Files\nodejs\nodevars.bat` assuming default install location was selected for NodeJS
4.	Navigate in the command prompt to the folder that holds this app
	```
	cd "c:\users\username\downloads\twitch-airtable-chatwatch"
	```
5.	Install the required NodeJS modules (This must be run inside the app's folder)
	```
	npm install
	```
6.	Copy the `settings.ini.example` file to `settings.ini`
7.	Edit the `settings.ini` file and fill in the required info (username, password, API key, table name, etc.)
8.	Start the App (bot.js) using NodeJS
	```
	node bot.js
	```

For subsequent launches, just run the `node bot.js` command to start the app from within the Node.js command prompt.  To simplify this, you could create a batch file that can just be double-clicked to launch.

#### Example startbot.bat (adjust paths to match your environment):
```
cd "c:\users\username\downloads\twitch-airtable-chatwatch"
"C:\Program Files\nodejs\nodevars.bat"
node bot.js
```

## Compiling
```
git clone http://x.x.x.x/twitch-airtable-chatwatch
cd twitch-airtable-chatwatch
npm install
npm install -g pkg
```

On Windows:
```
npm run buildwin
npm run packagewin
```