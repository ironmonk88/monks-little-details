import { MonksLittleDetails, i18n, log, setting } from "../monks-little-details.js";

export class ActorSounds {
    static init() {
        Hooks.on('renderTokenHUD', async (app, html, options) => {
            if (app.object.actor.getFlag('monks-little-details', 'sound-effect') != undefined) {
                $('.col.right', html).append(
                    $('<div>').addClass('control-icon sound-effect')
                        .append('<img src="modules/monks-little-details/icons/volumeup.svg" width="36" height="36" title="Play Sound Effect">')
                        .click(app.object.playSound.bind(app.object)));
            }
        });

        Hooks.on("globalInterfaceVolumeChanged", (volume) => {
            for (let token of canvas.tokens.placeables) {
                if (token.soundeffect) {
                    token.soundeffect.volume = (token.soundeffect._mldvolume ?? 1) * volume;
                }
            }
        });

        Token.prototype.playSound = function() {
            ActorSounds.loadSoundEffect(this);
        }
    }

    static injectSoundCtrls() {
        let sheetNames = ["ActorSheet"];

        if (setting("actor-sounds") === "npc" || setting("actor-sounds") === 'true') {
            let npcObject = (CONFIG.Actor.sheetClasses.npc || CONFIG.Actor.sheetClasses.minion);
            if (npcObject != undefined) {
                sheetNames = Object.values(npcObject)
                    .map((sheetClass) => sheetClass.cls)
                    .map((sheet) => sheet.name);
            }
        }

        sheetNames.forEach((sheetName) => {
            Hooks.on("render" + sheetName, (app, html, data) => {
                // only for GMs or the owner of this npc
                if (!app.object.isOwner || !data.actor) return;

                // don't add the button multiple times
                if ($(html).find("#mldCharacterSound").length > 0) return;

                let hasSound = (app.document.getFlag('monks-little-details', 'sound-effect') != undefined);

                let button = $('<button>')
                    .attr('type', "button")
                    .attr('id', "mldCharacterSound")
                    .toggleClass('loaded', hasSound)
                    .html('<i class="fas fa-volume-up"></i>')
                    .click(ActorSounds.showDialog.bind(app));
                //.contextmenu($.proxy(ActorSounds.loadSoundEffect, app));

                /*
                if (app.soundcontext == undefined) {
                    app.soundcontext = new ContextMenu(html, "#mldCharacterSound", [
                        {
                            name: "Select Sound",
                            icon: '<i class="fas fa-file-import"></i>',
                            callback: li => {
                                ActorSounds.findSoundEffect.call(app);
                            }
                        },
                        {
                            name: "Play Sound",
                            icon: '<i class="fas fa-play"></i>',
                            condition: $.proxy(function () {
                                return this.document.getFlag('monks-little-details', 'sound-effect');
                            }, app),
                            callback: li => {
                                ActorSounds.loadSoundEffect.call(app);
                            }
                        },
                        {
                            name: "Delete Sound",
                            icon: '<i class="fas fa-trash-alt"></i>',
                            condition: $.proxy(function () {
                                return this.document.getFlag('monks-little-details', 'sound-effect');
                            }, app),
                            callback: li => {
                                ActorSounds.clearSoundEffect.call(app);
                            }
                        }
                    ]);
                }*/

                let wrap = $('<div class="mldCharacterName"></div>');
                $(html).find("input[name='name'],h1[data-field-key='name']").wrap(wrap);
                $(html).find("input[name='name'],h1[data-field-key='name']").parent().prepend(button);
            });

            Hooks.on("close" + sheetName, (app, html, data) => {
                delete app.soundcontext;
            });
        });
    }

    /*
    static findSoundEffect(event) {
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
    }*/

    static async loadSoundEffect(token, event) {
        let actor = token.actor;

        if (!actor)
            return;

        if (event != undefined)
            event.preventDefault;

        if (token.soundeffect) {
            if (token.soundeffect?.playing) {
                token.soundeffect.stop();
                game.socket.emit("stopAudio", { src: audiofile }); //+++ this isn't a function with the new AudioHelper
            }
            delete token.soundeffect;
        } else {
            let volume = actor.getFlag('monks-little-details', 'volume') ?? 1;
            let soundeffect = actor.getFlag('monks-little-details', 'sound-effect');
            const cache = actor._tokenSounds;
            const audiofiles = await ActorSounds.getTokenSounds(soundeffect, cache);

            //audiofiles = audiofiles.filter(i => (audiofiles.length === 1) || !(i === this._lastWildcard));
            if (audiofiles?.length > 0) {
                const audiofile = audiofiles[Math.floor(Math.random() * audiofiles.length)];
                ActorSounds.playSoundEffect(audiofile, volume).then((sound) => {
                    if (sound) {
                        token.soundeffect = sound;
                        token.soundeffect.on("end", () => { delete token.soundeffect; });
                        token.soundeffect._mldvolume = volume;
                        return sound;
                    }
                });
            }
        }
    }

