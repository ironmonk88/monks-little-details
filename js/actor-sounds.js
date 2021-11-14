import { MonksLittleDetails, i18n, log, setting } from "../monks-little-details.js";

export class ActorSounds {
    static init() {
        Hooks.on('renderTokenHUD', async (app, html, options) => {
            if (app.object.actor.data.flags['monks-little-details'] != undefined) {
                $('.col.right', html).append(
                    $('<div>').addClass('control-icon sound-effect')
                        .append('<img src="modules/monks-little-details/icons/volumeup.svg" width="36" height="36" title="Play Sound Effect">')
                        .click($.proxy(ActorSounds.loadSoundEffect, app.object)));
            }
        });
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
                    if (!app.object.isOwner || !data.actor) return;

                    // don't add the button multiple times
                    if ($(html).find("#mldCharacterSound").length > 0) return;

                    let hasSound = (app.document.getFlag('monks-little-details', 'sound-effect') != undefined);

                    let button = $('<button>')
                        .attr('type', "button")
                        .attr('id', "mldCharacterSound")
                        .toggleClass('loaded', hasSound)
                        .html('<i class="fas fa-volume-up"></i>')
                        .click($.proxy(ActorSounds.findSoundEffect, app));
                    //.contextmenu($.proxy(ActorSounds.loadSoundEffect, app));

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
        const audiofiles = await ActorSounds.getTokenSounds(this.actor);

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
        if (event != undefined)
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
        this.actor.unsetFlag('monks-little-details', 'sound-effect');
    }
}