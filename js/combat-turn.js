import { MonksLittleDetails, i18n, log, debug, setting } from "../monks-little-details.js";

export class CombatTurn {
    static shadows = {};
    static sounds = {};

    static init() {

        //setTarget
        if (setting('remember-previous')) {
            let combatNextTurn = async function (wrapped, ...args) {
                let current = canvas.tokens.get(game.combats.active?.current?.tokenId);

                if (current?.isOwner) {
                    let targets = Array.from(game.user.targets).map(t => t.id);
                    log('saving targets, set target', current.name, targets);
                    if (game.user.isGM)
                        await current.document.setFlag('monks-little-details', 'targets', targets);
                    else
                        await game.user.setFlag('monks-little-details', 'targets', targets);
                }

                return wrapped(...args);
            }

            if (game.modules.get("lib-wrapper")?.active) {
                libWrapper.register("monks-little-details", "Combat.prototype.nextTurn", combatNextTurn, "WRAPPER");
            } else {
                const oldNextTurn = Combat.prototype.nextTurn;
                Combat.prototype.nextTurn = function (event) {
                    return combatNextTurn.call(this, oldNextTurn.bind(this), ...arguments);
                }
            }
        }

        Hooks.on("deleteCombatant", function (combatant, data, userId) {
            let combat = combatant.parent;
            CombatTurn.checkCombatTurn(combat);
        });

        Hooks.on("createCombatant", function (combatant, data, options) {
            let combat = combatant.parent;

            if (combatant.actor?.isOwner == true)
                CombatTurn.checkCombatTurn(combat);
        });

        Hooks.on("deleteCombat", function (combat) {
            if (setting('round-chatmessages') && combat && game.user.isGM && combat.started) {
                ChatMessage.create({ user: null, flavor: "Round End" }, { roundmarker: true });
            }

            if (combat && combat.started && setting('show-start')) {
                CombatTurn.clearShadows();
            }
        });

        /*
        Hooks.on("targetToken", async function (user, token, target) {
            if (setting('remember-previous')) {
                let current = canvas.tokens.get(game.combats.active?.current?.tokenId);

                if (current?.isOwner) {
                    let targets = Array.from(game.user.targets).map(t => t.id);
                    log('saving targets', current.name, targets, target);
                    if (game.user.isGM)
                        await current.document.setFlag('monks-little-details', 'targets', targets);
                    else
                        await game.user.setFlag('monks-little-details', 'targets', targets);
                }
            }
        });*/

        Hooks.on("updateCombat", async function (combat, delta) {
            CombatTurn.checkCombatTurn(combat);

            let combatStarted = (combat && (delta.round === 1 && combat.turn === 0 && combat.started === true));
            
            if (combat && combat.started && setting('clear-targets')) {
                let previous = canvas.tokens.get(combat?.previous?.tokenId);
                if (previous?.isOwner) {
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
            }

            if (combat && combat.started && game.user.isGM && setting('select-combatant')) {
                combat?.combatant?.token?._object?.control();
            }

            if (combat && combat.started && game.user.isGM && setting("pan-to-combatant") && combat?.combatant?.token) {
                canvas.animatePan({ x: combat?.combatant?.token.data.x, y: combat?.combatant?.token.data.y });
            }

            if (combat && combat.started && setting('remember-previous') && combat?.combatant?.token?.isOwner) {
                let targets = [];
                if (game.user.isGM)
                    targets = combat.combatant.token.getFlag('monks-little-details', 'targets');
                else
                    targets = game.user.getFlag('monks-little-details', 'targets');

                log('loading targets', combat?.combatant?.token?.name, targets);
                if (targets && targets.length > 0) {
                    for (let id of targets) {
                        let token = canvas.tokens.get(id);
                        if (token
                            && !token.data.hidden
                            && !((token?.combatant && token?.combatant.data.defeated) || token.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId) || token.data.overlayEffect == CONFIG.controlIcons.defeated))
                            token.setTarget(true, { user: game.user, releaseOthers: false, groupSelection: false });
                    }

                    /*
                    log('saving targets', combat.combatant.token.name, targets);
                    if (game.user.isGM)
                        await combat.combatant.token.setFlag('monks-little-details', 'targets', targets);
                    else
                        await game.user.setFlag('monks-little-details', 'targets', targets);
                        */
                }
            }

            if (combat && combat.started && setting('show-start')) {
                CombatTurn.clearShadows();
            }

            if (setting('round-chatmessages') && combat && game.user.isGM) {
                if (combatStarted)
                    ChatMessage.create({ user: null, flavor: "Round Start" }, { roundmarker: true });
                else if (Object.keys(delta).some((k) => k === "round"))
                    ChatMessage.create({ user: null, flavor: `Round ${delta.round}` }, { roundmarker: true });
            }

            if (setting('play-round-sound') && setting('round-sound') && Object.keys(delta).some((k) => k === "round")) {
                //let volume = (setting('volume') / 100) * game.settings.get("core", 'globalInterfaceVolume');
                //AudioHelper.play({ src: setting('round-sound'), volume: volume });
                CombatTurn.playTurnSounds('round');
            }

            if (combat && combat.started && (delta.round || delta.turn) && setting('auto-scroll')) {
                $(`#combat-tracker li[data-combatant-id="${combat.current.combatantId}"]`).each(function () {
                    log('scroll top', Math.max(this.offsetTop - $(this).height(), 0));
                    $(this).parent().scrollTop(Math.max(this.offsetTop - $(this).height(), 0));
                });
            }
        });

        Hooks.on("updateCombatant", async function (combatant, data, options, userId) {
            const combat = combatant.parent;

            if (combat && combat.started && combatant.actor.isOwner && data.defeated != undefined) {
                CombatTurn.checkCombatTurn(combat);
            }
        });

        Hooks.on("createChatMessage", (message, options, user) => {
            if (options.roundmarker && game.user.isGM) {
                message.setFlag('monks-little-details', 'roundmarker', true);
            }
        });

        Hooks.on("renderChatMessage", (message, html, data) => {
            if (message.getFlag('monks-little-details', 'roundmarker')) {
                html.addClass('round-marker');
            }
        });

        Hooks.on("preUpdateToken", (document, update, options, userId) => {
            if (setting('show-start') && 
            document.combatant?.combat?.started && 
            (update.x != undefined || update.y != undefined) && 
            CombatTurn.shadows[document.id] == undefined) {
                CombatTurn.showShadow(document.object, document.object.x, document.object.y);
                MonksLittleDetails.emit('showShadows', { uuid: document.uuid, x: document.object.x, y: document.object.y });
            }
        })

        /*
        Hooks.on("updateToken", async (document, update, options, userId) => {
            if (setting('show-start')
                && (document.isOwner || game.user.isGM)
                && (update.x != undefined || update.y != undefined)
                && CombatTurn.shadows[document.id] == undefined
                && document.combatant?.combat?.started) {

                let token = document.object;
                //create a shadow
                if (token.data.hidden && !game.user.isGM) return;

                let shadow = new PIXI.Container();
                canvas.background.addChild(shadow);
                let colorMatrix = new PIXI.filters.ColorMatrixFilter();
                colorMatrix.sepia(0.6);
                shadow.filters = [colorMatrix];
                shadow.x = token.x;
                shadow.y = token.y;
                shadow.alpha = 0.5;

                let tokenImage = await loadTexture(token.data.img)
                let sprite = new PIXI.Sprite(tokenImage)
                sprite.x = 0;
                sprite.y = 0;
                sprite.height = token.h;
                sprite.width = token.w;
                shadow.addChild(sprite);

                CombatTurn.shadows[token.id] = shadow;
            }
        })*/
    }