    static async playSoundEffect(audiofile, volume) {
        if (!audiofile)
            return new Promise();   //just return a blank promise so anything waiting can connect a then

        return AudioHelper.play({ src: audiofile, volume: (volume ?? 1) }, true);
    }

    static async getTokenSounds(audiofile, cache) {
        //const audiofile = actor.getFlag('monks-little-details', 'sound-effect');

        if (!audiofile) return;

        if (!audiofile.includes('*')) return [audiofile];
        if (cache) return cache; //actor._tokenSounds) return this._tokenSounds;
        let source = "data";
        let pattern = audiofile;
        const browseOptions = { wildcard: true };

        if (typeof ForgeVTT != "undefined" && ForgeVTT.usingTheForge) {
            source = "forgevtt";
        }

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
        let sounds = [];
        try {
            const content = await FilePicker.browse(source, pattern, browseOptions);
            sounds = content.files;
        } catch (err) {
            ui.notifications.error(err);
        }
        return sounds;
    }

    /*
    static clearSoundEffect(event) {
        this.actor.unsetFlag('monks-little-details', 'sound-effect');
    }
    */

    static async showDialog() {
        let actor = this.object;
        new ActorSoundDialog(actor).render(true);
    }
}

export class ActorSoundDialog extends FormApplication {
    constructor(object, app, options = {}) {
        super(object, options);

        this.app = app;
    }

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "actor-sound-dialog",
            classes: ["form"],
            title: i18n("MonksLittleDetails.ActorSound"),
            template: "modules/monks-little-details/templates/actor-sound.html",
            width: 500,
            submitOnChange: false,
            closeOnSubmit: true,
        });
    }

    getData(options) {
        let actor = this.object;
        let data = mergeObject(super.getData(options),
            {
                audiofile: actor.getFlag('monks-little-details', 'sound-effect'),
                volume: actor.getFlag('monks-little-details', 'volume') ?? 1
            }, { recursive: false }
        );

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('button[name="submit"]', html).click(this._onSubmit.bind(this));
        $('button[name="play"]', html).click(this.playSound.bind(this));
    }

    /* -------------------------------------------- */

    /** @override */
    async _updateObject(event, formData) {
        let audiofile = formData.audiofile;
        if (!audiofile.startsWith("/") && !audiofile.startsWith("http"))
            audiofile = "/" + audiofile;

        this.object.setFlag('monks-little-details', 'sound-effect', audiofile);
        this.object.setFlag('monks-little-details', 'volume', formData.volume);
    }

    async playSound() {
        let volume = parseFloat($('input[name="volume"]', this.element).val());
        let soundeffect = $('input[name="audiofile"]', this.element).val();
        let sounds = await ActorSounds.getTokenSounds(soundeffect);

        const audiofile = sounds[Math.floor(Math.random() * sounds.length)];

        ActorSounds.playSoundEffect(audiofile, volume);
    }
}

Hooks.on("setupTileActions", (app) => {
    app.registerTileGroup('monks-little-details', "Monk's Little Details");
    app.registerTileAction('monks-little-details', 'actor-sound', {
        name: 'Play Actor Sound',
        ctrls: [
            {
                id: "entity",
                name: "Select Entity",
                type: "select",
                subtype: "entity",
                options: { showToken: true, showWithin: true, showPlayers: true, showPrevious: true, showTagger: true },
                restrict: (entity) => { return (entity instanceof Token); },
            }
        ],
        group: 'monks-little-details',
        fn: async (args = {}) => {
            const { action, tokens } = args;

            let entities = await game.MonksActiveTiles.getEntities(args);
            for (let entity of entities) {
                if (entity instanceof TokenDocument && entity._object) {
                    entity._object.playSound();
                }
            }
        },
        content: async (trigger, action) => {
            let entityName = await game.MonksActiveTiles.entityName(action.data?.entity);
            return `<span class="logic-style">${trigger.name}</span> of <span class="entity-style">${entityName}</span>`;
        }
    });
});