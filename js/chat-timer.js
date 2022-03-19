import { MonksLittleDetails, i18n, log, setting } from "../monks-little-details.js";

export class ChatTimer {
    static init() {
    }

    static createTimer(time = "5", options = {}) {
        let timePart = time.split(':').reverse();
        let calcTime = ((Math.abs(timePart[0]) + (timePart.length > 1 ? Math.abs(timePart[1]) * 60 : 0) + (timePart.length > 2 ? Math.abs(timePart[2]) * 3600 : 0)) * 1000) * (time.startsWith('-') ? -1 : 1);

        let frmtTime = new Date(calcTime < 0 ? 0 : calcTime).toISOString().substr(11, 8);
        let content = `<div class="timer-msg"><div class="timer-flavor">${options.flavor}</div><div class="timer-time">${frmtTime}</div><div class="timer-bar"><div></div></div><div class="complete-msg">Complete</div></div>`;

        const speaker = { scene: canvas.scene.id, actor: game.user?.character?.id, token: null, alias: game.user?.name };

        let messageData = {
            user: game.user.id,
            speaker: speaker,
            type: CONST.CHAT_MESSAGE_TYPES.OOC,
            content: content,
            flags: { 'monks-little-details': { time: calcTime, start: Date.now(), flavor: options.flavor, followup: options.followup } }
        };

        if (options.whisper)
            messageData.whisper = options.whisper;

        ChatMessage.create(messageData);
    }
}

Hooks.on("chatCommandsReady", (chatCommands) => {
    chatCommands.registerCommand(chatCommands.createCommandFromData({
        commandKey: "/timer",
        invokeOnCommand: (chatlog, messageText, chatdata) => {
            let regex = /^(?:(?:(-?[01]?\d|2[0-3]):)?(-?[0-5]?\d):)?(-?[0-5]?\d)|((.*?))?$/g;
            let found = messageText.match(regex);

            let timePart = (found[0] || '5').split(':').reverse();
            let time = ((Math.abs(timePart[0]) + (timePart.length > 1 ? Math.abs(timePart[1]) * 60 : 0) + (timePart.length > 2 ? Math.abs(timePart[2]) * 3600 : 0)) * 1000) * (found[0].startsWith('-') ? -1 : 1);

            let flavor = null;
            if (found.length > 1)
                flavor = found[1].trim();
            regex = /(\((.*?)\))?$/g;
            found = messageText.match(regex);
            let followup = null;
            if (found.length > 0) {
                followup = found[0]
                flavor = flavor.replace(followup, '').trim();
                followup = followup.substr(1, followup.length - 2).trim();
            }

            chatdata.flags = { 'monks-little-details': { time: time, start: Date.now(), flavor: flavor, followup: followup } };
            let frmtTime = new Date(time < 0 ? 0 : time).toISOString().substr(11, 8);
            return '<div class="timer-msg"><div class="timer-flavor">' + flavor + '</div><div class="timer-time">' + frmtTime + '</div><div class="timer-bar"><div></div></div><div class="complete-msg">Complete</div></div>';
        },
        shouldDisplayToChat: true,
        iconClass: "fa-clock",
        description: "Set countdown"
    }));
});

