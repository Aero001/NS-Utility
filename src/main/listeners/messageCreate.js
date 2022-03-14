const Util = require("../externals/Util");
const ReputationAlgorithm = require("../externals/reputation/Algorithm");
const CommandProcessor = require("../externals/CommandProcessor");

module.exports = {
    name: "messageCreate",
    execType: "bind",
    async execute(msg) {
        if (!msg.guild) return;
        if (msg.webhookId) return;

        if (Util.isReputableChannel(msg.channel.id)) {
            if (!msg.member.user.bot) ReputationAlgorithm(msg);
        }

        const result = await CommandProcessor(msg);
        if (!result.success && result.message) {
            return msg.reply(result.message);
        }
    },
};
