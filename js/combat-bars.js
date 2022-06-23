import { MonksLittleDetails, i18n, log, setting } from "../monks-little-details.js";

export class CombatBars {
    static init() {
        Hooks.on("updateCombat", async function (combat, delta) {
            let combatStarted = (combat && (delta.round === 1 && combat.turn === 0 && combat.started === true));

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
        });

        Hooks.on('renderTokenConfig', function (app, html, options) {
            let displayBars = $('[name="displayBars"]', html).parents('div.form-group');
            let combatBars = displayBars.clone(true);

            let value = (app.object instanceof TokenDocument ? app.object.getFlag('monks-little-details', 'displayBarsCombat') : getProperty(app.object.data.token, "flags.monks-little-details.displayBarsCombat"));

            $('[name="displayBars"]', combatBars).attr('name', 'flags.monks-little-details.displayBarsCombat').prepend($('<option>').attr('value', '-1').html('')).val(value);
            $('> label', combatBars).html(i18n("MonksLittleDetails.CombatDisplayBars"));
            combatBars.insertAfter(displayBars);
        });

        Hooks.on("deleteCombat", function (combat) {
            //if we're using combat bars and the combat starts or stops, we need to refresh the tokens
            if (setting('add-combat-bars') && combat) {
                for (let combatant of combat.combatants) {
                    let token = combatant.token; //canvas.tokens.placeables.find(t => { return t.id == combatant._token.id; });
                    if (token) {
                        let displayBars = token.data.displayBars;
                        let combatBar = token.getFlag('monks-little-details', 'displayBarsCombat');
                        combatBar = (combatBar == undefined || combatBar == -1 ? displayBars : combatBar);

                        if (token.object.hud.bars.alpha != 1) {
                            token.object.hud.bars.alpha = 1;
                            token.object.refresh();
                        } else if (combatBar != displayBars)
                            token.object.refresh();

                        token.object.drawBars();
                    }
                }
            }
        });

        let tokenDrawBars = function (wrapped, ...args) {
            if (this.inCombat && this.data.displayBars === CONST.TOKEN_DISPLAY_MODES.NONE && this.document.data.flags['monks-little-details']?.displayBarsCombat !== CONST.TOKEN_DISPLAY_MODES.NONE) {
                this.data.displayBars = 5;
                wrapped.call(this);
                this.data.displayBars = CONST.TOKEN_DISPLAY_MODES.NONE;
            } else
                wrapped.call(this);
        }

        if (game.modules.get("lib-wrapper")?.active) {
            libWrapper.register("monks-little-details", "Token.prototype.drawBars", tokenDrawBars, "WRAPPER");
        } else {
            const oldTokenDrawBars = Token.prototype.drawBars;
            Token.prototype.drawBars = function () {
                return tokenDrawBars.call(this, oldTokenDrawBars.bind(this), ...arguments);
            }
        }
    }

    static canViewCombatMode(mode) {
        if (mode === CONST.TOKEN_DISPLAY_MODES.NONE) return false;
        else if (mode === CONST.TOKEN_DISPLAY_MODES.ALWAYS) return true;
        else if (mode === CONST.TOKEN_DISPLAY_MODES.CONTROL) return this.isOwner;
        else if (mode === CONST.TOKEN_DISPLAY_MODES.HOVER) return true;
        else if (mode === CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER) return this.isOwner;
        else if (mode === CONST.TOKEN_DISPLAY_MODES.OWNER) return this.isOwner;
        return false;
    }

    static tokenRefresh() {
        //if this token is part of a combat, then always show the bar, but at 0.5 opacity, unless controlled
        if (this.inCombat) {
            let combatBar = this.document.getFlag('monks-little-details', 'displayBarsCombat');
            if (combatBar != undefined && combatBar != -1) {
                this.hud.bars.visible = CombatBars.canViewCombatMode.call(this, combatBar);
                this.hud.bars.alpha = ((this._controlled && (combatBar == CONST.TOKEN_DISPLAY_MODES.CONTROL || combatBar == CONST.TOKEN_DISPLAY_MODES.OWNER || combatBar == CONST.TOKEN_DISPLAY_MODES.ALWAYS)) ||
                    (this._hover && (combatBar == CONST.TOKEN_DISPLAY_MODES.HOVER || combatBar == CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER)) ? 1 : 0.3);
            }
        } else {
            if (this?.hud.bars?.alpha)
                this.hud.bars.alpha = 1;
        }
    }

    static updateToken(document, data) {
        if (data?.flags && data?.flags['monks-little-details']?.displayBarsCombat) document?._object.drawBars();
    }
}