Hooks.on("renderChatMessage", (message, html, data) => {
    if (message.getFlag('monks-little-details', 'time') && !message.getFlag('monks-little-details', 'complete')) {
        let updateTime = function (time, start) {
            let dif = (Date.now() - start);
            let realTime = Math.abs(time);
            let remaining = (time < 0 ? realTime - dif : dif);
            if (time < 0)
                remaining = remaining + 1000;

            let frmtTime = new Date(remaining).toISOString().substr(11, 8);
            $('.timer-time', html).html(frmtTime);
            $('.timer-bar div', html).css({ width: ((dif / Math.abs(time)) * 100) + '%' });

            return dif < Math.abs(time);
        }

        let time = message.getFlag('monks-little-details', 'time');
        let start = message.getFlag('monks-little-details', 'start');

        if ((Date.now() - start) >= Math.abs(time)) {
            //the timer is finished
            let content = $(message.data.content);
            $(content).addClass('completed');
            updateTime(time, start);
            //$('.timer-time', content).html(parseInt(Math.abs(time) / 1000) + ' sec');
            message.update({ content: content[0].outerHTML, flags: { 'monks-little-details': { 'complete': true } } });
            if (message.getFlag('monks-little-details', 'followup'))
                ChatMessage.create({ user: game.user.id, content: message.getFlag('monks-little-details', 'followup') }, {});
        } else {
            //start that timer up!
            updateTime(time, start);
            /*
            let dif = (Date.now() - start);
            let remaining = parseInt(dif / 1000);
            $('.timer-time', html).html((time < 0 ? Math.abs(time) - remaining : remaining) + ' sec');
            $('.timer-bar div', html).css({ width: ((dif / Math.abs(time)) * 100) + '%' });
            */

            let timer = window.setInterval(function () {
                /*
                let dif = (Date.now() - start);
                let remaining = parseInt(dif / 1000);
                $('.timer-time', html).html((time < 0 ? Math.abs(time) - remaining : remaining) + ' sec');
                $('.timer-bar div', html).css({ width: ((dif / Math.abs(time)) * 100) + '%'});
                */
                //+++ check if message still exists
                if (!updateTime(time, start)) {
                    //the timer is finished
                    let content = $(message.data.content);
                    $(content).addClass('complete');
                    updateTime(time, start);
                    //$('.timer-time', content).html((time < 0 ? Math.abs(time) - remaining : remaining) + ' sec');
                    message.update({ content: content[0].outerHTML, flags: { 'monks-little-details': { 'complete': true } } });
                    if (message.getFlag('monks-little-details', 'followup')) {
                        ChatMessage.create({
                            user: game.user.id,
                            flavor: message.getFlag('monks-little-details', 'flavor'),
                            content: message.getFlag('monks-little-details', 'followup'),
                            speaker: message.data.speaker,
                            type: CONST.CHAT_MESSAGE_TYPES.OOC,
                            whisper: message.data.whisper
                        }, {});
                    }

                    window.clearInterval(timer);
                }
            }, 100);
        }
    }
});

Hooks.on("setupTileActions", (app) => {
    app.registerTileGroup('monks-little-details', "Monk's Little Details");
    app.registerTileAction('monks-little-details', 'chat-timer', {
        name: 'Chat Timer',
        ctrls: [
            {
                id: "duration",
                name: "Duration",
                type: "text",
                defvalue: "5",
                required: true,
            },
            {
                id: "for",
                name: "For",
                list: "for",
                type: "list",
            },
            {
                id: "flavor",
                name: "Flavor",
                type: "text",
            },
            {
                id: "followup",
                name: "Follow-up",
                type: "text",
            },
        ],
        values: {
            'for': {
                "everyone": 'Everyone',
                "gm": 'GM Only',
                'token': "Triggering Player"
            }
        },
        group: 'monks-little-details',
        fn: async (args = {}) => {
            const { action, tokens } = args;

            let options = {
                flavor: action.data.flavor,
                followup: action.data.followup
            };

            if (action.data.for == 'gm')
                options.whisper = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
            else if (action.data.for == 'token') {
                let entities = await game.MonksActiveTiles.getEntities(args);
                let entity = (entities.length > 0 ? entities[0] : null);
                let tkn = (entity?.object || tokens[0]?.object);
                let tokenOwners = (tkn ? Object.entries(tkn?.actor.data.permission).filter(([k, v]) => { return v == CONST.ENTITY_PERMISSIONS.OWNER }).map(a => { return a[0]; }) : []);
                options.whisper = Array.from(new Set(ChatMessage.getWhisperRecipients("GM").map(u => u.id).concat(tokenOwners)));
            }

            ChatTimer.createTimer(action.data.duration, options);
        },
        content: async (trigger, action) => {
            return `<span class="logic-style">${trigger.name}</span> count <span class="details-style">"${action.data.duration}"</span> for <span class="value-style">&lt;${i18n(trigger.values.for[action.data?.for])}&gt;</span>`;
        }
    });
});