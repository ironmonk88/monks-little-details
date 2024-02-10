import { registerSettings } from "./settings.js";
import { MMCQ } from "./quantize.js";
import { UpdateImages } from "./apps/update-images.js";
import { ModuleWarning } from "./apps/module-warning.js";
import { HUDChanges } from "./js/hud-changes.js";
import { MonksCompendium} from "./apps/compendium.js";

export let debugEnabled = 0;

export let debug = (...args) => {
    if (debugEnabled > 1) console.log("DEBUG: monks-little-details | ", ...args);
};
export let log = (...args) => console.log("monks-little-details | ", ...args);
export let warn = (...args) => {
    if (debugEnabled > 0) console.warn("WARN: monks-little-details | ", ...args);
};
export let error = (...args) => console.error("monks-little-details | ", ...args);

export const setDebugLevel = (debugText) => {
    debugEnabled = { none: 0, warn: 1, debug: 2, all: 3 }[debugText] || 0;
    // 0 = none, warnings = 1, debug = 2, all = 3
    if (debugEnabled >= 3)
        CONFIG.debug.hooks = true;
};

export let i18n = key => {
    return game.i18n.localize(key);
};
export let setting = key => {
    return game.settings.get("monks-little-details", key);
};

export let patchFunc = (prop, func, type = "WRAPPER") => {
    if (game.modules.get("lib-wrapper")?.active) {
        libWrapper.register("monks-little-details", prop, func, type);
    } else {
        const oldFunc = eval(prop);
        eval(`${prop} = function (event) {
            return func.call(this, oldFunc.bind(this), ...arguments);
        }`);
    }
}

export let isV11 = () => {
    return isNewerVersion(game.version, "10.9999");
};

export class MonksLittleDetails {
    static tokenHUDimages = {};
    static movingToken = false;

    static canDo(setting) {
        //needs to not be on the reject list, and if there is an only list, it needs to be on it.
        if (MonksLittleDetails._rejectlist[setting] != undefined && MonksLittleDetails._rejectlist[setting].includes(game.system.id))
            return false;
        if (MonksLittleDetails._onlylist[setting] != undefined && !MonksLittleDetails._onlylist[setting].includes(game.system.id))
            return false;
        return true;
    };

