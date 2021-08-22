import { MonksLittleDetails, i18n, log, setting } from "../monks-little-details.js";

export class ChatTimer {
    static init() {
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
                    if (message.getFlag('monks-little-details', 'followup'))
                        ChatMessage.create({ user: game.user.id, content: message.getFlag('monks-little-details', 'followup') }, {});

                    window.clearInterval(timer);
                }
            }, 100);
        }
    }
})