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
        try {
            await noblox.setCookie(process.env.cookie);
        } catch (err) {
            console.error(err);
            return Msg.reply("Issue logging into NSGroupOwner. <@360239086117584906>\nRoblox may be down.");
        }

        const args = Context.args;
        const playerName = args[0];
        const reason = Util.verify(Util.combine(args, 1), (self) => {
            return typeof self === "string";
        });
        const errMessage = Util.makeError("There was an issue while trying to gban that user.", [
            "Your argument does not match a valid username.",
            "You mistyped the username.",
        ]);

        const database = mongoClient.db("main");
        const groupBans = database.collection("groupBans");
        const modLogs = database.collection("modLogs");

        let playerId;
        let usingDiscord = false;

        // Discord Mention Support
        const attributes = await Util.getUserAttributes(Msg.guild, args[0]);
        if (attributes.success) {
            const rblxInfo = await Util.getRobloxAccount(attributes.id);
            if (rblxInfo.success) {
                usingDiscord = true;
                playerId = rblxInfo.response.robloxId;
            } else {
                return Msg.reply(`Could not get Roblox account via Discord syntax. Please provide a Roblox username.`);
            }
        }

        if (!playerName || !reason) {
            return Msg.reply("**Syntax Error:** `;gban <username | @user | userId> <reason>`");
        }

        if (!usingDiscord) {
            try {
                playerId = await noblox.getIdFromUsername(playerName);
            } catch (err) {
                console.error(err);
                return Msg.reply(errMessage);
            }
        }

        let rankId;
        try {
            rankId = await noblox.getRankInGroup(config.group, playerId);
        } catch (err) {
            console.error(err);
            return Msg.reply(errMessage);
        }

        if (rankId >= 252) {
            return Msg.reply("Invalid rank! You can only group-ban members ranked below **Moderator**.");
        }

        const currentStat = await groupBans.findOne({ id: playerId });
        const hasModLogs = await modLogs.findOne({ id: playerId });

        if (currentStat) {
            const gbReason = currentStat.reason;
            return Msg.reply(`This user is already banned: **${gbReason}**`);
        }

        let couldExile = true;

        noblox.exile(config.group, playerId).catch(() => {
            couldExile = false;
        });

        const dataForm = Util.makeLogData("Group Ban", `**Executor:** ${Msg.member.user.tag} **Reason:** ${reason} **@ ${Util.getDateNow()}**`);

        if (hasModLogs) {
            const modLogData = hasModLogs.data;
            modLogData.push(dataForm);
            await modLogs
                .updateOne(
                    {
                        id: playerId,
                    },
                    { $set: { data: modLogData } }
                )
                .catch((err) => Msg.reply(`*Error:*\n\`\`\`\n${err}\n\`\`\``));
        } else {
            await modLogs
                .insertOne({
                    id: playerId,
                    data: [dataForm],
                })
                .catch((err) => Msg.reply(`*Error:*\n\`\`\`\n${err}\n\`\`\``));
        }

        groupBans
            .insertOne({
                id: playerId,
                reason: reason,
            })
            .then(() =>
                Msg.reply(
                    // prettier-ignore
                    `Successfully group banned user. ${couldExile ? "" : "\nBy the way, I couldn't exile them. If they weren't in the group originally, this doesn't matter."}`
                )
            )
            .catch((err) => Msg.reply(`*Error:*\n\`\`\`\n${err}\n\`\`\``));
    };
}

module.exports = {
    class: new Command({
        Name: "gban",
        Description: "Bans a user from joining the group.",
        Usage: ";gban <username | @user | userId> <reason>",
        Permission: 5,
    }),
};
