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
    let content = `<div class="ft-content">`;
    content += `<div class="ft-card-container">`;
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

      <div class="ft-invoke-card">

        <div class="ft-invoke-header">
          ⚡ Invoke Context
        </div>

        <div class="ft-invoke-body">

          <div class="ft-invoke-label">
            Actor
          </div>

          <div class="ft-invoke-value">
            ${msg.speaker.alias}
          </div>

          <div class="ft-invoke-label">
            Roll
          </div>

          <div class="ft-invoke-value">
            ${skill}
          </div>

          <div class="ft-invoke-label">
            Current Roll
          </div>

          <div class="ft-invoke-roll">
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
          <div class="ft-card">
            <div class="ft-card-header ${this._renderHeaderClass(group)}" style="${this._renderHeaderStyle(group)}">
              ${group.sourceName}
            </div>
            <div class="ft-card-body">
              ${group.aspects.map(a => this._renderAspect(a)).join("")}
            </div>
          </div>
        `).join("");
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
      <div class="ft-aspect-row">
        <div class="ft-aspect-info">
          <div class="ft-aspect-type">
            Aspect
          </div>
          <div class="ft-aspect-name">
            ${aspect.name}
          </div>
        </div>
        <div class="ft-aspect-controls">
          ${this._renderInvokeControls(aspect)}
        </div>
      </div>
    `
  }

  static _renderConsequence(aspect) {

    const severity =
      aspect.severity.replace(
        " Consequence",
        ""
      );

    return `
      <div class="ft-aspect-row">
        <div class="ft-aspect-info">
          <div class="ft-aspect-type">
            ${aspect.severity}
          </div>
          <div class="ft-aspect-name">
            ${aspect.name}
          </div>
        </div>
        <div class="ft-aspect-controls">
          ${this._renderInvokeControls(aspect)}
        </div>
      </div>
    `

  }

  static _renderInvokeControls(aspect) {
    return `
      <div class="ft-invoke-stack">

        ${game.user.isGM ? `
          <button class="invoke-control-button" data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}" data-action="plus" data-type="player">
            +
          </button>
        ` : ""}

        <span class="ft-invoke-badge">
          ${aspect.invokes ?? 0}
        </span>

        ${game.user.isGM ? `
          <button class="invoke-control-button" data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}" data-action="minus" data-type="player">
            -
          </button>
        ` : ""}

      </div>

      <div class="ft-invoke-stack">

        ${game.user.isGM ? `
          <button class="invoke-control-button" data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}" data-action="plus" data-type="gm">
            +
          </button>
        ` : ""}

        <span class="ft-gm-invoke-badge">
          ${aspect.gm_invokes ?? 0}
        </span>

        ${game.user.isGM ? `
          <button class="invoke-control-button" data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}" data-action="minus" data-type="gm">
            -
          </button>
        ` : ""}

      </div>
          `;
        }

    /*let content = "";

    if (game.user.isGM) {
      content += `
        <a class="invoke-minus" data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}">
          <i class="fa-solid fa-minus"></i>
        </a>        
      `
    }

    content += `
      <i class="fa-solid fa-${aspect.invokes}"></i>      
    `

    if (game.user.isGM) {
      content += `
        <a class="invoke-plus" data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}">
          <i class="fa-solid fa-plus"></i>
        </a>
      `
    }

    content += this._renderInvokeButton(aspect);

    return content

  }*/

  static _renderInvokeButton(aspect) {

    if (!game.fateTools.pendingInvoke) {
      return "";
    }

    return `
      <a
        class="invoke-aspect" data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}">
        <i class="fa-solid fa-bolt-lightning"></i>
      </a>
    `;

  }

  static _attachHandlers(element) {

    element.querySelectorAll(".invoke-control-button").forEach(el => {
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

    element.querySelectorAll(".invoke-aspect")
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
}

/*  static async getContent() {

    const invokeContext = game.fateTools.pendingInvoke;

    let content = "";

    if (invokeContext) {
      const msg = game.messages.get(invokeContext.messageId);

      content += `
      <div class="invoke-context">

        <h2>
          Invoking With
        </h2>

        <p>
          ${msg.speaker.alias}
        </p>

        <p>
          Current Roll:
          ${msg.rolls[0].total}
        </p>

      </div>

      <hr>
      `;

    }

    const aspects = await game.fateTools.AspectManager.getSceneAspects();

    const groups = {};

    for (const aspect of aspects) {

      const key =
    `${aspect.sourceId}`;

    if (!groups[key]) {

      groups[key] = {
        sourceType: aspect.sourceType,
        sourceName: aspect.sourceName,
        aspects: []
      };

    }

    groups[key].aspects.push(aspect);

  }

  for (const group of Object.values(groups)) {

    content += `<h2>${groupd.sourceName}</h2>`

    content += `
     <h2>${group.sourceName}</h2>

    <ul>

    ${group.aspects.map(a => {

    const invokeButton =
    invokeContext
    ? `
            <a
              class="invoke-aspect"
              data-key="${game.fateTools.AspectManager.getAspectKey(a)}"
            >
              <i class="fa-solid fa-bolt-lightning"></i>
              Invoke
            </a>
      `
      : "";

      if (a.type === "consequence") {

        const severity =
        a.severity.replace(
          " Consequence",
          ""
          );

        return `

        <li>

          [Consequence]
          [${severity}]
          ${a.name}

          <a
            class="invoke-minus"
            data-key="${game.fateTools.AspectManager.getAspectKey(a)}"
          >
            -
          </a>

          ${a.invokes}

          <a
            class="invoke-plus"
            data-key="${game.fateTools.AspectManager.getAspectKey(a)}"
          >
            +
          </a>

          ${invokeButton}

        </li>

          `;

        }

        return `

      <li>

        [Aspect]
        ${a.name}

        <a
          class="invoke-minus"
          data-key="${game.fateTools.AspectManager.getAspectKey(a)}"
        >
          -
        </a>

        ${a.invokes}

        <a
          class="invoke-plus"
          data-key="${game.fateTools.AspectManager.getAspectKey(a)}"
        >
          +
        </a>

        ${invokeButton}

      </li>

          `;

          }).join("")}

</ul>
        `;

    }

    return content;

  }

  static async refresh() {
    if (!this._instance) { return; }
    const content = await this.getContent();
    const html = this._instance.element;
    html.find(".dialog-content").html(content);
    this._attachHandlers(this._instance, html);
  }

  static _attachHandlers(app, html) {
    html.find(".invoke-plus").click(
      async event => {
        const key = event.currentTarget.dataset.key;
        const aspect = await game.fateTools.AspectManager.getAspectByKey(key);
        if (!aspect) { return; }
        await game.fateTools.AspectManager.setInvokes(aspect, aspect.invokes + 1);
        await game.fateTools.ActiveAspects.refresh();
      }
    );

    html.find(".invoke-minus").click(
      async event => {
        const key = event.currentTarget.dataset.key;
        const aspect = await game.fateTools.AspectManager.getAspectByKey(key);
        if (!aspect) return;
        await game.fateTools.AspectManager.setInvokes(aspect, Math.max(0, aspect.invokes - 1));
        await game.fateTools.ActiveAspects.refresh();
      }
    );

    html.find(".invoke-aspect").click(
      async event => {
        const key = event.currentTarget.dataset.key;
        const aspect = await game.fateTools.AspectManager.getAspectByKey(key);
        if (!aspect) return;
        await game.fateTools.AspectManager.invoke(aspect);
      }
    );
  }
}*/