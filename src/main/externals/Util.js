require("dotenv").config();

const fs = require("fs");
const axios = require("axios");
const defaultUtil = require("util");
const uuid = require("uuid");

class Utility {
    combine = (args, first, last) => {
        last ??= Infinity;
        for (const k in args) {
            if (k > first && k < last) {
                args[first] += ` ${args[k]}`;
            }
        }
        args.splice(first + 1, last);
        return args[first];
    };

    getLibrary = (lib) => {
        try {
            const library = require(`../commands/${lib}`);
            return [true, library];
        } catch (err) {
            console.error(err);
            return [false, "Couldn't retrieve command library!\nThis command may not exist, or been archived/moved."];
        }
    };

    sleep = (ms) => {
        return new Promise((resolve) => setTimeout(resolve, ms));
    };

    getPerm = async (member) => {
        const permissionsTable = Config.permissions;
        let highestPerm;

        if (!permissionsTable) {
            throw new ReferenceError(`Util.getPerm: Could not reference permissions table.`);
        }

        if (member.id === Config.ownerId) {
            return 7;
        }

        for (const k in permissionsTable) {
            if (this.hasRole(member, permissionsTable[k])) {
                highestPerm = k;
            }
        }

        return highestPerm === undefined ? -1 : parseInt(highestPerm);
    };

    hasRole = (member, roleId) => {
        return member.roles.cache.has(roleId);
    };

    getGuild = (guildId) => {
        return discordClient.guilds.fetch(guildId);
    };

    getChannel = (guild, channelId) => {
        return guild.channels.cache.get(channelId);
    };

    getRole = (guild, roleId) => {
        return guild.roles.cache.find((role) => role.id === roleId);
    };

    giveRole = (member, role) => {
        return member.roles.add(role);
    };

    sep = (int) => {
        let str = int.toString().split(".");
        str[0] = str[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return str.join(".");
    };

    upFirst = (str) => {
        return str?.length > 0 ? str[0].toUpperCase() + str.substring(1) : "";
    };

    isValid = (str, isCapsSensitive, ...types) => {
        for (const k in types) {
            if (!isCapsSensitive) {
                // prettier-ignore
                if (str.toLowerCase() === types[k].toLowerCase()) 
                    return [true, str.toLowerCase()];
            } else {
                // prettier-ignore
                if (str === types[k]) 
                    return [true, str.toLowerCase()];
            }
        }
        return [false, undefined];
    };

    makeError = (prefix, errors) => {
        for (const error in errors) {
            errors[error] = `**- ${errors[error]}**`;
        }
        errors = errors.join("\n");
        return `${prefix}\n${errors}`;
    };

    prompt = (source, prefix, responses, options) => {
        let functions = {};
        let responseStr = prefix;

        for (const k in responses) {
            const arr = responses[k];
            if (typeof arr[0] === "string") {
                functions[arr[0]] = arr[1];
            }
        }

        const getAvailResponses = () => {
            let toReturn = [];
            for (const k in functions) {
                if (!k.startsWith("/") && !k.endsWith(":")) {
                    toReturn.push(k);
                }
            }
            return toReturn.join(", ");
        };

        const responseTypes = getAvailResponses();
        responseStr += `\n**Available Responses:** ${responseTypes}`;

        source.channel.send(responseStr);

        const filter = (m) => m.user.id === source.user.id;
        const collector = source.channel.createMessageCollector({
            filter,
            time: options.timeout,
        });

        collector.on("collect", (m) => {
            for (const r in functions) {
                if (m.content.toString().toLowerCase() === r.toString().toLowerCase()) {
                    functions[r](m);
                    collector.stop();
                }
            }
        });

        collector.on("end", (_, reason) => {
            if (reason === "time") {
                functions["/timeout:"]();
            }
        });
    };

    promptAny = (source, message, func, timeoutFunc, options) => {
        source.channel.send(message);

        const filter = (m) => m.user.id === source.user.id;
        const collector = source.channel.createMessageCollector({
            filter,
            time: options.timeout,
        });

        collector.on("collect", (m) => {
            func(m);
            collector.stop();
        });

        collector.on("end", (_, reason) => {
            if (reason.toString() === "time") {
                timeoutFunc();
            }
        });
    };

    clean = async (text) => {
        // prettier-ignore
        if (text && text.constructor.name == "Promise") 
            text = await text;

        // prettier-ignore
        if (typeof text !== "string") 
            text = defaultUtil.inspect(text, { depth: 1 });

        // prettier-ignore
        text = text.replace(
            /`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203)
        );

        // prettier-ignore
        if (text.toString() === "undefined") 
            text = "void";

        return text;
    };

    verify = (define, func) => {
        return func(define) ? define : null;
    };

    /*
        %c - Command Name
        %p - Command Perm
        %d - Command Desc
        %u - Command Usage
    */
    getCommandList = async (src, format, usableOnly) => {
        const cmdArray = [];
        const commandFiles = fs.readdirSync("./src/main/commands").filter((file) => file.endsWith(".js"));

        const parseString = (str, context) => {
            str = str.replaceAll("%c", context.Name);
            str = str.replaceAll("%p", context.Permission);
            str = str.replaceAll("%d", context.Description);
            str = str.replaceAll("%u", context.Usage);
            return str;
        };

        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            const commandClass = command.class;

            let userPermission;
            try {
                userPermission = await this.getPerm(src.member);
            } catch (err) {
                return src.reply(
                    `There was an error fetching permissions, so I couldn't display commands correctly.\nYou shouldn't ever receive an error like this. Contact **${Config.developerTag}** immediately.\n<@360239086117584906>\n\`\`\`xl\n${err}\n\`\`\``
                );
            }

            if (usableOnly) {
                if (commandClass.Permission <= userPermission) {
                    cmdArray.push(parseString(format, commandClass));
                }
            } else {
                cmdArray.push(parseString(format, commandClass));
            }
        }