    static init() {
        if (game.MonksLittleDetails == undefined)
            game.MonksLittleDetails = MonksLittleDetails;

        try {
            Object.defineProperty(User.prototype, "isTheGM", {
                get: function isTheGM() {
                    return this == (game.users.find(u => u.hasRole("GAMEMASTER") && u.active) || game.users.find(u => u.hasRole("ASSISTANT") && u.active));
                }
            });
        } catch { }

        MonksLittleDetails.SOCKET = "module.monks-little-details";

        MonksLittleDetails._rejectlist = {
            "add-extra-statuses": ["pf2e"]
        }
        MonksLittleDetails._onlylist = {
            "sort-by-columns": ["dnd5e"],
            "show-combat-cr": ["dnd5e", "pf2e"]
        }

        registerSettings();
        MonksLittleDetails.registerHotKeys();

        if (setting("compendium-additional"))
            MonksCompendium.init();

        if (setting("reposition-collapse"))
            $('body').addClass("reposition-collapse");

        if (MonksLittleDetails.canDo("change-invisible-image") && setting("change-invisible-image"))
            CONFIG.controlIcons.visibility = "modules/monks-little-details/icons/invisible.svg";

        if (MonksLittleDetails.canDo("add-extra-statuses") && setting("add-extra-statuses")) {
            CONFIG.statusEffects = CONFIG.statusEffects.concat(setting("additional-effects") || []);
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
                                let img = entry.img;
                                if (VideoHelper.hasVideoExtension(img))
                                    ImageHelper.createThumbnail(img, { width: entry.width, height: entry.height }).then(img => {
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

        if (setting("alter-hud"))
            HUDChanges.init();

        let releaseAll = function (wrapped, ...args) {
            if (this.controlled.length) {
                let data = { tokens: this.controlled.map(t => t.document) };
                let id = window.setTimeout(() => {
                    if (id == MonksLittleDetails._selectedTokens.id)
                        delete MonksLittleDetails._selectedTokens;
                }, 400);
                data.id = id;
                MonksLittleDetails._selectedTokens = data;
            }
            return wrapped(...args);
        }

        patchFunc("TokenLayer.prototype.releaseAll", releaseAll);

        patchFunc("FilePicker.prototype._onSubmit", async (wrapped, ...args) => {
            let [ev] = args;
            let path = ev.target.file.value;

            if (path && path.length) {
                let idx = path.lastIndexOf("/");
                let target = path.substring(0, idx);

                MonksLittleDetails.addQuickLink(target);
            }

            return wrapped(...args);
        });

        patchFunc("DocumentSheet.prototype._createDocumentIdLink", function (wrapped, ...args) {
            wrapped(...args);
            let [html] = args;

            if (!(this.object instanceof foundry.abstract.Document) || !this.object.id || !(this.object.src || this.object.img)) return;
            const title = html.find(".window-title");
            const label = game.i18n.localize(this.object.constructor.metadata.label);
            const srcLink = document.createElement("a");
            srcLink.classList.add("document-image-link");
            srcLink.setAttribute("alt", "Copy image file path");
            srcLink.dataset.tooltip = "Copy image file path";
            srcLink.dataset.tooltipDirection = "UP";
            srcLink.innerHTML = '<i class="fa-solid fa-file-image"></i>';
            srcLink.addEventListener("click", event => {
                let src = (this.object.src || this.object.img);
                event.preventDefault();
                game.clipboard.copyPlainText(src);
                ui.notifications.info(`${label} image ${src} copied to clipboard`);
            });
            title.append(srcLink);
        });

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
                if (message.sound) AudioHelper.play({ src: message.sound });
            }

            if (game.modules.get("lib-wrapper")?.active) {
                libWrapper.register("monks-little-details", "ChatLog.prototype.notify", chatLogNotify, "OVERRIDE");
            } else {
                ChatLog.prototype.notify = function (event) {
                    return chatLogNotify.call(this, ...arguments);
                }
            }
        }

        let onDropData = async function (...args) {
            const [event, data] = args;
            if (!data.texture?.src) return;
            if (!this.active) this.activate();

            // Get the data for the tile to create
            const createData = await this._getDropData(event, data);

            // Validate that the drop position is in-bounds and snap to grid
            if (!canvas.dimensions.rect.contains(createData.x, createData.y))
                return false;

            // Create the Tile Document
            const cls = getDocumentClass(this.constructor.documentName);
            return cls.create(createData, { parent: canvas.scene });
        }

        if (game.modules.get("lib-wrapper")?.active) {
            libWrapper.register("monks-little-details", "TilesLayer.prototype._onDropData", onDropData, "OVERRIDE");
        } else {
            //const oldOnDropData = MapLayer.prototype._onDropData;
            TilesLayer.prototype._onDropData = function () {
                return onDropData.call(this, ...arguments);
            }
        }

        let oldRenderPopout = ActorDirectory.prototype.renderPopout;
        ActorDirectory.prototype.renderPopout = function () {
            if (setting("open-actor")) {
                if (game.user.isGM) {
                    if (MonksLittleDetails._lastActor)
                        MonksLittleDetails._lastActor.sheet.render(true, { focus: true });
                    else
                        return oldRenderPopout.call(this);
                } else {
                    if (game.user.character)
                        game.user.character.sheet.render(true, { focus: true });
                    else
                        return oldRenderPopout.call(this);
                }
            } else
                return oldRenderPopout.call(this);
        }
    }

    static addQuickLink(target, favorite = false) {
        let quicklinks = (game.user.getFlag("monks-little-details", "quicklinks") || []);
        let link = quicklinks.find(q => q.target == target);

        let favorites = [];
        let regular = quicklinks.filter(q => {
            if (q.favorite) favorites.push(q);
            return !q.favorite;
        });

        // if this link already exists
        //      if a favorite then do nothing, not a favorite, then sort it to the top of the list
        // if this link doesn't exist
        // check to see if there are any non-favorite spots available and push to the list.  Pop any that are greater than 25

        if (link) {
            if (!link.favorite) {
                regular.findSplice(q => q.target == target);
                regular.unshift(link);
            }
        } else {
            if (favorites.length < 25) {
                regular.unshift({ target: target, favorite });
                if (regular.length + favorites.length > 25)
                    regular = regular.slice(0, 25 - favorites.length);

                $(".quick-link-input-button").each(function () {
                    let input = $(this).next().val();
                    if (input == target) {
                        $("i", this).attr("class", `fa-star ${favorite ? "fa-solid" : "fa-regular"}`)
                    }
                });
            }
        }

        quicklinks = favorites.concat(regular);
        game.user.setFlag("monks-little-details", "quicklinks", quicklinks);

        MonksLittleDetails.buildQuickLinks(quicklinks, $('ul.quick-links-list'));
    }

    static buildQuickLinks(quicklinks, lists) {
        let favorites = [];
        let regular = quicklinks.filter(q => {
            if (q.favorite) favorites.push(q);
            return !q.favorite;
        })

        if (lists.length) {
            for (let l of lists) {
                let list = $(l);
                list.empty();
                if (quicklinks.length == 0)
                    list.append($("<li>").addClass('no-quick-links').html("No quick links yet"));
                else {
                    list.append(favorites.concat(regular).map(j => {
                        return $('<li>')
                            .addClass('quick-link-item flexrow')
                            .attr('target', j.target)
                            .append($('<div>').addClass('quick-favorite').html(`<i class="fa-star ${j.favorite ? "fa-solid" : "fa-regular"}"></i>`).click(MonksLittleDetails.toggleFavorite.bind(j, j.target)))
                            .append($('<div>').addClass('quick-title').html(j.target ? j.target : "-- root --"))
                            .click(MonksLittleDetails.selectQuickLink.bind(l, j.target));
                    }));
                }
            };
        }
    }

    static toggleFavorite(target, event) {
        event.preventDefault();
        event.stopPropagation();

        let quicklinks = duplicate(game.user.getFlag("monks-little-details", "quicklinks") || []);
        let link = quicklinks.find(q => q.target == target);
        link.favorite = !link.favorite;
        game.user.setFlag("monks-little-details", "quicklinks", quicklinks);
        $(`.quick-link-item[target="${target}"] .quick-favorite i`).toggleClass("fa-solid", link.favorite).toggleClass("fa-regular", !link.favorite);

        $(".quick-link-input-button").each(function () {
            let target = $(this).next().val();
            if (target == link.target) {
                $("i", this).attr("class", `fa-star ${link?.favorite ? "fa-solid" : "fa-regular"}`)
            }
        });
    }

    static selectQuickLink(target, event) {
        event.preventDefault();
        event.stopPropagation();
        this.app.browse(target);
        $('.quick-links-list.open').removeClass('open');
    }

    static async ready() {
        MonksLittleDetails.injectCSS();

        if (setting("pause-border") && game.paused && $('#board').length) {
            $("body").addClass("mld-paused");
        } else
            $("body").removeClass("mld-paused");

        try {
            let actorId = game.user.getFlag("monks-little-details", "last-actor");
            if (actorId)
                MonksLittleDetails._lastActor = await fromUuid(actorId);
        } catch { }

        const sortingModes = game.settings.get("core", "collectionSortingModes");
        if (sortingModes["CompendiumPacks"] == undefined && setting("compendium-additional")) {
            sortingModes["CompendiumPacks"] = "t";
            game.settings.set("core", "collectionSortingModes", sortingModes);
        }

        $('body').toggleClass("change-windows", setting("window-css-changes"));

        game.settings.settings.get("monks-little-details.find-my-token").default = !game.user.isGM;

        if (setting("show-warning") && game.user.isGM) {
            new ModuleWarning().render(true);
        }

        HUDChanges.ready();
        game.socket.on(MonksLittleDetails.SOCKET, MonksLittleDetails.onMessage);

        //remove notify
        $('#sidebar-tabs a[data-tab="chat"]').on('click.monks-little-details', function (event) {
            let icon = $('#chat-notification');
            if (icon.is(":visible")) icon.fadeOut(100);
        });
    }

    static registerHotKeys() {
        game.keybindings.register('monks-little-details', 'movement-key', {
            name: 'MonksLittleDetails.movement-key.name',
            hint: 'MonksLittleDetails.movement-key.hint',
            editable: [{ key: 'KeyM' }],
            restricted: true,
        });

        game.keybindings.register('monks-little-details', 'release-targets', {
            name: 'MonksLittleDetails.release-targets.name',
            editable: [{ key: "KeyT", modifiers: [KeyboardManager.MODIFIER_KEYS?.ALT]}],
            restricted: false,
            onDown: () => {
                for (let t of game.user.targets) {
                    t.setTarget(false, { user: game.user, releaseOthers: false, groupSelection: true });
                }
            },
        });

        if (game.settings.get("monks-little-details", "key-swap-tool")) {
            let layers = [
                { name: "Token Layer", tool: 'token', def: "KeyG", restricted: false },
                { name: "Measure Layer", tool: 'measure', restricted: false },
                { name: "Tile Layer", tool: 'tiles', def: "KeyH", restricted: true },
                { name: "Drawing Layer", tool: 'drawings', restricted: false },
                { name: "Wall Layer", tool: 'walls', restricted: true },
                { name: "Lighting Layer", tool: 'lighting', def: "KeyJ", restricted: true },
                { name: "Sound Layer", tool: 'sounds', def: "KeyK", restricted: true },
                { name: "Note Layer", tool: 'notes', restricted: false }
            ];
            if (game.modules["enhanced-terrain-layer"]?.active)
                layers.push({ name: i18n("MonksLittleDetails.TerrainLayer"), tool: 'terrain', def: "KeyL", restricted: true });

            layers.map(l => {
                game.keybindings.register('monks-little-details', `swap-${l.tool}-control`, {
                    name: `Quick show ${l.name}`,
                    editable: (l.def ? [{ key: l.def }] : []),
                    restricted: l.restricted,
                    onDown: () => { MonksLittleDetails.swapTool(l.tool, true); },
                    onUp: () => { MonksLittleDetails.releaseTool(); }
                });
                game.keybindings.register('monks-little-details', `change-${l.tool}-control`, {
                    name: `Change to ${l.name}`,
                    editable: (l.def ? [{ key: l.def, modifiers: [KeyboardManager.MODIFIER_KEYS?.SHIFT] }] : []),
                    restricted: l.restricted,
                    onDown: () => { MonksLittleDetails.swapTool(l.tool, false); },
                });
            });
        }
    }

    static swapTool(controlName, quick = true) {
        let control = ui.controls.control;
        if (control.name != controlName && MonksLittleDetails.switchTool == undefined) {
            if (quick !== false) //e?.shiftKey
                MonksLittleDetails.switchTool = { control: control, tool: control.activeTool };
            let newcontrol = ui.controls.controls.find(c => { return c.name == controlName; });
            if (newcontrol != undefined) {
                //ui.controls.activeControl = newcontrol.name;
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
                //ui.controls.activeControl = MonksLittleDetails.switchTool.control.name;
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
.directory:not(.compendium-sidebar) .directory-list .directory-item img {
    object-fit: contain !important;
    object-position: center !important;
}

.filepicker .thumbs-list img {
    object-fit: contain !important;
    object-position: center !important;
}

.control-icon.active > img {
    filter: sepia(100%) saturate(2000%) hue-rotate(-50deg);
}

.control-icon.active > i {
    color: #ffc163;
    opacity: 0.7;
}

.control-icon.active:hover > i {
    opacity:1;
}

#context-menu li.context-item{
    text-align: left;
}

/*
.form-group select{
    width: calc(100% - 2px);
}
*/

.compendium.directory .directory-list .directory-item.scene {
    position: relative;
    height: calc(var(--sidebar-item-height) + 2px);
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
    margin: 0px;
}

.compendium.directory .directory-list .directory-item.scene h4 a{
background-color: rgba(0, 0, 0, 0.5);
    padding: 5px 10px;
    border-radius: 4px;
}

#controls ol.control-tools .has-notes::after {
    color: #bc8c4a;
}

#controls ol.control-tools .has-notes::before {
    color: #bc8c4a;
}

#controls ol.control-tools li.active .has-notes::before,
#controls ol.control-tools li:hover .has-notes::before {
    color: #ffc163;
}
`;

        }

        if (setting("move-pause") == "all" || (setting("move-pause") == "true" && !game.user.isGM)) {
            innerHTML += `
#pause {
    bottom:30%;
}
#pause img {
    top: -100px;
    left: calc(50% - 150px);
    height: 300px;
    width: 300px;
    opacity: 0.3;
}
`;
        }

        var r = document.querySelector(':root');
        r.style.setProperty('--sidebar-padding', `${setting("directory-padding")}px`);
        const rgb = Color.from(setting("pause-border-colour")).rgb;
        r.style.setProperty('--pause-border-color', `${rgb[0] * 255}, ${rgb[1] * 255}, ${rgb[2] * 255}`);

        style.innerHTML = innerHTML;
        if (innerHTML != '')
            document.querySelector("head").appendChild(style);
    }

    static getMoveKey() {
        let keys = game.keybindings.bindings.get("monks-little-details.movement-key");
        if (!keys || keys.length == 0)
            return;

        return keys[0].key;
    }

    static async moveTokens(event) {
        let moveKey = MonksLittleDetails.getMoveKey();

        let tokens = canvas.tokens.controlled.map(t => t.document);
        if (!tokens.length && MonksLittleDetails._selectedTokens?.tokens)
            tokens = MonksLittleDetails._selectedTokens.tokens;

        if (game.user.isGM && moveKey && game.keyboard.downKeys.has(moveKey) && tokens.length > 0) {
            let pos = event.data.getLocalPosition(canvas.app.stage);
            let mid = {
                x: tokens[0].x,
                y: tokens[0].y
            };
            for (let i = 1; i < tokens.length; i++) {
                mid.x += tokens[i].x;
                mid.y += tokens[i].y;
            }
            mid.x = (mid.x / tokens.length);
            mid.y = (mid.y / tokens.length);

            let updates = [];
            for (let i = 0; i < tokens.length; i++) {
                let offsetx = mid.x - tokens[i].x;
                let offsety = mid.y - tokens[i].y;
                let gridPt = canvas.grid.grid.getGridPositionFromPixels(pos.x - offsetx, pos.y - offsety);
                let px = canvas.grid.grid.getPixelsFromGridPosition(gridPt[0], gridPt[1]);

                //t.update({ x: px[0], y: px[1] }, { animate: false });
                updates.push({ _id: tokens[i].id, x: px[0], y: px[1] });
            }
            if (updates.length) {
                MonksLittleDetails.movingToken = true;
                await canvas.scene.updateEmbeddedDocuments("Token", updates, { animate: false, bypass: true });
                MonksLittleDetails.movingToken = false;
            }
        }
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

    static getPalette(src, element, fn) {
        // Create custom CanvasImage object
        if (src != undefined) {
            loadTexture(src).then((texture) => {
                if (texture != undefined) {
                    // Create a temporary Sprite using the Tile texture
                    const sprite = new PIXI.Sprite(texture);
                    sprite.width = texture.width;
                    sprite.height = texture.height;
                    sprite.anchor.set(0.5, 0.5);
                    sprite.position.set(texture.width / 2, texture.height / 2);

                    // Create or update the alphaMap render texture
                    const tex = PIXI.RenderTexture.create({ width: texture.width, height: texture.height });

                    // Render the sprite to the texture and extract its pixels
                    canvas.app.renderer.render(sprite, { renderTexture: tex });
                    let pixels = canvas.app.renderer.extract.pixels(tex);
                    tex.destroy(true);

                    const pixelCount = texture.width * texture.height;

                    const pixelArray = MonksLittleDetails.createPixelArray(pixels, pixelCount, 10);

                    sprite.destroy();

                    // Send array to quantize function which clusters values
                    // using median cut algorithm
                    const cmap = MMCQ.quantize(pixelArray, 5);
                    const palette = cmap ? cmap.palette() : [];

                    $(element).empty();
                    for (let i = 0; i < palette.length; i++) {
                        var hexCode = MonksLittleDetails.rgbToHex(palette[i][0], palette[i][1], palette[i][2]);
                        $(element).append($('<div>').addClass('background-palette').attr('title', hexCode).css({ backgroundColor: hexCode }).on('click', $.proxy(fn, MonksLittleDetails, hexCode, element)));
                    }
                }
            })
        }
    };

    static async updateSceneBackground(hexCode, element) {
        $('.background-palette-container', element).remove();
        await MonksLittleDetails.currentScene.update({ backgroundColor: hexCode });
    }

    static async updatePlayerColour(hexCode, element) {
        $('.background-palette-container', element).remove();
        await MonksLittleDetails.currentUser.update({ color: hexCode });
    }

    static emit(action, args = {}) {
        args.action = action;
        args.senderId = game.user.id;
        game.socket.emit(MonksLittleDetails.SOCKET, args, (resp) => { });
    }

    static onMessage(data) {
        MonksLittleDetails[data.action].call(MonksLittleDetails, data);
    }

    static isDefeated(token) {
        return (token && (token.combatant && token.combatant.defeated) || token.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.specialStatusEffects.DEFEATED) || token.document.overlayEffect == CONFIG.controlIcons.defeated);
    }

    static showUpdateImages() {
        new UpdateImages().render(true);
    }
}
    

Hooks.once('init', MonksLittleDetails.init);
Hooks.on("ready", MonksLittleDetails.ready);

Hooks.on("canvasReady", () => {
    canvas.stage.on("mousedown", MonksLittleDetails.moveTokens);    //move all tokens while holding down m
});

Hooks.on('renderTokenHUD', async (app, html, options) => {
    MonksLittleDetails.element = html;
    //MonksLittleDetails.tokenHUD = app;

    //swap the setting and target button
    if (game.settings.get("monks-little-details", "swap-buttons")) {
        $('.col.left .control-icon[data-action="target"]', html).insertBefore($('.col.left .control-icon[data-action="config"]', html));
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
                MonksLittleDetails.getPalette(MonksLittleDetails.currentScene.background.src, element, MonksLittleDetails.updateSceneBackground);
            } else {
                element.remove();
            }
            e.preventDefault();
            e.stopPropagation();
        }).insertAfter(backgroundColor);

        $(html).on("click", () => { $('.background-palette-container', html).remove(); });
    }

    /*
    $('<div>')
        .addClass('form-group')
        .append($('<label>').html('Thumbnail Image'))
        .append(
            $('<div>').addClass('form-fields')
                .append($('<button>')
                    .addClass('file-picker')
                    .attr({ type: 'button', 'data-type': 'imagevideo', 'data-target': 'flags.monks-little-details.thumbnail', title: 'Browse Files', tabindex: '-1' })
                    .html('<i class="fas fa-file-import fa-fw"></i>')
                    .click(app._activateFilePicker.bind(app))
                )
                .append($('<input>').addClass('image').attr({ type: 'text', name: 'flags.monks-little-details.thumbnail', placeholder: 'File Path' }).val(app.object.getFlag('monks-little-details', 'thumbnail')))
        )
        .append($('<p>').addClass('notes').html(`Configure the thumbnail image that's shown in the scenes directory`))
        .insertAfter($('input[name="foreground"]', html).closest('.form-group'));
        */
    app.setPosition({ height: 'auto' });
});

