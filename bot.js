// TMI is the Twitch Chat API
const tmi = require('tmi.js');
// Axios is an HTTP library
const axios = require('axios');
// fs and ini for config file parsing
var fs = require('fs'), ini = require('ini');
// Chalk for colored text output
const chalk = require('chalk');
// Path for finding the config file when compiled as an exe
const path = require('path');


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

// Build API Endpoint URL
const airtableURL = `https://api.airtable.com/v0/${config.airtable.baseID}/${config.airtable.tableName}`

// Setup axios library for AirTable API calls
const airTableAPI = axios.create({
	baseURL: airtableURL,
});
// Set the authorization header for all requests to use API Key
airTableAPI.defaults.headers.common['Authorization'] = `Bearer ${config.airtable.apiKey}`;

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

	airTableAPI
		.post('', {fields: {[config.airtable.fieldName]: player}})
		.then(res => {
			// Executes when API HTTP status code is "good"
			console.log(`Successfully added ${chalk.bold(res.data.fields.PlayerName)} to AirTable.`)
		})
		.catch(error => {
			// Executes when there is an error including API HTTP status code issues (4xx, 5xx, etc)
			console.error(chalk.red(`AirTable API Error - Response Code: ${error.response.status} | ${error.response.data.error.type}: ${error.response.data.error.message}`))
		})

	return;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
	console.log(chalk.green(`* Connected to ${addr}:${port}`));
}
