/*global SyntaxBuilder, process*/
/*eslint no-undef: "error"*/

class Command {
    constructor(options) {
        for (const k in options) {
            this[k] = options[k];
        }
    }

    fn = async (msg) => {
        try {
            await msg.reply("Restarting via *process.exit* on PM2..");
            process.exit();
        } catch (err) {
            msg.reply(`*Error:*\n\`\`\`\n${err}\n\`\`\``);
        }
    };
}

module.exports = {
    class: new Command({
        Name: "restart",
        Description: "Restarts the bot application.",
        Usage: SyntaxBuilder.classifyCommand({ name: "restart" }).endBuild(),
        Permission: 7,
        Group: "Developer",
    }),
};
