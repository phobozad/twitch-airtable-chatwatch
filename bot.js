// TMI is the Twitch Chat API
const tmi = require('tmi.js');
// fs and ini for config file parsing
var fs = require('fs'), ini = require('ini');
// Chalk for colored text output
const chalk = require('chalk');
// Path for finding the config file when compiled as an exe
const path = require('path');
// Airtable Library
var Airtable = require('airtable');


// For pkg binary building
// From: https://github.com/rocklau/pkg-puppeteer/blob/master/index.js
const isPkg = typeof process.pkg != 'undefined';

// Pull in configuration from settings.ini file in the same folder as executable if we are running as a pkg-compiled *.exe
// Need this to support double-click of the *.exe since working directory isn't set correctly in that case
if(isPkg)
	var configFile = path.join(path.dirname(process.execPath), 'settings.ini');
else
	var configFile = './settings.ini';
var config = ini.parse(fs.readFileSync(configFile, 'utf-8'))

// Airtable
var airtableDB = new Airtable({apiKey: config.airtable.apiKey}).base(config.airtable.baseID);

// Setup twitch settings
const twitchChatSettings = {
	identity: {
		username: config.twitch.username,
		password: config.twitch.password
	},
	channels: [
		config.twitch.channel
	]
};


console.log('App starting...use Ctrl+C to quit')

// Create a Twitch Chat client with our options
const chatClient = new tmi.client(twitchChatSettings);

// Register our event handlers (defined below)
chatClient.on('message', onMessageHandler);
chatClient.on('connected', onConnectedHandler);

// Connect to Twitch:
chatClient.connect();


// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
	if (self) { return; } // Ignore messages from the bot

	// Remove whitespace from chat message
	const commandName = msg.trim();
	
	// Debug line to see all the info we get with the message
	//console.log(`Context: ${JSON.stringify(context)}`)

	// If the command is known, let's execute it
	if (commandName.includes('!play')) {
		
		//chatClient.say(target, `You rolled a ${num}`);     
		addPlayer(context['display-name']);
	}
}


// Function that will make a REST API call to AirTables to add a player name
function addPlayer (player) {
	console.log(`Adding Player ${chalk.bold(player)}`);

	airtableDB(config.airtable.tableName).create([{"fields": {[config.airtable.fieldName]: player}}], function(err, records) {
		if (err) {
			// Error
			console.error(chalk.red(`AirTable API Error - ${err}`));
			return;
		}

		// Success
		records.forEach(function (record) {
			console.log(`Added ${chalk.bold(record.fields[config.airtable.fieldName])} to AirTable.`);
		});
		console.log(`Successfully added ${records.length} players to AirTable.`)
	});

	return;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
	console.log(chalk.green(`* Connected to ${addr}:${port}`));
}
