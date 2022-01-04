require("dotenv").config();

const Util = require("../modules/Util");

class Command {
    constructor(options) {
        for (const k in options) {
            this[k] = options[k];
        }
    }

    fn = async (Msg, Context) => {
        const args = Context.args;

        const banType = Util.verify(args[0], (self) => {
            return Util.isValid(self || ".", false, "add", "remove")[0];
        });
        const attributes = await Util.getUserAttributes(Msg.guild, args[1]);

        if (!banType || !attributes.success) {
            return Msg.reply('**Syntax Error:** `;botban <"add" | "remove"> <@user | userId>`');
        }

        const database = mongoClient.db("main");
        const botBans = database.collection("botBans");

        const currentStat = await botBans.findOne({ id: attributes.id });

        if (banType === "add") {
            if (currentStat) {
                return Msg.reply(`This user is already banned from using NS Utility.`);
            }

            botBans
                .insertOne({
                    id: attributes.id,
                })
                .then(() => Msg.reply(`Successfully banned user from using NS Utility.`))
                .catch((err) => Msg.reply(`*Error:*\n\`\`\`\n${err}\n\`\`\``));
        } else if (banType === "remove") {
            if (!currentStat) {
                return Msg.reply(`This user is not already banned from using NS Utility.`);
            }

            botBans
                .deleteOne(currentStat)
                .then(() => Msg.reply(`Successfully removed ban.`))
                .catch((err) => Msg.reply(`*Error:*\n\`\`\`\n${err}\n\`\`\``));
        }
    };
}

module.exports = {
    class: new Command({
        Name: "botban",
        Description: "Bans a user from running commands on NS Utility.",
        Usage: `;botban <"add" | "remove"> <@user | userId>`,
        Permission: 7,
    }),
};
