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
	
	game.settings.register(modulename, "shownextup", {
		name: game.i18n.localize("MonksLittleDetails.ShowNextUp"),
		hint: game.i18n.localize("MonksLittleDetails.ShowNextUpHint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "showcurrentup", {
		name: game.i18n.localize("MonksLittleDetails.ShowCurrentUp"),
		hint: game.i18n.localize("MonksLittleDetails.ShowCurrentUpHint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "volume", {
		name: game.i18n.localize("MonksLittleDetails.Volume"),
		hint: game.i18n.localize("MonksLittleDetails.VolumeHint"),
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
	game.settings.register(modulename, "playroundsound", {
		name: game.i18n.localize("MonksLittleDetails.PlayRoundSound"),
		hint: game.i18n.localize("MonksLittleDetails.PlayRoundSoundHint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "disablesounds", {
		name: game.i18n.localize("MonksLittleDetails.DisableSounds"),
		hint: game.i18n.localize("MonksLittleDetails.DisableSoundsHint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "combat-position", {
		name: game.i18n.localize("MonksLittleDetails.Position"),
		hint: game.i18n.localize("MonksLittleDetails.PositionHint"),
        scope: "world",
        default: null,
        type: String,
        choices: dialogpositions,
        config: true
    });
	game.settings.register(modulename, "opencombat", {
		name: game.i18n.localize("MonksLittleDetails.PopoutCombat"),
		hint: game.i18n.localize("MonksLittleDetails.PopoutCombatHint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "close-combat-when-done", {
		name: "Close Combat when done",
		hint: "Close the combat popout, when you've done a combat encounter, if there are no other combats active.",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "show-combat-cr", {
		name: "Show Encounter CR",
		hint: "When creating a combat encounter, display the estimated CR for that encounter.",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "alter-hud", {
		name: "Alter the Token HUD status effects",
		hint: "Alter the Token HUD to show detailed status effects and allow to clear all effects.",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "scene-palette", {
		name: "Show Scene Palette",
		hint: "Show the top 5 dominant colours of a scene just in case you want to set the background colour to a similar colour.",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "swap-buttons", {
		name: "Swap target and settings button on the Token HUD",
		hint: "I think the settings button makes more sense on the bottom rather than in the middle.",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "change-invisible-image", {
		name: "Use DnD5e invisible icon",
		hint: "Instead of using the Foundry masked man image, use and outlined image",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "core-css-changes", {
		name: "Change Core CSS",
		hint: "Update some of the core css to display things a little better",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "show-drag-points-together", {
		name: "Show Drag Points Together",
		hint: "Show a toggle button on the wall tools that will drag points together if they overlap exactly",
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
};