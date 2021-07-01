import { registerSettings } from "./settings.js";
import { MMCQ } from "./quantize.js";
import { WithMonksCombatTracker } from "./apps/combattracker.js"
//import { MonksPlaylistConfig } from "./apps/monksplaylistconfig.js"

export let debug = (...args) => {
    if (debugEnabled > 1) console.log("DEBUG: monks-little-details | ", ...args);
};
export let log = (...args) => console.log("monks-little-details | ", ...args);
export let warn = (...args) => console.warn("monks-little-details | ", ...args);
export let error = (...args) => console.error("monks-little-details | ", ...args);
export let i18n = key => {
    return game.i18n.localize(key);
};
export let setting = key => {
    return game.settings.get("monks-little-details", key);
};
/*
export let volume = () => {
    return game.settings.get("monks-little-details", "volume") / 100.0;
};*/
export let combatposition = () => {
    return game.settings.get("monks-little-details", "combat-position");
};

export class MonksLittleDetails {
    static tracker = false;
    static turnMarkerAnim = {};
    static tokenHUDimages = {};

    static canDo(setting) {
        //needs to not be on the reject list, and if there is an only list, it needs to be on it.
        if (MonksLittleDetails._rejectlist[setting] != undefined && MonksLittleDetails._rejectlist[setting].includes(game.system.id))
            return false;
        if (MonksLittleDetails._onlylist[setting] != undefined && !MonksLittleDetails._onlylist[setting].includes(game.system.id))
            return false;
        return true;
    };

    static canViewCombatMode(mode) {
        if (mode === CONST.TOKEN_DISPLAY_MODES.NONE) return false;
        else if (mode === CONST.TOKEN_DISPLAY_MODES.ALWAYS) return true;
        else if (mode === CONST.TOKEN_DISPLAY_MODES.CONTROL) return this.isOwner;
        else if (mode === CONST.TOKEN_DISPLAY_MODES.HOVER) return true;
        else if (mode === CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER) return this.isOwner;
        else if (mode === CONST.TOKEN_DISPLAY_MODES.OWNER) return this.isOwner;
        return false;
    }