    static async showShadow(token, x, y) {
        //create a shadow
        if (token.data.hidden && !game.user.isGM) return;

        let shadow = new PIXI.Container();
        canvas.background.addChild(shadow);
        let colorMatrix = new PIXI.filters.ColorMatrixFilter();
        colorMatrix.sepia(0.6);
        shadow.filters = [colorMatrix];
        shadow.x = x + (token.w / 2);
        shadow.y = y + (token.h / 2);
        shadow.alpha = 0.5;
        shadow.angle = token.data.rotation;

        let width = token.w * token.data.scale;
        let height = token.h * token.data.scale;

        let tokenImage = await loadTexture(token.data.img)
        let sprite = new PIXI.Sprite(tokenImage)
        sprite.x = -(token.w / 2) - (width - token.w) / 2;
        sprite.y = -(token.h / 2) - (height - token.h) / 2;
        if (token.data.mirrorX) {
            sprite.scale.x = -1;
            sprite.anchor.x = 1;
        }
        if (token.data.mirrorY) {
            sprite.scale.y = -1;
            sprite.anchor.y = 1;
        }

        sprite.width = width;
        sprite.height = height;
        shadow.addChild(sprite);

        CombatTurn.shadows[token.id] = shadow;
    }

    static ready() {
        game.settings.settings.get("monks-little-details.play-turn-sound").default = !game.user.isGM; //(game.user.isGM ? 0 : 60); //set the default when we have the users loaded
        game.settings.settings.get("monks-little-details.play-next-sound").default = !game.user.isGM;
        game.settings.settings.get("monks-little-details.clear-targets").default = game.user.isGM;

        if (setting("large-print")) {
            $("<div>").attr("id", "your-turn").appendTo('body');
        }
    }

