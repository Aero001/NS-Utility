const Discord = require("discord.js");
const config = require("./config.json");
const fs = require("fs");

const { Client, Intents } = Discord;
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_PRESENCES,
    ],

    partials: ["CHANNEL"],
});

const eventFiles = fs
    .readdirSync(`../src/events/`)
    .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
    const event = require(`../src/events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args));
    } else {
        client.on(event.name, (...args) => event.execute(client, ...args));
    }
}

void client.login(config.token);
