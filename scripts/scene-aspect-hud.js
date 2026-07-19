export class SceneAspectHUD {

  static element = null;

  static render() {

    this.destroy();

    const gameAspects = game.fateTools.AspectManager.getGameAspects();
    const sceneAspects = game.fateTools.AspectManager.getSituationAspects();
    const countdowns = game.settings.get("fate-core-official", "countdowns") ?? {};

    const div = document.createElement("div");

    div.id = "fate-tools-scene-hud";

    div.innerHTML = `
        ${ this._renderAspectSection("Game Aspects", "game", gameAspects) }
        ${ this._renderAspectSection("Scene Aspects", "scene", sceneAspects) }
        ${ this._renderCountdownSection(countdowns) }

    `;

div.querySelectorAll(".fate-tools-countdown-box").forEach(box => {

  box.addEventListener(
    "click",
    async event => {

      const id =
        event.currentTarget.dataset.id;

      const index =
        Number(
          event.currentTarget.dataset.index
        );

      const countdowns =
        foundry.utils.deepClone(
          game.settings.get(
            "fate-core-official",
            "countdowns"
          )
        );

      const countdown =
        countdowns[id];

      if (
        !countdown ||
        !Array.isArray(
          countdown.boxes
        )
      ) {
        console.error(
          "Invalid countdown",
          { id, countdown }
        );
        return;
      }

      countdown.boxes[index] =
        !countdown.boxes[index];

      await game.settings.set(
        "fate-core-official",
        "countdowns",
        countdowns
      );

      Hooks.callAll(
        "fateToolsInvokesChanged"
      );

    }
  );

});

    console.log(div.innerHTML);

    document.body.appendChild(div);
  
    const newGameAspectButton = document.querySelector("#fate-tools-new-game-aspect");
    newGameAspectButton.addEventListener("click", async event => { this.newAspect("game"); });
    const newSceneAspectButton = document.querySelector("#fate-tools-new-scene-aspect");
    newSceneAspectButton.addEventListener("click", async event => { this.newAspect("scene"); });
    const players = document.querySelector("#players");
    const bottomOffset = players?players.offsetHeight + 10 : 10;
    div.style.bottom = `${bottomOffset}px`;
    this.element = div;
  }

  static _renderAspectSection(title, type, aspects) {
    return `
      <div class="ft-hud-section">
        <div class="ft-scene-hud-header">
          ${title}
          ${this._renderNewAspectButton(type)}
        </div>
        ${this._renderAspects(aspects)}
      </div>
    `
  }

  static _renderNewAspectButton(type) {
    if (!game.user.isGM) { return ""; }
    return `<button id="fate-tools-new-${type}-aspect" class="fate-tools-new-button">+ New</button>`
  }

  static _renderAspects(aspects) {
    return `${aspects.map(a => `
      <div class="ft-aspect-row">
        <span>
          ${a.name}
        </span>
        <span class="ft-invoke-badge">
          ${a.invokes}
        </span>
      </div>
    `).join("")} `  
  }

  static _renderCountdownSection(countdowns) {
    return `
      <div class="ft-hud-section">
        <div class="ft-scene-hud-header">
          Countdowns
        </div>
      ${ this._drawCountdownBoxes(countdowns) }
      </div>
    `
  }

  static destroy() {
    this.element?.remove();
    this.element = null;
  }

  static getCountdowns() {
    const countdowns = game.settings.get("fate-core-official", "countdowns");
    if (!countdowns) { return []; }
    return Object.values(countdowns);
  }

  static _drawCountdownBoxes(countdowns) {
    const boxes = Object.entries(countdowns).map(([id, cd]) => {
    const name = cd.name.replace(/<[^>]*>/g, "");
    const boxHtml =
      `<div class="fate-tools-countdown-track">` +
      cd.boxes
        .map((v, i) => `
          <div
            class="fate-tools-countdown-box ${v ? "filled" : ""}"
            data-id="${id}"
            data-index="${i}"
          ></div>
        `)
        .join("")
      + `</div>`;

    return `
      <div class="fate-tools-countdown-container">
        <div class="fate-tools-countdown-title ft-aspect-row">${name}</div>
        <div >${boxHtml}</div>
      </div>
    `;
  }).join("");

  return boxes;

  }

  static async newAspect(aspect_type) {

    let type_title = ""

    if (aspect_type === "game") { type_title = "Game"; }
    else if (aspect_type === "scene") { type_title = "Scene"; }
    else { return; }

    new Dialog({
      title: `New ${type_title} Aspect`,
      content: `
        <input id="new-aspect-name" type="text">
      `,
      buttons: {
        create: {
          label: "Create",
          callback: async html => { 
          
            const name = html.find("#new-aspect-name").val().trim();

          await this.create_new_aspect(aspect_type, name) }
        },
        close: {
          label: "Close"
        },
        
      },
      default: "create",
      create: () => { }
    }).render(true);
  }

  static async create_new_aspect(aspect_type, name, invokes=0) {
    if (!name) { return; }

    if (aspect_type === "game") {
      const aspects = await game.settings.get("fate-core-official", "gameAspects");
      aspects.push({
        name: name,
        free_invokes: invokes,
        notes: ""
      });
      await game.settings.set("fate-core-official", "gameAspects", aspects);
    }
    else if (aspect_type === "scene") {
      const aspects = await canvas.scene.getFlag("fate-core-official", "situation_aspects");
      aspects.push({
        name: name,
        free_invokes: invokes
      })
      await canvas.scene.setFlag("fate-core-official", "situation_aspects", aspects)
    }
    else {
      return;
    }

    Hooks.callAll("fateToolsInvokesChanged");

  }
}