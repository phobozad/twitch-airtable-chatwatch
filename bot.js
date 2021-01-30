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

// Set default value of update interval to 5 seconds if not configured in INI file
if (!config.airtable.updateIntervalMs) config.airtable.updateIntervalMs = 5000

// Airtable library setup
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


console.log('App starting...use Ctrl+C to quit');
console.log(`AirTable update interval is ${config.airtable.updateIntervalMs} milliseconds`);
console.log(`Twitch Channel is ${config.twitch.channel}`);
console.log(`Bot Username is ${config.twitch.username}`)

// We will buffer players in an array and only push this to Airtables every 5 seconds
var batchedPlayers = [];

// Setup interval for pushing the current batch of players to AirTable
// Use timeouts that get reset after every update to avoid overlapping/duplicate API calls if things get bogged down
setTimeout(batchUpdate,config.airtable.updateIntervalMs);

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
	if (commandName.toLowerCase().includes('!play')) {
		
		//chatClient.say(target, `You rolled a ${num}`);     
		addPlayer(context['display-name']);
	}
}


// Function that will make a REST API call to AirTables to add a player name
function addPlayer (player) {
	console.log(`Adding Player ${chalk.bold(player)} to next update batch`);
	batchedPlayers.push(player);
	return;
}

function batchUpdate() {

	// Only need to push update to AirTables if we have some players pending in the batch queue
	if (batchedPlayers.length > 0)
	{
		// Grab a snapshot of the queue, since it may get changed while we're processing it
		var currentBatch = batchedPlayers;

		// Build our payload to push to the AirTables API
		// This is an array where each item in the array is a row that will be inserted
		// We'll batch things up into a single row where the data is a comma-seprated list of players
		var updateData = [ { "fields": {[config.airtable.fieldName]: currentBatch.join(',')} } ];

		airtableDB(config.airtable.tableName).create(updateData, function(err, records) {
			if (err) {
				// Error
				console.error(chalk.red(`AirTable API Error - ${err}`));
				// Schedule next run for next batch
				setTimeout(batchUpdate,config.airtable.updateIntervalMs);
				return;
			}

			// Success		
			var recordCount = 0;
			records.forEach(function (record) {
				console.log(`Added ${chalk.bold(record.fields[config.airtable.fieldName])} to AirTable.`);
				recordCount += record.fields[config.airtable.fieldName].split(',').length;
			});
			console.log(`Successfully added ${recordCount} players to AirTable.`);

			
		});
		

		// Remove the players from the queue after we fire off the API call
		var remainingBatch = Array.from(batchedPlayers);
		currentBatch.forEach(function (player) {
			var index = remainingBatch.indexOf(player);
			if (index > -1)	remainingBatch.splice(index,1)
		})
		// Update the array with the filtered/cleaned version
		batchedPlayers = remainingBatch;
		
	}

	// Schedule next run for next batch
	setTimeout(batchUpdate,config.airtable.updateIntervalMs);

	return;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
	console.log(chalk.green(`* Connected to ${addr}:${port}`));
}
