import { MonksLittleDetails, log, error, setting, i18n } from '../monks-little-details.js';

export class ModuleWarning extends Application {
    constructor(object, options = {}) {
        super(object, options);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "module-warning",
            title: "Module Warning",
            template: "modules/monks-little-details/templates/module-warning.html",
            width: 800,
            height: 'auto'
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
        $('.clear', html).bind("click", () => { game.settings.set("monks-little-details", "show-warning", false); this.close(); });
        $('.just-close', html).bind("click", () => { this.close(); });
    }
}