import { MonksLittleDetails, i18n, log, setting } from "../monks-little-details.js";

export class BloodSplats {
    static init() {
        BloodSplats.availableGlyphs = '!"#$%&\'()*+,-./01234568:;<=>?@ABDEFGHIKMNOPQRSTUVWX[\\]^_`acdfhoquvx|}~¢£¥§©ª«¬®°±¶·º¿ÀÁÂÄÅÆÈÉÊËÌÏÑÒÓÔÖØÙÚÜßàáâåæçéêëìíîïñòõ÷øùûüÿiœŸƒπ';

        BloodSplats.splatfont = new FontFace('WC Rhesus A Bta', "url('modules/monks-little-details/fonts/WCRhesusABta.woff2')");
        BloodSplats.splatfont.load().then(() => {
            document.fonts.add(BloodSplats.splatfont);
        });

        let oldTokenDrawOverlay = Token.prototype._drawOverlay;
        Token.prototype._drawOverlay = async function (src, tint) {
            if (((this.combatant && this.combatant.defeated) || this.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.specialStatusEffects.DEFEATED) || this.document.overlayEffect == CONFIG.controlIcons.defeated) && this.actor?.type !== 'character') {
                //this should be showing the bloodsplat, so don't show the skull overlay
                return;
            } else
                return oldTokenDrawOverlay.call(this, src, tint);
        }

        Hooks.on("createCombatant", function (combatant, data, options) {
            //set the blood glyph if this is the GM
            if (setting('show-bloodsplat') != "false" && combatant && game.user.isGM) {
                let token = combatant.token; //canvas.tokens.placeables.find(t => { return (t.id == combatant._token.id); });
                if (token) {
                    let glyph = token.getFlag('monks-little-details', 'glyph');
                    if (glyph == undefined) {
                        glyph = BloodSplats.availableGlyphs.charAt(Math.floor(Math.random() * BloodSplats.availableGlyphs.length));
                        token.setFlag('monks-little-details', 'glyph', glyph);
                    }
                }
            }
        });

        Hooks.on("updateCombat", async function (combat, delta) {
            let combatStarted = (combat && (delta.round === 1 && combat.turn === 0 && combat.started === true));

            //set the bloodsplat glyph when the combat starts to maintain consistency
            if (setting('show-bloodsplat') != "false" && game.user.isGM && combatStarted) {
                for (let combatant of combat.combatants) {
                    let token = combatant.token; //canvas.tokens.placeables.find(t => { return t.id == combatant._token.id; });
                    if (token) {
                        let glyph = token.getFlag('monks-little-details', 'glyph');
                        if (glyph == undefined) {
                            glyph = BloodSplats.availableGlyphs.charAt(Math.floor(Math.random() * BloodSplats.availableGlyphs.length));
                            await token.setFlag('monks-little-details', 'glyph', glyph);
                        }
                    }
                }
            }
        });

        Hooks.on("renderTokenConfig", (app, html, data) => {
            if (game.user.isGM) {
                let colour = getProperty(app.token, "flags.monks-little-details.bloodsplat-colour");

                $('<div>')
                    .addClass('form-group')
                    .append($('<label>').html('Bloodsplat Colour'))
                    .append($('<div>').addClass('form-fields')
                        .append($('<input>').addClass('color').attr('type', 'text').attr('name', 'flags.monks-little-details.bloodsplat-colour').val(colour))
                        .append($('<input>').attr('type', 'color').attr('data-edit', 'flags.monks-little-details.bloodsplat-colour').val(colour))
                    )
                    .insertAfter($('[name="alpha"]', html).closest('.form-group'));

                app.setPosition();
            }
        });

        /*
        Hooks.on("updateToken", (document) => {
            let token = document.object;
            if (token) {
                //refresh the bloodsplat if there is one
                canvas.primary.removeChild(token.bloodsplat);
                delete token.bloodsplat;
            }
        });*/

