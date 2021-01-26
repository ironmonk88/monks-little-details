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
export let volume = () => {
    return game.settings.get("monks-little-details", "volume") / 100.0;
};
export let combatposition = () => {
    return game.settings.get("monks-little-details", "combat-position");
};

export class MonksLittleDetails {
    static tracker = false;

    static init() {
	    log("initializing");
        // element statics
       // CONFIG.debug.hooks = true;

        if (game.MonksLittleDetails == undefined)
            game.MonksLittleDetails = MonksLittleDetails;

        MonksLittleDetails.SOCKET = "module.monks-little-details";

        MonksLittleDetails.READY = true;

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
        ];

        // sound statics
        MonksLittleDetails.TURN_SOUND = "modules/monks-little-details/sounds/turn.wav";
        MonksLittleDetails.NEXT_SOUND = "modules/monks-little-details/sounds/next.wav";
        MonksLittleDetails.ROUND_SOUND = "modules/monks-little-details/sounds/round.wav";
        MonksLittleDetails.ACK_SOUND = "modules/monks-little-details/sounds/ack.wav";

        registerSettings();

        MonksLittleDetails.injectCSS();

        if (game.settings.get("monks-little-details", "change-invisible-image") && game.world.system === "dnd5e")
            CONFIG.controlIcons.visibility = "modules/monks-little-details/icons/invisible.svg";

