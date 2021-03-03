import { MonksLittleDetails, i18n } from "./monks-little-details.js";

export const registerSettings = function () {
    // Register any custom module settings here
    let modulename = "monks-little-details";
	
	let dialogpositions = {
		'': '—',
		'topleft': 'Top Left',
		'topright': 'Top Right',
		'bottomleft': 'Bottom Left',
		'bottomright': 'Bottom Right'
	};

	let opencombatoptions = {
		'none': i18n("MonksLittleDetails.combatopen.none"),
		'everyone': i18n("MonksLittleDetails.combatopen.everyone"),
		'gmonly': i18n("MonksLittleDetails.combatopen.gm"),
		'playersonly': i18n("MonksLittleDetails.combatopen.players")
	};
	
	game.settings.register(modulename, "shownextup", {
		name: i18n("MonksLittleDetails.shownextup.name"),
		hint: i18n("MonksLittleDetails.shownextup.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "next-sound", {
		name: i18n("MonksLittleDetails.next-sound.name"),
		hint: i18n("MonksLittleDetails.next-sound.hint"),
		scope: "world",
		config: true,
		default: "modules/monks-little-details/sounds/next.wav",
		type: String,
	});
	game.settings.register(modulename, "showcurrentup", {
		name: i18n("MonksLittleDetails.showcurrentup.name"),
		hint: i18n("MonksLittleDetails.showcurrentup.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "turn-sound", {
		name: i18n("MonksLittleDetails.turn-sound.name"),
		hint: i18n("MonksLittleDetails.turn-sound.hint"),
		scope: "world",
		config: true,
		default: "modules/monks-little-details/sounds/turn.wav",
		type: String,
	});
	game.settings.register(modulename, "round-sound", {
		name: i18n("MonksLittleDetails.round-sound.name"),
		hint: i18n("MonksLittleDetails.round-sound.hint"),
		scope: "world",
		config: true,
		default: "modules/monks-little-details/sounds/round.wav",
		type: String,
	});
	game.settings.register(modulename, "volume", {
		name: i18n("MonksLittleDetails.volume.name"),
		hint: i18n("MonksLittleDetails.volume.hint"),
		scope: "client",
		config: true,
		range: {
			min: 0,
			max: 100,
			step: 10,
		},
		default: 60,
		type: Number,
	});
	game.settings.register(modulename, "disablesounds", {
		name: i18n("MonksLittleDetails.disablesounds.name"),
		hint: i18n("MonksLittleDetails.disablesounds.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "combat-position", {
		name: i18n("MonksLittleDetails.combat-position.name"),
		hint: i18n("MonksLittleDetails.combat-position.hint"),
        scope: "world",
        default: null,
        type: String,
        choices: dialogpositions,
        config: true
    });
	game.settings.register(modulename, "opencombat", {
		name: i18n("MonksLittleDetails.opencombat.name"),
		hint: i18n("MonksLittleDetails.opencombat.hint"),
		scope: "world",
		config: true,
		choices: opencombatoptions,
		default: "everyone",
		type: String
	});
	game.settings.register(modulename, "disable-opencombat", {
		name: i18n("MonksLittleDetails.disable-opencombat.name"),
		hint: i18n("MonksLittleDetails.disable-opencombat.hint"),
		scope: "client",
		config: true,
		default: false,
		type: Boolean
	});
	game.settings.register(modulename, "close-combat-when-done", {
		name: i18n("MonksLittleDetails.close-combat-when-done.name"),
		hint: i18n("MonksLittleDetails.close-combat-when-done.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "prevent-token-removal", {
		name: i18n("MonksLittleDetails.prevent-token-removal.name"),
		hint: i18n("MonksLittleDetails.prevent-token-removal.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "show-combat-cr", {
		name: i18n("MonksLittleDetails.show-combat-cr.name"),
		hint: i18n("MonksLittleDetails.show-combat-cr.hint"),
		scope: "world",
		config: MonksLittleDetails.canDo("show-combat-cr"),
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "swap-buttons", {
		name: i18n("MonksLittleDetails.swap-buttons.name"),
		hint: i18n("MonksLittleDetails.swap-buttons.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "alter-hud", {
		name: i18n("MonksLittleDetails.alter-hud.name"),
		hint: i18n("MonksLittleDetails.alter-hud.hint"),
		scope: "world",
		config: MonksLittleDetails.canDo("alter-hud"),
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "add-extra-statuses", {
		name: i18n("MonksLittleDetails.add-extra-statuses.name"),
		hint: i18n("MonksLittleDetails.add-extra-statuses.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "change-invisible-image", {
		name: i18n("MonksLittleDetails.change-invisible-image.name"),
		hint: i18n("MonksLittleDetails.change-invisible-image.hint"),
		scope: "world",
		config: MonksLittleDetails.canDo("change-invisible-image"),
		default: true,
		type: Boolean,
		onChange: () => {
			location.reload();
		}
	});
	game.settings.register(modulename, "actor-sounds", {
		name: i18n("MonksLittleDetails.actor-sounds.name"),
		hint: i18n("MonksLittleDetails.actor-sounds.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "scene-palette", {
		name: i18n("MonksLittleDetails.scene-palette.name"),
		hint: i18n("MonksLittleDetails.scene-palette.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "core-css-changes", {
		name: i18n("MonksLittleDetails.core-css-changes.name"),
		hint: i18n("MonksLittleDetails.core-css-changes.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		onChange: () => {
			location.reload();
		}
	});
	game.settings.register(modulename, "show-drag-points-together", {
		name: i18n("MonksLittleDetails.show-drag-points-together.name"),
		hint: i18n("MonksLittleDetails.show-drag-points-together.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "movement-key", {
		name: i18n("MonksLittleDetails.movement-key.name"),
		hint: i18n("MonksLittleDetails.movement-key.hint"),
		scope: "world",
		config: true,
		default: "m",
		type: String,
	});
	game.settings.register(modulename, "show-notify", {
		name: i18n("MonksLittleDetails.show-notify.name"),
		hint: i18n("MonksLittleDetails.show-notify.hint"),
		scope: "client",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "show-bloodsplat", {
		name: i18n("MonksLittleDetails.show-bloodsplat.name"),
		hint: i18n("MonksLittleDetails.show-bloodsplat.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		onChange: () => {
			location.reload();
		}
	});
	game.settings.register(modulename, "token-combat-highlight", {
		name: i18n("MonksLittleDetails.token-combat-highlight.name"),
		hint: i18n("MonksLittleDetails.token-combat-highlight.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});
	game.settings.register(modulename, "token-highlight-animate", {
		name: i18n("MonksLittleDetails.token-highlight-animate.name"),
		hint: i18n("MonksLittleDetails.token-highlight-animate.hint"),
		scope: "world",
		config: true,
		default: 100,
		type: Number,
		range: {
			min: 0,
			max: 1000,
			step: 10
		}
	});
	game.settings.register(modulename, "token-highlight-picture", {
		name: i18n("MonksLittleDetails.token-highlight-picture.name"),
		hint: i18n("MonksLittleDetails.token-highlight-picture.hint"),
		scope: "world",
		config: true,
		default: "modules/monks-little-details/icons/turnmarker.png",
		type: String,
		onChange: () => {
			location.reload();
		}
	});
	game.settings.register(modulename, "token-highlight-scale", {
		name: i18n("MonksLittleDetails.token-highlight-scale.name"),
		hint: i18n("MonksLittleDetails.token-highlight-scale.hint"),
		scope: "world",
		config: true,
		default: 1.5,
		type: Number,
		range: {
			min: 1,
			max: 2,
			step: 0.1
		},
		onChange: () => {
			location.reload();
		}
	});
	game.settings.register(modulename, "hide-enemies", {
		name: i18n("MonksLittleDetails.hide-enemies.name"),
		hint: i18n("MonksLittleDetails.hide-enemies.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
};
