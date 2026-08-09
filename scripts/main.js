import { ZoneDataModel } from "./zone-model.js";
import { ZoneCardRenderer } from "./zone-placeable.js";
import { ZoneManager } from "./zone-manager.js";
import { ZoneConfig } from "./zone-config.js";
import { AspectManager } from "./aspect-manager.js";
import { ActiveAspects } from "./active-aspects.js";
import { TokenOverlay, TokenOverlayManager } from "./token-overlay.js";
import { SceneAspectHUD } from "./scene-aspect-hud.js";
import { RollManager, ModifyRollDialog } from "./roll-manager.js";

Hooks.once("init", () => {

  console.log(
    "%cFATE TOOLS | Initializing",
    "color: lime; font-weight: bold;"
  );


  CONFIG.Canvas.layers.fateTools = {
    layerClass: FateToolsLayer,
    group: "interface"
  };

  game.fateZones = {
//    ZonePlaceable,
    ZoneManager,
//    ZoneCanvas,
    ZoneConfig,
    SceneAspectHUD,
    ZoneCardRenderer
  };

  game.fateZones.activeTool = null;

  game.fateTools = {
    AspectManager,
    ActiveAspects,
    TokenOverlay,
    TokenOverlayManager,
    RollManager,
    ModifyRollDialog
  }

  game.fateTools.pendingInvoke = null;

  game.settings.register("fate-tools", "sceneHudPosition", {
    name: "Scene HUD Position",
    scope: "client",
    config: false,
    type: Object,
    default: {
      left: 20,
      top: 100
    }
  });

  game.settings.register("fate-tools", "sceneHudSize", {
    name: "Scene HUD Size",
    scope: "client",
    config: false,
    type: Object,
    default: {
      width: 350,
      height: 450
    }
  });

});

Hooks.on(
  "canvasReady",
  async () => {

    await ZoneManager.renderAll();
    await game.fateZones.SceneAspectHUD.render();

  }
);

Hooks.on(
  "getSceneControlButtons",
  (controls) => {

    const tokenControls =
      controls.tokens;

    if (!tokenControls) return;
    
    tokenControls.tools.showAspectManager = {
      name: "showAspectManager",
      title: "Show Aspect Manager",
      icon: "fa-solid fa-tags",
      button: true,
      visible: true,
      onChange: (active) => {
        game.fateTools.pendingInvoke = null; game.fateTools.ActiveAspects.show();
      }
    }

    // Non-GMs never get these tool(s).
    if (!game.user.isGM) return;

    tokenControls.tools.createZone = {
      name: "createZone",
      title: "Create Zone",
      icon: "fas fa-draw-polygon",
      visible: true,
      toggle: true,
      active: false,
      onChange: (active) => {
        game.fateZones.activeTool =
          active ? "createZone" : null;
      }
    };

  }
);

/*Hooks.once("ready", () => {
  canvas.stage.on("pointerdown", async event => {
    if (!game.user.isGM) return;
    if (game.fateZones.activeTool !== "createZone") return;

    const pos = event.data.getLocalPosition(canvas.stage);
    console.log("Mousedown.")
    await game.fateZones.ZoneManager.createDefaultZone(
      pos.x,
      pos.y
    );

    game.fateZones.activeTool = null;
  });
});*/

Hooks.on("canvasReady", () => {
  canvas.stage.on("pointerdown", onCanvasPointerDown);
});

async function onCanvasPointerDown(event) {
  if (!game.user.isGM) return;
  if (game.fateZones.activeTool !== "createZone") return;

  const pos = event.data.getLocalPosition(canvas.stage);

  console.log("Mousedown.");

  await game.fateZones.ZoneManager.createDefaultZone(
    pos.x,
    pos.y
  );

  game.fateZones.activeTool = null;
}

Hooks.on("updateScene", () => {
  console.log("updateScene");
  ZoneManager.renderAll();
  ActiveAspects.refresh();
  game.fateZones.SceneAspectHUD.render();
});

Hooks.on("fateToolsInvokesChanged", () => {
  ZoneManager.renderAll();
  ActiveAspects.refresh();
  game.fateZones.SceneAspectHUD.render();
  const FU = foundry.applications.instances.get("FateUtilities");
  if (FU) { FU.render(false); }
});

Hooks.on("renderFateUtilities", () => {
  ZoneManager.renderAll();
  ActiveAspects.refresh();
  game.fateZones.SceneAspectHUD.render();
});

Hooks.on("updateSetting", () => {
  ZoneManager.renderAll();
  ActiveAspects.refresh();
  game.fateZones.SceneAspectHUD.render();
});