Hooks.on('renderUserConfig', async (app, html, options) => {
    if (game.settings.get("monks-little-details", 'scene-palette') && app.object.avatar) {
        MonksLittleDetails.currentUser = app.object;

        let playerColor = $('input[data-edit="color"]', html);
        playerColor.parents('.form-group:first').css({ position: 'relative' });
        $('<button>').attr('type', 'button').html('<i class="fas fa-palette"></i>').on('click', function (e) {
            let element = $(this).siblings('.background-palette-container');
            if (element.length == 0) {
                element = $('<div>').addClass('background-palette-container flexrow').insertAfter(this);
                MonksLittleDetails.getPalette(MonksLittleDetails.currentUser.avatar, element, MonksLittleDetails.updatePlayerColour);
            } else {
                element.remove();
            }
            e.preventDefault();
            e.stopPropagation();
        }).insertAfter(playerColor);
    }

    $(html).on("click", () => { $('.background-palette-container', html).remove(); });

    app.setPosition({ height: 'auto' });
});

Hooks.on("renderSettingsConfig", (app, html, data) => {
    $('<p>').addClass('mld-warning').append('<i class="fas fa-circle-question"></i> Where have all of my features gone? ').append($('<a>').html("Click here").on("click", () => { new ModuleWarning().render(true); })).insertBefore($('[name="monks-little-details.swap-buttons"]').parents('div.form-group:first'));
    $('<div>').addClass('form-group group-header').html(i18n("MonksLittleDetails.SystemChanges")).insertBefore($('[name="monks-little-details.swap-buttons"]').parents('div.form-group:first'));
    $('<div>').addClass('form-group group-header').html(i18n("MonksLittleDetails.AddedFeatures")).insertBefore($('[name="monks-little-details.scene-palette"]').parents('div.form-group:first'));

    $(`<input type="color" style="flex: 0 0 90px;" value="${$('[name="monks-little-details.pause-border-colour"]').val()}" data-edit="monks-little-details.pause-border-colour">`).insertAfter($('[name="monks-little-details.pause-border-colour"]'));
    $('[name="monks-little-details.pause-border-colour"]').css("flex", "0 0 90px").on("change", function () {
        let val = $(this).val();
        if (val && !val.startsWith("#")) {
            val = "#" + val;
            $(this).val(val);
        }
        $(this).next().val($(this).val());
    });
    });

