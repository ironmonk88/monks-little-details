# Monk's Little Details
A bunch of quality of life improvements to make your games run smoother.

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

### Altered Status Effects
I can never remember what the icons stand for.  I'm displaying the names beside the icons aswell as sorting the statuses alphabetically.  Makes finding them a lot easier.  Also added a clear all button in case you want to get rid of all the statuses quickly.  And I've highlighted each item in bold orange so it's easier at a glance to see what's been selected.  And added some more of the standard statuses you might encounter in a 5e game.  You can also sort the statuses in rows or columns.

![monks-little-details](/screenshots/TokenHUDUpdates.webp)

### Swapped Token HUD buttons
I personally like the setup button below the target button, it makes more sense to me to be ordered that way.

### Changed the invisible image
Changed the invisible icon from the standard Masked Man image to one that more closely resembles a 5e graphic.

### Dominant Scene Colours
Added the top 5 dominant colours of a scene so that you can choose a background colour that blends with the scene a bit better.
![monks-little-details](/screenshots/BackgroundPalette.webp)

### GM Move characters
If you select characters, hold down the M Key and clicking on another map location, or holding down the M key and dragging the tokens will instantly move them there.  I found dragging them there has unfortunate side effects of showing spaces they shouldn't see while they're moving.  Teleporting them there preserves the fog of war between the two spots.  Handy for when you're using a map that has multiple levels on one image.  You can teleport from one area to the other quickly.
As of v9, editing the key that you use for movement has been moved from Monk's Little Details settings to the Core, Configure Controls settings.

### Swap tools by holding down a key
Monks Little Details will let you briefly activate another tool by holding down a key.  Pressing Shift+key will change the tool.  This allows you to switch briefly to other layers such as the Tiles layer to update a tile to visible before releasing the key and switching back to whatever layer you were on before. 
As of v9, editing the key that you use has been moved from Monk's Little Details settings to the Core, Configure Controls settings.

## Where have my features gone?
Monk's Little details used to do a lot of things and it got a bit out of control with the features that were added.

The module shas been split into multiple additional modules that are each responsible for a distinct feature originally provided by Little Details.

### Actor Sounds
Actor sounds have moved to Monk's Sound Enhancements.

### Bloodsplats
Bloodsplats have been moved to their own module, Monk's Bloodsplats

### Chat Timer
Chat Timer has moved to its own modules, Monk's Chat Timer

### Combat Tracker
The combat image displayed when a token has its turn has moved to Monk's Combat Marker.

### Combat Details
Any of the features that revolved around automating combat has been moved to Monk's Combat Details

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
