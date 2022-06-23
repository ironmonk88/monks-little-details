import { MonksLittleDetails, log, error, setting, i18n } from '../monks-little-details.js';

export const WithMonksCombatTracker = (CombatTracker) => {
    class MonksCombatTracker extends CombatTracker {
        constructor(...args) {
            super(...args);

            if (game.modules.get("hidden-initiative")?.active) {
                let oldGetData = this.getData;
                this.getData = async function() {
                    let data = await oldGetData();
                    return this.MonksGetData(data);
                }
            }
        }

        async getData() {   //this will get overwritten by Hidden Initiative if it's installed.
            const data = await super.getData();
            return this.MonksGetData(data);
        }

        async MonksGetData(data) {
            const combat = this.viewed;
            const hasCombat = combat !== null;
            const started = (combat?.turns.length > 0) && (combat?.round > 0)
            const hideuntilturn = setting("hide-until-turn");

            if (hasCombat && !game.user.isGM) {
                //go through the turns(combatants) and remove any that don't have players attached
                data.turns = data.turns.filter((t, index) => {
                    let combatant = combat.turns.find(c => c.id == t.id);
                    return combatant.hasPlayerOwner || (started && (combat.round > 1 || !hideuntilturn || combat.turn >= index));
                });
            }

            return data;
        }

        activateListeners(html) {
            super.activateListeners(html);

            if (!game.user.isGM)
                this._contextMenu(html);
        }

        _getEntryContextOptions() {
            let entries = [];
            if (game.user.isGM)
                entries = super._getEntryContextOptions();

            entries.unshift({
                name: "Target",
                icon: '<i class="fas fa-bullseye"></i>',
                callback: li => {
                    const combatant = this.viewed.combatants.get(li.data("combatant-id"));
                    if (combatant?.token?._object) {
                        const targeted = !combatant.token._object.isTargeted;
                        combatant.token._object.setTarget(targeted, { releaseOthers: false });
                    }
                }
            });

            return entries;
        }
    }

    const constructorName = "MonksCombatTracker";
    Object.defineProperty(MonksCombatTracker.prototype.constructor, "name", { value: constructorName });
    return MonksCombatTracker;
};