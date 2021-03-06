/*global SyntaxBuilder, Util, config, process*/
/*eslint no-undef: "error"*/

require("dotenv").config();

const RemoteInteraction = require("../modules/RemoteInteraction");

const noblox = require("noblox.js");

class Command {
    constructor(options) {
        for (const k in options) {
            this[k] = options[k];
        }
    }

    fn = async (msg, Context) => {
        const SyntaxErr = () => {
            return msg.reply(`**Syntax Error:** \`${this.Usage}\``);
        };

        try {
            await noblox.setCookie(process.env.cookie);
        } catch (err) {
            console.error(err);
            return msg.reply("Issue logging into NSGroupOwner. <@360239086117584906>\nRoblox may be down.");
        }

        const args = Context.args;
        const playerName = args[0];
        const errMessage = Util.makeError("There was an issue while trying to exile that user.", [
            "Your argument does not match a valid username.",
            "You mistyped the username.",
            "The user is not in the group.",
        ]);

        let playerId;

        if (!playerName || args.length > 1) {
            return SyntaxErr();
        }

        // Discord Mention Support
        const attributes = await Util.getUserAttributes(msg.guild, args[0]);
        if (attributes.success) {
            const rblxInfo = await RemoteInteraction.getRobloxAccount(attributes.id);
            if (rblxInfo.success) {
                playerId = rblxInfo.response.robloxId;
            } else {
                return msg.reply(`Could not get Roblox account via Discord syntax. Please provide a Roblox username.`);
            }
        }

        // ID Support
        if (args[0].includes("#") && !attributes.success) {
            playerId = Util.parseNumericalsAfterHash(args[0])[0];
            if (isNaN(parseInt(playerId))) {
                return SyntaxErr();
            }
        }

        if (!playerId) {
            try {
                playerId = await noblox.getIdFromUsername(playerName);
            } catch (err) {
                console.error(err);
                return msg.reply(errMessage);
            }
        }

        let rankId;
        try {
            rankId = await noblox.getRankInGroup(config.group, playerId);
        } catch (err) {
            console.error(err);
            return msg.reply(errMessage);
        }

        if (rankId >= 252) {
            return msg.reply("Invalid rank! You can only exile members ranked below **Moderator**.");
        }

        noblox
            .exile(config.group, playerId)
            .then(() => msg.reply(`Exiled user from group successfully.`))
            .catch(() => msg.reply(errMessage));
    };
}

module.exports = {
    class: new Command({
        Name: "exile",
        Description: "Exiles a user from the Roblox group.",
        Usage: SyntaxBuilder.classifyCommand({ name: "exile" }).makeRegular("User").endBuild(),
        Permission: 5,
        Group: "Remote",
    }),
};
