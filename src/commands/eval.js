require("dotenv").config();

const Util = require("../modules/Util");

class Command {
    constructor(options) {
        for (const k in options) {
            this[k] = options[k];
        }
    }

    fn = async (msg, Context) => {
        // Secondary check..
        if (msg.author.id !== "360239086117584906") {
            return msg.reply("You have insufficient permissions to run this command.\n<@360239086117584906>");
        }

        const args = Context.args;

        if (!args[0]) {
            return msg.reply(`**Syntax Error:** \`;eval <code>\``);
        }

        try {
            const toEvaluate = Util.combine(args, 0);
            const evaled = eval(toEvaluate);

            let cleaned = await Util.clean(evaled);
            cleaned = cleaned.replaceAll(process.env.token, "%REDACTED_TOKEN%");
            cleaned = cleaned.replaceAll(process.env.cookie, "%REDACTED_COOKIE%");
            cleaned = cleaned.replaceAll(process.env.mongoURI, "%REDACTED_MONGO-URI%");

            return msg.channel.send(
                `<@${msg.member.id}>, *Evaluation callback..* **Success:** [${Date.now() - msg.createdTimestamp}ms]\n\`\`\`js\n${cleaned}\n\`\`\``
            );
        } catch (err) {
            return msg.channel.send(
                // prettier-ignore
                `<@${msg.member.id}>, *Evaluation callback..* **Error:** [${Date.now() - msg.createdTimestamp}ms]\n\`\`\`xl\n${err}\n\`\`\``
            );
        }
    };
}

module.exports = {
    class: new Command({
        Name: "eval",
        Description: "Evaluates JavaScript code.",
        Usage: ";eval <code>",
        Permission: 7,
    }),
};
