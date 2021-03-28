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
export let volume = () => {
    return game.settings.get("monks-little-details", "volume") / 100.0;
};
export let combatposition = () => {
    return game.settings.get("monks-little-details", "combat-position");
};

export class MonksLittleDetails {
    static tracker = false;
    static turnMarkerAnim = {};
    static tokenHUDimages = {};

    static canDo(setting) {
        //needs to not be on the reject list, and if there is an only list, it needs to be on it.
        if (MonksLittleDetails._rejectlist[setting] != undefined && MonksLittleDetails._rejectlist[setting].includes(game.world.system))
            return false;
        if (MonksLittleDetails._onlylist[setting] != undefined && !MonksLittleDetails._onlylist[setting].includes(game.world.system))
            return false;
        return true;
    };

    static inCombat(token, combat = game.combats) {
        let combatant;
        combat = (combat instanceof Combat ? [combat] : combat);
        combat.find(c => {
            if (c.started)
                combatant = c.combatants.find(t => {
                    return t.tokenId == token.id;
                });
            return c.started && combatant != undefined;
        });

        return combatant;
    }

    static canViewCombatMode(mode) {
        if (mode === CONST.TOKEN_DISPLAY_MODES.NONE) return false;
        else if (mode === CONST.TOKEN_DISPLAY_MODES.ALWAYS) return true;
        else if (mode === CONST.TOKEN_DISPLAY_MODES.CONTROL) return this.owner;
        else if (mode === CONST.TOKEN_DISPLAY_MODES.HOVER) return true;
        else if (mode === CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER) return this.owner;
        else if (mode === CONST.TOKEN_DISPLAY_MODES.OWNER) return this.owner;
        return false;
    }

