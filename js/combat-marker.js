import { MonksLittleDetails, i18n, log, setting, error } from "../monks-little-details.js";

export class CombatMarker {
    static turnMarkerAnim = {};

    static init() {
        Hooks.on("updateCombatant", function (combatant, data, options, userId) {
            const combat = combatant.parent;
            if (combat && combat.started) {
                //const combatant = combat.data.combatants.find((o) => o.id === data.id);
                //let token = canvas.tokens.get(combatant.token._id);
                let token = combatant.token.object;
                CombatMarker.toggleTurnMarker(token, token.id == combat.current.tokenId);
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
                let token = combatant.token._object;
                CombatMarker.removeTurnMarker(token);
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
                CombatMarker.toggleTurnMarker(token, token.id == combat.current.tokenId);
            }
        });

        Hooks.on("updateToken", function (document, data, options, userid) {
            let token = document.object;
            if (data.img != undefined || data.width != undefined || data.height != undefined) {
                let activeCombats = game.combats.filter(c => {
                    return c?.scene?.id == game.scenes.viewed.id && c.started;
                });
                let activeTokens = activeCombats.map(c => { return c.current.tokenId });

                if (activeTokens.includes(token.id)) {
                    setTimeout(function () {
                        CombatMarker.removeTurnMarker(token);
                        CombatMarker.toggleTurnMarker(token, true);
                    }, 100);
                }
            }
            if (setting('token-highlight-remove') && (data.x != undefined || data.y != undefined)) {
                token.preventMarker = true;
                CombatMarker.removeTurnMarker(token);
            }
        });

        //check on the turn marker if the scene changes
        Hooks.on("canvasReady", function (canvas) {
            //clear all previous combat markers
            CombatMarker.clearTurnMarker();

            //check for current combats
            let activeCombats = game.combats.filter(c => {
                return c?.scene?.id == canvas.scene.id && c.started;
            });

            if (activeCombats.length) {
                //add a combat marker for each active combatant
                for (let combat of activeCombats) {
                    CombatMarker.toggleTurnMarker(combat.combatant?.token?.object, true);
                }
            }
        });

        Hooks.on("deleteCombat", function (combat) {
            //remove the combat highlight from any token in this combat
            if (combat.started == true) {
                if (setting("token-combat-highlight")) {
                    for (let combatant of combat.combatants) {
                        let token = combatant.token; //canvas.tokens.get(combatant.token._id);
                        CombatMarker.removeTurnMarker(token.object);
                    }
                }
            }
        });

        Hooks.on("updateCombat", async function (combat, delta) {
            if (combat.started) {
                for (let combatant of combat.combatants) {
                    let token = combatant.token; //canvas.tokens.get(combatant.token.id);
                    delete token?._object?.preventMarker;
                    CombatMarker.toggleTurnMarker(token.object, token.id == combat?.current?.tokenId);
                }
                //let token = canvas?.tokens.get(combat?.current?.tokenId);
                //MonksLittleDetails.removeTurnMarker(token);
                //MonksLittleDetails.toggleTurnMarker(token, true);
            }
        });

        Hooks.on("renderTokenConfig", (app, html, data) => {
            if (game.user.isGM) {
                $('<div>')
                    .addClass('form-group')
                    .append($('<label>').html(i18n("MonksLittleDetails.token-highlight-picture.name")))
                    .append($('<div>').addClass('form-fields')
                        .append($('<button>')
                            .addClass('file-picker')
                            .attr('type', 'button')
                            .attr('data-type', "imagevideo")
                            .attr('data-target', "img")
                            .attr('title', "Browse Files")
                            .attr('tabindex', "-1")
                            .html('<i class="fas fa-file-import fa-fw"></i>')
                            .click(function (event) {
                                const fp = new FilePicker({
                                    type: "imagevideo",
                                    current: $(event.currentTarget).next().val(),
                                    callback: path => {
                                        $(event.currentTarget).next().val(path);
                                    }
                                });
                                return fp.browse();
                            }))
                        .append($('<input>').addClass('token-highlight').attr({ 'type': 'text', 'name': 'flags.monks-little-details.token-highlight', 'placeholder': 'path/image.png' }).val(app.object.getFlag('monks-little-details', 'token-highlight')))
                    )
                    .insertAfter($('[name="alpha"]', html).closest('.form-group'));

                app.setPosition();
            }
        });
    }

    static toggleTurnMarker(token, visible) {
        if (token && token.preventMarker !== true) {
            if (token?.ldmarker?.transform == undefined) {
                let highlightFile = token.document.getFlag('monks-little-details', 'token-highlight') || setting("token-highlight-picture");
                loadTexture(highlightFile).then((tex) => { //"modules/monks-little-details/img/chest.png"
                    if (token.ldmarker != undefined) {
                        token.removeChild(token.ldmarker);
                    }
                    const markericon = new PIXI.Sprite(tex);
                    if (highlightFile.endsWith('webm')) {
                        tex.baseTexture.resource.source.autoplay = true;
                        tex.baseTexture.resource.source.loop = true;
                        try {
                            tex.baseTexture.resource.source.play();
                        } catch {
                            window.setTimeout(function () { try { tex.baseTexture.resource.source.play(); } catch { } }, 100);
                        }
                    }
                    markericon.pivot.set(markericon.width / 2, markericon.height / 2);//.set(-(token.w / 2), -(token.h / 2));
                    const size = Math.max(token.w, token.h) * setting("token-highlight-scale");
                    markericon.width = markericon.height = size;
                    markericon.position.set(token.w / 2, token.h / 2);
                    markericon.alpha = 0.8;
                    markericon.pulse = { value: null, dir: 1 };
                    token.ldmarker = markericon;
                    token.addChildAt(token.ldmarker, 0);
                    token.ldmarker.visible = visible;
                });
            } else
                token.ldmarker.visible = visible;

            if (visible)
                CombatMarker.turnMarkerAnim[token.id] = token;
            else
                delete CombatMarker.turnMarkerAnim[token.id];

            if (setting('token-highlight-animate') > 0) {
                if (!CombatMarker._animate && Object.keys(CombatMarker.turnMarkerAnim).length != 0) {
                    CombatMarker._animate = CombatMarker.animateMarkers.bind(this);
                    canvas.app.ticker.add(CombatMarker._animate);
                } else if (CombatMarker._animate != undefined && Object.keys(CombatMarker.turnMarkerAnim).length == 0) {
                    canvas.app.ticker.remove(CombatMarker._animate);
                    delete CombatMarker._animate;
                }
            }
        }
    }

