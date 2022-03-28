const { MessageEmbed } = require("discord.js");

module.exports = class CommandLogConstructor {
    makeLog(options) {
        return new MessageEmbed()
            .setColor("#58a2b4")
            .setAuthor({ name: options.user.tag, iconURL: options.user.avatarURL() })
            .setTitle(`Ran command \`${options.command}\``)
            .setDescription(options.messageContent)
            .setTimestamp();
    }
};