    static init() {
        log("initializing");
        // element statics
        // CONFIG.debug.hooks = true;

        //CONFIG.Playlist.sheetClass = MonksPlaylistConfig;

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
        /*
        MonksLittleDetails.swapTool = {
            'r': 'token',
            't': 'tiles',
            'y': 'lighting',
            'u': 'sounds',
            'i': 'terrain'
        }*/

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
            let oldTokenHUDRender = TokenHUD.prototype._render;
            TokenHUD.prototype._render = function (force = false, options = {}) {
                let result = oldTokenHUDRender.call(this, force, options).then((a, b) => {
                    MonksLittleDetails.alterHUD.call(this, MonksLittleDetails.element);
                });

                return result;
            }
            TokenHUD.prototype.refreshStatusIcons = function () {
                const effects = this.element.find(".status-effects")[0];
                const statuses = this._getStatusEffectChoices();
                for (let img of $('[src]', effects)) {
                    const status = statuses[img.getAttribute("src")] || {};
                    img.classList.toggle("overlay", !!status.isOverlay);
                    img.classList.toggle("active", !!status.isActive);
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
            MonksLittleDetails.splatfont = new FontFace('WC Rhesus A Bta', "url('modules/monks-little-details/fonts/WCRhesusABta.woff2'), url('modules/monks-little-details/fonts/WCRhesusABta.woff')");
            MonksLittleDetails.splatfont.load().then(() => {
                document.fonts.add(MonksLittleDetails.splatfont);
            });

            let oldTokenRefresh = Token.prototype.refresh;
            Token.prototype.refresh = function () {
                oldTokenRefresh.call(this);

                //find defeated state
                let combatant = MonksLittleDetails.inCombat(this);
                if (((combatant && combatant.defeated) || this.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId)) && this.actor?.data.type !== 'character') {
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

        //if this token is part of a combat, then always show the bar, but at 0.5 opacity, unless controlled
        if (setting('add-combat-bars')) {
            let oldTokenRefresh = Token.prototype.refresh;
            Token.prototype.refresh = function () {
                oldTokenRefresh.call(this);

                let combatant = MonksLittleDetails.inCombat(this);
                if (combatant) {
                    let combatBar = this.getFlag('monks-little-details', 'displayBarsCombat');
                    if (combatBar != undefined && combatBar != -1) {
                        this.bars.visible = MonksLittleDetails.canViewCombatMode.call(this, combatBar);
                        this.bars.alpha = ((this._controlled && (combatBar == CONST.TOKEN_DISPLAY_MODES.CONTROL || combatBar == CONST.TOKEN_DISPLAY_MODES.OWNER || combatBar == CONST.TOKEN_DISPLAY_MODES.ALWAYS)) ||
                            (this._hover && (combatBar == CONST.TOKEN_DISPLAY_MODES.HOVER || combatBar == CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER)) ? 1 : 0.3);
                    }
                } else
                    this.bars.alpha = 1;
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

        if (game.settings.get("monks-little-details", "key-swap-tool")) {
            if (!game.modules.get('lib-df-hotkeys')?.active) {
                if (game.user.isGM) {
                    ui.notifications.error(i18n("MonksLittleDetails.HotKeysWarning"));
                    warn(i18n("MonksLittleDetails.HotKeysWarning"));
                }
            } else {
                MonksLittleDetails.registerHotKeys();
            }
        }

        if (game.settings.get("monks-little-details", "alter-hud")) {
            CONFIG.statusEffects = CONFIG.statusEffects.sort(function (a, b) {
                let aid = (a.label != undefined ? i18n(a.label) : a.id);
                let bid = (b.label != undefined ? i18n(b.label) : b.id);
                return (aid > bid ? 1 : (aid < bid ? -1 : 0));
                //return (a.id == undefined || a.id > b.id ? 1 : (a.id < b.id ? -1 : 0)); //(a.label == undefined || i18n(a.label) > i18n(b.label) ? 1 : (i18n(a.label) < i18n(b.label) ? -1 : 0));
            });

            if (setting('sort-by-columns')) {
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
            }
        }
    }

    static registerHotKeys() {
        /*
        window.addEventListener('keydown', (e) => {
            if (MonksLittleDetails.canvasfocus && document.activeElement.tagName == 'BODY') {
                if (Object.keys(MonksLittleDetails.swapTool).includes(e.key.toLowerCase())) {
                    let controlName = MonksLittleDetails.swapTool[e.key.toLowerCase()];
                    let control = ui.controls.control;
                    if (control.name != controlName && MonksLittleDetails.switchTool == undefined) {
                        if (!e.shiftKey)
                            MonksLittleDetails.switchTool = { control: control, tool: control.activeTool };
                        let newcontrol = ui.controls.controls.find(c => { return c.name == controlName; });
                        if (newcontrol != undefined) {
                            ui.controls.activeControl = newcontrol.name;
                            if (newcontrol && newcontrol.layer)
                                canvas.getLayer(newcontrol.layer).activate();
                        }
                    }
                }
            }
        })

        window.addEventListener('keyup', (e) => {
            if (Object.keys(MonksLittleDetails.swapTool).includes(e.key.toLowerCase()) && MonksLittleDetails.switchTool != undefined) {
                if (MonksLittleDetails.switchTool.control) {
                    if (MonksLittleDetails.switchTool.control.layer)
                        canvas.getLayer(MonksLittleDetails.switchTool.control.layer).activate();
                    ui.controls.activeControl = MonksLittleDetails.switchTool.control.name;
                }
                delete MonksLittleDetails.switchTool;
            }
        })*/

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
                    canvas.getLayer(newcontrol.layer).activate();
            }
        }
    }

    static releaseTool() {
        if (MonksLittleDetails.switchTool != undefined) {
            if (MonksLittleDetails.switchTool.control) {
                if (MonksLittleDetails.switchTool.control.layer)
                    canvas.getLayer(MonksLittleDetails.switchTool.control.layer).activate();
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

.form-group select{
    width: calc(100% - 2px);
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

        let iconWidth = '24';
        if (game.world.system == 'pf2e' || (game.modules.get("illandril-token-hud-scale") != undefined && game.modules.get("illandril-token-hud-scale").active && game.settings.get("illandril-token-hud-scale", "enableStatusSelectorScale")))
            iconWidth = '36';

        /*
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

#token-hud .status-effects div.effect-control{
    width: 100% !important;
    height: ${iconWidth}px !important;
    color: #ccc;
    cursor: pointer;
    border-radius: 4px;
    padding: 1px;
    border: 1px solid transparent;
    position:relative;
}

#token-hud .status-effects div.pf2e-effect-img-container{
    height: ${iconWidth}px !important;
    text-align:left;
    padding-left:1px;
    border: 1px solid transparent;
    border-radius: 4px;
    opacity:0.4;
    color: #ccc;
}

#token-hud .status-effects div.effect-control:hover {
    color: #d2d1d0 !important;
}

#token-hud .status-effects div.pf2e-effect-img-container:hover{
    opacity:0.75;
}

#token-hud .status-effects .effect-control.active,
#token-hud .status-effects .pf2e-effect-img-container.active{
    color: #ff6400;
    border: 1px solid #ff6400;
    opacity:1;
}

#token-hud .status-effects .effect-control.active:hover {
    color: #ffc163 !important;
}

#token-hud .status-effects .effect-control img,
#token-hud .status-effects .pf2e-effect-img-container img{
    width: 100%;
    height: ${iconWidth}px;
    margin: 0;
    margin-top:-1px;
    padding: 0;
    padding-right: calc(100% - ${iconWidth}px);
    border: none;
    opacity: 0.5;
    display: inline-block;
}

#token-hud .status-effects .effect-control:hover img {
    opacity: 0.8;
}

#token-hud .status-effects .effect-control.active img,
#token-hud .status-effects .pf2e-effect-img-container.active img{
    opacity: 1;
    filter: sepia(100%) saturate(2000%) hue-rotate(-50deg);
}

#token-hud .status-effects div.effect-control div.effect-name,
#token-hud .status-effects div.pf2e-effect-img-container div.effect-name{
    vertical-align: top;
    padding-left: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: calc(100% - ${iconWidth}px);
    display: inline-block;
    pointer-events:none;
    position: absolute;
    top: 0px;
    left: ${iconWidth}px;
}
`;
        }*/

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
            if (this instanceof Token) {
                let token = this;
                if (this.soundeffect == undefined) {
                    let volume = game.settings.get("core", 'globalInterfaceVolume');
                    token.soundeffect = AudioHelper.play({ src: audiofile, volume: volume }, true);
                    token.soundeffect.on("end", () => {
                        log('Finished playing', audiofile);
                        delete token.soundeffect;
                    });

                } else {
                    token.soundeffect.stop();
                    game.socket.emit("stopAudio", {src: audiofile});
                    delete token.soundeffect;
                }

                //this.soundeffect = MonksLittleDetails.playSoundEffect(audiofile);
                //this.soundeffect._onend
                /*
                game.socket.emit(
                    MonksLittleDetails.SOCKET,
                    {
                        msgtype: 'playsoundeffect',
                        senderId: game.user._id,
                        actorid: this.actor.id,
                        audiofile: audiofile
                    },
                    (resp) => { }
                );*/
            } //else
                //MonksLittleDetails.playSoundEffect(audiofile);
        }
        if(event != undefined)
            event.preventDefault;
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

    /*
    static onMessage(data) {
        switch (data.msgtype) {
            case 'playsoundeffect': {
                MonksLittleDetails.playSoundEffect(data.audiofile);
            } break;
        }
    }*/

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
            if (next == undefined || next >= combat.turns.length)
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

    static async alterHUD(html) {
        if (MonksLittleDetails.canDo("alter-hud") && setting("alter-hud")) {
            $('#token-hud').addClass('monks-little-details').toggleClass('highlight-image', setting('alter-hud-colour'));
            const statuses = this._getStatusEffectChoices();

            for (let img of $('.col.right .control-icon.effects .status-effects > img')) {
                const status = statuses[img.getAttribute("src")] || {};
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
            };

            $('.col.right .control-icon.effects .status-effects > div.pf2e-effect-img-container', html).each(function () {
                let img = $('img', this);
                let title = img.attr('data-condition');
                let div = $('<div>').addClass('effect-name').attr('title', title).html(title).insertAfter(img);
                //$(this).append(div);
                const status = statuses[img.attr('src')] || {};
                //$(this).attr('src', img.attr('src')).toggleClass('active', !!status.isActive);
            });

            if (game.world.system !== 'pf2e') {
                $('.col.right .control-icon.effects .status-effects', html).append(
                    $('<div>').addClass('clear-all').html('<i class="fas fa-times-circle"></i> clear all').click($.proxy(MonksLittleDetails.clearAll, this))
                );
            }
        }
    }

    static async clearAll() {
        //find the tokenhud, get the TokenHUD.object  ...assuming it's a token?
        const statuses = this._getStatusEffectChoices();

        for (const [k, status] of Object.entries(statuses)) {
            if (status.isActive) {
                await this.object.toggleEffect({ id: status.id, icon: status.src });
            }
        }

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

    static getPalette(src, element) {
        // Create custom CanvasImage object
        //if (VideoHelper.hasVideoExtension(url)) {
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
        /*} else {
            MonksLittleDetails.canvasImage = new Image();
            MonksLittleDetails.canvasImage.addEventListener('load', () => {
                MonksLittleDetails.processPalette();
            });
            MonksLittleDetails.canvasImage.src = url + '?' + new Date().getTime();
            MonksLittleDetails.canvasImage.setAttribute('crossOrigin', '');
        }*/
    };

    /*
    static processPalette() {
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
    }*/
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
        $('.background-palette-container').remove();
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
        Hooks.on("updateCombatant", function (context, parentId, data) {
            const combat = game.combats.get(parentId);
            if (combat && combat.started) {
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
            if (combat && combat.started) {
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
            if (combat && combat.started) {
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

    //if we're using combat bars and the combat starts or stops, we need to refresh the tokens
    if (setting('add-combat-bars') && combat) {
        for (let combatant of combat.combatants) {
            let token = canvas.tokens.placeables.find(t => { return t.id == combatant.tokenId; });
            let displayBars = token.data.displayBars;
            let combatBar = token.getFlag('monks-little-details', 'displayBarsCombat');
            combatBar = (combatBar == undefined || combatBar == -1 ? displayBars : combatBar);

            if (token.bars.alpha != 1) {
                token.bars.alpha = 1;
                token.refresh();
            } else if (combatBar != displayBars)
                token.refresh();
        }
    }
});

Hooks.on("updateCombat", function (combat, delta) {
    MonksLittleDetails.checkCombatTurn(combat);

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

    //if we're using combat bars and the combat starts or stops, we need to refresh the tokens
    if (setting('add-combat-bars') && combat && (delta.round === 1 && combat.turn === 0 && combat.started === true)) {
        for (let combatant of combat.combatants) {
            let token = canvas.tokens.placeables.find(t => { return t.id == combatant.tokenId; });
            let displayBars = token.data.displayBars;
            let combatBar = token.getFlag('monks-little-details', 'displayBarsCombat');
            combatBar = (combatBar == undefined || combatBar == -1 ? displayBars : combatBar);

            if (combatBar != displayBars)
                token.refresh();
        }
    }

    log("update combat", combat);
    let opencombat = setting("opencombat");
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

    if (setting("token-combat-highlight") && combat.started) {
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

    canvas.stage.on('mouseover', (e) => {
        MonksLittleDetails.canvasfocus = true;
    });

    canvas.stage.on('mouseout', (e) => {
        MonksLittleDetails.canvasfocus = false;
    });
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

        let backgroundColor = $('input[data-edit="backgroundColor"]');
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

        /*
        if (MonksLittleDetails.currentScene.img != undefined) {
            let backgroundColor = $('input[name="backgroundColor"]').parents('.form-group:first');

            $('<div>')
                .addClass('form-group')
                .append($('<label>').html('Background Palette'))
                .append($('<div>').addClass('form-fields palette-fields'))
                .insertAfter(backgroundColor);

            MonksLittleDetails.getPalette(MonksLittleDetails.currentScene.img);
        }*/

        /*
        $('<div>')
            .addClass('background-size width')
            .insertAfter($('input[name="width"]'));
        $('<div>')
            .addClass('background-size height')
            .insertAfter($('input[name="height"]'));
            */

        /*
        $('input.image[name="img"]').on('change', function () {
            let img = $(this).val();
            MonksLittleDetails.getPalette(img);
        })*/
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
    if (dragtogether != undefined && dragtogether.active && options.ignore == undefined && update.c != undefined) {
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

Hooks.on("updateToken", function (scene, tkn, data, options, userid) {
    //actorData.data.attributes.hp
    if (['npc', 'all'].includes(setting('auto-defeated')) && game.user.isGM) {
        let token = canvas.tokens.get(tkn._id);
        let hp = getProperty(data, 'actorData.data.attributes.hp');
        if (hp != undefined && (setting('auto-defeated') == 'all' || (setting('auto-defeated') == 'npc' && token.data.disposition != 1))) {
            let combatant;
            let combat = game.combats.find(c => {
                if (c.started)
                    combatant = c.combatants.find(t => {
                        return t.tokenId == token.id;
                    });
                return c.started && combatant != undefined;
            });

            let defeated = (hp.value == 0);
            if (combatant != undefined && combatant.defeated != defeated) {
                combat.updateCombatant({ _id: combatant._id, defeated: defeated }).then(() => {
                    token.refresh();
                });
                //combatant.update({ defeated: defeated });
            }
        }
    }

    if (setting('auto-reveal') && game.user.isGM && data.hidden === false) {
        let token = canvas.tokens.get(tkn._id);
        let combatant;
        let combat = game.combats.find(c => {
            if (c.started)
                combatant = c.combatants.find(t => {
                    return t.tokenId == token.id;
                });
            return c.started && combatant != undefined;
        });

        if (combatant?.hidden === true) {
            combat.updateCombatant({ _id: combatant._id, hidden: false }).then(() => {
                token.refresh();
            });
        }
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
        if (compendium.entity == 'Scene') {
            html.find('li.directory-item h4 a').click(ev => {
                ev.preventDefault();
                ev.cancelBubble = true;
                if (ev.stopPropagation)
                    ev.stopPropagation();
                let entryId = $(ev.currentTarget).parents('li:first').attr('data-entry-id');
                compendium.getEntity(entryId).then(entry => {
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