    static clearShadows() {
        for (let shadow of Object.values(CombatTurn.shadows))
            canvas.background.removeChild(shadow);
        CombatTurn.shadows = {};
    }

    static doDisplayTurn() {
        if (setting("showcurrentup") && !game.user.isGM) {
            if (setting("large-print")) {
                $('#your-turn').addClass("current").removeClass("next").html(i18n("MonksLittleDetails.Turn")).addClass("show");
                window.setTimeout(() => { $("#your-turn").removeClass("show current"); }, 2000);
            } else
                ui.notifications.warn(i18n("MonksLittleDetails.Turn"));
        } 

        // play a sound
        if (setting('play-turn-sound') && setting('turn-sound') != '') { //volume() > 0 && !setting("disablesounds") && 
            //let volume = (setting('volume') / 100) * game.settings.get("core", 'globalInterfaceVolume');
            //AudioHelper.play({ src: setting('turn-sound'), volume:volume }); //, volume: volume()
            CombatTurn.playTurnSounds('turn');
        }
    }

    static doDisplayNext() {
        if (setting("shownextup") && !game.user.isGM) {
            if (setting("large-print")) {
                $('#your-turn').addClass("next").removeClass("current").html(i18n("MonksLittleDetails.Next")).addClass("show");
                window.setTimeout(() => { $("#your-turn").removeClass("show next"); }, 2000);
            } else 
                ui.notifications.info(i18n("MonksLittleDetails.Next"));
        }
        // play a sound
        if (setting('play-next-sound') && setting('next-sound') != '') { //volume() > 0 && !setting("disablesounds") && 
            //let volume = (setting('volume') / 100) * game.settings.get("core", 'globalInterfaceVolume');
            //AudioHelper.play({ src: setting('next-sound'), volume: volume }); //, volume: volume()
            CombatTurn.playTurnSounds('next');
        }
    }

    /**
    * Check if the current combatant needs to be updated
    */
    static checkCombatTurn(combat) {
        debug('checking combat started', combat, combat?.started);
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

            let isActive = entry?.actor?.isOwner;
            let nxtentry = null;
            let isNext = false;

            if (next != null) {
                nxtentry = combat.turns[next];
                isNext = nxtentry.actor?.isOwner; //_id === game.users.current.character?._id;
            }

            debug('Check combat turn', entry.name, nxtentry?.name, !game.user.isGM, isActive, isNext, entry, nxtentry);
            if (entry !== undefined) {
                if (isActive) {
                    CombatTurn.doDisplayTurn();
                } else if (isNext) {
                    if (game.modules.get("hidden-initiative")?.active && combat.round == 1 && !game.user.isGM)  //If hidden initiatives is active, then don't show up next information
                        return;

                    CombatTurn.doDisplayNext();
                }
            }
        }
    }

    static async playTurnSounds(turn) {
        const audiofiles = await CombatTurn.getTurnSounds(turn);

        //audiofiles = audiofiles.filter(i => (audiofiles.length === 1) || !(i === this._lastWildcard));
        if (audiofiles.length > 0) {
            const audiofile = audiofiles[Math.floor(Math.random() * audiofiles.length)];

            let volume = (setting('volume') / 100);
            AudioHelper.play({ src: audiofile, volume: volume });
        }
    }

    static async getTurnSounds(turn) {
        const audiofile = setting(`${turn}-sound`);

        if (!audiofile.includes('*')) return [audiofile];
        if (CombatTurn.sounds[turn]) return CombatTurn.sounds[turn];
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
            CombatTurn.sounds[turn] = content.files;
        } catch (err) {
            CombatTurn.sounds[turn] = [];
            ui.notifications.error(err);
        }
        return CombatTurn.sounds[turn];
    }
}