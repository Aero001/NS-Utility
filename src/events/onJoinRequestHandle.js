const noblox = require("noblox.js");
const config = require("../config.json");

module.exports = async (mongoClient, data) => {
    const database = mongoClient.db("main");
    const groupBans = database.collection("groupBans");

    const requesterId = data.requester.userId;

    const isGroupBanned = await groupBans.findOne({ id: requesterId });

    if (!isGroupBanned) {
        noblox.handleJoinRequest(config.group, requesterId, true).catch(console.error);
    }
};