    static clearTurnMarker() {
        CombatMarker.turnMarkerAnim = {};
        canvas.app.ticker.remove(CombatMarker._animate);
        delete CombatMarker._animate;
    }

    static removeTurnMarker(token) {
        if (token == undefined)
            return;

        if (token?.ldmarker) {
            token.removeChild(token.ldmarker);
            delete token.ldmarker;
        }
        delete CombatMarker.turnMarkerAnim[token.id];

        if (Object.keys(CombatMarker.turnMarkerAnim).length == 0) {
            canvas.app.ticker.remove(CombatMarker._animate);
            delete CombatMarker._animate;
        }
    }

    static animateMarkers(dt) {
        let interval = setting('token-highlight-animate');
        for (const [key, token] of Object.entries(CombatMarker.turnMarkerAnim)) {
            if (token?.ldmarker?.transform) {
                let delta = interval / 10000;
                try {
                    let animation = setting('token-combat-animation');
                    if (animation == 'clockwise') {
                        token.ldmarker.rotation += (delta * dt);
                        if (token.ldmarker.rotation > (Math.PI * 2))
                            token.ldmarker.rotation = token.ldmarker.rotation - (Math.PI * 2);
                    }
                    else if (animation == 'counterclockwise') {
                        token.ldmarker.rotation -= (delta * dt);
                    }
                    else if (animation == 'pulse') {
                        let tokenscale = setting("token-highlight-scale");
                        let change = tokenscale / 6;
                        const maxval = tokenscale + change;
                        const minval = Math.max(tokenscale - change, 0);

                        if (token.ldmarker.pulse.value == undefined) token.ldmarker.pulse.value = minval;
                        let adjust = (delta * dt);
                        
                        token.ldmarker.pulse.value = Math.max(token.ldmarker.pulse.value + (token.ldmarker.pulse.dir * adjust), 0);
                        if (token.ldmarker.pulse.value > maxval) {
                            token.ldmarker.pulse.value = (tokenscale + change) + ((tokenscale + change) - token.ldmarker.pulse.value);
                            token.ldmarker.pulse.dir = -1;
                        } else if (token.ldmarker.pulse.value < minval) {
                            token.ldmarker.pulse.value = (tokenscale - change) + ((tokenscale - change) - token.ldmarker.pulse.value);
                            token.ldmarker.pulse.dir = 1;
                        }

                        let perc = ((token.ldmarker.pulse.value - minval) / (maxval - minval));
                        let ease = (perc < 0.5 ? 2 * perc * perc : 1 - Math.pow(-2 * perc + 2, 2) / 2);

                        const size = (Math.max(token.w, token.h) * (minval + ((maxval - minval) * ease)));
                        token.ldmarker.width = token.ldmarker.height = size;
                    }
                    else if (animation == 'fadeout') {
                        let tokenscale = setting("token-highlight-scale");
                        token.ldmarker.pulse.value = token.ldmarker.pulse.value + (delta * dt);
                        let change = tokenscale / 6;
                        if (token.ldmarker.pulse.value > tokenscale + change) {
                            token.ldmarker.pulse.value = 0;
                            token.ldmarker.alpha = 1
                        } else if (token.ldmarker.pulse.value > tokenscale) {
                            token.ldmarker.alpha = 1 - ((token.ldmarker.pulse.value - tokenscale) / change);
                        }
                        const size = (Math.max(token.w, token.h) * token.ldmarker.pulse.value);
                        token.ldmarker.width = token.ldmarker.height = size;
                        //token.ldmarker.alpha = 1 - (token.ldmarker.pulse.value / tokenscale);
                    } else if (animation == 'fadein') {
                        let tokenscale = setting("token-highlight-scale");
                        token.ldmarker.pulse.value = token.ldmarker.pulse.value - (delta * dt);
                        let change = tokenscale / 4;
                        if (token.ldmarker.pulse.value > tokenscale - change) {
                            token.ldmarker.alpha = ((tokenscale - token.ldmarker.pulse.value) / change);
                        } else
                            token.ldmarker.alpha = 1
                        if (token.ldmarker.pulse.value < 0) {
                            token.ldmarker.pulse.value = tokenscale;
                            token.ldmarker.alpha = 0;
                        }
                        const size = (Math.max(token.w, token.h) * token.ldmarker.pulse.value);
                        token.ldmarker.width = token.ldmarker.height = size;
                        //token.ldmarker.alpha = (token.ldmarker.pulse.value / tokenscale);
                    }
                } catch (err) {
                    // skip lost frames if the tile is being updated by the server
                    error(err);
                    //delete CombatMarker.turnMarkerAnim[key];
                }
            }
        }
    }
}