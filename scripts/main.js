import { ZoneDataModel } from "./zone-model.js";
import { ZoneDocument } from "./zone-document.js";
import { ZonePlaceable } from "./zone-placeable.js";
import { ZoneManager } from "./zone-manager.js";
import { ZoneCanvas } from "./zone-canvas.js";
import { ZoneConfig } from "./zone-config.js";
import { AspectManager } from "./aspect-manager.js";
import { ActiveAspects } from "./active-aspects.js";
import { TokenOverlay, TokenOverlayManager } from "./token-overlay.js";
import { SceneAspectHUD } from "./scene-aspect-hud.js";
import { RollManager } from "./roll-manager.js";

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
    ZonePlaceable,
    ZoneManager,
    ZoneCanvas,
    ZoneConfig,
    SceneAspectHUD
  };

  game.fateZones.activeTool = null;

  game.fateTools = {
    AspectManager,
    ActiveAspects,
    TokenOverlay,
    TokenOverlayManager,
    RollManager
  }

  game.fateTools.pendingInvoke = null;

});


Hooks.on(
  "canvasReady",
  async () => {

    await ZoneCanvas.drawAll();
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
      onClick: (active) => {
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

Hooks.on("updateScene", () => {
  ZoneCanvas.drawAll();
  ActiveAspects.refresh()
  game.fateZones.SceneAspectHUD.render();
});

Hooks.on("fateToolsInvokesChanged", () => {
  ZoneCanvas.drawAll();
  ActiveAspects.refresh()
  game.fateZones.SceneAspectHUD.render();
  const FU = foundry.applications.instances.get("FateUtilities");
  if (FU) { FU.render(false); }
});

Hooks.on("renderFateUtilities", () => {
  ZoneCanvas.drawAll();
  ActiveAspects.refresh()
  game.fateZones.SceneAspectHUD.render();
});

Hooks.on("updateSetting", () => {
  ZoneCanvas.drawAll();
  ActiveAspects.refresh()
  game.fateZones.SceneAspectHUD.render();
});

export class FateToolsLayer extends InteractionLayer {

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

Hooks.on("renderChatMessageHTML", (message, html) => {

  if (!message.rolls?.length) return;

  const content =
    html.querySelector(".message-content");

  if (!content) return;

  // --------------------
  // Invoke Button
  // --------------------

  const button =
    document.createElement("button");

  button.className =
    "fate-tools-invoke";

  button.textContent =
    "Invoke";

  button.addEventListener(
    "click",
    async () => {

      game.fateTools.pendingInvoke = {

        messageId: message.id,

        actorId:
          message.speaker.actor,

        tokenId:
          message.speaker.token

      };

      await game.fateTools
        .ActiveAspects
        .show();

    }
  );

  content.appendChild(button);

  // --------------------
  // Invocation History
  // --------------------

  const invokes =
    message.getFlag(
      "fate-tools",
      "invokes"
    ) ?? [];

  if (!invokes.length)
    return;

  const originalTotal =
    message.rolls[0].total;

  let adjustedTotal =
    originalTotal;

  // Use latest reroll as the base result

  const reroll =
    invokes
      .filter(
        i => i.effect === "reroll"
      )
      .at(-1);

  if (reroll) {

    adjustedTotal =
      reroll.rerolled;

  }

  // Apply all +2 invokes

  for (const invoke of invokes) {

    if (invoke.effect === "+2") {

      adjustedTotal += 2;

    }

  }

  const invokeDiv =
    document.createElement("div");

  invokeDiv.className =
    "fate-tools-invokes";

  invokeDiv.innerHTML = `

    <hr>

    <h4>Invocations</h4>

    ${invokes.map(i => {

      if (i.effect === "reroll") {

        return `

          <div>

            ${i.user}
            invoked
            <strong>${i.aspect}</strong>

            (${i.payment}, reroll)

            <strong>
              ${i.original}
              →
              ${i.rerolled}
            </strong>

          </div>

        `;

      }

      return `

        <div>

          ${i.user}
          invoked
          <strong>${i.aspect}</strong>

          (${i.payment}, +2)

        </div>

      `;

    }).join("")}

    <hr>

    <div>

      Original Result:
      <strong>${originalTotal}</strong>

    </div>

    <div>

      Adjusted Total:
      <strong>${adjustedTotal}</strong>

    </div>

  `;

  content.appendChild(
    invokeDiv
  );

});

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

Hooks.on("createChatMessage", async (message) => {
  if (!message.rolls?.length) { return; }

  const rollData = game.fateTools.RollManager.extractRollData(message);
  await message.setFlag("fate-tools", "rollData", rollData);
  console.log("CREATE", message.id)
});

Hooks.on(
  "renderChatMessageHTML",
  (message, html) => {

    if (!message.rolls.length)
      return;

    const rollData =
      message.getFlag(
        "fate-tools",
        "rollData"
      );

    const invokes =
      message.getFlag(
        "fate-tools",
        "invokes"
      ) ?? [];

    if (!rollData)
      return;

    const content =
      html.querySelector(
        ".message-content"
      );

    if (!content)
      return;

    const newHTML =
      game.fateTools.RollManager
        .renderRollCard(
          rollData,
          invokes
        );

    content.innerHTML =
      newHTML;

    const button =
      content.querySelector(
        ".ft-roll-invoke-button"
      );

    if (button) {

      button.addEventListener(
        "click",
        async event => {

          game.fateTools.pendingInvoke = {
            messageId:
              event.currentTarget
                .dataset.messageId,

            actorId:
              event.currentTarget
                .dataset.actorId,

            tokenId:
              event.currentTarget
                .dataset.tokenId
          };

          await game.fateTools
            .ActiveAspects
            .show();

        }
      );

    }
 
  const flavor =
  html.querySelector(
    ".flavor-text"
  );

  flavor?.remove();

  }
);

/* customCard
  .querySelectorAll(
    ".ft-roll-invoke-button"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      async event => {

        const target =
          event.currentTarget;

        game.fateTools.pendingInvoke = {

          messageId:
            target.dataset.messageId,

          actorId:
            target.dataset.actorId,

          tokenId:
            target.dataset.tokenId

        };

        await game.fateTools
          .ActiveAspects
          .show();

      }
    );

  }); */