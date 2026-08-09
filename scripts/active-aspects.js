import { NewAspectDialog } from "./scene-aspect-hud.js";

export class ActiveAspectsApp extends foundry.applications.api.ApplicationV2 {

  static DEFAULT_OPTIONS = {
    id: "fate-tools-active-aspects",
    classes: ["fate-tools-active-aspects"],
    tag: "section",
    window: {
      title: "Active Aspects",
      resizable: true
    },
    position: {
      width: 900,
      height: 700
    }
  };

  async _renderHTML() {
    return await ActiveAspects.getContent();
  }

  async _replaceHTML(result, element) {
    element.innerHTML = result;
    ActiveAspects._attachHandlers(element);
  }

  async close(options) {
    ActiveAspects._instance = null;
    return super.close(options);
  }
}

export class ActiveAspects {

  static _instance = null;

  static async show() {
    if (this._instance) {
      await this._instance.render(true);
      return;
    }
    this._instance =
      new ActiveAspectsApp();

    await this._instance.render(true);
  }

  static async refresh() {
    if (!this._instance)
      return;
    await this._instance.render();
  }

  static async getContent() {
    const aspects = await game.fateTools.AspectManager.getSceneAspects();
    const groups = this._groupAspects(aspects);
    let content = `<div class="ft-active-aspects-content">`;
    content += `<div class="ft-active-aspects-card-container">`;
    content += this._renderInvokeContext();
    content += this._renderGroups(groups);
    content += `</div></div>`;
    return content;
  }

  static _groupAspects(aspects) {

    const groups = {};

    for (const aspect of aspects) {

      const key =
        aspect.sourceId;

      if (!groups[key]) {

        groups[key] = {
          sourceId: aspect.sourceId,
          sourceType: aspect.sourceType,
          sourceName: aspect.sourceName,
          aspects: []
        };

      }

      groups[key].aspects.push(aspect);

    }

    return groups;

  }

  static _renderInvokeContext() {
    const invokeContext =
      game.fateTools.pendingInvoke;

    if (!invokeContext) {
      return "";
    }

    const msg =
      game.messages.get(
        invokeContext.messageId
      );

    const div = document.createElement("div");
    div.innerHTML = msg.flavor;

    const skill =
    div.querySelector("h1")?.textContent ?? "";

    return `

      <div class="ft-active-aspects-invoke-card">

        <div class="ft-active-aspects-invoke-header">
          ⚡ Invoke Context
        </div>

        <div class="ft-active-aspects-invoke-body">

          <div class="ft-active-aspects-invoke-label">
            Actor
          </div>

          <div class="ft-active-aspects-invoke-value">
            ${msg.speaker.alias}
          </div>

          <div class="ft-active-aspects-invoke-label">
            Roll
          </div>

          <div class="ft-active-aspects-invoke-value">
            ${skill}
          </div>

          <div class="ft-active-aspects-invoke-label">
            Current Roll
          </div>

          <div class="ft-active-aspects-invoke-roll">
            ${msg.rolls[0].total}
          </div>

        </div>

      </div>

    `;
  }

  static _renderGroups(groups) {
    const order = {
      game: 0,
      scene: 1,
      zone: 2,
      actor: 3
    }

    
    return Object.values(groups).sort((a, b) => {
          return (
            (order[a.sourceType] ?? 999) -
            (order[b.sourceType] ?? 999)
          );
        }).map(group => `
          <div class="ft-active-aspects-card">
            <div class="ft-active-aspects-card-header ${this._renderHeaderClass(group)}" style="${this._renderHeaderStyle(group)}">
              <span class="ft-active-aspects-group-title">
                ${group.sourceName}
              </span>
              ${this._renderNewAspectButton(group)}
            </div>
            <div class="ft-active-aspects-card-body">
              ${group.aspects.map(a => this._renderAspect(a)).join("")}
            </div>
          </div>
        `).join("");
  }

  static _renderNewAspectButton(group) {
    if (!game.user.isGM) { return ""; }
    return `
      <span>
        <button data-source="${group.sourceType}" data-target="${group.sourceId}" class="ft-general-new-button ft-active-aspects-new-button">+ New</button>
      </span>
    `
  }