export class FateToolsLayer extends foundry.canvas.layers.InteractionLayer {

  static get layerOptions() {
    return foundry.utils.mergeObject(
      super.layerOptions,
      {
        name: "fateTools",
        zIndex: 160
      }
    );
  }

  async _draw() {

    await super._draw();

    this.eventMode = "static";
    this.interactiveChildren = true;

  }

}

Hooks.on("createChatMessage", async (message) => {
  if (!message.rolls?.length) { return; }

  if (!game.user.isGM) { return; }

  const rollData = game.fateTools.RollManager.extractRollData(message);
  await message.setFlag("fate-tools", "rollData", rollData);
});

Hooks.on("renderChatMessageHTML", (message, html) => {
  if (!message.rolls.length) { return; }

  const rollData = message.getFlag("fate-tools", "rollData");
  const invokes = message.getFlag("fate-tools", "invokes") ?? [];

  if (!rollData) { return; }

  const content = html.querySelector(".message-content");

  if (!content) { return; }

  const newHTML = game.fateTools.RollManager.renderRollCard(rollData, invokes);

  content.innerHTML = newHTML;

  const button = content.querySelector(".ft-roll-card-invoke-button");

  if (button) {
    button.addEventListener("click", async event => {
      const actorId = message.speaker.actor;
      const actor = game.actors.get(actorId);

      const canObserve = actor && (game.user.isGM || actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER));  

      if (!canObserve) {
        ui.notifications.error("You do not have permissions for this actor.");
        return;
      }

      game.fateTools.pendingInvoke = {
        messageId: event.currentTarget.dataset.messageId,
        actorId: event.currentTarget.dataset.actorId,
        tokenId: event.currentTarget.dataset.tokenId
      };

      await game.fateTools.ActiveAspects.show();
      }
    );
  }

  const modifyButton = content.querySelector(".ft-roll-card-modify-button");
  if (modifyButton) {
    modifyButton.addEventListener("click", async event => {
      const messageId = event.currentTarget.dataset.messageId;
      new game.fateTools.ModifyRollDialog(messageId).render(true);
    });
  }
 
  const flavor = html.querySelector(".flavor-text");
  flavor?.remove();
  }
);

Hooks.on("updateActor", (actor) => {
  game.fateTools.TokenOverlayManager.drawAll();
})

Hooks.on("updateToken", (document) => {
  game.fateTools.TokenOverlayManager.drawAll();
});

Hooks.on("refreshToken", token => {
  game.fateTools.TokenOverlayManager.drawAll();
});

Hooks.on("hoverToken", (token, hover) => {
  game.fateTools.TokenOverlayManager.drawAll();
});

Hooks.on("renderEditEntityTrack", (app, html) => {

  injectTrackColorPicker(app, html, "#edit_entity_track_boxes");

});

Hooks.on("renderEditTracks", (app, html) => {
  injectTrackColorPicker(app, html, "#edit_track_boxes");
});

Hooks.once("ready", () => {

  const originalSave = EditTracks.prototype._onSaveTrackButton;

  EditTracks.prototype._onSaveTrackButton = async function(event) {
    saveTrackColor(this.track, this.element);
    return originalSave.call(this, event);
  };

  const entityOriginalSave = EditEntityTrack.prototype._onSaveTrackButton;

  EditEntityTrack.prototype._onSaveTrackButton = async function(event) {
    saveTrackColor(this.track, this.element);
    return entityOriginalSave.call(this, event);  
  };

});

function injectTrackColorPicker(app, html, inputId) {
  const boxesInput = html.querySelector(inputId);

  if (!boxesInput) return;

  const row = boxesInput.closest("tr");

  if (!row) return;

  const color = app.track?.["fate-tools"]?.color??"#cccccc";

  const colorRow = document.createElement("tr");

  colorRow.style.backgroundColor = "transparent";

  colorRow.innerHTML = `
    <td>
      Track Color
    </td>

    <td>
      <input
        type="color"
        id="ft-track-color"
        value="${color}"
      >
    </td>
  `;

  row.insertAdjacentElement(
    "afterend",
    colorRow
  ); 
}

function saveTrackColor(track, element) {
  const color = element.querySelector("#ft-track-color")?.value;
  if (!color) return;
  track["fate-tools"] ??= {};
  track["fate-tools"].color = color;
}

Hooks.on("renderActorSheetV2", (app, html) => {
  const extras = html.querySelector(".mfate-extras");
  const stuntsPanel = html.querySelector(".mfate-panel--stunts");

  if (extras && stuntsPanel) {
    stuntsPanel.insertAdjacentElement("afterend", extras);
  }
});