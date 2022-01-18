const { MessageEmbed } = require("discord.js");

const Util = require("../externals/Util");

class Command {
    constructor(options) {
        for (const k in options) {
            this[k] = options[k];
        }
    }

    fn = async (Msg) => {
        const timeParameters = Util.getTimeParameters(discordClient.uptime);

        let messageEmbed;
        try {
            messageEmbed = new MessageEmbed()
                .setColor("#2f3136")
                .setTitle(`${timeParameters.days}d, ${timeParameters.hours}h, ${timeParameters.minutes}m, ${timeParameters.seconds}s`);
        } catch (err) {
            console.error(err);
            return Msg.channel.send(`**${timeParameters.days}d, ${timeParameters.hours}h, ${timeParameters.minutes}m, ${timeParameters.seconds}s**`);
        }

        return Msg.reply({ embeds: [messageEmbed] });
    };
}

module.exports = {
    class: new Command({
        Name: "uptime",
        Description: "Displays bot uptime.",
        Usage: `;uptime`,
        Permission: 0,
    }),
};