        return cmdArray.length > 0 ? cmdArray.join("\n") : "No commands to show.";
    };

    getUserAttributes = async (guild, str) => {
        if (!str) return { success: false };

        str = str.toString();

        let match = str.match(/(\d+)/);
        let returnValue;
        let isTag = false;

        if (str.includes("#")) {
            const user = discordClient.users.cache.find((u) => u.tag === str);
            if (user?.id) {
                isTag = true;
                await guild.members
                    .fetch(user.id)
                    .then((m) => {
                        returnValue = { success: true, id: user.id, member: m };
                    })
                    .catch(() => {});
            }
        }

        if (match && !isTag) {
            match = match[0];
            await guild.members
                .fetch(match)
                .then((m) => {
                    returnValue = { success: true, id: match, member: m };
                })
                .catch(() => {});
        }

        return returnValue || { success: false };
    };

    getRobloxAccount = async (discordId) => {
        let endpointResponse = await axios.get(`https://verify.eryn.io/api/user/${discordId.toString()}`).catch(() => {});

        if (endpointResponse) {
            endpointResponse = endpointResponse.data;
            return { success: endpointResponse.status === "ok", response: endpointResponse };
        } else {
            return { success: false };
        }
    };

    isReputableChannel = (channelId) => {
        for (const c of Config.reputationChannels) {
            if (channelId == c) {
                return true;
            }
        }
        return false;
    };

    isOfType = (url, ...types) => {
        for (const type of types) {
            if (url.indexOf(type, url.length - type.length) !== -1) {
                return true;
            }
        }
        return false;
    };

    sendInChannel = async (guildId, channelId, toSend) => {
        const guild = await this.getGuild(guildId);
        const channel = await this.getChannel(guild, channelId);
        channel.send(toSend).catch((err) => {
            throw new Error(`Util.sendInChannel: Could not send message. Err: ${err}`);
        });
    };

    dmUser = async (userIds, toSend) => {
        const guild = await this.getGuild("761468835600924733");
        userIds.forEach((id) => {
            guild.members
                .fetch(id)
                .then((m) => m.send(toSend))
                .catch(console.error);
        });
    };

    dmUsersIn = async (guild, roleId, toSend) => {
        const role = await this.getRole(guild, roleId);
        this.dmUser(
            role.members.map((m) => m.user.id),
            toSend
        );
    };

    getTimeParameters = (ms) => {
        let totalSeconds = ms / 1000;
        let days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);

        return { days: days, hours: hours, minutes: minutes, seconds: seconds };
    };

    /*
        Util.handleRoles(guildMember, {
            "roleId": callback,
            ...etc
        })
    */
    handleRoles = async (member, options) => {
        for (const roleId in options) {
            const callbackFn = options[roleId];
            const callback = callbackFn();
            if (callback) {
                const guild = await this.getGuild(member.guild.id);

                const role = this.getRole(guild, roleId);

                // prettier-ignore
                if (!role)
                    throw new Error(`Util.handleRoles: Could not retrieve role. Err: ${err}`);

                this.giveRole(member, role).catch((err) => {
                    throw new Error(`Util.handleRoles: Could not give role (${roleId}). Err: ${err}`);
                });
            }
        }
    };

    getRep = async (memberId) => {
        const database = mongoClient.db("main");
        const reputation = database.collection("reputation");
        const currentData = await reputation.findOne({ id: memberId });
        return currentData.reputationNum;
    };

    waitUntil = (callbackFn) => {
        return new Promise((resolve) => {
            let id;
            id = setInterval(() => {
                const cb = callbackFn();
                if (cb) {
                    clearInterval(id);
                    resolve();
                }
            }, 1000);
        });
    };

    // Splits a string into multiples based on character count.
    // Returns an array of the split strings.
    splitString = (string, charLimit) => {
        const arr = [];
        let newStr = string;

        while (newStr.length >= charLimit) {
            const subStr = newStr.substring(0, charLimit);
            newStr = newStr.substring(charLimit, newStr.length);
            arr.push(subStr);
        }

        arr.push(newStr);

        return arr;
    };

    getDateNow = () => {
        const date = new Date();
        return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
    };

    makeLogData = (head, body) => {
        const generatedId = uuid.v4();
        return {
            head: head + ` - ${generatedId}`,
            body: body,
            modLogId: generatedId,
        };
    };

    parseNumericalsAfterHash = (str) => {
        return str.match(/(?<=#)\d+/);
    };

    banInGame = async (payload) => {
        let endpointResponse;
        try {
            endpointResponse = await axios.post(`https://ns-api-nnrz4.ondigitalocean.app/api/remote/outbound/bans`, payload, {
                headers: {
                    Authorization: process.env.nsAPIAuth,
                },
            });
        } catch (err) {
            return { success: false, raw: JSON.stringify(err.response.data) };
        }

        endpointResponse = endpointResponse.data;
        return { success: endpointResponse ? endpointResponse.status === "ok" : false, raw: JSON.stringify(endpointResponse.data) };
    };

    unbanInGame = async (payload) => {
        let endpointResponse;
        try {
            endpointResponse = await axios.post(`https://ns-api-nnrz4.ondigitalocean.app/api/remote/outbound/unbans`, payload, {
                headers: {
                    Authorization: process.env.nsAPIAuth,
                },
            });
        } catch (err) {
            return { success: false, raw: JSON.stringify(err.response.data) };
        }

        endpointResponse = endpointResponse.data;
        return { success: endpointResponse ? endpointResponse.status === "ok" : false, raw: JSON.stringify(endpointResponse.data) };
    };

    kickInGame = async (payload) => {
        let endpointResponse;
        try {
            endpointResponse = await axios.post(`https://ns-api-nnrz4.ondigitalocean.app/api/remote/outbound/kicks`, payload, {
                headers: {
                    Authorization: process.env.nsAPIAuth,
                },
            });
        } catch (err) {
            return { success: false, raw: JSON.stringify(err.response.data) };
        }

        endpointResponse = endpointResponse.data;
        return { success: endpointResponse ? endpointResponse.status === "ok" : false, raw: JSON.stringify(endpointResponse.data) };
    };

    sdInGame = async (payload) => {
        let endpointResponse;
        try {
            endpointResponse = await axios.post(`https://ns-api-nnrz4.ondigitalocean.app/api/remote/outbound/shutdowns`, payload, {
                headers: {
                    Authorization: process.env.nsAPIAuth,
                },
            });
        } catch (err) {
            return { success: false, raw: JSON.stringify(err.response.data) };
        }

        endpointResponse = endpointResponse.data;
        return { success: endpointResponse ? endpointResponse.status === "ok" : false, raw: JSON.stringify(endpointResponse.data) };
    };

    mfaIntegrity = async (memberId) => {
        const database = mongoClient.db("main");
        const mfaAuthorizedUsers = database.collection("prm5>");
        const currentData = await mfaAuthorizedUsers.findOne({ user: memberId });
        return currentData && currentData.authorized === true;
    };
}

module.exports = new Utility();
