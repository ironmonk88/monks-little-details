import { MonksLittleDetails, log, setting, i18n } from '../monks-little-details.js';

export class EditEffects extends FormApplication {
    constructor(object) {
        super(object);
    }

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "edit-effects",
            classes: ["form", "edit-effects", "monks-little-details"],
            title: i18n("MonksLittleDetails.EditEffects"),
            template: "modules/monks-little-details/templates/edit-effects.html",
            width: 800,
            submitOnChange: false,
            closeOnSubmit: true,
            scrollY: [".item-list"]
        });
    }

    getData(options) {
        this.effects = this.effects || setting("additional-effects");
        return mergeObject(super.getData(options),
            {
                effects: this.effects
            }
        );
    }

    _updateObject() {
        let data = this.effects.filter(c => !!c.id && !!c.label);
        game.settings.set('monks-little-details', 'additional-effects', data);
        this.submitting = true;
    }

    resetEffects() {
        this.effects = game.settings.settings.get('monks-little-details.additional-effects').default;
        this.refresh();
    }

    addEffect(event) {
        this.effects.push({ id: "", name: "", icon: "" });
        this.refresh();
    }

    changeData(event) {
        let effectid = event.currentTarget.closest('li.item').dataset.id;
        let prop = $(event.currentTarget).attr("name");
        if (prop.startsWith("icon"))
            prop = "icon";

        let effect = this.effects.find(c => c.id == effectid);
        if (effect) {
            let val = $(event.currentTarget).val();
            if (prop == "id") {
                val = val.replace(/[^a-z]/gi, '');
                $(event.currentTarget).val(val);
                if (!!this.effects.find(c => c.id == val)) {
                    $(event.currentTarget).val(effectid)
                    return;
                }
                let parent = $(event.currentTarget.closest('li.item'));
                parent.attr("data-id", val);
                $('.item-icon input', parent).attr('name', `icon-${val}`);
                $('.item-icon button', parent).attr('data-target', `icon-${val}`);
            }

            effect[prop] = val;
        }
    }

    removeEffect() {
        let effectid = event.currentTarget.closest('li.item').dataset.id;
        this.effects.findSplice(s => s.id === effectid);
        this.refresh();
    }

    refresh() {
        this.render(true);
        let that = this;
        window.setTimeout(function () {
            that.setPosition({ height: 'auto' });
        }, 100);
    }

    activateListeners(html) {
        super.activateListeners(html);

        $('button[name="submit"]', html).click(this._onSubmit.bind(this));
        $('button[name="reset"]', html).click(this.resetEffects.bind(this));

        $('input[name]', html).change(this.changeData.bind(this));

        $('.item-delete', html).click(this.removeEffect.bind(this));
        $('.item-add', html).click(this.addEffect.bind(this));
    };
}