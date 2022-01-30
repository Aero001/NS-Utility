require("dotenv").config();

const noblox = require("noblox.js");
const Util = require("../externals/Util");

class Command {
    constructor(options) {
        for (const k in options) {
            this[k] = options[k];
        }
    }

    fn = async (Msg, Context) => {
        const SyntaxErr = () => {
            return Msg.reply(`**Syntax Error:** \`${this.Usage}\``);
        };

        try {
            await noblox.setCookie(process.env.cookie);
        } catch (err) {
            console.error(err);
            return Msg.reply("Issue logging into NSGroupOwner. <@360239086117584906>\nRoblox may be down.");
        }

        const args = Context.args;
        const playerName = args[0];
        const errMessage = Util.makeError("There was an issue while trying to get asset information on that user.", [
            "Your argument does not match a valid username.",
            "You mistyped the username.",
        ]);

        let playerId;

        if (!playerName || args.length > 1) {
            return SyntaxErr();
        }

        // Discord Mention Support
        const attributes = await Util.getUserAttributes(Msg.guild, args[0]);
        if (attributes.success) {
            const rblxInfo = await Util.getRobloxAccount(attributes.id);
            if (rblxInfo.success) {
                playerId = rblxInfo.response.robloxId;
            } else {
                return Msg.reply(`Could not get Roblox account via Discord syntax. Please provide a Roblox username.`);
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
                return Msg.reply(errMessage);
            }
        }

        let ownership;
        try {
            ownership = await noblox.getOwnership(playerId, 13375778, "GamePass");
        } catch (err) {
            console.error(err);
            return Msg.reply(errMessage);
        }

        return Msg.reply(ownership ? "This user owns NS VIP." : "Not owned, or their inventory is private.");
    };
}

module.exports = {
    class: new Command({
        Name: "isvip",
        Description: "Returns a yes/no answer on if the user provided has the NS VIP gamepass or not.",
        Usage: ";isvip <User>",
        Permission: 2,
    }),
};
