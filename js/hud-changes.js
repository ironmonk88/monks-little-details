import { MonksLittleDetails, i18n, log, setting } from "../monks-little-details.js";

export class HUDChanges {
    static init() {
        if (game.settings.get("monks-little-details", "alter-hud")) {
            let tokenHUDRender = function (wrapped, ...args) {
                let result = wrapped(...args).then((a, b) => {
                    HUDChanges.alterHUD.call(this, this.element);
                    CONFIG.statusEffects = CONFIG.statusEffects.filter(e => e.id != "");
                });

                return result;
            }
            if (game.modules.get("lib-wrapper")?.active) {
                libWrapper.register("monks-little-details", "TokenHUD.prototype._render", tokenHUDRender, "WRAPPER");
            } else {
                const oldTokenHUDRender = TokenHUD.prototype._render;
                TokenHUD.prototype._render = function (event) {
                    return tokenHUDRender.call(this, oldTokenHUDRender.bind(this), ...arguments);
                }
            }

            let getStatusEffectChoices = function (wrapped, ...args) {
                if (setting('sort-statuses') != 'none') {
                    CONFIG.statusEffects = CONFIG.statusEffects.sort(function (a, b) {
                        let aid = (a.label != undefined ? i18n(a.label) : a.id || a);
                        let bid = (b.label != undefined ? i18n(b.label) : b.id || b);
                        return (aid > bid ? 1 : (aid < bid ? -1 : 0));
                        //return (a.id == undefined || a.id > b.id ? 1 : (a.id < b.id ? -1 : 0)); //(a.label == undefined || i18n(a.label) > i18n(b.label) ? 1 : (i18n(a.label) < i18n(b.label) ? -1 : 0));
                    });
                }

                /*
                if (setting('sort-statuses') == 'columns') {
                    let effects = [];
                    let temp = CONFIG.statusEffects.filter(e => e.id != "");
                    let mid = Math.ceil(temp.length / 4);
                    for (let i = 0; i < mid; i++) {
                        for (let j = 0; j < 4; j++) {
                            let spot = i + (j * mid)
                            effects.push((spot < temp.length ? temp[spot] : { id: "", icon: "", label: "" }));
                        }
                    }
                    CONFIG.statusEffects = effects;
                }*/

                return wrapped(...args);
            }

            if (game.modules.get("lib-wrapper")?.active) {
                libWrapper.register("monks-little-details", "TokenHUD.prototype._getStatusEffectChoices", getStatusEffectChoices, "WRAPPER");
            } else {
                const oldGetStatusEffectChoices = TokenHUD.prototype._getStatusEffectChoices;
                TokenHUD.prototype._getStatusEffectChoices = function () {
                    return getStatusEffectChoices.call(this, oldGetStatusEffectChoices.bind(this), ...arguments);
                }
            }

            let refreshStatusIcons = function () {
                const effects = this.element.find(".status-effects")[0];
                const statuses = this._getStatusEffectChoices();
                for (let img of $('[src]', effects)) {
                    const status = statuses[img.getAttribute("src")] || {};
                    img.classList.toggle("overlay", !!status.isOverlay);
                    img.classList.toggle("active", !!status.isActive);
                }
            }

            if (game.modules.get("lib-wrapper")?.active) {
                libWrapper.register("monks-little-details", "TokenHUD.prototype.refreshStatusIcons", refreshStatusIcons, "OVERRIDE");
            } else {
                TokenHUD.prototype.refreshStatusIcons = function (event) {
                    return refreshStatusIcons.call(this);
                }
            }
        }
    }

    static ready() {
        if (setting('sort-by-columns'))
            game.settings.settings.get("monks-little-details.sort-statuses").default = 'columns';
    }

    static async alterHUD(html) {
        if (MonksLittleDetails.canDo("alter-hud") && setting("alter-hud")) {
            $('#token-hud').addClass('monks-little-details').toggleClass('highlight-image', setting('alter-hud-colour'));
            const statuses = this._getStatusEffectChoices();

            for (let img of $('> img,> picture', '.col.right .control-icon[data-action="effects"] .status-effects')) {
                let src = $(img).attr('src');
                if (src == '') {
                    $(img).css({ 'visibility': 'hidden' });
                } else {
                    //const status = statuses[img.getAttribute("src")] || {};
                    let title = $(img).attr('title') || $(img).attr('data-condition');

                    if (game.system.id == "pf2e") {
                        $('<div>')
                            .addClass('effect-name')
                            .attr('title', title)
                            .html(title)
                            .insertAfter($('img', img));
                    } else {
                        $('<div>')
                            .addClass('effect-container')//$(img).attr('class'))
                            //.toggleClass('active', !!status.isActive)
                            .attr('title', title)
                            //.attr('src', $(img).attr('src'))
                            .insertAfter(img)
                            .append(img)//.removeClass('effect-control'))
                            .append($('<div>').addClass('effect-name').html(title)
                            );
                    }
                }
            };

            $('.col.right .control-icon[data-action="effects"] .status-effects > div.pf2e-effect-img-container', html).each(function () {
                let img = $('img', this);
                let title = img.attr('data-condition');
                let div = $('<div>').addClass('effect-name').attr('title', title).html(title).insertAfter(img);
                //$(this).append(div);
                //const status = statuses[img.attr('src')] || {};
                //$(this).attr('src', img.attr('src')).toggleClass('active', !!status.isActive);
            });

            if (game.system.id !== 'pf2e') {
                $('.col.right .control-icon[data-action="effects"] .status-effects', html).append(
                    $('<div>').addClass('clear-all').html(`<i class="fas fa-times-circle"></i> ${i18n("MonksLittleDetails.ClearAll")}`).click($.proxy(HUDChanges.clearAll, this))
                );
            }

            if (setting('sort-statuses') == 'columns') {
                let rows = Math.max(Math.ceil(($('.status-effects', html).children().length - 1) / 4), 1);
                $('.status-effects', html).css({ 'grid-template-rows': `repeat(${rows}, ${100 / rows}%)`, 'grid-auto-flow': 'column' });
            }
        }
    }

    static async clearAll(e) {
        //find the tokenhud, get the TokenHUD.object  ...assuming it's a token?
        const statuses = this._getStatusEffectChoices();

        for (const [k, status] of Object.entries(statuses)) {
            if (status.isActive) {
                await this.object.toggleEffect({ id: status.id, icon: status.src });
            }
        }

        e.preventDefault();

        /*
        let selectedEffects = $('#token-hud .col.right .control-icon.effects .status-effects .effect-control.active');
        for (let ctrl of selectedEffects) {
            let img = $('img', ctrl).get(0);
            if (img != undefined) {
                const effect = (img.dataset.statusId && MonksLittleDetails.tokenHUD.object.actor) ?
                    CONFIG.statusEffects.find(e => e.id === img.dataset.statusId) :
                    img.getAttribute("src");

                await MonksLittleDetails.tokenHUD.object.toggleEffect(effect);
            }
        };*/
    }
}