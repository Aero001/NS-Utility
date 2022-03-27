require("dotenv").config();

const roleHandle = (member, currentRep) => {
    Util.handleRoles(member, {
        "953137241419571240": () => {
            return currentRep >= 10;
        },
        "927710449716318228": () => {
            return currentRep >= 50;
        },
        "927710734555688992": () => {
            return currentRep >= 135;
        },
        "927710891678502952": () => {
            return currentRep >= 300;
        },
        "927711487554900068": () => {
            return currentRep >= 500;
        },
        "927903591434428486": () => {
            return currentRep >= 700;
        },
        "927711654760841258": () => {
            return currentRep >= 1000;
        },
    }).catch((err) => {
        console.error(err);
        Util.dmUser([config.ownerId], `Could not assign role to \`${member.id}\`\n\`\`\`\n${err}\n\`\`\``);
    });
};

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

        const args = Context.args;

        const attributes = await Util.getUserAttributes(Msg.guild, args[0]);
        const amt = parseInt(args[1]);

        if (!attributes.success || (!amt && amt !== 0)) {
            return SyntaxErr();
        }

        const database = mongoClient.db("main");
        const reputation = database.collection("reputation");

        const userReputation = await reputation.findOne({ id: attributes.id });

        if (!userReputation) {
            try {
                reputation.insertOne({
                    id: attributes.id,
                    reputationNum: 0,
                });
            } catch (err) {
                Util.dmUser([Config.ownerId], `**Add Reputation to Edit Error**\n\`\`\`\n${err}\n\`\`\``);
                return Msg.reply("There was an error adding reputation.");
            }
        }

        const previous = userReputation.reputationNum;

        reputation
            .updateOne(
                {
                    id: attributes.id,
                },
                {
                    $set: {
                        reputationNum: amt,
                    },
                }
            )
            .then(() => {
                Util.sendInChannel("761468835600924733", "923715934370283612", `Edited <@${attributes.id}> REP from **${previous}** to **${amt}**.`);
                roleHandle(attributes.member, amt);
                Msg.reply(`Successfully altered reputation amount.`);
            })
            .catch((err) => Msg.reply(`*Error:*\n\`\`\`\n${err}\n\`\`\``));
    };
}

module.exports = {
    class: new Command({
        Name: "repedit",
        Description: "Edits a user's reputation.",
        Usage: SyntaxBuilder.classifyCommand({ name: "repedit" }).makeRegular("User").makeRegular("amount").endBuild(),
        Permission: 5,
        Group: "Reputation",
    }),
};
