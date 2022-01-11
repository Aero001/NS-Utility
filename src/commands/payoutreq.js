require("dotenv").config();

const { MessageActionRow, MessageButton } = require("discord.js");

const noblox = require("noblox.js");
const Util = require("../modules/Util");

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
        const amt = parseInt(args[0]);
        const reason = Util.combine(args, 1);

        const errMessage = Util.makeError("There was an issue while trying to submit a payout request.", [
            "Your argument does not match a valid amount.",
            "There was an unexpected internal error.",
        ]);
        const errMessageAdmin = Util.makeError("There was an issue while trying to payout this user.", [
            "The user is not in the group.",
            "The user does not meet the minimum age requirement. (you cannot payout new users!)",
            "The group does not have enough funds.",
        ]);

        let playerId;
        let playerName;

        const rblxInfo = await Util.getRobloxAccount(Msg.author.id);
        if (rblxInfo.success) {
            playerId = rblxInfo.response.robloxId;
        } else {
            return Msg.reply(`Could not get Roblox account. If you're not verified with RoVer, please do so via the \`!verify\` command and try again.`);
        }

        if (!amt || typeof amt !== "number" || !reason) {
            return Msg.reply("**Syntax Error:** `;payoutreq <amount> <reason>`");
        }

        if (amt > 3000) {
            return Msg.reply("Too high amount to request.");
        } else if (amt < 1) {
            return Msg.reply("Too low amount; payout amount must be greateDr than 0.");
        }

        try {
            playerName = await noblox.getUsernameFromId(playerId);
        } catch (err) {
            console.error(err);
            return Msg.reply(errMessage);
        }

        const logChannel = await Util.getChannel(Msg.guild, "930350546232147998");
        if (!logChannel) {
            return Msg.reply("I couldn't retrieve proper configuration channels.");
        }

        const row = new MessageActionRow().addComponents(
            new MessageButton().setCustomId("accept").setLabel("Accept").setStyle("SUCCESS"),
            new MessageButton().setCustomId("decline").setLabel("Decline").setStyle("DANGER")
        );

        const filter = (i) => Util.hasRole(i.member, "851082141235937300");
        const collector = logChannel.createMessageComponentCollector({
            filter,
            time: 8.64e7,
        });

        const msgContent = `@everyone, New payout request from **${playerName}** (${Msg.member.user.tag} :: ${Msg.author.id}):\n**R$:** ${Util.sep(
            amt
        )}\n**Reason:** ${reason}\n**Accepting this request is stricly irreversible.**\nThis request will expire in 24 hours if no option is selected.`;

        const main = await logChannel.send({
            content: msgContent,
            components: [row],
        });

        collector.on("collect", (i) => {
            if (i.customId === "accept") {
                noblox
                    .groupPayout(config.group, playerId, amt)
                    .then(() => {
                        collector.stop();
                        Msg.author.send(`Your payout request was accepted. **R$${Util.sep(amt)}** has been credited into your account.`).catch(() => {});
                        return main.edit({
                            content: `@everyone, Payout request from **${playerName}** accepted by <@${i.member.id}> (${i.member.user.tag} :: ${i.member.id})`,
                            components: [],
                        });
                    })
                    .catch((err) => {
                        collector.stop();
                        console.error(err);
                        return main.edit({
                            content: errMessageAdmin,
                            components: [],
                        });
                    });
            } else if (i.customId === "decline") {
                collector.stop();
                Msg.author.send("Your payout request was declined. No robux have been credited into your account.").catch(() => {});
                return main.edit({
                    content: `@everyone, Payout request from **${playerName}** declined by <@${i.member.id}> (${i.member.user.tag} :: ${i.member.id})`,
                    components: [],
                });
            }
        });

        collector.on("end", (_, reason) => {
            if (reason === "time") {
                Msg.author.send("Your payout request has expired (no one accepted/declined). No robux have been credited into your account.").catch(() => {});
                return main.edit({
                    content: `@everyone, Payout request from **${playerName}** expired (24 hours).`,
                    components: [],
                });
            }
        });

        Msg.reply("Your request has been sent for review.");
    };
}

module.exports = {
    class: new Command({
        Name: "payoutreq",
        Description: "Requests a group payment for review.",
        Usage: ";payoutreq <amount> <reason>",
        Permission: 0,
        Restriction: {
            byCategory: {
                whitelisted: ["796084853480357940", "922693863540404274"],
                errorMessage: "Sorry! This command can only be ran in either the **Design Team** or **Development** categories.",
            },
        },
    }),
};
