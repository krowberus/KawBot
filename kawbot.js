// === Requirements ======================= //
const fs = require('fs');
require('dotenv').config();
const express = require('express');
const EventEmitter = require('events');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, Intents, MessageEmbed, Collection } = require('discord.js');
const { kofi_channel_id, clientId, guildId } = require('./config.json');

const CLIENT_TOKEN = process.env.CLIENT_TOKEN;

// ==========================================================
//            -=[ Client Config ]=-
// ==========================================================

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    ],
});

// ==========================================================
//            -=[ Unhandled Errors ]=-
// ==========================================================

process.on('unhandledRejection', error => console.error('[Uncaught Promise Rejection]:', error));

// ==========================================================
//            -=[ Database Connect ]=-
// ==========================================================

const db = require('./database/database.js');
const kofiTable = require('./database/models/kofiTable.js');

// ==========================================================
//            -=[ Bot Ready Event ]=-
// ==========================================================
client.once('ready', async () => {
	client.user.setActivity('The River Styx', {
		type: ActivityType.Watching,
	});

	try {
		// Authenticate database & initialize models
		await db.authenticate();
		kofiTable.init(db);
		console.log('\x1b[33m[Database]: \x1b[37mModel Init Status: \x1b[32mComplete ✅\n\x1b[33m[Database]: \x1b[37mAuthentication Status: \x1b[32mComplete ✅');

		// Sync the models to the database.
		await db.sync({ force: false });
		console.log('\x1b[33m[Database]: \x1b[37mSync Status: \x1b[32mComplete ✅');
	}
	catch (error) {
		console.error('\x1b[33m[Database]: \x1b[32mLogin Status: Fail ❌ ' + error);
	}

    console.log(`\x1b[36m[Krowism]: \x1b[32mOnline! Flying in the Skies!`);
});

client.on(`guildCreate`, async (guild) => { 
    client.user.setActivity('In The Skies', { type: 'PLAYING' }),
});

// ==========================================================
//            -=[ Join/Leave Messages ]=-
// ==========================================================

client.on('guildMemberAdd', async member => { 
    const { welcomeChannel, infoChannel, rulesChannel } = require('./config.json');

    if (member == client.user) { 
        return;
    }

   const infoChat = member.guild.channels.cache.get(infoChannel);
   const rulesChat = member.guild.channels.cache.get(rulesChannel);

    const welcomeEmbed = new MessageEmbed()
    .setTitle(`**==[** Welcome to the Nest! **]==**`)
    .setColor('#206694')
    .setDescription(`**-=========================-** \n\n :wave: Welcome ${member}! \n\n **-=========================-** \n\n :book: For our rules, check ${rulesChat} \n\n:mega: Keep up-to-date by checking out${infoChat} \n\n **-=========================-**`)

    let joinChannel = member.guild.channels.cache.get(welcomeChannel);

    if (!joinChannel) { 
        return console.log(`Cannot find or access that channel`);
    } else { 
        if (joinChannel) { 
            joinChannel.send({ embeds: [welcomeEmbed] }).catch(error => { 
                console.log(error)
            });
        }
    }

});

client.on('guildMemberRemove', async member => { 
    const { welcomeChannel } = require('./config.json');

    if (member == client.user) { 
        return;
    }

    const leaveEmbed = new MessageEmbed()
    .setTitle(`**==[** Safe Travels, Friendo! **]==**`)
    .setColor('#E74C3C')
    .setDescription(`**-=========================-** \n\n :wave: Take Care, ${member.user.username}! \n\n **-=========================-**`)

    let leaveChannel = member.guild.channels.cache.get(welcomeChannel);

    if (!leaveChannel) { 
        return console.log(`Cannot find that channel`);
    } else { 
        if (leaveChannel) { 
                leaveChannel.send({ embeds: [leaveEmbed] }).catch(error => { 
             console.log(error)
            });
        }
    }

});

// ==========================================================
//                   -=[ Slash Commands ]=-                 
// ==========================================================

client.commands = new Collection();

const slashCommands = [];
const slashCommandFiles = fs.readdirSync('./slashcommands/').filter(file => file.endsWith('.js'));

for (const file of slashCommandFiles) {
	const command = require(`./slashcommands/${file}`);
	slashCommands.push(command.data.toJSON());
    client.commands.set(command.data.name, command);
    console.log(`\x1b[36m[Slash Commands]:\x1b[32m Loaded slash command: /${command.data.name}`)
}
const rest = new REST({ version: '9' }).setToken(CLIENT_TOKEN);

(async () => {
	try {
		console.log('\x1b[36m[Slash Commands]:\x1b[32m Started refreshing application slash commands.');

		await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: slashCommands },
		);

		console.log('\x1b[36m[Slash Commands]:\x1b[32m Successfully reloaded application slash commands.');
	} catch (error) {
		console.error(error);
	}
})();

client.on('interactionCreate', async interaction => { 
    if (!interaction.isCommand()) { 
        return
    };

    const command = client.commands.get(interaction.commandName);

    if (!command) { 
        return
    };

    const { options } = interaction

    try { 
        await command.execute(interaction, options, client);
    } catch (error) { 
        console.error(error); 
        await interaction.reply({ content: `There was an error while using this command!`, ephemeral: true})
    }
});


