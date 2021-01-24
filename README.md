# Monks Little Details
It's just a bunch of little things to make the program run a little smoother and look a little better.  But a lot are based on personal preference.

## Core Css Changes
The images displayed for the filepicker and compendiums crops the image if it's not square, due to the object-fit being set to cover.  I think it looks a but better as contain instead.  I also changed the scene compendium items to more closely match the styling used on the scene tab.  The wider image gives you a better idea of what you're seeing.  I found the core sytling a bit cramped.

## Turn notifications
Added notifications for the player when their turn is up next, or when it's switched to their turn.  Either message is optional, and so are the sound effects that go with it.

## Combat Encounter
When a combat is started, it will popout the Encounter Dialog and switch to the Chat Tab.  I find this is something I always do and automating it just makes life easier.  The popup will also close when the encounter has been finished.

## Show Combat CR
Display the calculated CR of the Encounter.  This should give you a clue if the encounter might be scaled too hard for the current party.  Not 100% accurate but enouhg for a good idea.

## Altered Status Effects
I can never remember what the icons stand for.  I'm displaying the names beside the icons aswell as sorting the statuses alphabetically.  Makes finding them a lot easier.  Also added a clear all button in case you want to get rid of all the statuses quickly.  And I've highlighted each item in bold orange so it's easier at a glance to see what's been selected.  And added some more of the standard statuses you might encounter in a 5e game.

## Swapped Token HUD buttons
I personally like the setup button below the target button, it makes more sense to me to be ordered that way.

## Changed the invisible image
Changed the invisible ivcon from the standard Masked Man image to one that more closely resembles a 5e graphic.

## Dominant Scene Colours
Added the top 5 dominant colours of a scene so that you can choose a background colour that blends with the scene a bit better.

## Drag wall points together
Added a toggle to the wall tools.  When selected, dragging a wall point to a new location will also move any other wall points that exactly overlapped the first one.  So instead of having to move both wall points to the new location it will maintain the connection between wall joints and move the second one after the first has been moved.  SAves me some time when editing lengths of wall.

## GM Move characters
If you select characters, hold down the M Key and click on another map location, the tokens will instantly move there.  I found dragging them there has unfortunate side effects of showing spaces they shouldn't see while they're moving.  Teleporting them there preserves the fog of war between the two spots.