        Hooks.on("refreshToken", (token) => {
            //find defeated state
            if (MonksLittleDetails.isDefeated(token) && token.actor?.type !== 'character') {
                token.bars.visible = false;
                for (let effect of token.effects.children) {
                    effect.alpha = 0;
                }
                if (['dnd5e.LootSheetNPC5e', 'core.MerchantSheet'].includes(token.actor?.flags?.core?.sheetClass) || token.actor?.flags["item-piles"]?.data?.enabled == true) {
                    token.mesh.alpha = 0.5;
                    if (token.bloodsplat) {
                        canvas.primary.removeChild(token.bloodsplat);
                        delete token.bloodsplat;
                    }
                    if (token.actor?.flags["item-piles"]?.data?.enabled !== true) {
                        if (token.tresurechest == undefined) {
                            if (setting("treasure-chest") != "") {
                                loadTexture(setting("treasure-chest")).then((tex) => {
                                    const chesticon = new PIXI.Sprite(tex);
                                    const size = Math.min(canvas.grid.grid.w, canvas.grid.grid.h);
                                    chesticon.width = chesticon.height = size * setting("treasure-chest-size");
                                    chesticon.position.set((token.w - chesticon.width) / 2, (token.h - chesticon.height) / 2);
                                    chesticon.alpha = 0.8;
                                    token.tresurechest = chesticon;
                                    token.addChild(token.tresurechest);
                                });
                            }
                        } else
                            token.tresurechest.alpha = (token.hover ? 1 : 0.8);
                    } else {
                        if (token.tresurechest != undefined)
                            token.tresurechest.alpha = 0;
                    }
                } else {
                    if (token.document._id != undefined) {
                        if (token.bloodsplat?.transform == undefined) {
                            let animate = canvas.ready && !token._original;
                            if (token.bloodsplat)
                                canvas.primary.removeChild(token.bloodsplat);

                            let glyph = token.document.getFlag('monks-little-details', 'glyph');
                            if (glyph == undefined) {
                                glyph = BloodSplats.availableGlyphs.charAt(Math.floor(Math.random() * BloodSplats.availableGlyphs.length));
                                if (game.user.isGM)
                                    token.document.setFlag('monks-little-details', 'glyph', glyph);
                            }
                            let colour = token.document.getFlag('monks-little-details', 'bloodsplat-colour') || setting('bloodsplat-colour') || '0xff0000';
                            token.bloodsplat = new PIXI.Text(' ' + glyph + ' ', { fontFamily: 'WC Rhesus A Bta', fontSize: token.h * setting("bloodsplat-size"), fill: colour, align: 'center' });
                            token.bloodsplat.alpha = (animate || (token.document.hidden && !game.user.isGM) ? 0 : 0.7);
                            token.bloodsplat.blendMode = PIXI.BLEND_MODES.OVERLAY;
                            token.bloodsplat.anchor.set(0.5, 0.5);
                            token.bloodsplat.x = token.x + (token.w / 2);
                            token.bloodsplat.y = token.y + (token.h / 2);
                            let idx = 0;
                            if (token.ldmarker)
                                idx = canvas.primary.children.indexOf(token.ldmarker) || 0;
                            canvas.primary.addChildAt(token.bloodsplat, idx);

                            //log('Font: ', token.id, (token.h * 1.5), token.bloodsplat.x, token.bloodsplat.y);

                            const iconAlpha = (game.user.isGM || (setting("show-bloodsplat") == "both" && !token.document.hidden) ? 0.2 : 0);
                            if (animate) {
                                //animate the bloodsplat alpha to 0.7
                                //animate the icon alpha to (game.user.isGM || setting("show-bloodsplat") == "both" ? 0.2 : 0);

                                token._animateTo = iconAlpha;

                                const attributes = [
                                    { parent: token.bloodsplat, attribute: 'alpha', to: 0.7 },
                                    { parent: token.mesh, attribute: 'alpha', to: iconAlpha }
                                ];

                                CanvasAnimation.animate(attributes, {
                                    name: "bloodsplatAnimation" + token.id,
                                    context: token,
                                    duration: 800
                                }).then(() => {
                                    delete token._animateTo;
                                });
                            } else
                                token.mesh.alpha = iconAlpha;
                        } else {
                            const iconAlpha = (game.user.isGM || (setting("show-bloodsplat") == "both" && !token.document.hidden) ? 0.2 : 0);
                            if (token._animateTo != iconAlpha)
                                token.mesh.alpha = iconAlpha;
                            token.bloodsplat.position.set(token.x + (token.w / 2), token.y + (token.h / 2));
                        }
                        if (token.tresurechest != undefined)
                            token.tresurechest.alpha = 0;
                    }
                }
            } else {
                if (token.bloodsplat) {
                    canvas.primary.removeChild(token.bloodsplat);
                    delete token.bloodsplat;
                }
                if (token.tresurechest) {
                    token.removeChild(token.tresurechest);
                    delete token.tresurechest;
                }
            }
        });

        Hooks.on("updateToken", function (document, data, options, userid) {
            let token = document.object;
            if (!token)
                return;

            if (token.bloodsplat && data.hidden != undefined) {
                token.bloodsplat.alpha = (token.document.hidden && !game.user.isGM ? 0 : 0.7);
            }
        });

        Hooks.on("destroyToken", (token) => {
            if (token.bloodsplat) {
                canvas.primary.removeChild(token.bloodsplat);
                delete token.bloodsplat;
            }
        });
    }
}