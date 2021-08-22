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

            if (hasCombat && !started && !game.user.isGM) {
                //go through the turns(combatants) and remove any that don't have players attached
                data.turns = data.turns.filter(t => {
                    let combatant = combat.turns.find(c => c.id == t.id);
                    return combatant.hasPlayerOwner;
                });
            }

            return data;
        }
    }

    const constructorName = "MonksCombatTracker";
    Object.defineProperty(MonksCombatTracker.prototype.constructor, "name", { value: constructorName });
    return MonksCombatTracker;
};

/*
Hooks.on("ready", () => {
    if (game.modules.get("hidden-initiative")?.active) {
        let oldGetData = 
    }
});*/