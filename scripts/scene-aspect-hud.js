export class NewCountdownDialog extends foundry.applications.api.ApplicationV2
{
  constructor() {
    super();
  }

  static DEFAULT_OPTIONS = {
    id: "ft-new-countdown-dialog",
    tag: "section",
    window: {
      title: "New Countdown"
    },
    position: {
      width: 350,
      height: "auto",
    }
  };

  async _renderHTML() {
    return `
      <div class="ft-new-countdown">
        <label>
          Countdown Name
        </label>
        <input type="text" name="countdown-name">
        <label>
          Countdown Boxes
        </label>
        <input type="number" value="3" name="countdown-boxes">
        <div class="ft-new-countdown-buttons">
          <button type="button" class="ft-new-countdown-create-countdown">
            Create
          </button>
        </div>
      </div>
    `
  }

  async _replaceHTML(result, element) {
    element.innerHTML = result;

    element.querySelector(".ft-new-countdown-create-countdown")?.addEventListener("click", async () => {
      const name = element.querySelector('[name="countdown-name"]')?.value?.trim();
      const boxes = Number(element.querySelector('[name="countdown-boxes"]')?.value);

      if (!name) { return; }
      await SceneAspectHUD.create_new_countdown(name, boxes);

      await this.close();
    });
  }
}

export class NewAspectDialog extends foundry.applications.api.ApplicationV2
{

  constructor(aspectType) {
    super();
    this.aspectType = aspectType;
    if (aspectType === "game") { this.type_title = "Game"; }
    if (aspectType === "scene") { this.type_title = "Scene"; }
    this.options.window.title = `New ${this.type_title} Aspect`;
    this.promise = new Promise(resolve => { this._resolve = resolve; });
  }

  static DEFAULT_OPTIONS = {
    id: "ft-new-aspect-dialog",
    tag: "section",
    window: {
      title: `New Aspect`
    },
    position: {
      width: 350,
      height: "auto"
    }
  };

  get result() {
    return this.promise;
  }

  async _renderHTML() {
    let type_title = ""

    return `
      <div class="ft-new-aspect">
        <label>
          Aspect Name
        </label>
        <input type="text" name="aspect-name"/>
        <div class="ft-new-aspect-buttons">
          <button type="button" class="ft-new-aspect-create-aspect">
            Create
          </button>
        </div>
      </div>
    `;
  }


  async _replaceHTML(result, element) {

    element.innerHTML = result;

    element.querySelector(".ft-new-aspect-create-aspect ")?.addEventListener("click", async () => {
      const name = element.querySelector('[name="aspect-name"]')?.value?.trim();
      if (!name) { return; }
      await SceneAspectHUD.create_new_aspect(this.aspectType, name);
      this._resolve(name);
      await this.close();
    });
  }
}

export class SceneAspectHUD {

  static element = null;

  static render() {

    this.destroy();

    const gameAspects = game.fateTools.AspectManager.getGameAspects();
    const sceneAspects = game.fateTools.AspectManager.getSituationAspects();
    const countdowns = game.settings.get("fate-core-official", "countdowns") ?? {};

    const div = document.createElement("div");

    div.id = "ft-scene-hud";

    div.innerHTML = `
      <div class="ft-scene-hud-content">
        ${ this._renderAspectSection("Game Aspects", "game", gameAspects) }
        ${ this._renderAspectSection("Scene Aspects", "scene", sceneAspects) }
        ${ this._renderCountdownSection(countdowns) }
      </div>

      <div class="ft-scene-hud-resizer"></div>
    `;

    div.querySelectorAll(".ft-scene-hud-countdown-box").forEach(box => {
      box.addEventListener("click", async event => {
          const id = event.currentTarget.dataset.id;
          const index = Number(event.currentTarget.dataset.index);
          const countdowns = foundry.utils.deepClone(game.settings.get("fate-core-official", "countdowns"));
          const countdown = countdowns[id];
          if (!countdown || !Array.isArray(countdown.boxes)) {
            console.error("Invalid countdown", { id, countdown });
            return;
          }
          countdown.boxes[index] = !countdown.boxes[index];
          await game.settings.set("fate-core-official", "countdowns", countdowns);
          Hooks.callAll("fateToolsInvokesChanged");
        }
      );
    });

    document.body.appendChild(div);
    this._makeDraggable(div);
    this._makeResizable(div);

    if (game.user.isGM) {
      const newGameAspectButton = document.querySelector("#ft-new-game-aspect");
      newGameAspectButton?.addEventListener("click", async event => { this.newAspect("game"); });
      const newSceneAspectButton = document.querySelector("#ft-new-scene-aspect");
      newSceneAspectButton?.addEventListener("click", async event => { this.newAspect("scene"); });    
      const newCountdownButton = div.querySelector("#ft-new-countdown");
      newCountdownButton?.addEventListener("click", () => this.newCountdown());
    }
    const players = document.querySelector("#players");
    const bottomOffset = players?players.offsetHeight + 10 : 10;
    div.style.position = "fixed";
    const pos = game.settings.get("fate-tools", "sceneHudPosition");
    const size = game.settings.get("fate-tools", "sceneHudSize");
    div.style.left = `${pos.left}px`;
    div.style.top = `${pos.top}px`;
    div.style.width = `${size.width}px`;
    div.style.height = `${size.height}px`;
    this.element = div;
  }

