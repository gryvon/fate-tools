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
    ZoneConfig
  };

  game.fateZones.activeTool = null;

  game.fateTools = {
    AspectManager,
    ActiveAspects
  }

  game.fateTools.pendingInvoke = null;

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


Hooks.on(
  "fateToolsInvokesChanged",
  () => {

    game.fateZones
      ?.ZoneCanvas
      ?.redrawAllZones?.();

  }
);

Hooks.on(
  "updateScene",
  (data) => {
    ZoneCanvas.drawAll();

    ActiveAspects.refresh();

  }
);


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

/* Hooks.on(
  "renderChatMessage",
  (message, html) => {

    if (!message.rolls?.length)
      return;

    const button = $(`
      <button
        class="fate-tools-invoke"
      >
        Invoke
      </button>
    `);

    button.click(async () => {

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

    });

    html.find(".message-content")
      .append(button);

  }
); */