  static _renderHeaderStyle(group) {

    if (group.sourceType !== "actor") {
      return "";
    }

    const token = canvas.tokens.get(group.sourceId);

    const actor = token?.actor;

    const owner = game.users.find(u =>
      !u.isGM &&
      actor?.testUserPermission(u, "OWNER")
    );

    if (owner?.color) { return `background: ${owner?.color}`; }

    return ""
  }

  static _renderHeaderClass(group) {

    switch (group.sourceType) {
      case "actor": {
        const token = canvas.tokens.get(group.sourceId);
        const actor = token?.actor
        return actor?.hasPlayerOwner
          ? "actor-player"
          : "actor-npc";
      }
      default:
        return group.sourceType;
    }
  }

  static _renderAspect(aspect) {
    const invokeButton = this._renderInvokeButton(aspect);
    if (aspect.type === "consequence") {
      return this._renderConsequence(aspect, invokeButton);
    }
    return `
      <div class="ft-active-aspects-aspect-row">
        <div class="ft-active-aspects-aspect-info">
          <div class="ft-active-aspects-aspect-type">
            Aspect
          </div>
          <div class="ft-active-aspects-aspect-name">
            ${aspect.name}
          </div>
        </div>
        <div class="ft-active-aspects-aspect-controls-row">
          <div class="ft-active-aspects-aspect-controls">
            ${this._renderInvokeControls(aspect)}
          </div>
          ${invokeButton}
          ${this._renderDeleteButton(aspect)}
        </div>
      </div>
    `
  }

  static _renderDeleteButton(aspect) {
    if (!game.user.isGM) { return ""; }
    const key = game.fateTools.AspectManager.getAspectKey(aspect);
    return `
      <a title="Delete this aspect" class="ft-active-aspects-delete-button" data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}">
        <i class="fa-solid fa-trash"></i>
      </a>
    `
  }

  static _renderConsequence(aspect) {
    const invokeButton = this._renderInvokeButton(aspect);
    const severity =
      aspect.severity.replace(
        " Consequence",
        ""
      );

    return `
      <div class="ft-active-aspects-aspect-row">
        <div class="ft-active-aspects-aspect-info">
          <div class="ft-active-aspects-aspect-type">
            ${aspect.severity}
          </div>
          <div class="ft-active-aspects-aspect-name">
            ${aspect.name}
          </div>
        </div>
        <div class="ft-active-aspects-aspect-controls-row">
          <div class="ft-active-aspects-aspect-controls">
            ${this._renderInvokeControls(aspect)}
          </div>
        ${invokeButton}
        </div>
      </div>
    `
  }