// ==========================================================
//                  -=[ Ko-Fi Webhooks ]=-
// ==========================================================

const kofiApp = express();
kofiApp.use(express.json());
kofiApp.use(express.urlencoded({ extended: true }));
kofiApp.disable('x-powered-by');

class KofiWebhook extends EventEmitter {
	listen() {
		kofiApp.post('/', async (req, res) => {

			if (req.body.data) {
				req.body = JSON.parse(req.body.data);
			}

			const data = req.body;
			const amount = data.amount;
			const timestamp = data.timestamp;
			const senderName = data.from_name;
			const kofiMessage = data.message;
			const isPublic = data.is_public;
			const type = data.type;
			const transactID = data.kofi_transaction_id;
			const verifyId = data.verification_token;

			const verifyKofiToken = process.env.KOFI_TOKEN;

			if (verifyId !== verifyKofiToken) {
				return res.status(401).end(),
				console.log('[Ko-Fi Webhook]: An invalid token was provided.');
			}


			if (verifyId === verifyKofiToken) {

				res.status(200).end();

				this.emit(
					'donation',
					senderName,
					amount,
					kofiMessage,
					transactID,
					type,
					isPublic,
					timestamp,

				);

				this.emit(
					'subscription',
					senderName,
					amount,
					kofiMessage,
					transactID,
					type,
					isPublic,
					timestamp,
				);

			}

		});

		const kofiport = process.env.KOFI_PORT || 8080;
		kofiApp.listen(kofiport, '0.0.0.0', () => {
			console.log(`\x1b[34m[Ko-Fi Webhook]:\x1b[37m Ko-Fi Online & Listening on: \x1b[32m${kofiport}`);
		});
	}
}

async function logKofi(senderName, amount, kofiMessage, transactID, type, isPublic, timestamp) {

	try {
		timestamp = `<t:${Math.floor(new Date().getTime() / 1000)}>`;

		const kofiChannelID = config.kofiChannelID;
		const kofiChannel = client.channels.cache.get(kofiChannelID);

		if (!kofiChannelID || !kofiChannel) {
			return console.error(!kofiChannelID ? "Ko-Fi Channel ID is not defined in the config." : `Ko-Fi Channel with ID ${kofiChannelID} not found.`);
		}

		const embedColor = {
			Donation: 'Blue',
			Subscription: 'Red',
		};

		if (isPublic == true) {
			const publicEmbed = new EmbedBuilder()
				.setColor(embedColor[type])
				.addFields(
					{ name: ':inbox_tray: __Sender Name__', value: `${senderName}`, inline: true },
					{ name: ':moneybag: __Amount__', value: `$${amount}`, inline: true },
					{ name: ':notepad_spiral: __Message__', value: kofiMessage || '[No Message]', inline: true },
					{ name: ':timer: __Timestamp__', value: `${timestamp}`, inline: true },
					{ name: ':information_source: __Type__', value: `${type}`, inline: true },
					{ name: ':globe_with_meridians: __Source__', value: '[Ko-Fi](https://www.ko-fi.com/krow)', inline: true },
				)
				.setFooter({ text: 'Krow\'s Ko-Fi WebHook', iconURL: 'https://uploads-ssl.webflow.com/5c14e387dab576fe667689cf/5cbee341ae2b8813ae072f5b_Ko-fi_logo_RGB_Outline.png' });
			kofiChannel.send({ embeds: [publicEmbed] });
		}

		if (isPublic == false) {
			const privateEmbed = new EmbedBuilder()
				.setColor(embedColor[type])
				.addFields(
					{ name: ':inbox_tray: __Sender Name__', value: '[Private]', inline: true },
					{ name: ':moneybag: __Amount__', value: '[Private]', inline: true },
					{ name: ':notepad_spiral: __Message__', value: '[Private]', inline: true },
					{ name: ':timer: __Timestamp__', value: `${timestamp}`, inline: true },
					{ name: ':information_source: __Type__', value: `${type}`, inline: true },
					{ name: ':globe_with_meridians: __Source__', value: '[Ko-Fi](https://www.ko-fi.com/krow)', inline: true },
				)
				.setFooter({ text: 'Krow\'s Ko-Fi', iconURL: 'https://uploads-ssl.webflow.com/5c14e387dab576fe667689cf/5cbee341ae2b8813ae072f5b_Ko-fi_logo_RGB_Outline.png' });
			kofiChannel.send({ embeds: [privateEmbed] });
		}
	}
	catch (error) {
		console.log(error);
	}

}

async function onDonation(senderName, amount, kofiMessage, transactID, type, isPublic, timestamp) {
	try {
		await Promise.all([
			logKofi(senderName, amount, kofiMessage, transactID, type, isPublic, timestamp),
			kofiTable.create({
				senderName: senderName,
				amount: amount,
				kofiMessage: kofiMessage,
				transactID: transactID,
				paymentType: type,
				isPublic: isPublic,
				sentTime: timestamp,
			}),
		]);
	}
	catch (error) {
		console.error(`[Ko-Fi Error]: ${error}`);
	}
}

const kofiListener = new KofiWebhook();
kofiListener.listen();
kofiListener.on('donation', onDonation);


// ==========================================================
//             -=[ Bot Login ]=-
// ==========================================================

client.login(CLIENT_TOKEN)
