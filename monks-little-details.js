import { registerSettings } from "./settings.js";
import { MMCQ } from "./quantize.js";

export let debug = (...args) => {
    if (debugEnabled > 1) console.log("DEBUG: monks-little-details | ", ...args);
};
export let log = (...args) => console.log("monks-little-details | ", ...args);
export let warn = (...args) => {
    if (debugEnabled > 0) console.warn("monks-little-details | ", ...args);
};
export let error = (...args) => console.error("monks-little-details | ", ...args);
export let i18n = key => {
    return game.i18n.localize(key);
};
export let setting = key => {
    return game.settings.get("monks-little-details", key);
};
export let volume = () => {
    return game.settings.get("monks-little-details", "volume") / 100.0;
};
export let combatposition = () => {
    return game.settings.get("monks-little-details", "combat-position");
};

export class MonksLittleDetails {
    static tracker = false;
    static turnMarkerAnim = {};

    static canDo(setting) {
        //needs to not be on the reject list, and if there is an only list, it needs to be on it.
        if (MonksLittleDetails._rejectlist[setting] != undefined && MonksLittleDetails._rejectlist[setting].includes(game.world.system))
            return false;
        if (MonksLittleDetails._onlylist[setting] != undefined && !MonksLittleDetails._onlylist[setting].includes(game.world.system))
            return false;
        return true;
    };

    static init() {
	    log("initializing");
        // element statics
       // CONFIG.debug.hooks = true;

        if (game.MonksLittleDetails == undefined)
            game.MonksLittleDetails = MonksLittleDetails;

        MonksLittleDetails.SOCKET = "module.monks-little-details";

        MonksLittleDetails.READY = true;

        MonksLittleDetails.availableGlyphs = '!"#$%&\'()*+,-./01234568:;<=>?@ABDEFGHIKMNOPQRSTUVWX[\\]^_`acdfhoquvx|}~¢£¥§©ª«¬®°±¶·º¿ÀÁÂÄÅÆÈÉÊËÌÏÑÒÓÔÖØÙÚÜßàáâåæçéêëìíîïñòõ÷øùûüÿiœŸƒπ';

        /*
        MonksLittleDetails.xpchart = [
            { cr: 0, xp: 10 },
            { cr: 0.13, xp: 25 },
            { cr: 0.25, xp: 50 },
            { cr: 0.5, xp: 100 },
            { cr: 1, xp: 200 },
            { cr: 2, xp: 450 },
            { cr: 3, xp: 700 },
            { cr: 4, xp: 1100 },
            { cr: 5, xp: 1800 },
            { cr: 6, xp: 2300 },
            { cr: 7, xp: 2900 },
            { cr: 8, xp: 3900 },
            { cr: 9, xp: 5000 },
            { cr: 10, xp: 5900 },
            { cr: 11, xp: 7200 },
            { cr: 12, xp: 8400 },
            { cr: 13, xp: 10000 },
            { cr: 14, xp: 11500 },
            { cr: 15, xp: 13000 },
            { cr: 16, xp: 15000 },
            { cr: 17, xp: 18000 },
            { cr: 18, xp: 20000 },
            { cr: 19, xp: 22000 },
            { cr: 20, xp: 25000 },
            { cr: 21, xp: 33000 },
            { cr: 22, xp: 41000 },
            { cr: 23, xp: 50000 },
            { cr: 24, xp: 62000 },
            { cr: 25, xp: 75000 },
            { cr: 26, xp: 90000 },
            { cr: 27, xp: 105000 },
            { cr: 28, xp: 120000 },
            { cr: 29, xp: 135000 },
            { cr: 30, xp: 155000 }
        ];*/

        if (game.world.system == 'dnd5e')
            MonksLittleDetails.xpchart = CONFIG.DND5E.CR_EXP_LEVELS;
        else if (game.world.system == 'pf2e') {
            MonksLittleDetails.xpchart = [50, 400, 600,800,1200,1600, 2400, 3200, 4800, 6400, 9600, 12800, 19200, 25600, 38400, 51200, 76800, 102400, 153600, 204800, 307200, 409600, 614400, 819200, 1228800, 1638400, 2457600, 3276800, 4915200, 6553600, 9830400 ];
        }

        MonksLittleDetails.crChallenge = [
            { text: "MonksLittleDetails.easy", rating: 'easy' },
            { text: "MonksLittleDetails.average", rating: 'average' },
            { text: "MonksLittleDetails.challenging", rating: 'challenging' },
            { text: "MonksLittleDetails.hard", rating: 'hard' },
            { text: "MonksLittleDetails.epic", rating: 'epic' }
        ];

        MonksLittleDetails._rejectlist = {
            "alter-hud": ["pf2e"],
            "change-invisible-image": ["pf2e"]
        }
        MonksLittleDetails._onlylist = {
            "show-combat-cr": ["dnd5e", "pf2e"]
        }

        // sound statics
        //MonksLittleDetails.NEXT_SOUND = "modules/monks-little-details/sounds/next.wav";
        //MonksLittleDetails.TURN_SOUND = "modules/monks-little-details/sounds/turn.wav";
        //MonksLittleDetails.ROUND_SOUND = "modules/monks-little-details/sounds/round.wav";

        registerSettings();

        MonksLittleDetails.injectCSS();

        if (MonksLittleDetails.canDo("change-invisible-image") && game.settings.get("monks-little-details", "change-invisible-image"))
            CONFIG.controlIcons.visibility = "modules/monks-little-details/icons/invisible.svg";

        if (MonksLittleDetails.canDo("add-extra-statuses") && game.settings.get("monks-little-details", "add-extra-statuses")) {
            CONFIG.statusEffects = CONFIG.statusEffects.concat(
                [
                    { "id": "charmed", "label": "MonksLittleDetails.StatusCharmed", "icon": "modules/monks-little-details/icons/smitten.png" },
                    { "id": "exhausted", "label": "MonksLittleDetails.StatusExhausted", "icon": "modules/monks-little-details/icons/oppression.png" },
                    { "id": "grappled", "label": "MonksLittleDetails.StatusGrappled", "icon": "modules/monks-little-details/icons/grab.png" },
                    { "id": "incapacitated", "label": "MonksLittleDetails.StatusIncapacitated", "icon": "modules/monks-little-details/icons/internal-injury.png" },
                    { "id": "invisible", "label": "MonksLittleDetails.StatusInvisible", "icon": "modules/monks-little-details/icons/invisible.png" },
                    { "id": "petrified", "label": "MonksLittleDetails.StatusPetrified", "icon": "modules/monks-little-details/icons/stone-pile.png" },
                    { "id": "hasted", "label": "MonksLittleDetails.StatusHasted", "icon": "modules/monks-little-details/icons/running-shoe.png" },
                    { "id": "slowed", "label": "MonksLittleDetails.StatusSlowed", "icon": "modules/monks-little-details/icons/turtle.png" },
                    { "id": "concentration", "label": "MonksLittleDetails.StatusConcentrating", "icon": "modules/monks-little-details/icons/beams-aura.png" },
                    { "id": "rage", "label": "MonksLittleDetails.StatusRage", "icon": "modules/monks-little-details/icons/enrage.png" },
                    { "id": "distracted", "label": "MonksLittleDetails.StatusDistracted", "icon": "modules/monks-little-details/icons/distraction.png" },
                    { "id": "dodging", "label": "MonksLittleDetails.StatusDodging", "icon": "modules/monks-little-details/icons/dodging.png" },
                    { "id": "disengage", "label": "MonksLittleDetails.StatusDisengage", "icon": "modules/monks-little-details/icons/journey.png" },
                    { "id": "cover", "label": "MonksLittleDetails.StatusCover", "icon": "modules/monks-little-details/icons/push.png" }
                ]
            );
        }

        if (game.settings.get("monks-little-details", "alter-hud")) {
            CONFIG.statusEffects = CONFIG.statusEffects.sort(function (a, b) {
                return (a.id == undefined || a.id > b.id ? 1 : (a.id < b.id ? -1 : 0)); //(a.label == undefined || i18n(a.label) > i18n(b.label) ? 1 : (i18n(a.label) < i18n(b.label) ? -1 : 0));
            })

            let oldTokenHUDRender = TokenHUD.prototype._render;
            TokenHUD.prototype._render = function (force = false, options = {}) {
                let result = oldTokenHUDRender.call(this, force, options).then((a, b) => {
                    MonksLittleDetails.alterHUD(MonksLittleDetails.element);
                });

                return result;
            }
        }

        if (game.settings.get("monks-little-details", "prevent-token-removal")) {
            let oldToggleCombat = TokenHUD.prototype._onToggleCombat;
            TokenHUD.prototype._onToggleCombat = function (event) {
                if (this.object.inCombat) {
                    ui.notifications.warn(i18n("MonksLittleDetails.PreventTokenMessage"));
                    event.preventDefault();
                    return false;
                } else {
                    return oldToggleCombat.call(this, event);
                }
            }
        }

        if (setting("show-bloodsplat")) {
            MonksLittleDetails.splatfont = new FontFace('WC Rhesus A Bta', "url('modules/monks-little-details/fonts/WCRhesusABta.woff2'), url('modules/monks-little-details/fonts/WCRhesusABta.woff')");
            MonksLittleDetails.splatfont.load().then(() => {
                document.fonts.add(MonksLittleDetails.splatfont);
            });

            let oldTokenRefresh = Token.prototype.refresh;
            Token.prototype.refresh = function () {
                oldTokenRefresh.call(this);

                if ((this.defeated || this.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId)) && this.actor?.data.type !== 'character') {
                    this.bars.visible = false;
                    for (let effect of this.effects.children) {
                        effect.alpha = 0;
                    }
                    if (this.actor?.getFlag("core", "sheetClass") != 'dnd5e.LootSheet5eNPC') {
                        if (this.data._id != undefined) {
                            this.icon.alpha = (game.user.isGM ? 0.2 : 0);
                            if (this.bloodsplat == undefined) {
                                let glyph = this.getFlag('monks-little-details', 'glyph');
                                if (glyph == undefined) {
                                    glyph = MonksLittleDetails.availableGlyphs.charAt(Math.floor(Math.random() * MonksLittleDetails.availableGlyphs.length));
                                    this.setFlag('monks-little-details', 'glyph', glyph);
                                }
                                this.bloodsplat = new PIXI.Text(' ' + glyph + ' ', { fontFamily: 'WC Rhesus A Bta', fontSize: this.height, fill: 0xff0000, align: 'center' });
                                this.bloodsplat.alpha = 0.7;
                                this.bloodsplat.blendMode = PIXI.BLEND_MODES.OVERLAY;
                                this.bloodsplat.anchor.set(0.5, 0.5);
                                this.bloodsplat.x = this.width / 2;
                                this.bloodsplat.y = this.height / 2;
                                this.addChild(this.bloodsplat);
                            }
                        }
                    } else {
                        this.icon.alpha = 0.5;
                        if (this.bloodsplat) {
                            this.removeChild(this.bloodsplat);
                            delete this.bloodsplat;
                        }
                        if (this.tresurechest == undefined) {
                            loadTexture("icons/svg/chest.svg").then((tex) => { //"modules/monks-little-details/img/chest.png"
                                const icon = new PIXI.Sprite(tex);
                                const size = Math.min(canvas.grid.grid.w, canvas.grid.grid.h);
                                icon.width = icon.height = size;
                                icon.position.set((this.w - size) / 2, (this.h - size) / 2);
                                icon.alpha = 0.8;
                                this.tresurechest = icon;
                                this.addChild(this.tresurechest);
                            });
                        } else
                            this.tresurechest.alpha = (this._hover ? 1 : 0.8);
                    }
                } else {
                    if (this.bloodsplat) {
                        this.removeChild(this.bloodsplat);
                        delete this.bloodsplat;
                    }
                    if (this.tresurechest) {
                        this.removeChild(this.tresurechest);
                        delete this.tresurechest;
                    }
                }
            }
        }

