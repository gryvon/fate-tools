export class ActiveAspectsApp extends foundry.applications.api.ApplicationV2 {

  static DEFAULT_OPTIONS = {
    id: "fate-tools-active-aspects",
    classes: ["fate-tools-active-aspects"],
    tag: "section",
    window: {
      title: "Active Aspects"
    },
    position: {
      width: 900,
      height: "auto"
    }
  };

  async _renderHTML() {
    return await ActiveAspects.getContent();
  }

  async _replaceHTML(result, element) {
    element.innerHTML = result;
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
    content += this._renderInvokeContext();
    content += `<div class="ft-card-container">`;
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

    return `

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

      <a
        class="invoke-minus"
        data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}"
      >
        -
      </a>

      ${aspect.invokes}

      <a
        class="invoke-plus"
        data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}"
      >
        +
      </a>

    `;

  }
  static _renderInvokeButton(aspect) {

    if (!game.fateTools.pendingInvoke) {
      return "";
    }

    return `

      <a
        class="invoke-aspect"
        data-key="${game.fateTools.AspectManager.getAspectKey(aspect)}"
      >
        <i class="fa-solid fa-bolt-lightning"></i>
        Invoke
      </a>

    `;

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