    static init() {
        log("initializing");

        //CONFIG.Playlist.sheetClass = MonksPlaylistConfig;

        if (game.MonksLittleDetails == undefined)
            game.MonksLittleDetails = MonksLittleDetails;

        MonksLittleDetails.SOCKET = "module.monks-little-details";

        MonksLittleDetails.READY = true;

        MonksLittleDetails.availableGlyphs = '!"#$%&\'()*+,-./01234568:;<=>?@ABDEFGHIKMNOPQRSTUVWX[\\]^_`acdfhoquvx|}~¢£¥§©ª«¬®°±¶·º¿ÀÁÂÄÅÆÈÉÊËÌÏÑÒÓÔÖØÙÚÜßàáâåæçéêëìíîïñòõ÷øùûüÿiœŸƒπ';

        if (game.system.id == 'dnd5e')
            MonksLittleDetails.xpchart = CONFIG.DND5E.CR_EXP_LEVELS;
        else if (game.system.id == 'pf2e') {
            MonksLittleDetails.xpchart = [50, 400, 600, 800, 1200, 1600, 2400, 3200, 4800, 6400, 9600, 12800, 19200, 25600, 38400, 51200, 76800, 102400, 153600, 204800, 307200, 409600, 614400, 819200, 1228800, 1638400, 2457600, 3276800, 4915200, 6553600, 9830400];
        }

        MonksLittleDetails.crChallenge = [
            { text: "MonksLittleDetails.easy", rating: 'easy' },
            { text: "MonksLittleDetails.average", rating: 'average' },
            { text: "MonksLittleDetails.challenging", rating: 'challenging' },
            { text: "MonksLittleDetails.hard", rating: 'hard' },
            { text: "MonksLittleDetails.epic", rating: 'epic' }
        ];

        MonksLittleDetails._rejectlist = {
            //"alter-hud": ["pf2e"]
        }
        MonksLittleDetails._onlylist = {
            "sort-by-columns": ["dnd5e"],
            "show-combat-cr": ["dnd5e", "pf2e"]
        }

        registerSettings();

        MonksLittleDetails.injectCSS();

        if (MonksLittleDetails.canDo("change-invisible-image") && setting("change-invisible-image"))
            CONFIG.controlIcons.visibility = "modules/monks-little-details/icons/invisible.svg";

        if (MonksLittleDetails.canDo("add-extra-statuses") && setting("add-extra-statuses")) {
            CONFIG.statusEffects = CONFIG.statusEffects.concat(
                [
                    { "id": "charmed", "label": "MonksLittleDetails.StatusCharmed", "icon": "modules/monks-little-details/icons/smitten.svg" },
                    { "id": "exhausted", "label": "MonksLittleDetails.StatusExhausted", "icon": "modules/monks-little-details/icons/oppression.svg" },
                    { "id": "grappled", "label": "MonksLittleDetails.StatusGrappled", "icon": "modules/monks-little-details/icons/grab.svg" },
                    { "id": "incapacitated", "label": "MonksLittleDetails.StatusIncapacitated", "icon": "modules/monks-little-details/icons/internal-injury.svg" },
                    { "id": "invisible", "label": "MonksLittleDetails.StatusInvisible", "icon": "modules/monks-little-details/icons/invisible.svg" },
                    { "id": "petrified", "label": "MonksLittleDetails.StatusPetrified", "icon": "modules/monks-little-details/icons/stone-pile.svg" },
                    { "id": "hasted", "label": "MonksLittleDetails.StatusHasted", "icon": "modules/monks-little-details/icons/running-shoe.svg" },
                    { "id": "slowed", "label": "MonksLittleDetails.StatusSlowed", "icon": "modules/monks-little-details/icons/turtle.svg" },
                    { "id": "concentration", "label": "MonksLittleDetails.StatusConcentrating", "icon": "modules/monks-little-details/icons/beams-aura.svg" },
                    { "id": "rage", "label": "MonksLittleDetails.StatusRage", "icon": "modules/monks-little-details/icons/enrage.svg" },
                    { "id": "distracted", "label": "MonksLittleDetails.StatusDistracted", "icon": "modules/monks-little-details/icons/distraction.svg" },
                    { "id": "dodging", "label": "MonksLittleDetails.StatusDodging", "icon": "modules/monks-little-details/icons/dodging.svg" },
                    { "id": "disengage", "label": "MonksLittleDetails.StatusDisengage", "icon": "modules/monks-little-details/icons/journey.svg" },
                    { "id": "cover", "label": "MonksLittleDetails.StatusCover", "icon": "modules/monks-little-details/icons/push.svg" }
                ]
            );
        }

        /*if (setting('context-view-artwork')) {
            let oldContextMenuOptions = Compendium.prototype._getContextMenuOptions;
            Compendium.prototype._contextMenu = function (html) {

                let compendium = this;
                new ContextMenu(html, ".directory-item", [
                    {
                        name: "View Scene Artwork",
                        icon: '<i class="fas fa-image fa-fw"></i>',
                        condition: li => compendium.entity == 'Scene',
                        callback: li => {
                            let entryId = li.attr('data-entry-id');
                            this.getEntity(entryId).then(entry => {
                                let img = entry.data.img;
                                if (VideoHelper.hasVideoExtension(img))
                                    ImageHelper.createThumbnail(img, { width: entry.data.width, height: entry.data.height }).then(img => {
                                        new ImagePopout(img.thumb, {
                                            title: entry.name,
                                            shareable: true,
                                            uuid: entry.uuid
                                        }).render(true);
                                    });
                                else {
                                    new ImagePopout(img, {
                                        title: entry.name,
                                        shareable: true,
                                        uuid: entry.uuid
                                    }).render(true);
                                }
                            });
                        }
                    },
                    {
                        name: "COMPENDIUM.ImportEntry",
                        icon: '<i class="fas fa-download"></i>',
                        callback: li => {
                            const entryId = li.attr('data-entry-id');
                            const entities = this.cls.collection;
                            return entities.importFromCollection(this.collection, entryId, {}, { renderSheet: true });
                        }
                    },
                    {
                        name: "COMPENDIUM.DeleteEntry",
                        icon: '<i class="fas fa-trash"></i>',
                        callback: li => {
                            let entryId = li.attr('data-entry-id');
                            this.getEntity(entryId).then(entry => {
                                return Dialog.confirm({
                                    title: `${game.i18n.localize("COMPENDIUM.DeleteEntry")} ${entry.name}`,
                                    content: game.i18n.localize("COMPENDIUM.DeleteConfirm"),
                                    yes: () => this.deleteEntity(entryId),
                                });
                            });
                        }
                    }
                ]);
            }
        }*/

        if (game.settings.get("monks-little-details", "alter-hud")) {
            let tokenHUDRender = function (wrapped, ...args) {
                let result = wrapped(...args).then((a, b) => {
                    MonksLittleDetails.alterHUD.call(this, MonksLittleDetails.element);
                    CONFIG.statusEffects = CONFIG.statusEffects.filter(e => e.id != "");
                });

                return result;
            }
            if (game.modules.get("lib-wrapper")?.active) {
                libWrapper.register("monks-little-details", "TokenHUD.prototype._render", tokenHUDRender, "WRAPPER");
            } else {
                const oldTokenHUDRender = TokenHUD.prototype._render;
                TokenHUD.prototype._render = function (event) {
                    return tokenHUDRender.call(this, oldTokenHUDRender.bind(this), ...arguments);
                }
            }

            let getStatusEffectChoices = function (wrapped, ...args) {
                CONFIG.statusEffects = CONFIG.statusEffects.sort(function (a, b) {
                    let aid = (a.label != undefined ? i18n(a.label) : a.id);
                    let bid = (b.label != undefined ? i18n(b.label) : b.id);
                    return (aid > bid ? 1 : (aid < bid ? -1 : 0));
                    //return (a.id == undefined || a.id > b.id ? 1 : (a.id < b.id ? -1 : 0)); //(a.label == undefined || i18n(a.label) > i18n(b.label) ? 1 : (i18n(a.label) < i18n(b.label) ? -1 : 0));
                });

                if (setting('sort-by-columns')) {
                    /*
                    let [blanks, temp] = CONFIG.statusEffects.partition(f => f.label != undefined);
                    let effects = [];
                    let mid = Math.ceil(temp.length / 4);
                    let offset = (4 - ((mid * 4) - temp.length));
                    for (let i = 0; i < mid; i++) {
                        for (let j = 0; j < 4; j++) {
                            let spot = (i + (mid * j) - (j > offset ? 1 : 0));
                            if (spot < temp.length) {
                                effects.push(temp[spot]);
                            }
                        }
                    }
                    CONFIG.statusEffects = effects.concat(blanks);
                    */
                    let effects = [];
                    let temp = CONFIG.statusEffects.filter(e => e.id != "");
                    let mid = Math.ceil(temp.length / 4);
                    for (let i = 0; i < mid; i++) {
                        for (let j = 0; j < 4; j++) {
                            let spot = i + (j * mid)
                            effects.push((spot < temp.length ? temp[spot] : { id: "", icon: "", label: "" }));
                        }
                    }
                    CONFIG.statusEffects = effects;
                }

                return wrapped(...args);
            }

            if (game.modules.get("lib-wrapper")?.active) {
                libWrapper.register("monks-little-details", "TokenHUD.prototype._getStatusEffectChoices", getStatusEffectChoices, "WRAPPER");
            } else {
                const oldGetStatusEffectChoices = TokenHUD.prototype._getStatusEffectChoices;
                TokenHUD.prototype._getStatusEffectChoices = function () {
                    return getStatusEffectChoices.call(this, oldGetStatusEffectChoices.bind(this), ...arguments);
                }
            }

            let refreshStatusIcons = function () {
                const effects = this.element.find(".status-effects")[0];
                const statuses = this._getStatusEffectChoices();
                for (let img of $('[src]', effects)) {
                    const status = statuses[img.getAttribute("src")] || {};
                    img.classList.toggle("overlay", !!status.isOverlay);
                    img.classList.toggle("active", !!status.isActive);
                }
            }

            if (game.modules.get("lib-wrapper")?.active) {
                libWrapper.register("monks-little-details", "TokenHUD.prototype.refreshStatusIcons", refreshStatusIcons, "OVERRIDE");
            } else {
                TokenHUD.prototype.refreshStatusIcons = function (event) {
                    return refreshStatusIcons.call(this);
                }
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

        if (setting('hide-enemies'))
            CONFIG.ui.combat = WithMonksCombatTracker(CONFIG.ui.combat);

        if (setting("show-bloodsplat")) {
            MonksLittleDetails.splatfont = new FontFace('WC Rhesus A Bta', "url('modules/monks-little-details/fonts/WCRhesusABta.woff2')");
            MonksLittleDetails.splatfont.load().then(() => {
                document.fonts.add(MonksLittleDetails.splatfont);
            });

            let oldTokenDrawOverlay = Token.prototype._drawOverlay;
            Token.prototype._drawOverlay = async function ({ src, tint } = {}) {
                if (((this.combatant && this.combatant.data.defeated) || this.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId) || this.data.overlayEffect == CONFIG.controlIcons.defeated) && this.actor?.data.type !== 'character') {
                    //this should be showing the bloodsplat, so don't show the skull overlay
                    return;
                } else
                    return oldTokenDrawOverlay.call(this, { src, tint });
            }
        }

        if (setting("show-bloodsplat") || setting('add-combat-bars')) {
            let tokenRefresh = function (wrapped, ...args) {
                wrapped.call(this);

                if (setting("show-bloodsplat")){
                    //find defeated state
                    let combatant = this.combatant;
                    if (((combatant && combatant.data.defeated) || this.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId) || this.data.overlayEffect == CONFIG.controlIcons.defeated) && this.actor?.data.type !== 'character') {
                        this.bars.visible = false;
                        for (let effect of this.effects.children) {
                            effect.alpha = 0;
                        }
                        if (this.actor?.getFlag("core", "sheetClass") != 'dnd5e.LootSheet5eNPC') {
                            if (this.data._id != undefined) {
                                this.icon.alpha = (game.user.isGM ? 0.2 : 0);
                                if (this.bloodsplat == undefined) {
                                    let glyph = this.document.getFlag('monks-little-details', 'glyph');
                                    if (glyph == undefined) {
                                        glyph = MonksLittleDetails.availableGlyphs.charAt(Math.floor(Math.random() * MonksLittleDetails.availableGlyphs.length));
                                        if (game.user.isGM)
                                            this.document.setFlag('monks-little-details', 'glyph', glyph);
                                    }

                                    this.bloodsplat = new PIXI.Text(' ' + glyph + ' ', { fontFamily: 'WC Rhesus A Bta', fontSize: this.h * 1.5, fill: 0xff0000, align: 'center' });
                                    this.bloodsplat.alpha = 0.7;
                                    this.bloodsplat.blendMode = PIXI.BLEND_MODES.OVERLAY;
                                    this.bloodsplat.anchor.set(0.5, 0.5);
                                    this.bloodsplat.x = this.w / 2;
                                    this.bloodsplat.y = this.h / 2;
                                    this.addChild(this.bloodsplat);

                                    log('Font: ', this.id, (this.h * 1.5), this.bloodsplat.x, this.bloodsplat.y);
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

                //if this token is part of a combat, then always show the bar, but at 0.5 opacity, unless controlled
                if (setting('add-combat-bars')) {
                    if (this.inCombat) {
                        let combatBar = this.document.getFlag('monks-little-details', 'displayBarsCombat');
                        if (combatBar != undefined && combatBar != -1) {
                            this.bars.visible = MonksLittleDetails.canViewCombatMode.call(this, combatBar);
                            this.bars.alpha = ((this._controlled && (combatBar == CONST.TOKEN_DISPLAY_MODES.CONTROL || combatBar == CONST.TOKEN_DISPLAY_MODES.OWNER || combatBar == CONST.TOKEN_DISPLAY_MODES.ALWAYS)) ||
                                (this._hover && (combatBar == CONST.TOKEN_DISPLAY_MODES.HOVER || combatBar == CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER)) ? 1 : 0.3);
                        }
                    } else
                        this.bars.alpha = 1;
                }
            }
            if (game.modules.get("lib-wrapper")?.active) {
                libWrapper.register("monks-little-details", "Token.prototype.refresh", tokenRefresh, "WRAPPER");
            } else {
                const oldTokenRefresh = Token.prototype.refresh;
                Token.prototype.refresh = function () {
                    return tokenRefresh.call(this, oldTokenRefresh.bind(this), ...arguments);
                }
            }
        }

        /*
        if (setting('add-combat-bars')) {
            let tokenRefresh = function (wrapped, ...args) {
                wrapped(...args);

                if (this.inCombat) {
                    let combatBar = this.document.getFlag('monks-little-details', 'displayBarsCombat');
                    if (combatBar != undefined && combatBar != -1) {
                        this.bars.visible = MonksLittleDetails.canViewCombatMode.call(this, combatBar);
                        this.bars.alpha = ((this._controlled && (combatBar == CONST.TOKEN_DISPLAY_MODES.CONTROL || combatBar == CONST.TOKEN_DISPLAY_MODES.OWNER || combatBar == CONST.TOKEN_DISPLAY_MODES.ALWAYS)) ||
                            (this._hover && (combatBar == CONST.TOKEN_DISPLAY_MODES.HOVER || combatBar == CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER)) ? 1 : 0.3);
                    }
                } else
                    this.bars.alpha = 1;
            }

            if (game.modules.get("lib-wrapper")?.active) {
                libWrapper.register("monks-little-details", "Token.prototype.refresh", tokenRefresh, "WRAPPER");
            } else {
                const oldTokenRefresh = Token.prototype.refresh;
                Token.prototype.refresh = function () {
                    return tokenRefresh.call(this, oldTokenRefresh.bind(this), ...arguments);
                }
            }
        }*/

        if (game.settings.get("monks-little-details", "show-notify")) {
            let chatLogNotify = function (...args) {
                let message = args[0]
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

            if (game.modules.get("lib-wrapper")?.active) {
                libWrapper.register("monks-little-details", "ChatLog.prototype.notify", chatLogNotify, "OVERRIDE");
            } else {
                ChatLog.prototype.notify = function (event) {
                    return chatLogNotify.call(this, ...arguments);
                }
            }
        }

        /*
        let oldSync = AmbientSound.prototype.sync;
        AmbientSound.prototype.sync = function sync(isAudible, volume, options) {
            let result = oldSync.call(this, isAudible, volume, options);

            let delay = this.document.getFlag('monks-little-details', 'loop-delay');
            if (delay && delay != 0) {
                this.sound.loop = false;

                if (delay > 0) {
                    if (this.sound.loopdelay == null) {
                        $(this.sound).on('ended', function () {
                            this.sound.loopdelay = window.setTimeout(function () {
                                this.sound.play();
                            }, delay * 1000);
                        });
                    }
                }
            }

            return result;
        }*/

        let wallDragStart = function (wrapped, ...args) {
            let result = wrapped(...args);

            let event = args[0];

            let dragtogether = ui.controls.control.tools.find(t => { return t.name == "toggledragtogether" });
            if (dragtogether != undefined && dragtogether.active) {
                MonksLittleDetails.dragpoints = [];
                let fixed = event.data.fixed;
                let oldcoord = (fixed ? this.coords.slice(0, 2) : this.coords.slice(2, 4));
                if (oldcoord != null) {
                    this.scene.data.walls.forEach(w => {
                        if (w.id != this.id) {
                            if (w.data.c[0] == oldcoord[0] && w.data.c[1] == oldcoord[1])
                                //scene.updateEmbeddedEntity("Wall", { c: [oldcoord[2], oldcoord[3], w.c[2], w.c[3]], _id: w._id }, { ignore: true });
                                MonksLittleDetails.dragpoints.push({ wall: w.object, fixed: 1 });
                            else if (w.data.c[2] == oldcoord[0] && w.data.c[3] == oldcoord[1])
                                //scene.updateEmbeddedEntity("Wall", { c: [w.c[0], w.c[1], oldcoord[2], oldcoord[3]], _id: w._id }, { ignore: true });
                                MonksLittleDetails.dragpoints.push({ wall: w.object, fixed: 0 });
                        }
                    });
                }
            }

            return result;
        }
        if (game.modules.get("lib-wrapper")?.active) {
            libWrapper.register("monks-little-details", "Wall.prototype._onDragLeftStart", wallDragStart, "WRAPPER");
        } else {
            const oldWallDragStart = Wall.prototype._onDragLeftStart;
            Wall.prototype._onDragLeftStart = function (event) {
                return wallDragStart.call(this, oldWallDragStart.bind(this), ...arguments);
            }
        }

        /*
        let oldWallDragStart = Wall.prototype._onDragLeftStart;
        Wall.prototype._onDragLeftStart = function (event) {
            let result = oldWallDragStart.call(this, event);

            let dragtogether = ui.controls.control.tools.find(t => { return t.name == "toggledragtogether" });
            if (dragtogether != undefined && dragtogether.active) {
                MonksLittleDetails.dragpoints = [];
                let fixed = event.data.fixed;
                let oldcoord = (fixed ? this.coords.slice(0, 2) : this.coords.slice(2, 4));
                if (oldcoord != null) {
                    this.scene.data.walls.forEach(w => {
                        if (w.id != this.id) {
                            if (w.data.c[0] == oldcoord[0] && w.data.c[1] == oldcoord[1])
                                //scene.updateEmbeddedEntity("Wall", { c: [oldcoord[2], oldcoord[3], w.c[2], w.c[3]], _id: w._id }, { ignore: true });
                                MonksLittleDetails.dragpoints.push({ wall: w.object, fixed: 1 });
                            else if (w.data.c[2] == oldcoord[0] && w.data.c[3] == oldcoord[1])
                                //scene.updateEmbeddedEntity("Wall", { c: [w.c[0], w.c[1], oldcoord[2], oldcoord[3]], _id: w._id }, { ignore: true });
                                MonksLittleDetails.dragpoints.push({ wall: w.object, fixed: 0 });
                        }
                    });
                }
            }

            return result;
        }*/

        let wallDragMove = function (wrapped, ...args) {
            let event = args[0];
            const { clones, destination, fixed, origin, originalEvent } = event.data;

            let dragtogether = ui.controls.control.tools.find(t => { return t.name == "toggledragtogether" });
            if (dragtogether != undefined && dragtogether.active && MonksLittleDetails.dragpoints?.length > 0 && clones.length === 1) {
                for (let dragpoint of MonksLittleDetails.dragpoints) {
                    const w = dragpoint.wall;
                    const pt = [destination.x, destination.y];
                    w.data.c = dragpoint.fixed ? pt.concat(w.coords.slice(2, 4)) : w.coords.slice(0, 2).concat(pt);
                    w._hover = false;
                    w.refresh();
                }
            }

            return wrapped(...args);
        }

        if (game.modules.get("lib-wrapper")?.active) {
            libWrapper.register("monks-little-details", "Wall.prototype._onDragLeftMove", wallDragMove, "WRAPPER");
        } else {
            const oldWallDragMove = Wall.prototype._onDragLeftMove;
            Wall.prototype._onDragLeftMove = function (event) {
                return wallDragMove.call(this, oldWallDragMove.bind(this), ...arguments);
            }
        }

        /*
        let oldWallDragMove = Wall.prototype._onDragLeftMove;
        Wall.prototype._onDragLeftMove = function (event) {
            const { clones, destination, fixed, origin, originalEvent } = event.data;

            let dragtogether = ui.controls.control.tools.find(t => { return t.name == "toggledragtogether" });
            if (dragtogether != undefined && dragtogether.active && MonksLittleDetails.dragpoints?.length > 0 && clones.length === 1 ) {
                for (let dragpoint of MonksLittleDetails.dragpoints) {
                    const w = dragpoint.wall;
                    const pt = [destination.x, destination.y];
                    w.data.c = dragpoint.fixed ? pt.concat(w.coords.slice(2, 4)) : w.coords.slice(0, 2).concat(pt);
                    w._hover = false;
                    w.refresh();
                }
            }

            return oldWallDragMove.call(this, event);
        }*/

        let wallDragDrop = function (wrapped, ...args) {
            let result = wrapped(...args);

            let event = args[0];

            const { clones, destination, fixed, originalEvent } = event.data;
            const layer = this.layer;
            const snap = layer._forceSnap || !originalEvent.shiftKey;

            const pt = this.layer._getWallEndpointCoordinates(destination, { snap });

            if (clones.length === 1 && MonksLittleDetails.dragpoints?.length > 0) {
                for (let dragpoint of MonksLittleDetails.dragpoints) {
                    const p0 = dragpoint.fixed ? dragpoint.wall.coords.slice(2, 4) : dragpoint.wall.coords.slice(0, 2);
                    const coords = dragpoint.fixed ? pt.concat(p0) : p0.concat(pt);
                    if ((coords[0] === coords[2]) && (coords[1] === coords[3])) {
                        return dragpoint.wall.document.delete(); // If we collapsed the wall, delete it
                    }
                    dragpoint.wall.document.update({ c: coords });
                }
                MonksLittleDetails.dragpoints = [];
            }

            return result;
        }

        if (game.modules.get("lib-wrapper")?.active) {
            libWrapper.register("monks-little-details", "Wall.prototype._onDragLeftDrop", wallDragDrop, "WRAPPER");
        } else {
            const oldWallDragDrop = Wall.prototype._onDragLeftDrop;
            Wall.prototype._onDragLeftDrop = function (event) {
                return wallDragDrop.call(this, oldWallDragDrop.bind(this), ...arguments);
            }
        }

        /*
        let oldWallDragDrop = Wall.prototype._onDragLeftDrop;
        Wall.prototype._onDragLeftDrop = function (event) {
            let result = oldWallDragDrop.call(this, event);
            const { clones, destination, fixed, originalEvent } = event.data;
            const layer = this.layer;
            const snap = layer._forceSnap || !originalEvent.shiftKey;

            const pt = this.layer._getWallEndpointCoordinates(destination, { snap });

            if (clones.length === 1 && MonksLittleDetails.dragpoints?.length > 0) {
                for (let dragpoint of MonksLittleDetails.dragpoints) {
                    const p0 = dragpoint.fixed ? dragpoint.wall.coords.slice(2, 4) : dragpoint.wall.coords.slice(0, 2);
                    const coords = dragpoint.fixed ? pt.concat(p0) : p0.concat(pt);
                    if ((coords[0] === coords[2]) && (coords[1] === coords[3])) {
                        return dragpoint.wall.document.delete(); // If we collapsed the wall, delete it
                    }
                    dragpoint.wall.document.update({ c: coords });
                }
                MonksLittleDetails.dragpoints = [];
            }

            return result;
        }*/
    }

    static ready() {
        game.settings.settings.get("monks-little-details.play-turn-sound").default = !game.user.isGM; //(game.user.isGM ? 0 : 60); //set the default when we have the users loaded
        game.settings.settings.get("monks-little-details.play-next-sound").default = !game.user.isGM;

        if(setting("actor-sounds"))
            MonksLittleDetails.injectSoundCtrls();

        MonksLittleDetails.checkCombatTurn(game.combats.active);

        game.socket.on('module.monks-little-details', MonksLittleDetails.onMessage);

        $('#sidebar-tabs a[data-tab="chat"]').on('click.monks-little-details', function (event) {
            let icon = $('#chat-notification');
            if(icon.is(":visible")) icon.fadeOut(100);
        });

        if (game.settings.get("monks-little-details", "key-swap-tool") && game.user.isGM) {
            if (!game.modules.get('lib-df-hotkeys')?.active) {
                ui.notifications.error(i18n("MonksLittleDetails.HotKeysWarning"));
                warn(i18n("MonksLittleDetails.HotKeysWarning"));
            } else {
                MonksLittleDetails.registerHotKeys();
            }
        }
    }

    static registerHotKeys() {
        Hotkeys.registerGroup({
            name: 'monks-little-details_tool-swap',
            label: 'Monks Litle Details, Tool Swap',
            description: 'Use these keys to swap between tools'
        });

        [
            { name: i18n("MonksLittleDetails.TokenLayer"), tool: 'token', def: Hotkeys.keys.KeyG },
            { name: i18n("MonksLittleDetails.MeasureLayer"), tool: 'measure', def: null },
            { name: i18n("MonksLittleDetails.TileLayer"), tool: 'tiles', def: Hotkeys.keys.KeyH },
            { name: i18n("MonksLittleDetails.DrawingLayer"), tool: 'drawings', def: null },
            { name: i18n("MonksLittleDetails.WallLayer"), tool: 'walls', def: null },
            { name: i18n("MonksLittleDetails.LightingLayer"), tool: 'lighting', def: Hotkeys.keys.KeyJ },
            { name: i18n("MonksLittleDetails.SoundLayer"), tool: 'sounds', def: Hotkeys.keys.KeyK },
            { name: i18n("MonksLittleDetails.NoteLayer"), tool: 'notes', def: null },
            { name: i18n("MonksLittleDetails.TerrainLayer"), tool: 'terrain', def: Hotkeys.keys.KeyL }
        ].map(l => {
            Hotkeys.registerShortcut({
                name: `monks-little-details_swap-${l.tool}-control`,
                label: `${i18n("MonksLittleDetails.QuickShow")} ${l.name}`,
                group: 'monks-little-details_tool-swap',
                default: () => { return { key: l.def, alt: false, ctrl: false, shift: false }; },
                onKeyDown: (e) => { MonksLittleDetails.swapTool(l.tool, true); },
                onKeyUp: (e) => { MonksLittleDetails.releaseTool(); }
            });
            Hotkeys.registerShortcut({
                name: `monks-little-details_change-${l.tool}-control`,
                label: `${i18n("MonksLittleDetails.ChangeTo")} ${l.name}`,
                group: 'monks-little-details_tool-swap',
                default: () => { return { key: l.def, alt: false, ctrl: false, shift: true }; },
                onKeyDown: (e) => { MonksLittleDetails.swapTool(l.tool, false); }
            });
        });
        
    }

    static swapTool(controlName, quick = true) {
        let control = ui.controls.control;
        if (control.name != controlName && MonksLittleDetails.switchTool == undefined) {
            if (quick !== false) //e?.shiftKey
                MonksLittleDetails.switchTool = { control: control, tool: control.activeTool };
            let newcontrol = ui.controls.controls.find(c => { return c.name == controlName; });
            if (newcontrol != undefined) {
                ui.controls.activeControl = newcontrol.name;
                if (newcontrol && newcontrol.layer)
                    canvas[newcontrol.layer].activate();
            }
        }
    }

    static releaseTool() {
        if (MonksLittleDetails.switchTool != undefined) {
            if (MonksLittleDetails.switchTool.control) {
                if (MonksLittleDetails.switchTool.control.layer)
                    canvas[MonksLittleDetails.switchTool.control.layer].activate();
                ui.controls.activeControl = MonksLittleDetails.switchTool.control.name;
            }
            delete MonksLittleDetails.switchTool;
        }
    }

    static injectCSS() {
        let innerHTML = '';
        let style = document.createElement("style");
        style.id = "monks-css-changes";
        if (setting("core-css-changes")) {
            innerHTML += `
.directory .directory-list .directory-item img {
    object-fit: contain !important;
}

.filepicker .thumbs-list img {
    object-fit: contain !important;
}

.control-icon.active > img {
    filter: sepia(100%) saturate(2000%) hue-rotate(-50deg);
}

#context-menu li.context-item{
    text-align: left;
}

.form-group select{
    width: calc(100% - 2px);
}

.compendium.directory .directory-list .directory-item.scene {
    position: relative;
}

.compendium.directory .directory-list .directory-item.scene img {
    flex: 1;
    object-fit: cover !important;
}

.compendium.directory .directory-list .directory-item.scene h4 {
    position: absolute;
    width: 100%;
    text-align: center;
    text-shadow: 1px 1px 3px #000;
    color: #f0f0e0;
}

.compendium.directory .directory-list .directory-item.scene h4 a{
background-color: rgba(0, 0, 0, 0.5);
    padding: 5px 10px;
    border-radius: 4px;
}
`;

        }

        if (setting("move-pause")) {
            innerHTML += `
#pause{
    bottom:30%;
}
`;
        }

        //let iconWidth = '24';
        //if (game.system.id == 'pf2e' || (game.modules.get("illandril-token-hud-scale") != undefined && game.modules.get("illandril-token-hud-scale").active && game.settings.get("illandril-token-hud-scale", "enableStatusSelectorScale")))
        //    iconWidth = '36';

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

                    let hasSound = (app.document.getFlag('monks-little-details', 'sound-effect') != undefined);

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
                                    return this.document.getFlag('monks-little-details', 'sound-effect');
                                }, app),
                                callback: li => {
                                    MonksLittleDetails.loadSoundEffect.call(app);
                                }
                            },
                            {
                                name: "Delete Sound",
                                icon: '<i class="fas fa-trash-alt"></i>',
                                condition: $.proxy(function () {
                                    return this.document.getFlag('monks-little-details', 'sound-effect');
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
            left: this.position.left + 10,
            wildcard: true
        });
        return fp.browse();
    }

    static async loadSoundEffect(event) {
        const audiofiles = await MonksLittleDetails.getTokenSounds(this.actor);

        //audiofiles = audiofiles.filter(i => (audiofiles.length === 1) || !(i === this._lastWildcard));
        if (audiofiles.length > 0) {
            const audiofile = audiofiles[Math.floor(Math.random() * audiofiles.length)];

            let volume = game.settings.get("core", 'globalInterfaceVolume');
            if (this instanceof Token) {
                let token = this;
                if (this.soundeffect == undefined) {
                    AudioHelper.play({ src: audiofile, volume: volume }, true).then((sound) => {
                        token.soundeffect = sound;
                        token.soundeffect.on("end", () => {
                            log('Finished playing', audiofile);
                            delete token.soundeffect;
                        });
                    });

                } else {
                    if (token.soundeffect.playing) {
                        token.soundeffect.stop();
                        game.socket.emit("stopAudio", { src: audiofile }); //+++ this isn't a function with the new AudioHelper
                    }
                    delete token.soundeffect;
                }
            } else
                AudioHelper.play({ src: audiofile, volume: volume }, true);
        }
        if(event != undefined)
            event.preventDefault;
    }

    static async getTokenSounds(actor) {
        const audiofile = actor.getFlag('monks-little-details', 'sound-effect');

        if (!audiofile.includes('*')) return [audiofile];
        if (actor._tokenSounds) return this._tokenSounds;
        let source = "data";
        let pattern = audiofile;
        const browseOptions = { wildcard: true };

        // Support S3 matching
        if (/\.s3\./.test(pattern)) {
            source = "s3";
            const { bucket, keyPrefix } = FilePicker.parseS3URL(pattern);
            if (bucket) {
                browseOptions.bucket = bucket;
                pattern = keyPrefix;
            }
        }

        // Retrieve wildcard content
        try {
            const content = await FilePicker.browse(source, pattern, browseOptions);
            this._tokenSounds = content.files;
        } catch (err) {
            this._tokenSounds = [];
            ui.notifications.error(err);
        }
        return this._tokenSounds;
    }

    /*
    static playSoundEffect(audiofile) {
        if (audiofile != undefined) {
            let volume = game.settings.get("core", 'globalInterfaceVolume');
            return AudioHelper.play({ src: audiofile, volume: volume }, true);
        }
    }*/

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

    static doDisplayTurn() {
        if (!MonksLittleDetails.READY)
            MonksLittleDetails.init();

        if (setting("showcurrentup") && !game.user.isGM)
            ui.notifications.warn(i18n("MonksLittleDetails.Turn"));

        // play a sound
        if (setting('play-turn-sound') && setting('turn-sound') != '') //volume() > 0 && !setting("disablesounds") && 
            AudioHelper.play({ src: setting('turn-sound') }); //, volume: volume()
    }

    static doDisplayNext() {
        if (!MonksLittleDetails.READY)
            MonksLittleDetails.init();

        if (setting("shownextup") && !game.user.isGM)
            ui.notifications.info(i18n("MonksLittleDetails.Next"));
        // play a sound
        if (setting('play-next-sound') && setting('next-sound') != '') //volume() > 0 && !setting("disablesounds") && 
            AudioHelper.play({ src: setting('next-sound') }); //, volume: volume()
    }

    /**
    * Check if the current combatant needs to be updated
    */
    static checkCombatTurn(combat) {
        log('checking combat started', combat, combat?.started);
        if (combat && combat.started) {
            let entry = combat.combatant;

            let findNext = function (from) {
                let next = null;
                if (skip) {
                    for (let [i, t] of combat.turns.entries()) {
                        if (i <= from ||
                            t.data.defeated ||
                            t.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId)) continue;
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
            if (next == undefined || next >= combat.turns.length)
                next = findNext(-1);

            let isActive = entry.actor?.isOwner;
            let nxtentry = null;
            let isNext = false;

            if (next != null) {
                nxtentry = combat.turns[next];
                isNext = nxtentry.actor?.isOwner; //_id === game.users.current.character?._id;
            }

            log('Check combat turn', entry.name, nxtentry?.name, !game.user.isGM, isActive, isNext, entry, nxtentry);
            if (entry !== undefined) {
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

        app.position.left = (combatposition().endsWith('left') ? 120 : (sidebar.offsetLeft - app.position.width));
        app.position.top = (combatposition().startsWith('top') ?
            (combatposition().endsWith('left') ? 70 : (sidebar.offsetTop - 3)) :
            (combatposition().endsWith('left') ? (players.offsetTop - app.position.height - 3) : (sidebar.offsetTop + sidebar.offsetHeight - app.position.height - 3)));

        $(app._element).css({ top: app.position.top, left: app.position.left });
    }

    static async alterHUD(html) {
        if (MonksLittleDetails.canDo("alter-hud") && setting("alter-hud")) {
            $('#token-hud').addClass('monks-little-details').toggleClass('highlight-image', setting('alter-hud-colour'));
            const statuses = this._getStatusEffectChoices();
             
            for (let img of $('.col.right .control-icon[data-action="effects"] .status-effects > img')) {
                let src = $(img).attr('src');
                if (src == '') {
                    $(img).css({ 'visibility': 'hidden' });
                } else {
                    //const status = statuses[img.getAttribute("src")] || {};
                    let title = $(img).attr('title') || $(img).attr('data-condition');
                    let div = $('<div>')
                        .addClass('effect-container')//$(img).attr('class'))
                        //.toggleClass('active', !!status.isActive)
                        .attr('title', title)
                        //.attr('src', $(img).attr('src'))
                        .insertAfter(img)
                        .append(img)//.removeClass('effect-control'))
                        .append($('<div>').addClass('effect-name').html(title)
                        );
                }
            };

            $('.col.right .control-icon[data-action="effects"] .status-effects > div.pf2e-effect-img-container', html).each(function () {
                let img = $('img', this);
                let title = img.attr('data-condition');
                let div = $('<div>').addClass('effect-name').attr('title', title).html(title).insertAfter(img);
                //$(this).append(div);
                //const status = statuses[img.attr('src')] || {};
                //$(this).attr('src', img.attr('src')).toggleClass('active', !!status.isActive);
            });

            if (game.system.id !== 'pf2e') {
                $('.col.right .control-icon[data-action="effects"] .status-effects', html).append(
                    $('<div>').addClass('clear-all').html('<i class="fas fa-times-circle"></i> clear all').click($.proxy(MonksLittleDetails.clearAll, this))
                );
            }
        }
    }

    static async clearAll(e) {
        //find the tokenhud, get the TokenHUD.object  ...assuming it's a token?
        const statuses = this._getStatusEffectChoices();

        for (const [k, status] of Object.entries(statuses)) {
            if (status.isActive) {
                await this.object.toggleEffect({ id: status.id, icon: status.src });
            }
        }

        e.preventDefault();

        /*
        let selectedEffects = $('#token-hud .col.right .control-icon.effects .status-effects .effect-control.active');
        for (let ctrl of selectedEffects) {
            let img = $('img', ctrl).get(0);
            if (img != undefined) {
                const effect = (img.dataset.statusId && MonksLittleDetails.tokenHUD.object.actor) ?
                    CONFIG.statusEffects.find(e => e.id === img.dataset.statusId) :
                    img.getAttribute("src");

                await MonksLittleDetails.tokenHUD.object.toggleEffect(effect);
            }
        };*/
    }

    static getCRText (cr) {
        switch (cr) {
            case 0.13: return '⅛';
            case 0.17: return '⅙';
            case 0:
            case 0.25: return '¼';
            case 0.33: return '⅓';
            case 0.5: return '½';
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
        for (let combatant of combat.combatants) {
            if (combatant.actor != undefined) {
                if (combatant.token.data.disposition == 1) {
                    apl.count = apl.count + 1;
                    let levels = 0;
                    if (combatant.actor.data.data?.classes) {
                        levels = Object.values(combatant.actor.data.data?.classes).reduce((a, b) => {
                            return a + (b?.levels || 0);
                        }, 0);
                    } else {
                        levels = combatant?.actor.data.data.details?.level?.value || combatant?.actor.data.data.details?.level || 0;
                    }

                    apl.levels += levels;
                } else {
                    xp += (combatant?.actor.data.data.details?.xp?.value || MonksLittleDetails.xpchart[Math.clamped(parseInt(combatant?.actor.data.data.details?.level?.value) || combatant.actor.data.data?.classes?.reduce(c => { return c.data.levels; }), 0, MonksLittleDetails.xpchart.length - 1)] || 0);
                }
            }
        };

        var calcAPL = 0;
        if (apl.count > 0)
            calcAPL = Math.round(apl.levels / apl.count) + (apl.count < 4 ? -1 : (apl.count > 5 ? 1 : 0));

        //get the CR of any unfriendly/neutral
        let cr = Math.clamped(MonksLittleDetails.xpchart.findIndex(cr => cr >= xp) - 1, 0, 29);

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

    static getPalette(src, element) {
        // Create custom CanvasImage object
        if (src != undefined) {
            loadTexture(src).then((texture) => {
                if (texture != undefined) {
                    let sprite = new PIXI.Sprite(texture);
                    let pixels = canvas.app.renderer.plugins.extract.pixels(sprite);
                    const pixelCount = texture.width * texture.height;

                    const pixelArray = MonksLittleDetails.createPixelArray(pixels, pixelCount, 10);

                    sprite.destroy();

                    // Send array to quantize function which clusters values
                    // using median cut algorithm
                    const cmap = MMCQ.quantize(pixelArray, 5);
                    const palette = cmap ? cmap.palette() : null;

                    $(element).empty();
                    for (let i = 0; i < palette.length; i++) {
                        var hexCode = MonksLittleDetails.rgbToHex(palette[i][0], palette[i][1], palette[i][2]);
                        $(element).append($('<div>').addClass('background-palette').attr('title', hexCode).css({ backgroundColor: hexCode }).on('click', $.proxy(MonksLittleDetails.updateSceneBackground, MonksLittleDetails, hexCode)));
                    }
                }
            })
        }
    };

    static async updateSceneBackground(hexCode) {
        $('.background-palette-container').remove();
        await MonksLittleDetails.currentScene.update({ backgroundColor: hexCode });
    }

    static async fixImages({ wildcards = true, packs = "dnd5e.monsters", system = "dnd", tokentypes = ['overhead', 'disc', 'artwork'] } = {}) {
        let getFiles = async function(filename) {
            let source = "data";
            let pattern = filename;
            const browseOptions = { wildcard: true };

            // Support S3 matching
            if (/\.s3\./.test(pattern)) {
                source = "s3";
                const { bucket, keyPrefix } = FilePicker.parseS3URL(pattern);
                if (bucket) {
                    browseOptions.bucket = bucket;
                    pattern = keyPrefix;
                }
            }

            // Retrieve wildcard content
            try {
                const content = await FilePicker.browse(source, pattern, browseOptions);
                return content.files;
            } catch (err) {
                return null;
                error(err);
            }
            return [];
        }

        let alltypes = [];

        packs = (packs instanceof Array ? packs : [packs]);

        for (let pack of packs) {

            var monsters = game.packs.get(pack);
            if (monsters) {
                await monsters.configure({ locked: false });

                await monsters.getDocuments().then(async (entries) => {
                    for (var i = 0; i < entries.length; i++) {
                        var entry = entries[i];
                        var monname = entry.name.toLowerCase();
                        monname = monname.replace(/-/g, '').replace(/'/g, '').replace(/\(.*\)/, '').replace(/\s/g, '');
                        /*if (monname == 'ettin')
                            log('Ettin');
                        var mtype = entry.data.data.details.type?.value.toLowerCase() || entry.data.data.traits.traits.value; //|| entry.data.data.details.creatureType?.toLowerCase()
                        mtype = (mtype instanceof Array ? mtype : [mtype]);
                        for (let i = 0; i < mtype.length; i++) {
                            if (mtype[i].indexOf(',') > 0) {
                                let temp = mtype[i].split(',');
                                mtype[i] = temp[0];
                                for (let j = 1; j < temp.length; j++)
                                    mtype.push(temp[j]);
                            }
                            mtype[i] = mtype[i].replace(/\(.*\)/, '').replace(/\s/g, '');
                        }
                        //mtype = mtype.replace(/\(.*\)/, '').replace(/\s/g, '').split(',');

                        for (let montype of mtype) {*/
                            //if (!alltypes.find(t => t == montype))
                            //    alltypes.push(montype);

                            var imgname = `images/avatar/${system}/${monname}.png`;
                            if (entry.data.img.toLowerCase() != imgname) {
                                let files = await getFiles(imgname);
                                if (files && files.length > 0) {
                                    await entry.update({ img: files[0] });
                                    log('Fixing:', entry.name, files[0]);
                                } else {
                                    if (monname.startsWith('ancient'))
                                        monname = monname.replace('ancient', '');
                                    if (monname.startsWith('adult'))
                                        monname = monname.replace('adult', '');
                                    if (monname.startsWith('young'))
                                        monname = monname.replace('young', '');

                                    imgname = `images/avatar/${system}/${monname}.png`;
                                    if (entry.data.img.toLowerCase() != imgname) {
                                        let files = await getFiles(imgname);
                                        if (files && files.length > 0) {
                                            await entry.update({ img: files[0] });
                                            log('Fixing:', entry.name, files[0]);
                                        } //else {
                                            //log('Cant find:' + monname + ', ' + montype);
                                        //}
                                    }
                                }
                            }
                        /*
                            for (let tokentype of tokentypes) {
                                var tokenname = `images/tokens/${tokentype}/${montype}/${monname}.png`; // + (wildcards ? "*" : '')
                                if (entry.data.token.img == tokenname)
                                    break;

                                let files = await getFiles(tokenname);
                                if (files && files.length > 0) {
                                    await entry.update({ token: { img: files[0] } });
                                    log('Fixing Token:', entry.name, files[0]);
                                    break;
                                }
                            }*/
                        }
                    //}

                    monsters.configure({ locked: true });
                    log("Completed: " + monsters.metadata.label);
                });
            }
        }

        log('All monster types:' + alltypes);
    }

    static toggleTurnMarker(token, visible) {
        if (token) {
            if (token.turnmarker == undefined) {
                loadTexture(setting("token-highlight-picture")).then((tex) => { //"modules/monks-little-details/img/chest.png"
                    if (token.turnmarker == undefined) {
                        const icon = new PIXI.Sprite(tex);
                        icon.pivot.set(icon.width / 2, icon.height / 2);//.set(-(token.w / 2), -(token.h / 2));
                        const size = Math.max(token.w, token.h) * setting("token-highlight-scale");
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

            if (setting('token-highlight-animate') > 0) {
                if (!MonksLittleDetails._animate && Object.keys(MonksLittleDetails.turnMarkerAnim).length != 0) {
                    MonksLittleDetails._animate = MonksLittleDetails.animateMarkers.bind(this);
                    canvas.app.ticker.add(MonksLittleDetails._animate);
                } else if (MonksLittleDetails._animate != undefined && Object.keys(MonksLittleDetails.turnMarkerAnim).length == 0) {
                    canvas.app.ticker.remove(MonksLittleDetails._animate);
                    delete MonksLittleDetails._animate;
                }
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
        let interval = setting('token-highlight-animate');
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
        Hooks.on("updateCombatant", function (combatant, data, options, userId) {
            const combat = combatant.parent;
            if (combat && combat.started) {
                //const combatant = combat.data.combatants.find((o) => o.id === data.id);
                //let token = canvas.tokens.get(combatant.token._id);
                let token = combatant.token.object;
                MonksLittleDetails.toggleTurnMarker(token, token.id == combat.current.tokenId);
            }
        });

        /**
         * Handle combatant delete
         */
        Hooks.on("deleteCombatant", function (combatant, data, options, userId) {
            let combat = combatant.parent;
            if (combat && combat.started) {
                //const combatant = combat.data.combatants.find((o) => o.id === data.id);
                //let token = canvas.tokens.get(combatant.token._id);
                let token = combatant.token.object;
                MonksLittleDetails.removeTurnMarker(token);
            }
        });

        /**
         * Handle combatant added
         */
        Hooks.on("createCombatant", function (combatant, options, userId) {
            let combat = combatant.parent;
            if (combat && combat.started) {
                //let combatant = combat.data.combatants.find((o) => o.id === data.id);
                //let token = canvas.tokens.get(combatant.token._id);
                let token = combatant.token.object;
                MonksLittleDetails.toggleTurnMarker(token, token.id == combat.current.tokenId);
            }
        });

        Hooks.on("updateToken", function (document, data, options, userid) {
            let token = document.object;
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

        //check on the turn marker if the scene changes
        Hooks.on("canvasReady", function (canvas) {
            let activeCombats = game.combats.filter(c => {
                return c?.scene?.id == canvas.scene.id && c.started;
            });

            if (activeCombats.length) {
                for (let combat of activeCombats) {
                    MonksLittleDetails.toggleTurnMarker(combat.combatant.token.object, true);
                }
            }
        });
    }
});

/**
 * Handle combatant delete
 */
Hooks.on("deleteCombatant", function (combatant, data, userId) {
    let combat = combatant.parent;
    MonksLittleDetails.checkCombatTurn(combat);
});

/**
 * Handle combatant added
 */
Hooks.on("createCombatant", function (combatant, data, options) {
    let combat = combatant.parent;
    //let combatant = combat.data.combatants.find((o) => o.id === data.id);

    if (combatant.actor.isOwner) 
        MonksLittleDetails.checkCombatTurn(combat);

    //set the blood glyph if this is the GM
    if (setting('show-bloodsplat') && combatant && game.user.isGM) {
        let token = combatant.token; //canvas.tokens.placeables.find(t => { return (t.id == combatant._token.id); });
        let glyph = token.getFlag('monks-little-details', 'glyph');
        if (glyph == undefined) {
            glyph = MonksLittleDetails.availableGlyphs.charAt(Math.floor(Math.random() * MonksLittleDetails.availableGlyphs.length));
            token.setFlag('monks-little-details', 'glyph', glyph);
        }
    }
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

    //if there are no more combats left, then close the combat window
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

    //remove the combat highlight from any token in this combat
    if (combat.started == true) {
        if (setting("token-combat-highlight")) {
            for (let combatant of combat.combatants) {
                let token = combatant.token; //canvas.tokens.get(combatant.token._id);
                MonksLittleDetails.removeTurnMarker(token.object);
            }
        }
    }

    //if we're using combat bars and the combat starts or stops, we need to refresh the tokens
    if (setting('add-combat-bars') && combat) {
        for (let combatant of combat.combatants) {
            let token = combatant.token; //canvas.tokens.placeables.find(t => { return t.id == combatant._token.id; });
            if (token) {
                let displayBars = token.data.displayBars;
                let combatBar = token.getFlag('monks-little-details', 'displayBarsCombat');
                combatBar = (combatBar == undefined || combatBar == -1 ? displayBars : combatBar);

                if (token.object.bars.alpha != 1) {
                    token.object.bars.alpha = 1;
                    token.object.refresh();
                } else if (combatBar != displayBars)
                    token.object.refresh();
            }
        }
    }
});

Hooks.on("updateCombat", async function (combat, delta) {
    MonksLittleDetails.checkCombatTurn(combat);

    let combatStarted = (combat && (delta.round === 1 && combat.turn === 0 && combat.started === true));

    if (combat && combat.started && game.user.isGM && setting('clear-targets')) {
        //clear the targets
        game.user.targets.forEach(t => t.setTarget(false, { user: game.user, releaseOthers: true, groupSelection: false }));

        canvas.tokens.selectObjects({
            x: 0,
            y: 0,
            height: 0,
            releaseOptions: {},
            controlOptions: { releaseOthers: true, updateSight: true }
        });
    }

    //set the bloodsplat glyph when the combat starts to maintain consistency
    if (setting('show-bloodsplat') && game.user.isGM && combatStarted) {
        for (let combatant of combat.combatants) {
            let token = combatant.token; //canvas.tokens.placeables.find(t => { return t.id == combatant._token.id; });
            if (token) {
                let glyph = token.getFlag('monks-little-details', 'glyph');
                if (glyph == undefined) {
                    glyph = MonksLittleDetails.availableGlyphs.charAt(Math.floor(Math.random() * MonksLittleDetails.availableGlyphs.length));
                    await token.setFlag('monks-little-details', 'glyph', glyph);
                }
            }
        }
    }

    //if we're using combat bars and the combat starts or stops, we need to refresh the tokens
    if (setting('add-combat-bars') && combatStarted) {
        for (let combatant of combat.combatants) {
            let token = combatant.token; //canvas.tokens.placeables.find(t => { return t.id == combatant._token.id; });
            if (token) {
                let displayBars = token.data.displayBars;
                let combatBar = token.getFlag('monks-little-details', 'displayBarsCombat');
                combatBar = (combatBar == undefined || combatBar == -1 ? displayBars : combatBar);

                if (combatBar != displayBars)
                    token.object.refresh();
            }
        }
    }

    //log("update combat", combat);
    let opencombat = setting("opencombat");
    if ((opencombat == "everyone" || (game.user.isGM && opencombat == "gmonly") || (!game.user.isGM && opencombat == "playersonly"))
        && game.settings.get("monks-little-details", "popout-combat")
        && combatStarted) {
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

    if (setting('play-round-sound') && setting('round-sound') && Object.keys(delta).some((k) => k === "round")) { //volume() > 0 && !setting("disablesounds") && 
		AudioHelper.play({ src: game.settings.get('monks-little-details', 'round-sound') });//, volume: volume()
    }

    if (setting("token-combat-highlight") && combat.started) {
        for (let combatant of combat.combatants) {
            let token = combatant.token; //canvas.tokens.get(combatant.token.id);
            MonksLittleDetails.toggleTurnMarker(token.object, token.id == combat?.current?.tokenId);
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

    canvas.stage.on('mouseover', (e) => {
        MonksLittleDetails.canvasfocus = true;
    });

    canvas.stage.on('mouseout', (e) => {
        MonksLittleDetails.canvasfocus = false;
    });
});

Hooks.on('closeCombatTracker', async (app, html) => {
    MonksLittleDetails.tracker = false;
});

Hooks.on('renderTokenHUD', async (app, html, options) => {
    MonksLittleDetails.element = html;
    MonksLittleDetails.tokenHUD = app;
    if (game.settings.get("monks-little-details", "swap-buttons")) {
        $('.col.left .control-icon[data-action="target"]', html).insertBefore($('.col.left .control-icon[data-action="config"]', html));
    }

    if (app.object.actor.data.flags['monks-little-details'] != undefined && game.settings.get("monks-little-details", "actor-sounds")) {
        $('.col.right', html).append(
            $('<div>').addClass('control-icon sound-effect')
                .append('<img src="modules/monks-little-details/icons/volumeup.svg" width="36" height="36" title="Play Sound Effect">')
                .click($.proxy(MonksLittleDetails.loadSoundEffect, app.object)));
    }
});

Hooks.on('renderCombatTracker', async (app, html, data) => {
    if (!MonksLittleDetails.tracker && app.options.id == "combat-popout") {
        MonksLittleDetails.tracker = true;

        if (combatposition() !== '') {
            MonksLittleDetails.repositionCombat(app);
        }
    }

    if (game.user.isGM && data.combat && !data.combat.started && setting('show-combat-cr') && MonksLittleDetails.canDo('show-combat-cr') && MonksLittleDetails.xpchart != undefined) {
        //calculate CR
        let crdata = MonksLittleDetails.getCR(data.combat);

        if ($('#combat-round .encounter-cr-row').length == 0 && data.combat.combatants.size > 0) {
            let crChallenge = MonksLittleDetails.crChallenge[Math.clamped(crdata.cr - crdata.apl, -1, 3) + 1];
            let epicness = Math.clamped((crdata.cr - crdata.apl - 3), 0, 5);

            $('<nav>').addClass('encounters flexrow encounter-cr-row')
                .append($('<h3>').html('CR: ' + MonksLittleDetails.getCRText(crdata.cr)))
                .append($('<div>').addClass('encounter-cr').attr('rating', crChallenge.rating).html(i18n(crChallenge.text) + "!".repeat(epicness)))
                .insertAfter($('#combat-round .encounters:last'));
        }
    }

    if (data.combat == undefined) {
        //+++ if the sound module is active
        $('#combat-round h3', html).css({ fontSize: '16px', lineHeight: '15px'});
    }

    //don't show the previous or next turn if this isn't the GM
    if (!game.user.isGM && data.combat && data.combat.started) {
        $('.combat-control[data-control="previousTurn"],.combat-control[data-control="nextTurn"]:last').css({visibility:'hidden'});
    }
});

Hooks.on('renderSceneConfig', async (app, html, options) => {
    if (game.settings.get("monks-little-details", 'scene-palette')) {
        MonksLittleDetails.currentScene = app.object;

        let backgroundColor = $('input[data-edit="backgroundColor"]', html);
        backgroundColor.parents('.form-group:first').css({ position: 'relative' });
        $('<button>').attr('type', 'button').html('<i class="fas fa-palette"></i>').on('click', function (e) {
            let element = $(this).siblings('.background-palette-container');
            if (element.length == 0) {
                element = $('<div>').addClass('background-palette-container flexrow').insertAfter(this);
                MonksLittleDetails.getPalette(MonksLittleDetails.currentScene.img, element);
            } else {
                element.remove();
            }
            e.preventDefault();
        }).insertAfter(backgroundColor);
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

/*
Hooks.on("preUpdateWall", (document, update, options) => {
    let wall = document.object;
    let scene = document.parent;

    let dragtogether = ui.controls.control.tools.find(t => { return t.name == "toggledragtogether" });
    if (dragtogether != undefined && dragtogether.active && options.ignore == undefined && update.c != undefined) {
        let updates = [];
        let oldcoord = ((wall.coords[0] != update.c[0] || wall.coords[1] != update.c[1]) && wall.coords[2] == update.c[2] && wall.coords[3] == update.c[3] ? [wall.coords[0], wall.coords[1], update.c[0], update.c[1]] :
            ((wall.coords[2] != update.c[2] || wall.coords[3] != update.c[3]) && wall.coords[0] == update.c[0] && wall.coords[1] == update.c[1] ? [wall.coords[2], wall.coords[3], update.c[2], update.c[3]] : null));
        if (oldcoord != null) {
            scene.data.walls.forEach(w => {
                if (w.id != wall.id) {
                    if (w.data.c[0] == oldcoord[0] && w.data.c[1] == oldcoord[1])
                        //scene.updateEmbeddedEntity("Wall", { c: [oldcoord[2], oldcoord[3], w.c[2], w.c[3]], _id: w._id }, { ignore: true });
                        updates.push({ c: [oldcoord[2], oldcoord[3], w.data.c[2], w.data.c[3]], _id: w.id });
                    else if (w.data.c[2] == oldcoord[0] && w.data.c[3] == oldcoord[1])
                        //scene.updateEmbeddedEntity("Wall", { c: [w.c[0], w.c[1], oldcoord[2], oldcoord[3]], _id: w._id }, { ignore: true });
                        updates.push({ c: [w.data.c[0], w.data.c[1], oldcoord[2], oldcoord[3]], _id: w.id });
                }
            });
        }
        if(updates.length)
            scene.updateEmbeddedDocuments("Wall", updates, { ignore: true });
    }
    //let thewall = scene.data.walls.find(w => w._id === wall._id);
    //log('preupdatewall', thewall.c, wall.c, update);
});*/

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

    let parent = $('input[name="monks-little-details.next-sound"]', html).closest('.form-group');
    $('input[name="monks-little-details.next-sound"]', html).insertAfter($('input[name="monks-little-details.play-next-sound"]', html));
    parent.remove();

    btn.clone(true).insertAfter($('input[name="monks-little-details.next-sound"]', html));

    parent = $('input[name="monks-little-details.turn-sound"]', html).closest('.form-group');
    $('input[name="monks-little-details.turn-sound"]', html).insertAfter($('input[name="monks-little-details.play-turn-sound"]', html));
    parent.remove();

    btn.clone(true).insertAfter($('input[name="monks-little-details.turn-sound"]', html));

    parent = $('input[name="monks-little-details.round-sound"]', html).closest('.form-group');
    $('input[name="monks-little-details.round-sound"]', html).insertAfter($('input[name="monks-little-details.play-round-sound"]', html));
    parent.remove();

    btn.clone(true).insertAfter($('input[name="monks-little-details.round-sound"]', html));

    parent = $('[name="monks-little-details.opencombat"]', html).closest('.form-group');
    $('[name="monks-little-details.opencombat"]', html).insertAfter($('input[name="monks-little-details.popout-combat"]', html));
    parent.remove();

    let btn2 = $('<button>')
        .addClass('file-picker')
        .attr('type', 'button')
        .attr('data-type', "imagevideo")
        .attr('data-target', "img")
        .attr('title', "Browse Files")
        .attr('tabindex', "-1")
        .html('<i class="fas fa-file-import fa-fw"></i>')
        .click(function (event) {
            const fp = new FilePicker({
                type: "image",
                current: $(event.currentTarget).prev().val(),
                callback: path => {
                    $(event.currentTarget).prev().val(path);
                }
            });
            return fp.browse();
        });

    btn2.clone(true).insertAfter($('input[name="monks-little-details.token-highlight-picture"]', html));

    $('<div>').addClass('form-group group-header').html(i18n("MonksLittleDetails.SystemChanges")).insertBefore($('[name="monks-little-details.swap-buttons"]').parents('div.form-group:first'));
    $('<div>').addClass('form-group group-header').html(i18n("MonksLittleDetails.CombatTracker")).insertBefore($('[name="monks-little-details.show-combat-cr"]').parents('div.form-group:first'));
    $('<div>').addClass('form-group group-header').html(i18n("MonksLittleDetails.CombatTurn")).insertBefore($('[name="monks-little-details.shownextup"]').parents('div.form-group:first'));
    $('<div>').addClass('form-group group-header').html(i18n("MonksLittleDetails.CombatTokenHighlight")).insertBefore($('[name="monks-little-details.token-combat-highlight"]').parents('div.form-group:first'));
    $('<div>').addClass('form-group group-header').html(i18n("MonksLittleDetails.AddedFeatures")).insertBefore($('[name="monks-little-details.actor-sounds"]').parents('div.form-group:first'));
});

Hooks.on("updateToken", async function (document, data, options, userid) {
    //actorData.data.attributes.hp
    if (setting('auto-defeated') != 'none' && game.user.isGM) {
        let token = document.object;
        let hp = getProperty(data, 'actorData.data.attributes.hp');
        if (hp != undefined && (setting('auto-defeated').startsWith('all') || document.data.disposition != 1)) {
            let combatant = document.combatant;

            //check to see if the combatant has been defeated
            let defeated = (setting('auto-defeated').endsWith('negative') ? hp.value < 0 : hp.value == 0);
            if (combatant != undefined && combatant.data.defeated != defeated) {
                await combatant.update({ defeated: defeated }).then(() => {
                    token.refresh();
                });
            }
        }
    }

    if (setting('auto-reveal') && game.user.isGM && data.hidden === false) {
        let token = document.object;
        let combatant = document.combatant;;

        if (combatant?.hidden === true) {
            await combatant.update({ hidden: false }).then(() => {
                token.refresh();
            });
        }
    }
});

Hooks.on("updateCombatant", async function (combatant, data, options, userId) {
    const combat = combatant.parent;
    if (combat && combat.started && data.defeated != undefined && setting('auto-defeated') != 'none' && game.user.isGM) {
        let t = combatant.token
        const a = combatant.token.actor;

        let status = CONFIG.statusEffects.find(e => e.id === CONFIG.Combat.defeatedStatusId);
        let effect = a && status ? status : CONFIG.controlIcons.defeated;
        const exists = (effect.icon == undefined ? (t.data.overlayEffect == effect) : (a.effects.find(e => e.getFlag("core", "statusId") === effect.id) != undefined));
        if (exists != data.defeated)
            await t.object.toggleEffect(effect, { overlay: true, active: data.defeated });
    }

    if (combat && combat.started && combatant.actor.isOwner && data.defeated != undefined) {
        MonksLittleDetails.checkCombatTurn(combat);
    }
});


Hooks.on('renderTokenConfig', function (app, html, options) {
    if (setting('add-combat-bars')) {
        let displayBars = $('[name="displayBars"]', html).parents('div.form-group');
        let combatBars = displayBars.clone(true);

        $('[name="displayBars"]', combatBars).attr('name', 'flags.monks-little-details.displayBarsCombat').prepend($('<option>').attr('value', '-1').html('')).val(app.object.getFlag('monks-little-details', 'displayBarsCombat'));
        $('> label', combatBars).html(i18n("MonksLittleDetails.CombatDisplayBars"));
        combatBars.insertAfter(displayBars);
    }
});

Hooks.on("renderCompendium", (compendium, html, data) => {
    if (setting('compendium-view-artwork')) {
        if (compendium.metadata.entity == 'Scene') {
            html.find('li.directory-item h4 a').click(ev => {
                ev.preventDefault();
                ev.cancelBubble = true;
                if (ev.stopPropagation)
                    ev.stopPropagation();

                let documentId = ev.currentTarget.closest('li').dataset.documentId;
                compendium.collection.getDocument(documentId).then(entry => {
                    let img = entry.data.img;
                    if (VideoHelper.hasVideoExtension(img))
                        ImageHelper.createThumbnail(img, { width: entry.data.width, height: entry.data.height }).then(img => {
                            new ImagePopout(img.thumb, {
                                title: entry.name,
                                shareable: true,
                                uuid: entry.uuid
                            }).render(true);
                        });
                    else {
                        new ImagePopout(img, {
                            title: entry.name,
                            shareable: true,
                            uuid: entry.uuid
                        }).render(true);
                    }
                });
            });
        }
    }
    /*
    if (compendium.entity == 'Playlist') {
        compendium._onEntry = async (entryId) => {
            //for the playlist I want to expand the directory structure
            let li = $('li[data-entry-id="' + entryId + '"]', compendium.element);
            let dir = $('.play-list-sounds', li);
            if (dir.length == 0) {
                dir = $('<ol>').addClass('play-list-sounds').appendTo(li);
                const entity = await compendium.getEntity(entryId);
                $(entity.sounds).each(function () {
                    let sound = this;
                    $('<li>').addClass('play-sound').html(this.name).appendTo(dir).on('click', $.proxy((sound, entity, li, ev)=>{
                        if (sound != undefined) {
                            //let path = li.attr('data-sound-path');
                            if (compendium.currentsound != undefined) {
                                if (compendium.currentsound.sound.playing) {
                                    compendium.currentsound.sound.playing = false;
                                    compendium.currentsound.audio.stop();
                                }
                            }
                            if (compendium.currentsound == undefined || compendium.currentsound.sound.path != sound.path) {
                                sound.playing = true;
                                let audio = AudioHelper.play({ src: sound.path });
                                compendium.currentsound = {
                                    sound: sound,
                                    audio: audio
                                };
                            }
                        }
                    }, compendium, sound, entity, li));
                });

                new DragDrop({
                    dragSelector: ".play-list-sounds .play-sound",
                    dropSelector: "#playlists .directory-list .directory-item.playlist",
                    callbacks: {
                        dragstart: (ev) => {
                            ev.preventDefault();
                            log('play sound drag start', ev);
                             },
                        dragover: (ev) => {
                            ev.preventDefault();
                            log('play sound drag over', ev);
                             },
                        drop: (ev) => {
                            ev.preventDefault();
                            log('play sound drag drop', ev);
                             }
                    }
                }).bind(dir[0]);
            }
            dir.hide().slideDown(200);
        }
    }*/
});

Hooks.on("preUpdateToken", (document, update, options, userId) => {
    let movechar = game.settings.get("monks-little-details", "movement-key");
    if (movechar.length == 0) movechar = "m";
    if (movechar.length > 1) movechar = movechar[0];

    if ((update.x != undefined || update.y != undefined) && game.user.isGM && game.keyboard.isDown(movechar)) {
        options.animate = false;
    }
});

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

/*
Hooks.on('renderAmbientSoundConfig', (app, html, data) => {
    $('<div>')
        .addClass('form-group')
        .append($('<label>').html('Repeat Delay'))
        .append($('<div>').addClass('form-fields').append($('<input>').attr('type', 'number').attr('name', 'flags.monks-little-details.loop-delay').attr('step', '1').val(app.document.getFlag('monks-little-details', 'loop-delay'))))
        .append($('<p>').addClass('hint').html('Specify the time between loops, set to -1 to have this play only once'))
        .insertBefore($('button[name="submit"]', html));
})*/