        if (game.settings.get("monks-little-details", "show-notify")) {
            let oldChatLogNotify = ChatLog.prototype.notify;
            ChatLog.prototype.notify = function (message) {
                this._lastMessageTime = new Date();
                if (!this.rendered) return;

                // Display the chat notification icon and remove it 3 seconds later
                let icon = $('#chat-notification');
                if (icon.is(":hidden")) icon.fadeIn(100);
                if (ui.sidebar.activeTab == 'chat') {
                    setTimeout(() => {
                        if (new Date() - this._lastMessageTime > 3000 && icon.is(":visible")) icon.fadeOut(100);
                    }, 3001);
                }

                // Play a notification sound effect
                if (message.data.sound) AudioHelper.play({ src: message.data.sound });
            }
        }
    }

    static ready() {
        if(game.settings.get("monks-little-details", "actor-sounds"))
            MonksLittleDetails.injectSoundCtrls();

        MonksLittleDetails.checkCombatTurn(game.combats.active);

        game.socket.on('module.monks-little-details', MonksLittleDetails.onMessage);

        $('#sidebar-tabs a[data-tab="chat"]').on('click.monks-little-details', function (event) {
            let icon = $('#chat-notification');
            if(icon.is(":visible")) icon.fadeOut(100);
        });
    }

    static injectCSS() {
        let innerHTML = '';
        let style = document.createElement("style");
        style.id = "monks-css-changes";
        if (game.settings.get("monks-little-details", "core-css-changes")) {
            innerHTML += `
.sidebar-tab .directory-list .directory-item img {
    object-fit: contain !important;
}

.filepicker .thumbs-list img {
    object-fit: contain !important;
}

.sidebar-tab .directory-list .directory-item.scene {
    position: relative;
}

.sidebar-tab .directory-list .directory-item.scene img {
    flex: 1;
    object-fit: cover !important;
}

.sidebar-tab .directory-list .directory-item.scene h4 {
    position: absolute;
    width: 100%;
    text-align: center;
    text-shadow: 1px 1px 3px #000;
    color: #f0f0e0;
}

.control-icon.active > img {
    filter: sepia(100%) saturate(2000%) hue-rotate(-50deg);
}

#context-menu li.context-item{
    text-align: left;
}
`;
        }

        let iconWidth = '24';
        if (game.modules.get("illandril-token-hud-scale") != undefined && game.modules.get("illandril-token-hud-scale").active && game.settings.get("illandril-token-hud-scale", "enableStatusSelectorScale"))
            iconWidth = '36';

        if (MonksLittleDetails.canDo("alter-hud") && game.settings.get("monks-little-details", "alter-hud")) {
            innerHTML += `
#token-hud .status-effects {
    top: -56px !important;
    width: unset !important;
    grid-template-columns: 130px 130px 130px 130px !important;
    font-size: 16px;
    line-height: ${iconWidth}px;
    text-align: left;
    background: rgba(0, 0, 0, 0.8);
}

#token-hud .status-effects .clear-all {
    position: absolute;
    bottom: 100%;
    right: 5px;
    cursor: pointer;
    color: #ccc;
    border-top-right-radius: 4px;
    border-top-left-radius: 4px;
    background: #333;
    padding: 4px 8px;
}

#token-hud .status-effects .clear-all:hover {
    color: #d2d1d0;
}

#token-hud .status-effects div.effect-control {
    width: 100% !important;
    height: ${iconWidth}px !important;
    color: #ccc;
    cursor: pointer;
    border-radius: 4px;
    padding: 1px;
    border: 1px solid transparent;
}

#token-hud .status-effects div.effect-control:hover {
    color: #d2d1d0 !important;
}

#token-hud .status-effects div.effect-control.active {
    color: #ff6400;
    border: 1px solid #ff6400;
}

#token-hud .status-effects div.effect-control.active:hover {
    color: #ffc163 !important;
}

#token-hud .status-effects .effect-control img {
    width: ${iconWidth}px;
    height: ${iconWidth}px;
    margin: 0;
    margin-top:-1px;
    padding: 0;
    border: none;
    opacity: 0.5;
    display: inline-block;
}

#token-hud .status-effects .effect-control:hover img {
    opacity: 0.8;
}

#token-hud .status-effects .effect-control.active img {
    opacity: 1;
    filter: sepia(100%) saturate(2000%) hue-rotate(-50deg);
}

#token-hud .status-effects div.effect-control div {
    vertical-align: top;
    padding-left: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: calc(100% - ${iconWidth}px);
    display: inline-block;
}
`;
        }

        style.innerHTML = innerHTML;
        if (innerHTML != '')
            document.querySelector("head").appendChild(style);
    }

    static injectSoundCtrls() {
        let npcObject = (CONFIG.Actor.sheetClasses.npc || CONFIG.Actor.sheetClasses.minion);
        if (npcObject != undefined) {
            let npcSheetNames = Object.values(npcObject)
                .map((sheetClass) => sheetClass.cls)
                .map((sheet) => sheet.name);

            npcSheetNames.forEach((sheetName) => {
                Hooks.on("render" + sheetName, (app, html, data) => {
                    // only for GMs or the owner of this npc
                    if (!data.owner || !data.actor) return;

                    // don't add the button multiple times
                    if ($(html).find("#mldCharacterSound").length > 0) return;

                    let hasSound = (app.entity.getFlag('monks-little-details', 'sound-effect') != undefined);

                    let button = $('<button>')
                        .attr('type', "button")
                        .attr('id', "mldCharacterSound")
                        .toggleClass('loaded', hasSound)
                        .html('<i class="fas fa-volume-up"></i>')
                        .click($.proxy(MonksLittleDetails.findSoundEffect, app));
                    //.contextmenu($.proxy(MonksLittleDetails.loadSoundEffect, app));

                    if (app.soundcontext == undefined) {
                        app.soundcontext = new ContextMenu(html, "#mldCharacterSound", [
                            {
                                name: "Select Sound",
                                icon: '<i class="fas fa-file-import"></i>',
                                callback: li => {
                                    MonksLittleDetails.findSoundEffect.call(app);
                                }
                            },
                            {
                                name: "Play Sound",
                                icon: '<i class="fas fa-play"></i>',
                                condition: $.proxy(function () {
                                    return this.entity.getFlag('monks-little-details', 'sound-effect');
                                }, app),
                                callback: li => {
                                    MonksLittleDetails.loadSoundEffect.call(app);
                                }
                            },
                            {
                                name: "Delete Sound",
                                icon: '<i class="fas fa-trash-alt"></i>',
                                condition: $.proxy(function () {
                                    return this.entity.getFlag('monks-little-details', 'sound-effect');
                                }, app),
                                callback: li => {
                                    MonksLittleDetails.clearSoundEffect.call(app);
                                }
                            }
                        ]);
                    }

                    let wrap = $('<div class="mldCharacterName"></div>');
                    $(html).find("input[name='name']").wrap(wrap);
                    $(html).find("input[name='name']").parent().prepend(button);
                });

                Hooks.on("close" + sheetName, (app, html, data) => {
                    delete app.soundcontext;
                });
            });
        }
    }

    static findSoundEffect(event) {
        log('Click sound button');
        //Display the filepicker to save a sound
        const current = this.actor.getFlag('monks-little-details', 'sound-effect');
        const fp = new FilePicker({
            type: "audio",
            current: current,
            callback: path => {
                this.actor.setFlag('monks-little-details', 'sound-effect', path);
            },
            top: this.position.top + 40,
            left: this.position.left + 10
        });
        return fp.browse();
    }

    static loadSoundEffect(event) {
        const audiofile = this.actor.getFlag('monks-little-details', 'sound-effect');
        if (audiofile != undefined) {
            MonksLittleDetails.playSoundEffect(audiofile);
            if (this instanceof Token) {
                game.socket.emit(
                    MonksLittleDetails.SOCKET,
                    {
                        msgtype: 'playsoundeffect',
                        senderId: game.user._id,
                        actorid: this.actor.id,
                        audiofile: audiofile
                    },
                    (resp) => { }
                );
            }
        }
        if(event != undefined)
            event.preventDefault;
    }

    static playSoundEffect(audiofile) {
        if (audiofile != undefined) {
            let volume = game.settings.get("core", 'globalInterfaceVolume');
            AudioHelper.play({ src: audiofile, volume: volume });
        }
    }

    static clearSoundEffect(event) {
        log('Clear Sound effect');
        this.actor.unsetFlag('monks-little-details', 'sound-effect');
    }

    static async moveTokens(event) {
        let movechar = game.settings.get("monks-little-details", "movement-key");
        if (movechar.length == 0) movechar = "m";
        if (movechar.length > 1) movechar = movechar[0];

        if (game.user.isGM && game.keyboard.isDown(movechar) && canvas.tokens.controlled.length > 0) {
            let pos = event.data.getLocalPosition(canvas.app.stage);
            let mid = {
                x: canvas.tokens.controlled[0].data.x,
                y: canvas.tokens.controlled[0].data.y
            };
            for (let i = 1; i < canvas.tokens.controlled.length; i++) {
                mid.x += canvas.tokens.controlled[i].data.x;
                mid.y += canvas.tokens.controlled[i].data.y;
            }
            mid.x = (mid.x / canvas.tokens.controlled.length);
            mid.y = (mid.y / canvas.tokens.controlled.length);

            let tokens = canvas.tokens.controlled.map(t => { return t.id; });
            let updates = [];
            for (let i = 0; i < tokens.length; i++) {
                let t = canvas.tokens.get(tokens[i]);
                let offsetx = mid.x - t.data.x;
                let offsety = mid.y - t.data.y;
                let gridPt = canvas.grid.grid.getGridPositionFromPixels(pos.x - offsetx, pos.y - offsety);
                let px = canvas.grid.grid.getPixelsFromGridPosition(gridPt[0], gridPt[1]);

                //t.update({ x: px[0], y: px[1] }, { animate: false });
                updates.push({ _id: t.id, x: px[0], y: px[1] });
            }
            if(updates.length)
                canvas.scene.updateEmbeddedEntity("Token", updates, { animate: false });
        }
    }

    static onMessage(data) {
        switch (data.msgtype) {
            case 'playsoundeffect': {
                MonksLittleDetails.playSoundEffect(data.audiofile);
            } break;
        }
    }

    static doDisplayTurn() {
        if (!game.settings.get("monks-little-details", "showcurrentup")) {
            return;
        }

        if (!MonksLittleDetails.READY) {
            MonksLittleDetails.init();
        }
        ui.notifications.warn(i18n("MonksLittleDetails.Turn"));

        // play a sound
        if (volume() > 0 && !game.settings.get("monks-little-details", "disablesounds") && game.settings.get('monks-little-details', 'turn-sound') != '')
            AudioHelper.play({ src: game.settings.get('monks-little-details', 'turn-sound'), volume: volume() });
    }

    static doDisplayNext() {
        if (!game.settings.get("monks-little-details", "shownextup")) {
            return;
        }

        if (!MonksLittleDetails.READY) {
            MonksLittleDetails.init();
        }

        ui.notifications.info(i18n("MonksLittleDetails.Next"));
        // play a sound
        if (volume() > 0 && !game.settings.get("monks-little-details", "disablesounds") && game.settings.get('monks-little-details', 'next-sound') != '')
            AudioHelper.play({ src: game.settings.get('monks-little-details', 'next-sound'), volume: volume() });
    }

    /**
    * Check if the current combatant needs to be updated
    */
    static checkCombatTurn(combat) {
        log('checking combat started', combat, combat?.started);
        if (combat && combat.started) {
            let entry = combat.combatant;

            /*
            // next combatant
            let nxtturn = (curCombat.turn || 0) + 1;
            if (nxtturn > curCombat.turns.length - 1) nxtturn = 0;

            //find the next one that hasn't been defeated
            let nxtentry = curCombat.turns[nxtturn];
            while (nxtentry.defeated && nxtturn != curCombat.turn) {
                nxtturn++;
                if (nxtturn > curCombat.turns.length - 1) nxtturn = 0;
                nxtentry = curCombat.turns[nxtturn];
            }*/

            let findNext = function (from) {
                let next = null;
                if (skip) {
                    for (let [i, t] of combat.turns.entries()) {
                        if (i <= from) continue;
                        if (t.defeated) continue;
                        if (t.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId)) continue;
                        next = i;
                        break;
                    }
                }
                else next = from + 1;

                return next;
            }

            // Determine the next turn number
            let skip = combat.settings.skipDefeated;
            let next = findNext(combat.turn);
            //if there wasn't one next after the current player, then start back at the beginning and try to find the next one
            if (next == undefined || next > combat.turns.length)
                next = findNext(-1);

            let isActive = entry.actor?.owner;
            let nxtentry = null;
            let isNext = false;

            if (next != null) {
                nxtentry = combat.turns[next];
                isNext = nxtentry.actor?.owner; //_id === game.users.current.character?._id;
            }

            log('Check combat turn', entry.name, nxtentry?.name, !game.user.isGM, isActive, isNext, entry, nxtentry);
            if (entry !== undefined && !game.user.isGM) {
                if (isActive) {
                    MonksLittleDetails.doDisplayTurn();
                } else if (isNext) {
                    MonksLittleDetails.doDisplayNext();
                }
            }
        }
    }

    static repositionCombat(app) {
        //we want to start the dialog in a different corner
        let sidebar = document.getElementById("sidebar");
        let players = document.getElementById("players");

        let butHeight = (!game.user.isGM && !app.combat.getCombatantByToken(app.combat.current.tokenId)?.owner ? 40 : 0);

        app.position.left = (combatposition().endsWith('left') ? 120 : (sidebar.offsetLeft - app.position.width));
        app.position.top = (combatposition().startsWith('top') ?
            (combatposition().endsWith('left') ? 70 : (sidebar.offsetTop - 3)) :
            (combatposition().endsWith('left') ? (players.offsetTop - app.position.height - 3) : (sidebar.offsetTop + sidebar.offsetHeight - app.position.height - 3)) - butHeight);
        $(app._element).css({ top: app.position.top, left: app.position.left });
    }

    static alterHUD(html) {
        if (MonksLittleDetails.canDo("alter-hud") && game.settings.get("monks-little-details", "alter-hud")) {
            $('.col.right .control-icon.effects .status-effects img', html).each(function () {
                let div = $('<div>')
                    .addClass('effect-control')
                    .toggleClass('active', $(this).hasClass('active'))
                    .attr('title', $(this).attr('title'))
                    .attr('data-status-id', $(this).attr('data-status-id'))
                    .attr('src', $(this).attr('src'))
                    .insertAfter(this)
                    .append($(this).removeClass('effect-control'))
                    .append($('<div>').html($(this).attr('title')).click(function (event) {
                        $(this).prev().click();
                        if (event.stopPropagation) event.stopPropagation();
                        if (event.preventDefault) event.preventDefault();
                        event.cancelBubble = true;
                        event.returnValue = false;
                        return false;
                    }));
                div[0].src = $(this).attr('src');
            });

            $('.col.right .control-icon.effects .status-effects', html).append(
                $('<div>').addClass('clear-all').html('<i class="fas fa-times-circle"></i> clear all').click($.proxy(MonksLittleDetails.clearAll, this))
            );
        }
    }

    static async clearAll() {
        //find the tokenhud, get the TokenHUD.object  ...assuming it's a token?
        let selectedEffects = $('#token-hud .col.right .control-icon.effects .status-effects .effect-control.active');
        for (let ctrl of selectedEffects) {
            let img = $('img', ctrl).get(0);
            if (img != undefined) {
                const effect = (img.dataset.statusId && MonksLittleDetails.tokenHUD.object.actor) ?
                    CONFIG.statusEffects.find(e => e.id === img.dataset.statusId) :
                    img.getAttribute("src");

                await MonksLittleDetails.tokenHUD.object.toggleEffect(effect);
            }
        };
    }

    static getCRText (cr) {
        switch (cr) {
            case 0.13: return '1/8';
            case 0.17: return '1/6';
            case 0.25: return '1/4';
            case 0.33: return '1/3';
            case 0.5: return '1/2';
            default: return cr;
        }
    }

    /*
    static getCRChallenge (data) {
        if (data.cr < data.apl) return 'easy';
        else if (data.cr === data.apl) return 'average';
        else if (data.cr === data.apl + 1) return 'challenging';
        else if (data.cr === data.apl + 2) return 'hard';
        else if (data.cr >= data.apl + 3) return 'epic';
        else return '';
    }

    static getCRChallengeName (data) {
        if (data.cr < data.apl) return i18n("MonksLittleDetails.easy");
        else if (data.cr === data.apl) return i18n("MonksLittleDetails.average");
        else if (data.cr === data.apl + 1) return i18n("MonksLittleDetails.challenging");
        else if (data.cr === data.apl + 2) return i18n("MonksLittleDetails.hard");
        else if (data.cr >= data.apl + 3) return i18n("MonksLittleDetails.epic");
        else return '';
    }*/

    static getCR(combat) {
        var apl = { count: 0, levels: 0 };
        var xp = 0;

        //get the APL of friendly combatants
        $(combat.data.combatants).each(function (idx, combatant) {
            if (combatant.actor != undefined) {
                if (combatant.token.disposition == 1) {
                    apl.count = apl.count + 1;
                    apl.levels = apl.levels + (combatant.actor.data.data.details.level.value || combatant.actor.data.data.details.level);
                } else {
                    xp += (combatant?.actor.data.data.details?.xp?.value || MonksLittleDetails.xpchart[Math.clamped(parseInt(combatant?.actor.data.data.details?.level?.value), 0, MonksLittleDetails.xpchart.length - 1)] || 0);
                }
            }
        });

        var calcAPL = 0;
        if (apl.count > 0)
            calcAPL = Math.round(apl.levels / apl.count) + (apl.count < 4 ? -1 : (apl.count > 5 ? 1 : 0));

        //get the CR of any unfriendly/neutral
        let cr = Math.clamped(MonksLittleDetails.xpchart.findIndex(cr => cr >= xp), 0, 29);

        return { cr: cr, apl: calcAPL };
    }

    static getDiceSound(hasMaestroSound = false) {
        const has3DDiceSound = game.dice3d ? game.settings.get("dice-so-nice", "settings").enabled : false;
        const playRollSounds = true; //game.settings.get("betterrolls5e", "playRollSounds")

        if (playRollSounds && !has3DDiceSound && !hasMaestroSound) {
            return CONFIG.sounds.dice;
        }

        return null;
    }

    static rgbToHex(r, g, b) {
        var componentToHex = function (c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }
        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    static createPixelArray(imgData, pixelCount, quality) {
        const pixels = imgData;
        const pixelArray = [];

        for (let i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality) {
            offset = i * 4;
            r = pixels[offset + 0];
            g = pixels[offset + 1];
            b = pixels[offset + 2];
            a = pixels[offset + 3];

            // If pixel is mostly opaque and not white
            if (typeof a === 'undefined' || a >= 125) {
                if (!(r > 250 && g > 250 && b > 250)) {
                    pixelArray.push([r, g, b]);
                }
            }
        }
        return pixelArray;
    }

    static getPalette(url) {
        // Create custom CanvasImage object
        MonksLittleDetails.canvasImage = new Image();
        MonksLittleDetails.canvasImage.addEventListener('load', () => {
            let canvas = document.createElement('canvas');
            let context = canvas.getContext('2d');
            let width = canvas.width = MonksLittleDetails.canvasImage.naturalWidth;
            let height = canvas.height = MonksLittleDetails.canvasImage.naturalHeight;
            if (width == 0 || height == 0)
                return;

            context.drawImage(MonksLittleDetails.canvasImage, 0, 0, width, height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const pixelCount = MonksLittleDetails.canvasImage.width * MonksLittleDetails.canvasImage.height;

            const pixelArray = MonksLittleDetails.createPixelArray(imageData.data, pixelCount, 10);

            canvas.remove();

            // Send array to quantize function which clusters values
            // using median cut algorithm
            const cmap = MMCQ.quantize(pixelArray, 5);
            const palette = cmap ? cmap.palette() : null;

            let element = $('.palette-fields');

            $(element).empty();
            for (let i = 0; i < palette.length; i++) {
                var hexCode = MonksLittleDetails.rgbToHex(palette[i][0], palette[i][1], palette[i][2]);
                $(element).append($('<div>').addClass('background-palette').attr('title', hexCode).css({ backgroundColor: hexCode }).on('click', $.proxy(MonksLittleDetails.updateSceneBackground, MonksLittleDetails, hexCode)));
            }

            //const dominantColor = palette[0];
        });
        MonksLittleDetails.canvasImage.src = url + '?' + new Date().getTime();
        MonksLittleDetails.canvasImage.setAttribute('crossOrigin', '');
    };
    /*
    static async createThumbnail(img) {
        const newImage = img !== undefined;

        // Load required textures to create the thumbnail
        img = img ?? this.data.img;
        const toLoad = [img];
        await TextureLoader.loader.load(toLoad);

        // First load the background texture to get dimensions
        const bg = img ? await loadTexture(img) : null;

        // Get the target dimensions for the canvas
        const dims = duplicate(this.data);
        if (newImage) {
            dims.width = bg.width;
            dims.height = bg.height;
        }
        const d = Canvas.getDimensions(dims);

        // Create a container and add a transparent graphic to enforce the size
        const c = new PIXI.Container();
        const g = c.addChild(new PIXI.Graphics());
        g.beginFill(0xFFFFFF, 0.0).drawRect(0, 0, d.sceneWidth, d.sceneHeight);

        // Add the background image
        if (bg) {
            const s = new PIXI.Sprite(bg);
            s.width = d.sceneWidth;
            s.height = d.sceneHeight;
            c.addChild(s);
        }

        // Render the container to a thumbnail
        return ImageHelper.createThumbnail(c, { width, height });
    }*/

    static async updateSceneBackground(hexCode) {
        await MonksLittleDetails.currentScene.update({ backgroundColor: hexCode });
    }

    static fixImages() {
        var dnd5emonsters = game.packs.get("dnd5e.monsters");
        dnd5emonsters.locked = false;

        dnd5emonsters.getContent().then(entries => {
            debugger;
            for (var i = 0; i < entries.length; i++) {
                var entry = entries[i];
                var montype = entry.data.data.details.type.toLowerCase();
                montype = montype.replace(/\(.*\)/, '').replace(/\s/g, '');
                var monname = entry.name.toLowerCase();
                if (monname.startsWith('ancient'))
                    monname = monname.replace('ancient', '');
                if (monname.startsWith('adult'))
                    monname = monname.replace('adult', '');
                if (monname.startsWith('young'))
                    monname = monname.replace('young', '');
                monname = monname.replace(/\s/g, '').replace(/-/g, '').replace(/'/g, '').replace(/\(.*\)/, '');

                var imgname = 'images/avatar/dnd/' + montype + '/' + monname + '.png';
                if (entry.data.img != imgname) {
                    var data = { _id: entry._id, img: imgname };
                    var fetchname = window.location.protocol + "//" + window.location.host + '/' + imgname;
                    $.get(imgname)
                        .done(function () {
                            // Do something now you know the image exists.
                            xhr.dnd5emonsters.updateEntity(xhr.entity);
                        }).fail(function () {
                            // Image doesn't exist - do something else.

                        });
                    /*
                    let xhr = new XMLHttpRequest();
                    xhr.dnd5emonsters = dnd5emonsters;
                    xhr.entity = data;
                    xhr.onload = () => {
                        if (xhr.status == 200) {
                            xhr.dnd5emonsters.updateEntity(xhr.entity);
                            log('Fixing:' + xhr.entity.img);
                        } else {
                            log('Image does not exist:' + xhr.entity.img);
                        }
                    };
                    xhr.open('HEAD', fetchname);
                    xhr.send();*/
                }

                /*
                var tokentype = 'overhead';
                var tokenname = 'images/tokens/' + tokentype + '/' + montype + '/' + monname + '.png';
                if (entry.data.token.img != '' && entry.data.token.img != tokenname) {
                    var data = { _id: entry._id, token: { img: tokenname } };
                    var fetchname = window.location.protocol + "//" + window.location.host + '/' + tokenname;
                    var img = new Image();
                    img.dnd5emonsters = dnd5emonsters;
                    img.entity = data;
                    img.tokentype = tokentype;
                    img.montype = montype;
                    img.monname = monname;

                    img.onload = function () {
                        this.dnd5emonsters.updateEntity(this.entity);
                        console.log('Fixing token:' + this.entity.token.img);
                    }

                    img.onerror = function () {
                        if (this.tokentype == 'overhead')
                            this.tokentype = 'disc';
                        else if (this.tokentype == 'disc')
                            this.tokentype = 'artwork';
                        else
                            return;
                        var tokenname = 'images/tokens/' + this.tokentype + '/' + this.montype + '/' + this.monname + '.png';
                        this.entity.token.img = tokenname;
                        this.src = tokenname;
                    }
                    img.src = fetchname;
                }*/
                /*
                var token = new Image();
                token.onload = function(){
                    dnd5emonsters.updateEntity({
                        _id:entry._id,
                        token:{img:tokenname}
                    });
                }
                token.src = tokenname;
                */
            }
        });
    }

    static toggleTurnMarker(token, visible) {
        if (token) {
            if (token.turnmarker == undefined) {
                loadTexture("modules/monks-little-details/icons/turnmarker.png").then((tex) => { //"modules/monks-little-details/img/chest.png"
                    if (token.turnmarker == undefined) {
                        const icon = new PIXI.Sprite(tex);
                        icon.pivot.set(icon.width / 2, icon.height / 2);//.set(-(token.w / 2), -(token.h / 2));
                        const size = Math.max(token.w, token.h) * 1.5;
                        icon.width = icon.height = size;
                        icon.position.set(token.w / 2, token.h / 2);
                        icon.alpha = 0.8;
                        token.turnmarker = icon;
                        token.addChildAt(token.turnmarker, 0);
                    }
                    token.turnmarker.visible = visible;
                });
            } else
                token.turnmarker.visible = visible;

            if (visible)
                MonksLittleDetails.turnMarkerAnim[token.id] = token;
            else
                delete MonksLittleDetails.turnMarkerAnim[token.id];

            if (!MonksLittleDetails._animate && Object.keys(MonksLittleDetails.turnMarkerAnim).length != 0) {
                MonksLittleDetails._animate = MonksLittleDetails.animateMarkers.bind(this);
                canvas.app.ticker.add(MonksLittleDetails._animate);
            } else if (MonksLittleDetails._animate != undefined && Object.keys(MonksLittleDetails.turnMarkerAnim).length == 0) {
                canvas.app.ticker.remove(MonksLittleDetails._animate);
                delete MonksLittleDetails._animate;
            }
        }
    }

    static removeTurnMarker(token) {
        if (token?.turnmarker) {
            token.removeChild(token.turnmarker);
            delete token.turnmarker;
        }
        delete MonksLittleDetails.turnMarkerAnim[token.id];
    }

    static animateMarkers(dt) {
        let interval = 500;
        for (const [key, token] of Object.entries(MonksLittleDetails.turnMarkerAnim)) {
            if (token && token.turnmarker) {
                let delta = interval / 10000;
                try {
                    token.turnmarker.rotation += (delta * dt);
                } catch (err) {
                    // skip lost frames if the tile is being updated by the server
                }
            }
        }
    }
}

/**
 * Assorted hooks
 */
/* ------------------------------------ */
/* Initialize module					*/
/* ------------------------------------ */
Hooks.once('init', async function () {
    log('Initializing Monks Little Details');
    // Assign custom classes and constants here
    // Register custom module settings
    MonksLittleDetails.init();

    if (setting("token-combat-highlight")) {
        Hooks.on("updateCombatant", function (context, parentId, data) {
            const combat = game.combats.get(parentId);
            if (combat) {
                const combatant = combat.data.combatants.find((o) => o.id === data.id);
                let token = canvas.tokens.get(combatant.token._id);
                MonksLittleDetails.toggleTurnMarker(token, token.id == combat.current.tokenId);
            }
        });

        /**
         * Handle combatant delete
         */
        Hooks.on("deleteCombatant", function (context, parentId, data) {
            let combat = game.combats.get(parentId);
            if (combat) {
                const combatant = combat.data.combatants.find((o) => o.id === data.id);
                let token = canvas.tokens.get(combatant.token._id);
                MonksLittleDetails.removeTurnMarker(token);
            }
        });

        /**
         * Handle combatant added
         */
        Hooks.on("addCombatant", function (context, parentId, data) {
            let combat = game.combats.get(parentId);
            if (combat) {
                let combatant = combat.data.combatants.find((o) => o.id === data.id);
                let token = canvas.tokens.get(combatant.token._id);
                MonksLittleDetails.toggleTurnMarker(token, token.id == combat.current.tokenId);
            }
        });

        Hooks.on("updateToken", function (scene, tkn, data, options, userid) {
            let token = canvas.tokens.get(tkn._id);
            if (data.img != undefined) {
                let activeCombats = game.combats.filter(c => {
                    return c?.scene?.id == game.scenes.viewed.id && c.started;
                });
                let activeTokens = activeCombats.map(c => { return c.current.tokenId });

                if (activeTokens.includes(token.id)) {
                    setTimeout(function () {
                        MonksLittleDetails.removeTurnMarker(token);
                        MonksLittleDetails.toggleTurnMarker(token, true);
                    }, 100);
                }
            }
        });

        Hooks.on("updateScene", function (scene, data, options, userid) {
            if (scene.isView) {
                let activeCombats = game.combats.filter(c => {
                    return c?.scene?.id == scene.id && c.started;
                });

                if (activeCombats.length) {
                    for (let combat of activeCombats) {
                        let token = canvas.tokens.get(combat.current.tokenId);
                        MonksLittleDetails.toggleTurnMarker(token, true);
                    }
                }
            }
        });
    }
});
/**
 * Handle combatant update
 */
Hooks.on("updateCombatant", function (context, parentId, data) {
    const combat = game.combats.get(parentId);
    if (combat) {
        const combatant = combat.data.combatants.find((o) => o.id === data.id);

        if (combatant.actor.owner)
            MonksLittleDetails.checkCombatTurn(combat);
    }
});

/**
 * Handle combatant delete
 */
Hooks.on("deleteCombatant", function (context, parentId, data) {
    let combat = game.combats.get(parentId);
    MonksLittleDetails.checkCombatTurn(combat);
});

/**
 * Handle combatant added
 */
Hooks.on("addCombatant", function (context, parentId, data) {
    let combat = game.combats.get(parentId);
    let combatant = combat.data.combatants.find((o) => o.id === data.id);

    if (combatant.actor.owner) 
        MonksLittleDetails.checkCombatTurn(combat);
});

/**
 * Combat update hook
 */

Hooks.on("createCombat", function (data, delta) {
    if (game.user.isGM && ui.sidebar.activeTab !== "combat")
        ui.sidebar.activateTab("combat");
});

Hooks.on("deleteCombat", function (combat) {
    MonksLittleDetails.tracker = false;   //if the combat gets deleted, make sure to clear this out so that the next time the combat popout gets rendered it repositions the dialog

    if (game.combats.combats.length == 0 && game.settings.get("monks-little-details", 'close-combat-when-done')) {
        const tabApp = ui["combat"];
        if (tabApp._popout != undefined) {
            MonksLittleDetails.closeCount = 0;
            MonksLittleDetails.closeTimer = setInterval(function () {
                MonksLittleDetails.closeCount++;
                const tabApp = ui["combat"];
                if (MonksLittleDetails.closeCount > 100 || tabApp._popout == undefined) {
                    clearInterval(MonksLittleDetails.closeTimer);
                    return;
                }

                const states = tabApp?._popout.constructor.RENDER_STATES;
                if (![states.CLOSING, states.RENDERING].includes(tabApp?._popout._state)) {
                    tabApp?._popout.close();
                    clearInterval(MonksLittleDetails.closeTimer);
                }
            }, 100);
        }
    }

    if (combat.started == true) {
        if (setting("token-combat-highlight")) {
            for (let combatant of combat.combatants) {
                let token = canvas.tokens.get(combatant.token._id);
                MonksLittleDetails.removeTurnMarker(token);
            }
        }
    }
});

Hooks.on("updateCombat", function (combat, delta) {
    MonksLittleDetails.checkCombatTurn(combat);

    log("update combat", combat);
    let opencombat = game.settings.get("monks-little-details", "opencombat");
    if ((opencombat == "everyone" || (game.user.isGM && opencombat == "gmonly") || (!game.user.isGM && opencombat == "playersonly"))
        && !game.settings.get("monks-little-details", "disable-opencombat")
        && delta.round === 1 && combat.turn === 0 && combat.started === true) {
		//new combat, pop it out
		const tabApp = ui["combat"];
		tabApp.renderPopout(tabApp);
		
        if (ui.sidebar.activeTab !== "chat")
            ui.sidebar.activateTab("chat");
    }

    if (combatposition() !== '' && delta.active === true) {
        //+++ make sure if it's not this players turn and it's not the GM to add padding for the button at the bottom
        MonksLittleDetails.tracker = false;   //delete this so that the next render will reposition the popout, changing between combats changes the height
    }

    if (!game.user.isGM && volume() > 0 && !game.settings.get("monks-little-details", "disablesounds") && game.settings.get('monks-little-details', 'round-sound') && Object.keys(delta).some((k) => k === "round")) {
		AudioHelper.play({
            src: game.settings.get('monks-little-details', 'round-sound'),
		    volume: volume()
		});
    }

    if (setting("token-combat-highlight")) {
        for (let combatant of combat.combatants) {
            let token = canvas.tokens.get(combatant.token._id);
            MonksLittleDetails.toggleTurnMarker(token, token.id == combat?.current?.tokenId);
        }
        //let token = canvas?.tokens.get(combat?.current?.tokenId);
        //MonksLittleDetails.removeTurnMarker(token);
        //MonksLittleDetails.toggleTurnMarker(token, true);
    }
});

/**
 * Ready hook
 */
Hooks.on("ready", MonksLittleDetails.ready);

Hooks.on("canvasReady", () => {
    canvas.stage.on("mousedown", MonksLittleDetails.moveTokens);    //move all tokens while holding down m
});

Hooks.on('renderCombatTracker', async (app, html, options) => {
    if (!MonksLittleDetails.tracker && app.options.id == "combat-popout"){
        MonksLittleDetails.tracker = true;
		
		if(combatposition() !== ''){
            MonksLittleDetails.repositionCombat(app);
		}
	}
});

Hooks.on('closeCombatTracker', async (app, html) => {
    MonksLittleDetails.tracker = false;
});

Hooks.on('renderTokenHUD', async (app, html, options) => {
    MonksLittleDetails.element = html;
    MonksLittleDetails.tokenHUD = app;
    if (game.settings.get("monks-little-details", "swap-buttons")) {
        $('.col.left .control-icon.target', html).insertBefore($('#token-hud .col.left .control-icon.config'));
    }

    if (app.object.actor.data.flags['monks-little-details'] != undefined && game.settings.get("monks-little-details", "actor-sounds")) {
        $('.col.right', html).append(
            $('<div>').addClass('control-icon sound-effect')
                .append('<img src="modules/monks-little-details/icons/volumeup.svg" width="36" height="36" title="Play Sound Effect">')
                .click($.proxy(MonksLittleDetails.loadSoundEffect, app.object)));
    }
});

Hooks.on('renderCombatTracker', async (app, html, options) => {
    if (game.user.isGM && game.combat && !game.combat.started && game.settings.get("monks-little-details", 'show-combat-cr') && MonksLittleDetails.canDo('show-combat-cr') && MonksLittleDetails.xpchart != undefined) {
        //calculate CR
        let data = MonksLittleDetails.getCR(game.combat);

        if ($('#combat-round .encounter-cr-row').length == 0 && game.combat.data.combatants.length > 0) {
            let crChallenge = MonksLittleDetails.crChallenge[Math.clamped(data.cr - data.apl, -1, 3) + 1];
            let epicness = Math.clamped((data.cr - data.apl - 3), 0, 5);

            $('<nav>').addClass('encounters flexrow encounter-cr-row')
                .append($('<h3>').html('CR: ' + MonksLittleDetails.getCRText(data.cr)))
                .append($('<div>').addClass('encounter-cr').attr('rating', crChallenge.rating).html(i18n(crChallenge.text) + "!".repeat(epicness)))
                .insertAfter($('#combat-round .encounters:last'));
        }
    }

    if (game.combat == undefined) {
        //+++ if the sound module is active
        $('#combat-round h3', html).css({ fontSize: '16px', lineHeight: '15px'});
    }

    if (!game.user.isGM && game.combat && game.combat.started) {
        $('.combat-control[data-control="previousTurn"],.combat-control[data-control="nextTurn"]:last').css({visibility:'hidden'});
    }
});

Hooks.on('renderSceneConfig', async (app, html, options) => {
    if (game.settings.get("monks-little-details", 'scene-palette')) {
        MonksLittleDetails.currentScene = app.object;

        if (MonksLittleDetails.currentScene.img != undefined) {
            let backgroundColor = $('input[name="backgroundColor"]').parents('.form-group:first');

            $('<div>')
                .addClass('form-group')
                .append($('<label>').html('Background Palette'))
                .append($('<div>').addClass('form-fields palette-fields'))
                .insertAfter(backgroundColor);

            MonksLittleDetails.getPalette(MonksLittleDetails.currentScene.img);
            //get dimensions
            /*
            loadTexture(MonksLittleDetails.currentScene.img).then((bg) => {
                if (bg != undefined) {
                    $('.background-size.width').html(bg.width);
                    $('.background-size.height').html(bg.height);
                }
            });*/
        }

        /*
        $('<div>')
            .addClass('background-size width')
            .insertAfter($('input[name="width"]'));
        $('<div>')
            .addClass('background-size height')
            .insertAfter($('input[name="height"]'));
            */

        $('input.image[name="img"]').on('change', function () {
            let img = $(this).val();
            MonksLittleDetails.getPalette(img);
            /*
            loadTexture(img).then((bg) => {
                if (bg != undefined) {
                    $('.background-size.width').html(bg.width);
                    $('.background-size.height').html(bg.height);
                }
            });*/
        })
    }
});

Hooks.on("getSceneControlButtons", (controls) => {
    if (game.settings.get('monks-little-details', 'show-drag-points-together')) {
        const dragtogetherTools = [{
            name: "toggledragtogether",
            title: "Drag points together",
            icon: "fas fa-angle-double-right",
            toggle: true,
            active: true
        }];
        let wallTools = controls.find(control => control.name === "walls").tools;
        wallTools.splice(wallTools.findIndex(e => e.name === 'clone') + 1, 0, ...dragtogetherTools);
    }
});

Hooks.on("preUpdateWall", (scene, wall, update, options) => {
    let dragtogether = ui.controls.control.tools.find(t => { return t.name == "toggledragtogether" });
    if (dragtogether != undefined && dragtogether.active && options.ignore == undefined) {
        let updates = [];
        let oldcoord = ((wall.c[0] != update.c[0] || wall.c[1] != update.c[1]) && wall.c[2] == update.c[2] && wall.c[3] == update.c[3] ? [wall.c[0], wall.c[1], update.c[0], update.c[1]] :
            ((wall.c[2] != update.c[2] || wall.c[3] != update.c[3]) && wall.c[0] == update.c[0] && wall.c[1] == update.c[1] ? [wall.c[2], wall.c[3], update.c[2], update.c[3]] : null));
        if (oldcoord != null) {
            scene.data.walls.forEach(w => {
                if (w._id != wall._id) {
                    if (w.c[0] == oldcoord[0] && w.c[1] == oldcoord[1])
                        //scene.updateEmbeddedEntity("Wall", { c: [oldcoord[2], oldcoord[3], w.c[2], w.c[3]], _id: w._id }, { ignore: true });
                        updates.push({ c: [oldcoord[2], oldcoord[3], w.c[2], w.c[3]], _id: w._id });
                    else if (w.c[2] == oldcoord[0] && w.c[3] == oldcoord[1])
                        //scene.updateEmbeddedEntity("Wall", { c: [w.c[0], w.c[1], oldcoord[2], oldcoord[3]], _id: w._id }, { ignore: true });
                        updates.push({ c: [w.c[0], w.c[1], oldcoord[2], oldcoord[3]], _id: w._id });
                }
            });
        }
        if(updates.length)
            scene.updateEmbeddedEntity("Wall", updates, { ignore: true });
    }
    //let thewall = scene.data.walls.find(w => w._id === wall._id);
    //log('preupdatewall', thewall.c, wall.c, update);
});

Hooks.on("updateWall", (scene, wall, update, options) => {
    //let thewall = scene.data.walls.find(w => w._id === wall._id);
    //log('updatewall', thewall);
});

Hooks.on("renderSettingsConfig", (app, html, data) => {
    let btn = $('<button>')
        .addClass('file-picker')
        .attr('type', 'button')
        .attr('data-type', "imagevideo")
        .attr('data-target', "img")
        .attr('title', "Browse Files")
        .attr('tabindex', "-1")
        .html('<i class="fas fa-file-import fa-fw"></i>')
        .click(function (event) {
            const fp = new FilePicker({
                type: "audio",
                current: $(event.currentTarget).prev().val(),
                callback: path => {
                    $(event.currentTarget).prev().val(path);
                }
            });
            return fp.browse();
        });

    btn.clone(true).insertAfter($('input[name="monks-little-details.next-sound"]', html));
    btn.clone(true).insertAfter($('input[name="monks-little-details.turn-sound"]', html));
    btn.clone(true).insertAfter($('input[name="monks-little-details.round-sound"]', html));
});
