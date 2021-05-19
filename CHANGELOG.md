# Version 1.0.28
Added option for GM to hear the next round sound

Changed the positioning of the status effects to be consistent with Foundry standards.

Fixed an issue with the bloodsplat causing players to receive an error message

Fixed issue with images not scaling properly in the Windows Foundry Client.

Added option to select sounds with wildcards

# Version 1.0.27
File name accidentally changed to .svg, restored it back to .png

# Version 1.0.26
Fixing a small error when calculating the CR of an encounter

File optimization, Thank you xdy!

# Version 1.0.25
Fixing issues with the combat resource bars.

Adding option to move the pause icon

Adding option to sort token statues by column rather than row.

# Version 1.0.22
Added option to use different setting for resource bars when the token is in combat.  This will also display a see through version of the bar for hover and controlled option until the token is hovered or controlled.  This should make it easier to set the bars to not be seen during regular movement, but have them show once combat starts.

Added interface with DF Library Hotkeys to show hotkey settings just for Monks Little Details.

# Version 1.0.21
Adding option to auto-defeat players aswell as npc's.

Moved the game paused icon up a bit more so that it's obvious the game is paused.  If it's too low down it can be missed.

Added a fixed maximum width to select boxes in a form.  If the text is too big it'll drop to the next line.  Still unsure if this is too big of a change though, not entirely sure of the consequences.  But I find it interesting that the input fields are a fized width, but the select fields are not.

Whenever the turn changes, remove targets if you are the GM.

# Version 1.0.20
Don't mind me, just trying to find a set of keys that aren't used by other things and don't cause issues with Foundry.

# Version 1.0.19
Fixed issue with quick viewing layers, by using Library: DF Hotkeys.  Awesome module by the way.  It's not a requirement for Monks Little Details as it will check to see if you need to to be installed, but will warn you to install it if you want the feature.

# Version 1.0.17
Fixing styling with the token HUD in Pathfinder.

Changing the location of stacked condition indicator in PF2

Adding the option to briefly switch between layers by holding down a key and pressing Shift+key will change the layer.  This should let you switch briefly to another layer such as the Tiles layer to hide or show a tile before releasing the key and going back tot he token layer.  Current keys are assigned as r=tokens, t-tiles, y-lighting, u-sounds, i-terrain (if you have the Terrain Layer module installed)

# Version 1.0.16
Adding option to not highlight the image in the Token HUD.  If the system uses full colour images, then highlighting it just distorts the image.

Updated the background palette so that it only loads after clicking a button.  Saves on refresh speed.

Added context menu to view scene artwork in a compendium.  Always found it difficult to select a map if I wasn't sure what I was looking at.  This should allow you to see the whole map before importing it.

Automatically set the defeated status to an NPC that's in combat and drops to 0 HP.

Allow the monster sound effect to be stopped if you press the speaker a second time while it's playing.

Fixing issues with PF2E styling of Token HUD items.  The stackable items weren't getting the right styles.

# Version 1.0.15
Altered the combat tracker so that enemies aren't visible to players when setting up the combat.

Updated the dominanat colour palette to get colours from animated maps

Added option to set the animation speed of the combat tracking highlight

Added option for combat highlight size

Added option to change combat highlight image

Fixed issue where combat tracking highlight shows on tokens for a combat that hasn't started yet.

Letting PF2 change the invisible man icon

Got the altered Token HUD working in PF2

# Version 1.0.14
Possibly fixed cross origin issues with getting the palette on images from Forge or S3 bucket.

Fixed issue with the next up notification.  Wasn't getting the correct combat to pull information from.

Added indicator to show which token has the current turn in combat

# Version 1.0.12
Added Japanese translations (Thank you touge)

# Version 1.0.11
Adding option to show bloodsplat when character dies.

# Version 1.0.10
Added Combat Rating for Pathfinder

# Version 1.0.9
Adding retain notify options.  If you're not on the chat sidebar the notification will stay there until you go back to the chat bar.

Also adding debug to try and figure out issues with the round notification.

# Version 1.0.7
Added option to change which key moves tokens

Updated the code that moves the characters to move them as a batch, rather than individually

Added the option to prevent tokens being removed from a combat encounter via the token HUD.  They can still be removed from the Encounter Interface.

# Version 1.0.6
Added support to specify what audio file to play for the next, current, and round events.  Leave it blank to not play a sound.

Scene Navigation changes

Fixed an issue with closing the Combat Tracker after the encounter is finished.

# Version 1.0.5
Fixed the conflicts with Token Scaler.  Little Details doesn't exactly play nice, but will resize where it can.

Fixed an issue with the settings not turning off the HUD changes.

Fixed an issue with the CR estimation not working due to vehicles added to the encounter.

# Version 1.0.4
Fixed some issues with the next turn not working

Added setting to disable the turn based sounds

Added feature to attach sound effects to a creature.

# Version 1.0.3
Fixed some issues with Pathfinder

# Version 1.0.2
Initial release