  static async newCountdown() {
    new NewCountdownDialog().render(true);
  }

  static _renderAspectSection(title, type, aspects) {
    return `
      <div class="ft-hud-section">
        <div class="ft-scene-hud-header">
          <span class="ft-scene-title">${title}</span>
          <span>${this._renderNewAspectButton(type)}</span>
        </div>
        ${this._renderAspects(aspects)}
      </div>
    `
  }

  static _renderNewAspectButton(type) {
    if (!game.user.isGM) { return ""; }
    return `<button id="ft-new-${type}-aspect" class="ft-common-new-button">+ New</button>`
  }

  static _renderAspects(aspects) {
    const html = `${aspects.map(a => `
      <div class="ft-scene-aspect-row">
        <span class="ft-aspect-title">
          ${a.name}
        </span>
        <div class="ft-common-invoke-container">
          <span class="ft-common-player-invoke-badge">
            ${a.invokes}
          </span>
          <span class="ft-common-gm-invoke-badge">
            ${a.gm_invokes ?? 0}
          </span>
        </div>
      </div>
    `).join("")} `
    return html  
  }

  static _renderCountdownSection(countdowns) {
    return `
      <div class="ft-scene-hud-section">
        <div class="ft-scene-hud-header">
          Countdowns
          ${ this._renderNewCountdownButton() }
        </div>
      ${ this._drawCountdownBoxes(countdowns) }
      </div>
    `
  }

  static _renderNewCountdownButton() {
    if (!game.user.isGM) return "";

    return `
      <button id="ft-new-countdown-button-new" class="ft-common-new-button">
        + New
      </button>
    `;
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
      `<div class="ft-scene-hud-countdown-track">` +
      cd.boxes
        .map((v, i) => `
          <div
            class="ft-scene-hud-countdown-box ${v ? "filled" : ""}"
            data-id="${id}"
            data-index="${i}"
          ></div>
        `)
        .join("")
      + `</div>`;

    return `
      <div class="ft-scene-hud-countdown-container">
        <div class="ft-scene-hud-countdown-title ft-aspect-row">${name}</div>
        <div >${boxHtml}</div>
      </div>
    `;
  }).join("");

  return boxes;

  }

  static async newAspect(aspectType) {

    new NewAspectDialog(aspectType).render(true);

  }

  static async create_new_aspect(aspect_type, name, invokes=0) {
    if (!name) { return; }

    if (aspect_type === "game") {
      const aspects = await game.settings.get("fate-core-official", "gameAspects") ?? [];
      aspects.push({
        name: name,
        free_invokes: invokes,
        notes: ""
      });
      await game.settings.set("fate-core-official", "gameAspects", aspects);
    }
    else if (aspect_type === "scene") {
      const aspects = await canvas.scene.getFlag("fate-core-official", "situation_aspects") ?? [];
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

  static async create_new_countdown(name, boxes) {

    const countdowns = foundry.utils.deepClone(
      game.settings.get("fate-core-official", "countdowns") ?? {}
    );

    const key = btoa(`<p>${name}</p>`);

    countdowns[key] = {
      name: `<p>${name}</p>`,
      description: "",
      boxes: Array(Number(boxes)).fill(false),
      visible: "visible"
    };

    await game.settings.set(
      "fate-core-official",
      "countdowns",
      countdowns
    );

    Hooks.callAll("fateToolsInvokesChanged");

  }

  static _makeDraggable(element) {

    const handle = element.querySelector(".ft-scene-hud-content");

    if (!handle) return;

    let isDragging = false;

    let offsetX = 0;
    let offsetY = 0;

    handle.style.cursor = "move";

    handle.addEventListener("mousedown", event => {

      isDragging = true;

      const rect = element.getBoundingClientRect();

      offsetX = event.clientX - rect.left;
      offsetY = event.clientY - rect.top;

      event.preventDefault();
    });

    document.addEventListener("mousemove", event => {

      if (!isDragging) return;

      element.style.left = `${event.clientX - offsetX}px`;
      element.style.top = `${event.clientY - offsetY}px`;

      element.style.bottom = "auto";
    });

    document.addEventListener("mouseup", async () => {
      isDragging = false;

      await game.settings.set("fate-tools", "sceneHudPosition", {top: parseInt(element.style.top), left: parseInt(element.style.left)});
    });
  }

  static _makeResizable(element) {

      const handle = element.querySelector(
          ".ft-scene-hud-resizer"
      );

      if (!handle) return;

      let resizing = false;

      let startX;
      let startY;

      let startWidth;
      let startHeight;

      handle.addEventListener("mousedown", event => {

          resizing = true;

          startX = event.clientX;
          startY = event.clientY;

          startWidth = element.offsetWidth;
          startHeight = element.offsetHeight;

          event.preventDefault();
          event.stopPropagation();
      });

      document.addEventListener("mousemove", event => {

          if (!resizing) return;

          const width =
              startWidth + (event.clientX - startX);

          const height =
              startHeight + (event.clientY - startY);

          element.style.width =
              `${Math.max(250, width)}px`;

          element.style.height =
              `${Math.max(200, height)}px`;
      });

      document.addEventListener("mouseup", async () => {
          resizing = false;

          await game.settings.set("fate-tools", "sceneHudSize", {width: element.offsetWidth, height: element.offsetHeight});
      });
  }

}