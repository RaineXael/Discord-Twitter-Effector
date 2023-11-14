const { Client, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config()
prompts = require('prompts')
const token = process.env.BOT_TOKEN // remove this after you've confirmed it is working


async function fetchAllMessages(count, client) {
	const channel = client.channels.cache.get(process.env.CHANNEL_ID);
	let messages = [];

	// Create message pointer
	let message = await channel.messages
		.fetch({ limit: 1 })
		.then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

	while (message) {
		await channel.messages
			.fetch({ limit: count, before: message.id })
			.then(messagePage => {
				messagePage.forEach(msg => messages.push(msg));

				// Update our message pointer to be the last message on the page of messages
				message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
			});
	}

	messages = await messages.map(elem => {
		return elem.content;
	})

	const response = await prompts([
		{
			type: 'confirm',
			name: 'delete',
			message: `Messages changed! Would you like to post the old messages and remove the old ones?`,
		}
	])

	return messages;
}




// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, async (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);

	const response = await prompts([
		{
			type: 'number',
			name: 'count',
			message: `How many messages would you like to change?`,
			initial: 50
		}
	])
	//
	const messages = await fetchAllMessages(response.count, c);
	console.log(messages[1].split('\n'));  
	await console.log(`Bot destroying`);
	await client.destroy();
});

// Log in to Discord with your client's token
client.login(token);


