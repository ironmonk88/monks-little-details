export const WithMonksCombatTracker = (CombatTracker) => {
    class MonksCombatTracker extends CombatTracker {
        constructor(...args) {
            super(...args);

            this.getData = async () => {
                const baseData = await super.getData();
                const combat = this.viewed;
                const hasCombat = combat !== null;
                const started = (combat?.turns.length > 0) && (combat?.round > 0)

                if (hasCombat && !started && !game.user.isGM) {
                    //go through the turns(combatants) and remove any that don't have players attached
                    baseData.turns = baseData.turns.filter(t => {
                        let combatant = combat.turns.find(c => c.id == t.id);
                        return combatant.hasPlayerOwner;
                    });
                }

                return baseData;
            }
        }
    }

    const constructorName = "MonksCombatTracker";
    Object.defineProperty(MonksCombatTracker.prototype.constructor, "name", { value: constructorName });
    return MonksCombatTracker;
};