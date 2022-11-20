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
            const hideuntilturn = setting("hide-until-turn");
            if (setting('hide-enemies') || hideuntilturn) {
                const combat = this.viewed;
                const hasCombat = combat !== null;
                const started = (combat?.turns.length > 0) && (combat?.round > 0)

                if (hasCombat && !game.user.isGM && data.turns) {
                    //go through the turns(combatants) and remove any that don't have players attached
                    data.turns = data.turns.filter((t, index) => {
                        let combatant = combat.turns.find(c => c.id == t.id);
                        return combatant.hasPlayerOwner || (started && (combat.round > 1 || !hideuntilturn || combat.turn >= index));
                    });
                }
            }

            setProperty(data, "options.resizable", true);

            return data;
        }

        async _render(...args) {
            await super._render(...args);
            if (this.popOut) {
                $(this.element).toggleClass("hide-defeated", setting("hide-defeated") == true);
                //new Draggable(this, html, false, this.options.resizable);
            }
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

Hooks.on("renderMonksCombatTracker", function (app, html, data) {
    if (app.popOut) {
        app.options.height = "";
        let draggable = new Draggable(app, html, false, { resizeX: false });
    }
});