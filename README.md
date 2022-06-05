# Monk's Little Details
Add-On Module for Foundry VTT
It's just a bunch of little things to make the program run a little smoother and look a little better.  But a lot are based on personal preference.

## Installation
Simply use the install module screen within the FoundryVTT setup

## Usage & Current Features

### Core Css Changes
The images displayed for the filepicker and compendiums crops the image if it's not square, due to the object-fit being set to cover.  I think it looks a bit better as contain instead. 

Before

![monks-little-details](/screenshots/CoreCssBefore.webp)

After

![monks-little-details](/screenshots/CoreCssAfter.webp)

I also changed the scene compendium items to more closely match the styling used on the scene tab.  The wider image gives you a better idea of what you're seeing.

Scene Compendium

![monks-little-details](/screenshots/SceneCompendium.webp)

Scene Navigation changes

### Turn notifications
Added turn notification for the player.  During combat the player will receive an alert notification when their turn is up next, and another one when it's their turn to move.  Either message or accompanying sound effects can be toggled.

### Combat Encounter Automation
When a combat is started, it will popout the Encounter Dialog and switch to the Chat Tab.

The popup will also close when the encounter has been finished.

1.0.15 When creating an encounter, enemy tokens are kept hidden from players until the combat is started, thereby giving the GM a chance to hide the tokens.

1.0.16 Automatically sets the defeated status when an NPC token reaches 0 HP.

1.0.17 Reveal initiative when changing a token from invisible to visible.

### Show Combat CR
Display the calculated CR of the Encounter.  This should give you a clue if the encounter might be scaled too hard for the current party.  Not 100% accurate but enough for a good idea.

![monks-little-details](/screenshots/ShowCombatCR.webp)

### Combat tracker 1.0.14
Display an animated disc behind the token that currently has a turn in the encounter.

### Altered Status Effects
I can never remember what the icons stand for.  I'm displaying the names beside the icons aswell as sorting the statuses alphabetically.  Makes finding them a lot easier.  Also added a clear all button in case you want to get rid of all the statuses quickly.  And I've highlighted each item in bold orange so it's easier at a glance to see what's been selected.  And added some more of the standard statuses you might encounter in a 5e game.

![monks-little-details](/screenshots/TokenHUDUpdates.webp)

### Swapped Token HUD buttons
I personally like the setup button below the target button, it makes more sense to me to be ordered that way.

### Changed the invisible image
Changed the invisible icon from the standard Masked Man image to one that more closely resembles a 5e graphic.

### Dominant Scene Colours
Added the top 5 dominant colours of a scene so that you can choose a background colour that blends with the scene a bit better.
![monks-little-details](/screenshots/BackgroundPalette.webp)

### Drag wall points together
~~Added a toggle to the wall tools.  When selected, dragging a wall point to a new location will also move any other wall points that exactly overlapped the first one.  So instead of having to move both wall points to the new location it will maintain the connection between wall joints and move the second one after the first has been moved.  Saves me some time when editing lengths of wall.~~
Dragging Wall points together has moved to the module Monk's Wall Enhancement.  There were a handful of other wall improvements and it made sense to bundle them all together.

### Character Sound Effects
Added a button to load a sound file to associate with a character.  So if you ever wanted to make a dragon roar, or a banshee howl, you can upload the file, attach it to the character and play from the Token HUD.  From the character sheet, a button with a speaker icon should now be visible.  Clicking that will open a dialog window that will allow you to select a file, adjust the volume and preview the sound effect.  And orange border will denote that I file has been loaded.
![monks-little-details](/screenshots/AddSound.webp)

While playing, bringing up the Token HUD will show a speaker button under the combat button.  Clicking on the speaker button will play the sound effect using the current volume settings for Foundry.
![monks-little-details](/screenshots/PlaySound.webp)

You can change what character sheets this button is available for in the settings.  Current options are, `none` to leave the setting off, `everyone` to turn it on all character sheets, and `NPC` to have it only available for NPC character sheets.

### GM Move characters
If you select characters, hold down the M Key and clicking on another map location, or holding down the M key and dragging the tokens will instantly move them there.  I found dragging them there has unfortunate side effects of showing spaces they shouldn't see while they're moving.  Teleporting them there preserves the fog of war between the two spots.  Handy for when you're using a map that has multiple levels on one image.  You can teleport from one area to the other quickly.
As of v9, editing the key that you use for movement has been moved from Monk's Little Details settings to the Core, Configure Controls settings.

### BloodSplats
When an Monster is killed, show it as a blood splat rather than the icon.  I find this eliminates a bit of clutter on the screen and makes it easier to see what's going on.  Player characters still show with the skull.

### Swap tools by holding down a key
New to 1.0.17 Monks Little Details will let you briefly activate another tool by holding down a key.  Pressing Shift+key will change the tool.  This allows you to switch briefly to other layers such as the Tiles layer to update a tile to visible before releasing the key and switching back to whatever layer you were on before.  ~~Requries the module Library: DF Hotkeys to be installed to work.~~
As of v9, editing the key that you use has been moved from Monk's Little Details settings to the Core, Configure Controls settings.

### Timer
If you have the module Library: Chat Commands installed you can use /timer as a chat command.  This will produce a count down timer.  `/timer 5` will add a timer that counts up 5 seconds.  `/timer -5` will count down 5 seconds.  `/timer 5:00 Send this message to the timer (Send this message after the timer is finished)` will add a timer that counts up 5 minutes and displays the first message to the chat message with the timer.  And once the timer it complete it will send a second chat message with the second message that's in parenthesis.

## Bug Reporting
I'm sure there are lots of issues with it.  It's very much a work in progress.
Please feel free to contact me on discord if you have any questions or concerns. ironmonk88#4075

## Support

If you feel like being generous, stop by my <a href="https://www.patreon.com/ironmonk">patreon</a>.

Or [![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/R6R7BH5MT)

Not necessary but definitely appreciated.

## License
This Foundry VTT module, writen by Ironmonk, is licensed under [GNU GPLv3.0](https://www.gnu.org/licenses/gpl-3.0.en.html), supplemented by [Commons Clause](https://commonsclause.com/).

This work is licensed under Foundry Virtual Tabletop <a href="https://foundryvtt.com/article/license/">EULA - Limited License Agreement for module development from May 29, 2020.</a>
