/*global SyntaxBuilder, config, Util, discordClient*/
/*eslint no-undef: "error"*/

const { MessageEmbed } = require("discord.js");

class Command {
    constructor(options) {
        for (const k in options) {
            this[k] = options[k];
        }
    }

    fn = async (msg) => {
        const timeParameters = Util.getTimeParameters(discordClient.uptime);

        let messageEmbed;
        try {
            messageEmbed = new MessageEmbed()
                .setColor("#256ab4")
                .setTitle("NS Utility")
                .setDescription("An ease of use bot application which interacts with the Roblox API.")
                .addFields(
                    {
                        name: "Developer",
                        value: "<@360239086117584906>",
                        inline: true,
                    },
                    {
                        name: "Library",
                        value: "discord.js",
                        inline: true,
                    },
                    {
                        name: "Source",
                        value: "[GitHub](https://github.com/Aerosphia/NS-Utility)",
                        inline: true,
                    },
                    {
                        name: "Version",
                        value: config.version,
                        inline: true,
                    },
                    {
                        name: "Group",
                        value: "[Roblox](https://www.roblox.com/groups/8046949/NEXT-SATURDAY#!/about)",
                        inline: true,
                    },
                    {
                        name: "Discord",
                        value: "[Invite](https://discord.gg/SHRuvXcpMc)",
                        inline: true,
                    },
                    {
                        name: "Uptime",
                        value: `${timeParameters.days}d, ${timeParameters.hours}h, ${timeParameters.minutes}m, ${timeParameters.seconds}s`,
                    },
                    {
                        name: "Contributors",
                        value: "<@478849686267232256>, <@816041207113187348>, <@310879289786761216>, <@113691352327389188>",
                    }
                )
                .setTimestamp()
                .setFooter({ text: `Requested by ${msg.member.user.tag}` });
        } catch (err) {
            console.error(err);
            return msg.channel.send("There was an issue generating the embed.");
        }

        return msg.channel.send({ embeds: [messageEmbed] });
    };
}

module.exports = {
    class: new Command({
        Name: "about",
        Description: "Gives bot information.",
        Usage: SyntaxBuilder.classifyCommand({ name: "about" }).endBuild(),
        Permission: 0,
        Group: "General",
    }),
};
