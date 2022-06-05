import { MonksLittleDetails, i18n, log, setting } from "../monks-little-details.js";

export class BloodSplats {
    static init() {
        BloodSplats.availableGlyphs = '!"#$%&\'()*+,-./01234568:;<=>?@ABDEFGHIKMNOPQRSTUVWX[\\]^_`acdfhoquvx|}~¢£¥§©ª«¬®°±¶·º¿ÀÁÂÄÅÆÈÉÊËÌÏÑÒÓÔÖØÙÚÜßàáâåæçéêëìíîïñòõ÷øùûüÿiœŸƒπ';

        BloodSplats.splatfont = new FontFace('WC Rhesus A Bta', "url('modules/monks-little-details/fonts/WCRhesusABta.woff2')");
        BloodSplats.splatfont.load().then(() => {
            document.fonts.add(BloodSplats.splatfont);
        });

        let oldTokenDrawOverlay = Token.prototype._drawOverlay;
        Token.prototype._drawOverlay = async function ({ src, tint } = {}) {
            if (((this.combatant && this.combatant.data.defeated) || this.actor?.effects.find(e => e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId) || this.data.overlayEffect == CONFIG.controlIcons.defeated) && this.actor?.data.type !== 'character') {
                //this should be showing the bloodsplat, so don't show the skull overlay
                return;
            } else
                return oldTokenDrawOverlay.call(this, { src, tint });
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
                let colour = app.token.getFlag('monks-little-details', 'bloodsplat-colour');

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
                token.removeChild(token.bloodsplat);
                delete token.bloodsplat;
            }
        });*/
    }

    static tokenRefresh () {
        //find defeated state
        if (MonksLittleDetails.isDefeated(this) && this.actor?.data.type !== 'character') {
            this.hud.bars.visible = false;
            for (let effect of this.hud.effects.children) {
                effect.alpha = 0;
            }
            if (['dnd5e.LootSheetNPC5e', 'core.MerchantSheet'].includes(this.actor?.data?.flags?.core?.sheetClass) || this.actor?.data.flags["item-piles"]?.data?.enabled == true) {
                this.icon.alpha = 0.5;
                if (this.bloodsplat) {
                    this.removeChild(this.bloodsplat);
                    delete this.bloodsplat;
                }
                if (this.actor?.data.flags["item-piles"]?.data?.enabled !== true) {
                    if (this.tresurechest == undefined) {
                        if (setting("treasure-chest") != "") {
                            loadTexture(setting("treasure-chest")).then((tex) => {
                                const chesticon = new PIXI.Sprite(tex);
                                const size = Math.min(canvas.grid.grid.w, canvas.grid.grid.h);
                                chesticon.width = chesticon.height = size * setting("treasure-chest-size");
                                chesticon.position.set((this.w - chesticon.width) / 2, (this.h - chesticon.height) / 2);
                                chesticon.alpha = 0.8;
                                this.tresurechest = chesticon;
                                this.addChild(this.tresurechest);
                            });
                        }
                    } else
                        this.tresurechest.alpha = (this._hover ? 1 : 0.8);
                } else {
                    if (this.tresurechest != undefined)
                        this.tresurechest.alpha = 0;
                }
            } else {
                if (this.data._id != undefined) {
                    if (this.bloodsplat?.transform == undefined) {
                        let animate = canvas.ready;
                        if (this.bloodsplat)
                            this.removeChild(this.bloodsplat);

                        let glyph = this.document.getFlag('monks-little-details', 'glyph');
                        if (glyph == undefined) {
                            glyph = BloodSplats.availableGlyphs.charAt(Math.floor(Math.random() * BloodSplats.availableGlyphs.length));
                            if (game.user.isGM)
                                this.document.setFlag('monks-little-details', 'glyph', glyph);
                        }
                        let colour = this.document.getFlag('monks-little-details', 'bloodsplat-colour') || setting('bloodsplat-colour') || '0xff0000';
                        this.bloodsplat = new PIXI.Text(' ' + glyph + ' ', { fontFamily: 'WC Rhesus A Bta', fontSize: this.h * 1.5, fill: colour, align: 'center' });
                        this.bloodsplat.alpha = (animate ? 0 : 0.7);
                        this.bloodsplat.blendMode = PIXI.BLEND_MODES.OVERLAY;
                        this.bloodsplat.anchor.set(0.5, 0.5);
                        this.bloodsplat.x = this.w / 2;
                        this.bloodsplat.y = this.h / 2;
                        this.addChild(this.bloodsplat);

                        //log('Font: ', this.id, (this.h * 1.5), this.bloodsplat.x, this.bloodsplat.y);

                        const iconAlpha = (game.user.isGM || setting("show-bloodsplat") == "both" ? 0.2 : 0);
                        if (animate) {
                            //animate the bloodsplat alpha to 0.7
                            //animate the icon alpha to (game.user.isGM || setting("show-bloodsplat") == "both" ? 0.2 : 0);

                            this._animateTo = iconAlpha;

                            const attributes = [
                                { parent: this.bloodsplat, attribute: 'alpha', to: 0.7 },
                                { parent: this.icon, attribute: 'alpha', to: iconAlpha }
                            ];

                            CanvasAnimation.animateLinear(attributes, {
                                name: "bloodsplatAnimation" + this.id,
                                context: this,
                                duration: 800
                            }).then(() => {
                                delete this._animateTo;
                            });
                        } else
                            this.icon.alpha = iconAlpha;
                    } else {
                        const iconAlpha = (game.user.isGM || setting("show-bloodsplat") == "both" ? 0.2 : 0);
                        if (this._animateTo != iconAlpha)
                            this.icon.alpha = iconAlpha;
                    }
                    if (this.tresurechest != undefined)
                        this.tresurechest.alpha = 0;
                }
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