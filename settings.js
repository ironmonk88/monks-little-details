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
		name: game.i18n.localize("CombatDetails.ShowNextUp"),
		hint: game.i18n.localize("CombatDetails.ShowNextUpHint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "showcurrentup", {
		name: game.i18n.localize("CombatDetails.ShowCurrentUp"),
		hint: game.i18n.localize("CombatDetails.ShowCurrentUpHint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "volume", {
		name: game.i18n.localize("CombatDetails.Volume"),
		hint: game.i18n.localize("CombatDetails.VolumeHint"),
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
	game.settings.register(modulename, "combat-position", {
        name: game.i18n.localize("CombatDetails.Position"),
        hint: game.i18n.localize("CombatDetails.PositionHint"),
        scope: "world",
        default: null,
        type: String,
        choices: dialogpositions,
        config: true
    });
	game.settings.register(modulename, "opencombat", {
		name: game.i18n.localize("CombatDetails.PopoutCombat"),
		hint: game.i18n.localize("CombatDetails.PopoutCombatHint"),
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
};