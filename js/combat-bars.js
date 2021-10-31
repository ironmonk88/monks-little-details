import { MonksLittleDetails, i18n, log, setting } from "../monks-little-details.js";

/*
if (setting('add-combat-bars')) {
    let tokenRefresh = function (wrapped, ...args) {
        wrapped(...args);

        if (this.inCombat) {
            let combatBar = this.document.getFlag('monks-little-details', 'displayBarsCombat');
            if (combatBar != undefined && combatBar != -1) {
                this.bars.visible = MonksLittleDetails.canViewCombatMode.call(this, combatBar);
                this.bars.alpha = ((this._controlled && (combatBar == CONST.TOKEN_DISPLAY_MODES.CONTROL || combatBar == CONST.TOKEN_DISPLAY_MODES.OWNER || combatBar == CONST.TOKEN_DISPLAY_MODES.ALWAYS)) ||
                    (this._hover && (combatBar == CONST.TOKEN_DISPLAY_MODES.HOVER || combatBar == CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER)) ? 1 : 0.3);
            }
        } else
            this.bars.alpha = 1;
    }

    if (game.modules.get("lib-wrapper")?.active) {
        libWrapper.register("monks-little-details", "Token.prototype.refresh", tokenRefresh, "WRAPPER");
    } else {
        const oldTokenRefresh = Token.prototype.refresh;
        Token.prototype.refresh = function () {
            return tokenRefresh.call(this, oldTokenRefresh.bind(this), ...arguments);
        }
    }
}*/

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

            $('[name="displayBars"]', combatBars).attr('name', 'flags.monks-little-details.displayBarsCombat').prepend($('<option>').attr('value', '-1').html('')).val(app.object.getFlag('monks-little-details', 'displayBarsCombat'));
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

                        if (token.object.bars.alpha != 1) {
                            token.object.bars.alpha = 1;
                            token.object.refresh();
                        } else if (combatBar != displayBars)
                            token.object.refresh();
                    }
                }
            }
        });
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
                this.bars.visible = CombatBars.canViewCombatMode.call(this, combatBar);
                this.bars.alpha = ((this._controlled && (combatBar == CONST.TOKEN_DISPLAY_MODES.CONTROL || combatBar == CONST.TOKEN_DISPLAY_MODES.OWNER || combatBar == CONST.TOKEN_DISPLAY_MODES.ALWAYS)) ||
                    (this._hover && (combatBar == CONST.TOKEN_DISPLAY_MODES.HOVER || combatBar == CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER)) ? 1 : 0.3);
            }
        } else {
            if (this?.bars?.alpha)
                this.bars.alpha = 1;
        }
    }
}