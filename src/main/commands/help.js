const CommandList = require("../externals/CommandList");
const List = new CommandList();

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
        const perm = Context.clientPerm;
        const command = args[0];

        if (!command) {
            const helpMessage = List.generate({
                Format: `\`%c\` - **%d** [%p]`,
                Permission: perm,
                Usable: true,
            });

            return Msg.author
                .send(helpMessage)
                .then(() => Msg.reply("Sent you a DM with information."))
                .catch(() => Msg.reply("I couldn't DM you. Are your DMs off?"));
        } else if ((command && args.length > 1) || command.toString().toLowerCase() === "help") {
            return SyntaxErr();
        }

        let [success, result] = Util.getLibrary(command);
        if (!success) {
            return Msg.reply(result);
        } else {
            if ((Msg.guild.id === Config.testServer && Msg.author.id === Config.ownerId) || result.class.Permission <= perm) {
                return Msg.reply(
                    // prettier-ignore
                    `Command: \`${command.toLowerCase()}\` **[${result.class.Permission}]**\nUsage: \`${result.class.Usage}\`\nDescription: **${result.class.Description}**`
                );
            }
        }
    };
}

module.exports = {
    class: new Command({
        Name: "help",
        Description: "Gives help and info on all usable commands, or specific commands.",
        Usage: SyntaxBuilder.classifyCommand({ name: "help" }).makeRegular("command", { optional: true }).endBuild(),
        Permission: 0,
        Group: "General",
    }),
};
