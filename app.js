const { Client, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config()
prompts = require('prompts')
const token = process.env.BOT_TOKEN 

async function postAllMessages(client, messages){
	const channel = client.channels.cache.get(process.env.CHANNEL_ID_OUTPUT);
	const allMessages = []

	//split all messages and process to string
	messages.forEach(message => {
		const processedMessage = message.content.split('\n');
		processedMessage.forEach(subMessage =>{
			//console.log(subMessage + ' -- ' + replaceX(subMessage));
			allMessages.push(replaceX(subMessage));
		})
		
	});

	const response = await prompts([
		{
			type: 'confirm',
			name: 'reverse',
			message: `Would you like the messages to be posted oldest-first?`,
		},
	
	]);

	//reverse message order so that oldest messages
	//are posted first
	if(response.reverse){
		allMessages.reverse()
	}


	//make strings into promise array to be Promise.all'd
	messagePromises = allMessages.map(content => {
		return channel.send(content);
	})

	await Promise.all(messagePromises);
}

function replaceX(message){
	if(!message.includes('fxtwitter.com'))
	{
		replacedLink = message.replace('twitter.com', 'fxtwitter.com').replace('x.com', 'fxtwitter.com');
		return replacedLink;
	}
	return message;
}

async function fetchAllMessages(client) {

	const channel = client.channels.cache.get(process.env.CHANNEL_ID_INPUT);
	if(channel === undefined){
		throw new Error('Channel is undefined, give a valid accessible Channel ID in the .env file.')
	}
	let messages = [];

	// Create message pointer
	let message = await channel.messages
		.fetch({ limit: 1 })
		.then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

	while (message) {
		await channel.messages
			.fetch({ limit: 100, before: message.id })
			.then(messagePage => {
				messagePage.forEach(msg => messages.push(msg));

				// Update our message pointer to be the last message on the page of messages
				message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
			});
	}

	//filter out the non link texts and separate the other links

	messages = messages.filter((message) => {
		//remove all texts including fxtwtter.com
		return !message.content.includes("//fxtwitter.com");
	});

	messages = messages.filter((message) => {
		// Keep messages that include "//twitter.com" or "//x.com"
		return message.content.includes("//twitter.com") || message.content.includes("//x.com");
	});

	return messages;

}

async function deleteOldMessages(messages){
	console.log('Deleting all messages!')
	deletionPromises = messages.map(message => message.delete());
	await Promise.all(deletionPromises);
	console.log('Deleting all done!')
}

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, async (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
	console.log('Fetching posts...')
	
	try{
		const messages = await fetchAllMessages(c);
		//console.log(messages);
		const response = await prompts([
			{
				type: 'confirm',
				name: 'post',
				message: `${messages.length} messages found! Would you like to post the old messages in the CHANNEL_ID_OUTPUT channel?`,
			},
			{
				type: (prev) => prev ? 'confirm' : null,
				//type:'confirm',
				name: 'delete',
				message: `Would you like to delete the old links?`,
			},
		]);
		
		if (response.post === true){
			await postAllMessages(client,messages);
			if (response.delete === true){
				await deleteOldMessages(messages)
			}
		}  
		
		
		
	}
	catch (error){
		console.error('An error occoured in fetching the messages: ' + error)
	}
	finally{
		await console.log(`Bot destroying`);
		await client.destroy();
	}
	
	
});

// Log in to Discord with your client's token
client.login(token);