        if (game.settings.get("monks-little-details", "alter-hud")) {
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
                    { "id": "disengage", "label": "MonksLittleDetails.StatusDisengage", "icon": "modules/monks-little-details/icons/journey.png" }
                ]
            );

            CONFIG.statusEffects = CONFIG.statusEffects.sort(function (a, b) {
                return (a.id == undefined || a.id > b.id ? 1 : (a.id < b.id ? -1 : 0));
            })

            let oldTokenHUDRender = TokenHUD.prototype._render;
            TokenHUD.prototype._render = function (force = false, options = {}) {
                let result = oldTokenHUDRender.call(this, force, options).then((a, b) => {
                    MonksLittleDetails.alterHUD(MonksLittleDetails.element);
                });

                return result;
            }
        }
    }

    static ready() {
        MonksLittleDetails.injectSoundCtrls();

        MonksLittleDetails.checkCombatTurn();

        game.socket.on('module.monks-little-details', MonksLittleDetails.onMessage);

        canvas.stage.on("mousedown", MonksLittleDetails.moveTokens);    //move all tokens while holding down m
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
`;
        }

        let iconWidth = '24';
        if (game.modules.get("illandril-token-hud-scale") != undefined && game.modules.get("illandril-token-hud-scale").active && game.settings.get("illandril-token-hud-scale", "enableStatusSelectorScale"))
            iconWidth = '36';

        if (game.world.system === "dnd5e" && game.settings.get("monks-little-details", "alter-hud")) {
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
        let npcSheetNames = Object.values(CONFIG.Actor.sheetClasses.npc)
            .map((sheetClass) => sheetClass.cls)
            .map((sheet) => sheet.name);

        npcSheetNames.forEach((sheetName) => {
            Hooks.on("render" + sheetName, (app, html, data) => {
                // only for GMs or the owner of this npc
                if (!data.owner || !data.actor) return;

                // don't add the button multiple times
                if ($(html).find("#mldCharacterSound").length > 0) return;

                let button = $('<button>')
                    .attr('type', "button")
                    .attr('id', "mldCharacterSound")
                    .toggleClass('loaded', app.entity.data.flags['monks-little-details'] != undefined)
                    .html('<i class="fas fa-volume-up"></i>')
                    .click($.proxy(MonksLittleDetails.findSoundEffect, app))
                    .contextmenu($.proxy(MonksLittleDetails.loadSoundEffect, app));

                let wrap = $('<div class="mldCharacterName"></div>');
                $(html).find("input[name='name']").wrap(wrap);
                $(html).find("input[name='name']").parent().prepend(button);
            });
        });
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
        event.preventDefault;
    }

    static playSoundEffect(audiofile) {
        if (audiofile != undefined) {
            let volume = game.settings.get("core", 'globalInterfaceVolume');
            AudioHelper.play({ src: audiofile, volume: volume });
        }
    }

    static async moveTokens(event) {
        if (game.user.isGM && game.keyboard.isDown("m") && canvas.tokens.controlled.length > 0) {
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

            let tokens = canvas.tokens.controlled.map(t => { return t.id; })
            for (let i = 0; i < tokens.length; i++) {
                let t = canvas.tokens.get(tokens[i]);
                let offsetx = mid.x - t.data.x;
                let offsety = mid.y - t.data.y;
                let gridPt = canvas.grid.grid.getGridPositionFromPixels(pos.x - offsetx, pos.y - offsety);
                let px = canvas.grid.grid.getPixelsFromGridPosition(gridPt[0], gridPt[1]);

                await t.update({ x: px[0], y: px[1] }, { animate: false });
            }
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
        if (volume() > 0 && !game.settings.get("monks-little-details", "disablesounds"))
            AudioHelper.play({ src: MonksLittleDetails.TURN_SOUND, volume: volume() });
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
        if (volume() > 0 && !game.settings.get("monks-little-details", "disablesounds"))
            AudioHelper.play({ src: MonksLittleDetails.NEXT_SOUND, volume: volume() });
    }

    /**
    * Check if the current combatant needs to be updated
    */
    static checkCombatTurn() {
        let curCombat = game.combats.active;

        if (curCombat && curCombat.started) {
            let entry = curCombat.combatant;
            // next combatant
            let nxtturn = (curCombat.turn || 0) + 1;
            if (nxtturn > curCombat.turns.length - 1) nxtturn = 0;
            let nxtentry = curCombat.turns[nxtturn];

            //find the next one that hasn't been defeated
            while (nxtentry.defeated && nxtturn != curCombat.turn) {
                nxtturn++;
                if (nxtturn > curCombat.turns.length - 1) nxtturn = 0;
                nxtentry = curCombat.turns[nxtturn];
            }

            if (entry !== undefined && !game.user.isGM) {
                let isActive = entry.actor?.owner;
                let isNext = nxtentry.actor?.owner; //_id === game.users.current.character?._id;

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

        let butHeight = (!game.user.isGM && !app.combat.getCombatantByToken(app.combat.current.tokenId).owner ? 40 : 0);

        app.position.left = (combatposition().endsWith('left') ? 120 : (sidebar.offsetLeft - app.position.width));
        app.position.top = (combatposition().startsWith('top') ?
            (combatposition().endsWith('left') ? 70 : (sidebar.offsetTop - 3)) :
            (combatposition().endsWith('left') ? (players.offsetTop - app.position.height - 3) : (sidebar.offsetTop + sidebar.offsetHeight - app.position.height - 3)) - butHeight);
        $(app._element).css({ top: app.position.top, left: app.position.left });
    }

    static alterHUD(html) {
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
        if (game.world.system === "dnd5e") {
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
    }

    static getCR(combat) {
        var apl = { count: 0, levels: 0 };
        var xp = 0;

        //get the APL of friendly combatants
        $(combat.data.combatants).each(function (idx, combatant) {
            if (combatant.actor != undefined) {
                if (combatant.token.disposition == 1) {
                    apl.count = apl.count + 1;
                    apl.levels = apl.levels + combatant.actor.data.data.details.level;
                } else {
                    xp += (combatant?.actor.data.data.details?.xp?.value || 0);
                }
            }
        });

        var calcAPL = 0;
        if (apl.count > 0)
            calcAPL = Math.round(apl.levels / apl.count) + (apl.count < 4 ? -1 : (apl.count > 5 ? 1 : 0));

        //get the CR of any unfriendly/neutral
        var cr = 999;
        $(MonksLittleDetails.xpchart).each(function () {
            if (this.xp >= xp)
                cr = Math.min(cr, this.cr);
        });

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
        MonksLittleDetails.canvasImage.src = url;
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
});
/**
 * Handle combatant update
 */
Hooks.on("updateCombatant", function (context, parentId, data) {
    const combat = game.combats.get(parentId);
    if (combat) {
        const combatant = combat.data.combatants.find((o) => o.id === data.id);

        if (combatant.actor.owner) MonksLittleDetails.checkCombatTurn();
    }
});

/**
 * Handle combatant delete
 */
Hooks.on("deleteCombatant", function (context, parentId, data) {
  //let combat = game.combats.get(parentId);
    MonksLittleDetails.checkCombatTurn();
});

/**
 * Handle combatant added
 */
Hooks.on("addCombatant", function (context, parentId, data) {
    let combat = game.combats.get(parentId);
    let combatant = combat.data.combatants.find((o) => o.id === data.id);

    if (combatant.actor.owner) 
        MonksLittleDetails.checkCombatTurn();
});

/**
 * Combat update hook
 */

Hooks.on("deleteCombat", function (combat) {
    MonksLittleDetails.tracker = false;   //if the combat gets deleted, make sure to clear this out so that the next time the combat popout gets rendered it repositions the dialog

    if (game.combats.combats.length == 0 && game.settings.get("monks-little-details", 'close-combat-when-done')) {
        const tabApp = ui["combat"];
        tabApp.close();
    }

});

Hooks.on("updateCombat", function (data, delta) {
    MonksLittleDetails.checkCombatTurn();

	log("update combat", data);
	if(game.settings.get("monks-little-details", "opencombat") && delta.round === 1 && data.turn === 0 && data.started === true){
		//new combat, pop it out
		const tabApp = ui["combat"];
		tabApp.renderPopout(tabApp);
		
        if (ui.sidebar.activeTab !== "chat")
            ui.sidebar.activateTab("chat");
    }

    if (combatposition() !== '' && delta.active === true) {
        //+++ make sure if it's not this players turn and it's not the GM to add padding for the button at the bottom
        MonksLittleDetails.tracker = false;   //delete this so that the next render will reposition the popout, changin between combats changes the height
    }

    if (!game.user.isGM && volume() > 0 && game.settings.get("monks-little-details", "playroundsound") && !game.settings.get("monks-little-details", "disablesounds") && Object.keys(delta).some((k) => k === "round")) {
		AudioHelper.play({
            src: MonksLittleDetails.ROUND_SOUND,
		    volume: volume()
		});
	}
});

/**
 * Ready hook
 */
Hooks.on("ready", MonksLittleDetails.ready);

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

    if (app.object.actor.data.flags['monks-little-details'] != undefined) {
        $('.col.right', html).append(
            $('<div>').addClass('control-icon sound-effect')
                .append('<img src="modules/monks-little-details/icons/volumeup.svg" width="36" height="36" title="Play Sound Effect">')
                .click($.proxy(MonksLittleDetails.loadSoundEffect, app.object)));
    }
});

Hooks.on('renderCombatTracker', async (app, html, options) => {
    if (game.user.isGM && game.combat && !game.combat.started && game.settings.get("monks-little-details", 'show-combat-cr') && game.world.system === "dnd5e") {
        //calculate CR
        let data = MonksLittleDetails.getCR(game.combat);

        if ($('#combat-round .encounter-cr-row').length == 0 && game.combat.data.combatants.length > 0) {
            $('<nav>').addClass('encounters flexrow encounter-cr-row')
                .append($('<h3>').html('CR: ' + MonksLittleDetails.getCRText(data.cr)))
                .append($('<div>').addClass('encounter-cr').attr('rating', MonksLittleDetails.getCRChallenge(data)).html(MonksLittleDetails.getCRChallengeName(data)))
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
            onClick: function () { MonksLittleDetails.dragtogether = !MonksLittleDetails.dragtogether; },
            toggle: true
        }];
        let wallTools = controls.find(control => control.name === "walls").tools;
        wallTools.splice(wallTools.findIndex(e => e.name === 'clone') + 1, 0, ...dragtogetherTools);
    }
});

Hooks.on("preUpdateWall", (scene, wall, update, options) => {
    if (MonksLittleDetails.dragtogether && options.ignore == undefined) {
        let oldcoord = ((wall.c[0] != update.c[0] || wall.c[1] != update.c[1]) && wall.c[2] == update.c[2] && wall.c[3] == update.c[3] ? [wall.c[0], wall.c[1], update.c[0], update.c[1]] :
            ((wall.c[2] != update.c[2] || wall.c[3] != update.c[3]) && wall.c[0] == update.c[0] && wall.c[1] == update.c[1] ? [wall.c[2], wall.c[3], update.c[2], update.c[3]] : null));
        if (oldcoord != null) {
            scene.data.walls.forEach(w => {
                if (w._id != wall._id) {
                    if (w.c[0] == oldcoord[0] && w.c[1] == oldcoord[1])
                        scene.updateEmbeddedEntity("Wall", { c: [oldcoord[2], oldcoord[3], w.c[2], w.c[3]], _id: w._id }, { ignore: true });
                    else if (w.c[2] == oldcoord[0] && w.c[3] == oldcoord[1])
                        scene.updateEmbeddedEntity("Wall", { c: [w.c[0], w.c[1], oldcoord[2], oldcoord[3]], _id: w._id }, { ignore: true });
                }
            });
        }
    }
    let thewall = scene.data.walls.find(w => w._id === wall._id);
    log('preupdatewall', thewall.c, wall.c, update);
});

Hooks.on("updateWall", (scene, wall, update, options) => {
    let thewall = scene.data.walls.find(w => w._id === wall._id);
    log('updatewall', thewall);
});
