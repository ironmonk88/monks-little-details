export class LatestChanges extends Application {
    constructor(entity, options = {}) {
        super(options);
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "assignexperience",
            title: i18n("MonksLittleDetails.LatestChanges"),
            template: "./modules/monks-little-details/templates/latest.html",
            width: 400,
            height: 400,
            popOut: true,
        });
    }

    getData(options) {
        return {
            actors: this.actors,
            xp: this.xp,
            dividexp: this.dividexp,
            reason: this.reason,
            divideXpOptions: this.divideXpOptions
        };
    }
}