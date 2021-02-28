export const WithMonksCombatTracker = (BaseTracker) => {
    class MonksCombatTracker extends BaseTracker {
        constructor(...args) {
            super(...args);

            this.getData = async () => {
                const baseData = await super.getData();
                const combat = this.combat;
                const hasCombat = combat !== null;

                if (hasCombat && !combat.started && !game.user.isGM) {
                    baseData.turns = baseData.turns.filter(c => {
                        return c.players.length;
                    });
                }

                return baseData;
            }
        }
    }

    const constructorName = isNewerVersion(game.data.version, "0.7.0")
        ? "MonksCombatTracker"
        : "CombatTracker";
    Object.defineProperty(MonksCombatTracker.prototype.constructor, "name", { value: constructorName });
    return MonksCombatTracker;
};