Hooks.on("renderCompendium", (compendium, html, data) => {
    if (setting('compendium-view-artwork')) {
        if (compendium.collection.documentName == 'Scene') {
            html.find('li.directory-item h4 a').click(ev => {
                ev.preventDefault();
                ev.cancelBubble = true;
                if (ev.stopPropagation)
                    ev.stopPropagation();

                let documentId = ev.currentTarget.closest('li').dataset.documentId;
                compendium.collection.getDocument(documentId).then(entry => {
                    let img = entry.background.src;
                    if (img) {
                        if (VideoHelper.hasVideoExtension(img))
                            ImageHelper.createThumbnail(img, { width: entry.width, height: entry.height }).then(img => {
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
                    } else {
                        ev.currentTarget.parentElement.click();
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
    let moveKey = MonksLittleDetails.getMoveKey();

    if ((update.x != undefined || update.y != undefined) && game.user.isGM && moveKey && game.keyboard.downKeys.has(moveKey)) {
        options.animate = false;
        options.bypass = true;
    }
});

Hooks.on("getSceneControlButtons", (controls) => {
    if (setting("find-my-token")) {
        let tokenControls = controls.find(control => control.name === "token")
        tokenControls.tools.push({
            name: "findtoken",
            title: "MonksLittleDetails.FindMyToken",
            icon: "fas fa-users-viewfinder",
            onClick: async (away) => {
                //Find token
                let tokens = canvas.tokens.ownedTokens;
                if (tokens.length == 0) return;

                let lastTime = game.user.getFlag('monks-little-details', 'findTime');
                let lastIdx = (lastTime == undefined || (Date.now() - lastTime) > 2000 ? 0 : game.user.getFlag('monks-little-details', 'findIdx') || 0);

                if (lastIdx >= tokens.length)
                    lastIdx = 0;

                let token = tokens[lastIdx];
                if (!token) return;

                canvas.pan({ x: token.x, y: token.y });
                token.control({ releaseOthers: true });

                lastIdx = (lastIdx + 1) % tokens.length;
                await game.user.setFlag('monks-little-details', 'findTime', Date.now());
                await game.user.setFlag('monks-little-details', 'findIdx', lastIdx);
            },
            button: true
        });
    }
});


/*
Hooks.on('renderAmbientSoundConfig', (app, html, data) => {
    $('<div>')
        .addClass('form-group')
        .append($('<label>').html('Repeat Delay'))
        .append($('<div>').addClass('form-fields').append($('<input>').attr('type', 'number').attr('name', 'flags.monks-little-details.loop-delay').attr('step', '1').val(app.document.getFlag('monks-little-details', 'loop-delay'))))
        .append($('<p>').addClass('hint').html('Specify the time between loops, set to -1 to have this play only once'))
        .insertBefore($('button[name="submit"]', html));
})*/

Hooks.on("renderActorSheet", (sheet) => {
    MonksLittleDetails._lastActor = sheet.object;
    game.user.setFlag("monks-little-details", "last-actor", sheet.object.uuid);
})

Hooks.on("getSidebarTabFolderContext", (html, entries) => {
    entries.splice(4, 0, {
        name: "FOLDER.Clear",
        icon: '<i class="fas fa-folder"></i>',
        condition: game.user.isGM,
        callback: header => {
            const li = header.parent();
            const folder = game.folders.get(li.data("folderId"));
            if (folder) {
                return Dialog.confirm({
                    title: `${i18n("FOLDER.Clear")} ${folder.name}`,
                    content: `<h4>${game.i18n.localize("AreYouSure")}</h4><p>${i18n("MonksLittleDetails.ClearWarning")}</p>`,
                    yes: () => {
                        //const userId = game.user.id;
                        //const db = CONFIG.DatabaseBackend;
                        /*
                        // Delete or move sub-Folders
                        const deleteFolderIds = [];
                        for (let f of folder.getSubfolders()) {
                            deleteFolderIds.push(f.id);
                        }
                        if (deleteFolderIds.length) {
                            db._handleDeleteDocuments({
                                request: { type: "Folder", options: { deleteSubfolders: true, deleteContents: true, render: true } },
                                result: deleteFolderIds,
                                userId
                            });
                        }*/

                        // Delete contained Documents
                        const deleteDocumentIds = [];
                        for (let d of folder.documentCollection) {
                            if (d.folder?.id !== folder.id) continue;
                            deleteDocumentIds.push(d.id);
                        }
                        if (deleteDocumentIds.length) {
                            const cls = getDocumentClass(folder.type);
                            return cls.deleteDocuments(deleteDocumentIds);
                        }
                    },
                    options: {
                        top: Math.min(li[0].offsetTop, window.innerHeight - 350),
                        left: window.innerWidth - 720,
                        width: 400
                    }
                });
            }
        }
    });
});

Hooks.on("renderMacroConfig", (app, html, data) => {
    $('.sheet-footer', html).prepend(
        $("<button>")
            .attr("type", "button")
            .html('<i class="fas fa-file-download"></i> Apply')
            .on("click", (event) => { app._onSubmit.call(app, event, { preventClose: true }) }));

    if (setting("macro-tabs")) {
        $('textarea[name="command"]', html).on("keydown", function (e) {
            if (e.key == 'Tab') {
                e.preventDefault();
                e.stopPropagation();
                var start = this.selectionStart;
                var end = this.selectionEnd;

                // set textarea value to: text before caret + tab + text after caret
                this.value = this.value.substring(0, start) + "\t" + this.value.substring(end);

                // put caret at right position again
                this.selectionStart = this.selectionEnd = start + 1;
                $(this).trigger("input");
            }
        });
    }
})

Hooks.on('renderModuleManagement', (app, html, data) => {
    if (setting("module-management-changes")) {
        let requires = {};

        let scrollToView = function (ev) {
            let module = $(ev.currentTarget).html();
            let div = $(`.package[data-module-id="${module}"]`, html);
            if (div.length) {
                div[0].scrollIntoView({ behavior: "smooth" });
            }
        }

        for (let mod of data.modules) {
            if (mod.relationships.requires.length) {
                for (let dep of mod.relationships.requires) {
                    if (requires[dep] == undefined)
                        requires[dep] = [mod.name];
                    else
                        requires[dep].push(mod.name);

                    let hasModule = data.modules.find(m => (m.id || m.name) == dep);
                    $(`.package[data-module-id="${mod.id || mod.name}"] .package-metadata .tag`, html).each(function () {
                        if ($(this).html() == dep) {
                            $(this).addClass(hasModule ? (hasModule.active ? "success" : "info") : "danger");
                        }
                        $(this).on("click", scrollToView.bind(this));
                    });
                }
            }
        }

        for (let [req, values] of Object.entries(requires)) {
            let li = $('<li>').appendTo($(`.package[data-module-id="${req}"] .package-metadata`, html));
            li.append($("<strong>").html("Supports:"));
            for (let val of values) {
                li.append($("<span>").addClass("tag").html(val).on("click", scrollToView.bind(this)));
            }
        }
    }
});

Hooks.on("getActorDirectoryEntryContext", (html, entries) => {
    if (game.system.id == "dnd5e") {
        entries.push({
            name: "Transform into this Actor",
            icon: '<i class="fas fa-random"></i>',
            condition: li => {
                const actor = game.actors.get(li.data("documentId"));
                const canPolymorph = game.user.isGM || (actor.testUserPermission(game.user, "OWNER") && game.user.can("TOKEN_CREATE") && game.settings.get("dnd5e", "allowPolymorphing"));
                return canPolymorph;
            },
            callback: async (li) => {
                let docId = li.data("documentId");
                let from = game.actors.get(docId);

                if (!from) return;

                let data = {
                    type: 'Actor',
                    uuid: from.uuid
                }

                let actors = canvas.tokens.controlled.map(t => t.actor);

                if (actors.length == 0 && !game.user.isGM)
                    actors = [game.user.character];

                for (let actor of actors) {
                    actor.sheet._onDropActor(null, data);
                }
            }
        });
    }
});

Hooks.on("getCompendiumEntryContext", (html, entries) => {
    entries.push({
        name: "Transform into this Actor",
        icon: '<i class="fas fa-random"></i>',
        condition: li => {
            if (!$(li).hasClass("actor"))
                return false;
            const canPolymorph = game.user.isGM || (game.settings.get("dnd5e", "allowPolymorphing"));
            return canPolymorph;
        },
        callback: async (li) => {
            let compendium = $(li).closest('.directory');
            let data = {
                pack: compendium.data("pack"),
                id: li.data("documentId")
            }

            let actors = canvas.tokens.controlled.map(t => t.actor);

            if (actors.length == 0 && !game.user.isGM)
                actors = [game.user.character];

            for (let actor of actors) {
                actor.sheet._onDropActor(null, data);
            }
        }
    });
});

Hooks.on("updateScene", (scene, data, options) => {
    if ((data.darkness == 0 || data.darkness == 1) && options.animateDarkness != undefined && ui.controls.activeControl == "lighting") {
        let tool = $(`#controls .sub-controls .control-tool[data-tool="${data.darkness == 0 ? 'day' : 'night'}"]`);
        $('#darkness-progress').remove();

        let leftSide = $("<div>").attr("deg", 0);
        let rightSide = $("<div>").attr("deg", 0);

        let progress = $('<div>')
            .attr("id", "darkness-progress")
            .append($("<div>").addClass("progress-left-side").append(leftSide))
            .append($("<div>").addClass("progress-right-side").append(rightSide));

        tool.append(progress).css({ "position": "relative", "overflow": "hidden" });

        let halfTime = options.animateDarkness / 2;

        $(rightSide).animate({ deg: 180 }, {
            duration: halfTime,
            step: function (now) {
                if (!!rightSide.attr("stop"))
                    rightSide.stop();
                rightSide.css({
                    transform: 'rotate(' + now + 'deg)'
                });
            },
            complete: function () {
                $(leftSide).animate({ deg: 180 }, {
                    duration: halfTime,
                    step: function (now) {
                        if (!!leftSide.attr("stop"))
                            leftSide.stop();
                        leftSide.css({
                            transform: 'rotate(' + now + 'deg)'
                        });
                    },
                    complete: function () {
                        progress.remove();
                        tool.css({ "overflow": "" });
                    }
                });
            }
        });
    }
});

Hooks.on("renderFilePicker", (app, html, data) => {
    if (setting("add-quicklinks")) {
        $(app.element).addClass("use-quicklinks");
        if ($('button.quick-links', html).length)
            return;

        let quicklinks = game.user.getFlag("monks-little-details", "quicklinks") || [];

        let list = $('<ul>').addClass('quick-links-list');
        list[0].app = app;

        MonksLittleDetails.buildQuickLinks(quicklinks, list);
        let link = quicklinks.find(q => q.target == app.result.target);

        $(html).click(function () { list.removeClass('open') });

        $('input[name="target"]', html)
            .css({ "padding-left": "25px" })
            .before(
                $("<button>")
                    .attr("type", "button")
                    .addClass("quick-link-input-button")
                    .append($("<i>").addClass(`fa-star ${link?.favorite ? "fa-solid" : "fa-regular"}`))
                    .click(function (ev) {
                        let target = $('input[name="target"]', html).val();
                        let quicklinks = duplicate(game.user.getFlag("monks-little-details", "quicklinks") || []);
                        let link = quicklinks.find(q => q.target == target);
                        if (link) {
                            MonksLittleDetails.toggleFavorite(target, ev);
                        } else {
                            MonksLittleDetails.addQuickLink(target, true);
                        }

                        ev.preventDefault();
                        ev.stopPropagation();
                        $('input[name="target"]', html).focus();
                    })
            )
            .after(
                $("<button>")
                    .attr("type", "button")
                    .addClass("quick-links")
                    .append($("<i>").addClass("fas fa-caret-down"))
                    .click(function (ev) {
                        //$('.quick-links-list', html).removeClass('open');
                        list.toggleClass('open');
                        ev.preventDefault();
                        ev.stopPropagation();
                    })
            )
            .after(list);
        $('input[name="target"]', html).parent().css({ position: "relative" });
    }

    if (setting("remove-favorites")) {
        $(".form-group.favorites", html).remove();
    }
});

Hooks.on("renderDocumentDirectory", (app, html, data) => {
    let parseTree = (node) => {
        for (let child of node.children) {
            if (child.folder.color) {
                $(`.directory-item.folder[data-folder-id="${child.folder.id}"] > .subdirectory`, html).css("border-bottom-color", child.folder.color);
            }
            parseTree(child);
        }
    }
    parseTree(data.tree);
});

Hooks.on("pauseGame", (state) => {
    if (setting("pause-border")) {
        $("body").toggleClass("mld-paused", state && $('#board').length);
    }
})