  static _renderInvokeControls(aspect) {
    return `
      <div class="ft-active-aspects-invoke-stack">

        ${game.user.isGM ? `
          <button class="ft-active-aspects-invoke-control-button" data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}" data-action="plus" data-type="player">
            +
          </button>
        ` : ""}

        <span title="Player Free Invokes" class="ft-general-player-invoke-badge">
          ${aspect.invokes ?? 0}
        </span>

        ${game.user.isGM ? `
          <button class="ft-active-aspects-invoke-control-button" data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}" data-action="minus" data-type="player">
            -
          </button>
        ` : ""}

      </div>

      <div class="ft-active-aspects-invoke-stack">

        ${game.user.isGM ? `
          <button class="ft-active-aspects-invoke-control-button" data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}" data-action="plus" data-type="gm">
            +
          </button>
        ` : ""}

        <span title="GM Free Invokes" class="ft-general-gm-invoke-badge">
          ${aspect.gm_invokes ?? 0}
        </span>

        ${game.user.isGM ? `
          <button class="ft-active-aspects-invoke-control-button" data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}" data-action="minus" data-type="gm">
            -
          </button>
        ` : ""}

      </div>
          `;
        }

  static _renderInvokeButton(aspect) {
    if (!game.fateTools.pendingInvoke) {
      return "";
    }

    return `
      <a title="Invoke Aspect!" class="ft-active-aspects-invoke-aspect" data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}">
        <i class="fa-solid fa-bolt-lightning"></i>
      </a>
    `;

  }

  static _attachHandlers(element) {

    element.querySelectorAll(".ft-active-aspects-delete-button").forEach(el => {
      el.addEventListener("click", async event => {
      const key = event.currentTarget.dataset.key;
      const aspect = await game.fateTools.AspectManager.getAspectByKey(key);
      
      await this.handleDeleteButton(aspect);
      });
    });

    element.querySelectorAll(".ft-active-aspects-new-button").forEach(el => {
      el.addEventListener("click", async event => {
      const sourceType = event.currentTarget.dataset.source;
      const sourceId = event.currentTarget.dataset.target;
      await this.handleNewButton(sourceType, sourceId);

      });
    });

    element.querySelectorAll(".ft-active-aspects-invoke-control-button").forEach(el => {
      el.addEventListener("click", async event => {
        const key = event.currentTarget.dataset.key;
        const action = event.currentTarget.dataset.action;
        const type = event.currentTarget.dataset.type;
        const aspect = await game.fateTools.AspectManager.getAspectByKey(key);

        if (!aspect) { return; }

        let invokes = aspect.invokes;
        let gm_invokes = aspect.gm_invokes;


        if (action === "plus") {
          if (type === "gm") { gm_invokes += 1; }
          else if (type === "player") { invokes += 1; }
        }
        else if (action === "minus") {
          if (type === "gm") { gm_invokes -= 1; }
          else if (type === "player") { invokes -= 1; }
        }

        await game.fateTools.AspectManager.setInvokes(aspect, Math.max(0, invokes), Math.max(0, gm_invokes))

      })
    })

    element.querySelectorAll(".ft-active-aspects-invoke-aspect")
      .forEach(el => {

        el.addEventListener(
          "click",
          async event => {

            const key =
              event.currentTarget.dataset.key;

            const aspect =
              await game.fateTools
                .AspectManager
                .getAspectByKey(key);

            if (!aspect) return;

            await game.fateTools
              .AspectManager
              .invoke(aspect);

          }
        );

      });

  }

  static async handleNewButton(sourceType, sourceId) {
    const dialog = new NewAspectDialog(sourceType);
    let name = "";
    switch (sourceType) {
      case "game":
        new NewAspectDialog(sourceType).render(true);
        break;
      case "scene":
        new NewAspectDialog(sourceType).render(true);
        break;
      case "zone":
        const zones = canvas.scene.getFlag("fate-tools", "zones");
        const zone = zones.find(z => z.id === sourceId);
        await dialog.render(true);
        name = await dialog.result;
        zone.aspects.push(name);
        canvas.scene.setFlag("fate-tools", "zones", zones);
        break;
      case "actor":
        console.log("actor")
        const token = canvas.scene.tokens.get(sourceId);
        const actor = token.actor;
        console.log(actor);
        const tempAspects = actor.getFlag("fate-tools", "temporaryAspects") ?? [];
        await dialog.render(true);
        name = await dialog.result;
        console.log(name)
        tempAspects.push(name);
        await actor.setFlag("fate-tools", "temporaryAspects", tempAspects);
        Hooks.callAll("fateToolsInvokesChanged");
        break;
      default:
        console.log(sourceType, sourceId);        
    }
  }

  static async handleDeleteButton(aspect) {
    let aspects = [];
    let updatedAspects = [];
    if (aspect.category === "Temporary Aspect") {
      const token = canvas.scene.tokens.get(aspect.sourceId);
      aspects = token.actor.getFlag("fate-tools", "temporaryAspects");
      updatedAspects = aspects.filter(item => item !== aspect.name);
      await token.actor.setFlag("fate-tools", "temporaryAspects", updatedAspects);
      Hooks.callAll("fateToolsInvokesChanged");
    }
    else if (aspect.sourceType === "zone") {
      const zones = canvas.scene.getFlag("fate-tools", "zones");
      const zone = zones.find(z => z.id === aspect.sourceId);
      zone.aspects = zone.aspects.filter(item => item !== aspect.name);
      await canvas.scene.setFlag("fate-tools", "zones", zones);
    }
    else if (aspect.sourceType === "scene") {
      aspects = canvas.scene.getFlag("fate-core-official", "situation_aspects")
      updatedAspects = aspects.filter(item => item.name !== aspect.name);
      await canvas.scene.setFlag("fate-core-official", "situation_aspects", updatedAspects);
    }
    else if (aspect.sourceType === "game") {
      aspects = game.settings.get("fate-core-official", "gameAspects")
      updatedAspects = aspects.filter(item => item.name !== aspect.name);
      await game.settings.set("fate-core-official", "gameAspects", updatedAspects);
    }
    else {
      ui.notifications.error("You can't delete this aspect.");
      return;
    }
    ui.notifications.info("Aspect deleted.");
  }
}