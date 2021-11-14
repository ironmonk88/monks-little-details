import { MonksLittleDetails, i18n } from "./monks-little-details.js";

export const registerSettings = function () {
    // Register any custom module settings here
	let modulename = "monks-little-details";

	const debouncedReload = foundry.utils.debounce(function () { window.location.reload(); }, 100);
	
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

	let autodefeated = {
		'none': i18n("MonksLittleDetails.autodefeated.none"),
		'npc-zero': i18n("MonksLittleDetails.autodefeated.npc-zero"),
		'npc-negative': i18n("MonksLittleDetails.autodefeated.npc-negative"),
		'all-zero': i18n("MonksLittleDetails.autodefeated.all-zero"),
		'all-negative': i18n("MonksLittleDetails.autodefeated.all-negative")
	};

	let animation = {
		'none': i18n("MonksLittleDetails.animation.none"),
		'clockwise': i18n("MonksLittleDetails.animation.clockwise"),
		'counterclockwise': i18n("MonksLittleDetails.animation.counterclockwise"),
		'pulse': i18n("MonksLittleDetails.animation.pulse"),
		'fadeout': i18n("MonksLittleDetails.animation.fadeout"),
		'fadein': i18n("MonksLittleDetails.animation.fadein")
	};

	let sortstatus = {
		'none': i18n("MonksLittleDetails.sortstatus.none"),
		'rows': i18n("MonksLittleDetails.sortstatus.rows"),
		'columns': i18n("MonksLittleDetails.sortstatus.columns")
	};

	//System changes
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
		onChange: debouncedReload
	});
	game.settings.register(modulename, "sort-by-columns", {
		name: i18n("MonksLittleDetails.sort-by-columns.name"),
		hint: i18n("MonksLittleDetails.sort-by-columns.hint"),
		scope: "world",
		config: false,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "sort-statuses", {
		name: i18n("MonksLittleDetails.sort-statuses.name"),
		hint: i18n("MonksLittleDetails.sort-statuses.hint"),
		scope: "world",
		config: MonksLittleDetails.canDo("sort-statuses"),
		default: 'rows',
		type: String,
		choices: sortstatus,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "alter-hud-colour", {
		name: i18n("MonksLittleDetails.alter-hud-colour.name"),
		hint: i18n("MonksLittleDetails.alter-hud-colour.hint"),
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
		onChange: debouncedReload
	});
	game.settings.register(modulename, "core-css-changes", {
		name: i18n("MonksLittleDetails.core-css-changes.name"),
		hint: i18n("MonksLittleDetails.core-css-changes.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "compendium-view-artwork", {
		name: game.i18n.localize("MonksLittleDetails.compendium-view-artwork.name"),
		hint: game.i18n.localize("MonksLittleDetails.compendium-view-artwork.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});

	//combat tracker
	game.settings.register(modulename, "show-combat-cr", {
		name: i18n("MonksLittleDetails.show-combat-cr.name"),
		hint: i18n("MonksLittleDetails.show-combat-cr.hint"),
		scope: "world",
		config: MonksLittleDetails.canDo("show-combat-cr"),
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "hide-enemies", {
		name: i18n("MonksLittleDetails.hide-enemies.name"),
		hint: i18n("MonksLittleDetails.hide-enemies.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "popout-combat", {
		name: i18n("MonksLittleDetails.opencombat.name"),
		hint: i18n("MonksLittleDetails.opencombat.hint"),
		scope: "client",
		config: true,
		default: true,
		type: Boolean
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
	game.settings.register(modulename, "combat-position", {
		name: i18n("MonksLittleDetails.combat-position.name"),
		hint: i18n("MonksLittleDetails.combat-position.hint"),
		scope: "world",
		default: null,
		type: String,
		choices: dialogpositions,
		config: true
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
	game.settings.register(modulename, "auto-defeated", {
		name: i18n("MonksLittleDetails.auto-defeated.name"),
		hint: i18n("MonksLittleDetails.auto-defeated.hint"),
		scope: "world",
		config: true,
		choices: autodefeated,
		default: (game.system.id == 'D35E' || game.system.id == 'pf1' ? 'npc-negative' : 'npc-zero'),
		type: String,
	});
	game.settings.register(modulename, "invisible-dead", {
		name: i18n("MonksLittleDetails.invisible-dead.name"),
		hint: i18n("MonksLittleDetails.invisible-dead.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "auto-reveal", {
		name: i18n("MonksLittleDetails.auto-reveal.name"),
		hint: i18n("MonksLittleDetails.auto-reveal.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "add-combat-bars", {
		name: i18n("MonksLittleDetails.add-combat-bars.name"),
		hint: i18n("MonksLittleDetails.add-combat-bars.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});

	//Combat Turn
	game.settings.register(modulename, "shownextup", {
		name: i18n("MonksLittleDetails.shownextup.name"),
		hint: i18n("MonksLittleDetails.shownextup.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "showcurrentup", {
		name: i18n("MonksLittleDetails.showcurrentup.name"),
		hint: i18n("MonksLittleDetails.showcurrentup.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "play-next-sound", {
		name: i18n("MonksLittleDetails.next-sound.name"),
		hint: i18n("MonksLittleDetails.next-sound.hint"),
		scope: "client",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "play-turn-sound", {
		name: i18n("MonksLittleDetails.turn-sound.name"),
		hint: i18n("MonksLittleDetails.turn-sound.hint"),
		scope: "client",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "play-round-sound", {
		name: i18n("MonksLittleDetails.round-sound.name"),
		hint: i18n("MonksLittleDetails.round-sound.hint"),
		scope: "client",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "next-sound", {
		name: i18n("MonksLittleDetails.next-sound.name"),
		hint: i18n("MonksLittleDetails.next-sound.hint"),
		scope: "world",
		config: true,
		default: "modules/monks-little-details/sounds/next.ogg",
		type: String,
		//filePicker: 'audio',
	});
	game.settings.register(modulename, "turn-sound", {
		name: i18n("MonksLittleDetails.turn-sound.name"),
		hint: i18n("MonksLittleDetails.turn-sound.hint"),
		scope: "world",
		config: true,
		default: "modules/monks-little-details/sounds/turn.ogg",
		type: String,
		//filePicker: 'audio',
	});
	game.settings.register(modulename, "round-sound", {
		name: i18n("MonksLittleDetails.round-sound.name"),
		hint: i18n("MonksLittleDetails.round-sound.hint"),
		scope: "world",
		config: true,
		default: "modules/monks-little-details/sounds/round.ogg",
		type: String,
		//filePicker: 'audio',
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
	/*
	game.settings.register(modulename, "disablesounds", {
		name: i18n("MonksLittleDetails.disablesounds.name"),
		hint: i18n("MonksLittleDetails.disablesounds.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});*/
	game.settings.register(modulename, "clear-targets", {
		name: i18n("MonksLittleDetails.clear-targets.name"),
		hint: i18n("MonksLittleDetails.clear-targets.hint"),
		scope: "client",
		config: true,
		default: true,
		type: Boolean
	});
	game.settings.register(modulename, "remember-previous", {
		name: i18n("MonksLittleDetails.remember-previous.name"),
		hint: i18n("MonksLittleDetails.remember-previous.hint"),
		scope: "client",
		config: true,
		default: true,
		type: Boolean
	});
	game.settings.register(modulename, "round-chatmessages", {
		name: i18n("MonksLittleDetails.round-chatmessages.name"),
		hint: i18n("MonksLittleDetails.round-chatmessages.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});
	game.settings.register(modulename, "show-start", {
		name: i18n("MonksLittleDetails.show-start.name"),
		hint: i18n("MonksLittleDetails.show-start.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});

	//Combat Token Highlight
	game.settings.register(modulename, "token-combat-highlight", {
		name: i18n("MonksLittleDetails.token-combat-highlight.name"),
		hint: i18n("MonksLittleDetails.token-combat-highlight.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});
	game.settings.register(modulename, "token-highlight-remove", {
		name: i18n("MonksLittleDetails.token-highlight-remove.name"),
		hint: i18n("MonksLittleDetails.token-highlight-remove.hint"),
		scope: "world",
		config: true,
		default: false,
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
		//filePicker: true,
		onChange: debouncedReload
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
		onChange: debouncedReload
	});
	game.settings.register(modulename, "token-combat-animation", {
		name: i18n("MonksLittleDetails.token-combat-animation.name"),
		hint: i18n("MonksLittleDetails.token-combat-animation.hint"),
		scope: "world",
		default: 'clockwise',
		type: String,
		choices: animation,
		config: true
	});

	//Added Features
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

	game.settings.register(modulename, "movement-key", {
		name: i18n("MonksLittleDetails.movement-key.name"),
		hint: i18n("MonksLittleDetails.movement-key.hint"),
		scope: "world",
		config: true,
		default: "m",
		type: String,
	});
	game.settings.register(modulename, "find-my-token", {
		name: i18n("MonksLittleDetails.find-my-token.name"),
		hint: i18n("MonksLittleDetails.find-my-token.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "show-notify", {
		name: i18n("MonksLittleDetails.show-notify.name"),
		hint: i18n("MonksLittleDetails.show-notify.hint"),
		scope: "client",
		config: true,
		default: true,
		type: Boolean,
	});
	game.settings.register(modulename, "move-pause", {
		name: i18n("MonksLittleDetails.move-pause.name"),
		hint: i18n("MonksLittleDetails.move-pause.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	game.settings.register(modulename, "reposition-collapse", {
		name: i18n("MonksLittleDetails.reposition-collapse.name"),
		hint: i18n("MonksLittleDetails.reposition-collapse.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "show-bloodsplat", {
		name: i18n("MonksLittleDetails.show-bloodsplat.name"),
		hint: i18n("MonksLittleDetails.show-bloodsplat.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "bloodsplat-colour", {
		name: i18n("MonksLittleDetails.bloodsplat-colour.name"),
		scope: "world",
		config: true,
		default: '#FF0000',
		type: String,
		onChange: debouncedReload
	});
	game.settings.register(modulename, "key-swap-tool", {
		name: i18n("MonksLittleDetails.key-swap-tool.name"),
		hint: i18n("MonksLittleDetails.key-swap-tool.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean,
	});
	if (game.modules.get('lib-df-hotkeys')?.active) {
		game.settings.registerMenu(modulename, 'hot-keys', {
			name: 'Change Hotkeys',
			label: 'Change Hotkeys',
			hint: 'Change the hotkeys that this module uses',
			icon: 'fas fa-keyboard',
			restricted: true,
			type: Hotkeys.createConfig('Monks Little Details', ['monks-little-details'])
		});
	}

	game.settings.register(modulename, "latest-version", {
		scope: "world",
		config: false,
		default: 0,
		type: Number,
	});
};
