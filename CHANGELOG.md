# Changelog

## v0.8.11

### Fixed
 - Fixed issue with Fate Zones not propogating as expected after scene switches.
 - Fixed issue with modify button sometimes not working after zone overlay being moved.

## v0.8.10

### Improvements
 - Invokes can now only be called by a token observer or owner.
 - Added ToolTips to Active Aspects control buttons.

## v0.8.9

### Added
 - Descriptions in Zone Overlays.
 - Automatically move "Extras" from the Biography tab to the Main tab, *where it should be!*
 - Actors now have temporary aspects or "tags" available in the Active Aspects.
 - Handy + New and delete buttons are available to the GM in Active Aspects.

### Improvements
 - Converted Zone Config Dialog to ApplicationV2.
 - Improved aesthetic of Zone Config Dialog.
 - Changed all onClick to onChange for future v15 compliance.
 - Removed some dead code.
 - Scene HUD is now draggable and resizable.

 ### Fixed
 - Fixed bug that caused invoke buttons on the Active Aspects window to disappear.
 - Fixed bug that causes a permission error to appear on other player's clients when a user makes a roll.

## v0.8.0

### Added
 - Added GM Free Invoke System.
 - New Countdown Timer in Scene HUD.

### Improvements
 - Fixed and added some CSS for some added polish.

### Fixed
 - Fixed bug with chat card roll total.
 - Token HUD now matches stress boxes when linked skill increases the track length.
 - Stress Tracks now have customizable colors.

## v0.7.8

### Improved
 - Added "hover" effect to aspect rows to improve readability.
 - Greatly improved aesthetics of the Scene HUD.
 - Removed + & - free invoke buttons from Active Aspects for non-GMs.
 - Converted "New Game/Scene Aspect" window to V2 Application.
 - Can now add custom modifiers to the chat card.

### Fixed
 - Fixed bug that was turning Fate Utilities' Situation Tab Green.

## v0.7.5

### Added
- Custom FateTools roll card replacement.
- Fate dice visualization.
- Roll metadata extraction and storage.
- Stunt tracking on roll cards.
- Invoke tracking on roll cards.
- Reroll tracking with dice display.
- Dynamic total calculation.
- Ladder result display.
- Invoke integration from roll cards.
- Dice So Nice support for rerolls.

### Improved
- Replaced Fate Core Official roll card interface with FateTools roll cards.

## v0.7.1

### Improved
- Active Aspects migrated to Foundry VTT's ApplicationV2 framework.
- Active Aspects redesigned with a card-based interface.
- Added color-coded cards for Game, Scene, Zone, Player Character, and NPC sources.
- Improved readability and organization of Active Aspects.
- Added automatic scrolling support for large numbers of aspects.
- Added sorting of aspect groups by source type.
- Refactored Active Aspects rendering into smaller, maintainable components.

## v0.7.0

### Added

- Scene Aspect HUD
- Game Aspect integration
- Situation Aspect integration
- Countdown Track HUD
- Canvas creation of Game Aspects
- Canvas creation of Scene Aspects
- Countdown interaction from the HUD

### Improved

- Active Aspects integration
- Fate Utilities synchronization

## v0.6.2

### Added

- Countdown Track display
- Countdown interaction

## v0.6.0

### Added

- Token Overlay HUD
- Stress display
- Consequence display
- Clickable stress boxes
- Hover/selected token visibility

## v0.5.0

### Added

- Invoke workflow
- Free Invoke support
- Fate Point spending
- GM Fate Point spending
- Reroll invokes
- Invocation history

