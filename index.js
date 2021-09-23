const { Client, MessageEmbed, Intents } = require('discord.js');
const fs = require('fs');
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES] });
const token = 'TOKENN';
const Prefix = ':';

bot.on('ready', () => {
    console.log('Bot Online');
    bot.user.setActivity('Notification Manager | :setup');
});

bot.on('messageCreate', message => {
    if (!message.author.bot) {
        ping(message);
    }
    let args = message.content.substring(Prefix.length).split(" ");
    if (!message.content.startsWith(Prefix)) return;

    switch(args[0]) {
        case 'setup':
            setupUser(message);
            const embed = new MessageEmbed()
                .setTitle('__Notification Manger Setup:__')
                .addField('Whitelisting Channels:', 'Type **:addchannel** followed by any channels you would like to whitelist.')
                .addField('Setting The Notification Interval:', 'Type **:setinterval** followed by thedesired number of minnutes between each ping.')  
                .addField('Adding Ignored Users:', 'Type **:blacklist** followed by @ing any user you want to blacklist.')
                .addField('Reset Settings:', 'Type **:reset** to reset all notification settings.')
                .setColor('#ec4145')
            message.channel.send({ embeds: [embed] });            
        break;

        case 'addchannel':
            if (args[1]) {    
                let user = findUser(message.author.id);
                let channels = args.slice(1).map(element => element.split(/<|>|#/).join(''));
                user.channels = channels;
                updateJSON(user);
            } else {
                message.channel.send(`<@${message.author.id}>, please supply the channels you want to be notified in.`);
            }
        break;

        case 'setinterval':
            if (args[1]) {    
                let u = findUser(message.author.id);
                u.interval = parseInt(args[1]);
                updateJSON(u);
            } else {
                message.channel.send(`<@${message.author.id}>, please supply an interval in minutes.`);
            }
        break;

        case 'blacklist':
            if (args[1]) {
                let u2 = findUser(message.author.id);
                let blacklisted = args.slice(1).map(element => element.split(/<|>|@/).join(''));
                u2.ignoredUsers = blacklisted;
                updateJSON(u2);
            } else {
                message.channel.send(`<@${message.author.id}>, please supply the users you would like to blacklist.`);
            }
        break;

        case 'reset':
            let u3 = findUser(message.author.id);
            if (u3) {    
                u3.channels = [];
                u3.interval = 0;
                u3.ignoredUsers = [];
                u3.lastPing = 0;
                updateJSON(u3);
            } else {
                message.channel.send(`<@${message.author.id}>, you are not in my system.`);
            }
        break;

        case 'test':
            console.log(message.member._roles);
        break;
    }
});

function ping(message) {
    let toBePinged = [];
    let userIds = [];
    let roleIds = [];
    message.mentions.users.forEach(u => { userIds.push(u.id); })
    message.mentions.roles.forEach(m => { roleIds.push(m.id); });
    let temp = fs.readFileSync('./users.json', 'utf8');
    if (temp != '') {
        let users = JSON.parse(temp);
        users.forEach(user => {
            if((userIds.indexOf(user.id) < 0) && !(roleIds.some(r=> user.UserRoles.indexOf(r) >= 0))
                && (Date.now() - (user.lastPing) >= (user.interval * 60000))
                    && message.author.id !== user.id) {
                toBePinged.push(user.id);
                user.lastPing = Date.now();
                updateJSON(user);
            } else if ((Date.now() - (user.lastPing) >= (user.interval * 60000)){
                user.lastPing = Date.now();
                updateJSON(user);
            }
        })
    }
    if (toBePinged[0] != undefined) {    
        let s = `New messages in <#${message.channel.id}>.`;
        toBePinged.forEach(id => {
            s += `<@${id}>`;
        });
        message.channel.send(s).then(m => {
            m.delete();
        })
    }
}

function setupUser(message) {
    let temp = fs.readFileSync('./users.json', 'utf8');
    let users = new Array();
    if (temp != '') {
        users = JSON.parse(temp);
        let found = false;
        users.forEach(user => {
            if (user.id === message.author.id) { found = true; }
        })
        if (!found) {
            let newUser = {
                id: message.author.id,
                channels: [], 
                UserRoles: message.member._roles,
                interval: 0,
                ignoredUsers: [],
                lastPing: 0
            }
            users.push(newUser);
            const jsonString = JSON.stringify(users);
            fs.writeFileSync('./users.json', jsonString);
        }
    } else {
        message.channel.send(`<@${message.author.id}>, you are already in my system.`)
    }
}

function findUser(id) {
    let u;
    let temp = fs.readFileSync('./users.json', 'utf8');
    if (temp != '') {
        let users = JSON.parse(temp);
        users.forEach(user => {
            if (user.id === id) { u = user; }
        })
    }
    return u;
}

function updateJSON(updatedUser) {
    let temp = fs.readFileSync('./users.json', 'utf8');
    if (temp != '') {
        let users = JSON.parse(temp);
        for (let i = 0; i < users.length; i++) {
            if (users[i].id === updatedUser.id) {
                users[i] = updatedUser;
            }
        }
        const jsonString = JSON.stringify(users);
        fs.writeFileSync('./users.json', jsonString);
    }
}

bot.login(token);
