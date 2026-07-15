import { ZoneDataModel } from "./zone-model.js";
import { ZoneDocument } from "./zone-document.js";
import { ZonePlaceable } from "./zone-placeable.js";
import { ZoneManager } from "./zone-manager.js";
import { ZoneCanvas } from "./zone-canvas.js";
import { ZoneConfig } from "./zone-config.js";
import { AspectManager } from "./aspect-manager.js";
import { ActiveAspects } from "./active-aspects.js";

Hooks.once("init", () => {

  console.log(
    "%cZONE STRESS | Initializing",
    "color: lime; font-weight: bold;"
  );

  game.fateZones = {
    ZonePlaceable,
    ZoneManager,
    ZoneCanvas,
    ZoneConfig
  };

  game.fateZones.activeTool = null;

  game.fateTools = {
    AspectManager,
    ActiveAspects
  }

});


Hooks.on(
  "canvasReady",
  async () => {

    await ZoneCanvas.drawAll();

  }
);

Hooks.on(
  "getSceneControlButtons",
  (controls) => {

    // Non-GMs never get the tool.
    if (!game.user.isGM) return;

    const tokenControls =
      controls.tokens;

    if (!tokenControls) return;

    tokenControls.tools.createZone = {

      name: "createZone",

      title: "Create Zone",

      icon: "fas fa-draw-polygon",

      visible: true,

      toggle: true,

      active: false,

      onClick: (active) => {

        game.fateZones.activeTool =
          active ? "createZone" : null;

      }

    };

  }
);

Hooks.on(
  "canvasReady",
  () => {

    canvas.stage.on(
      "pointerdown",
      async (event) => {

        if (!game.user.isGM)
          return;

        if (
          game.fateZones.activeTool !==
          "createZone"
        ) return;

        const pos =
          event.data.getLocalPosition(
            canvas.stage
          );

        await game.fateZones
          .ZoneManager
          .createDefaultZone(
            pos.x,
            pos.y
          );

        game.fateZones.activeTool = null;

        // Switch back to Select
        ui.controls.control.tools.createZone.active = false;
        ui.controls.control.tools.select.active = true;

        ui.controls.render();

      }
    );

  }
);

