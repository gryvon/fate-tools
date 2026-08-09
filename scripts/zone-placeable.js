export class ZoneCardRenderer {

  constructor(zoneData, options={}) {
    this.zoneData = zoneData;
    this.dragging = false;
    this.resizing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.options = options;

    this._onDragMove = this._onDragMove.bind(this);
    this._onDragEnd = this._onDragEnd.bind(this);
    this._onResizeMove = this._onResizeMove.bind(this);
    this._onResizeEnd = this._onResizeEnd.bind(this);
  }

  render() {
    // this.destroy();
    const zoneOverlay = document.getElementById(`ft-zone-overlay-${this.zoneData.id}`)
    if (zoneOverlay) {
      this.element = zoneOverlay;
      zoneOverlay.style.setProperty("--zone-color", this.zoneData.color ?? "#ffffff");
      zoneOverlay.style.left = `${this.zoneData.position.x ?? 100}px`;
      zoneOverlay.style.top = `${this.zoneData.position.y ?? 100}px`;
      zoneOverlay.style.width = `${this.zoneData.position.width ?? 500}px`;
      zoneOverlay.style.height = `${this.zoneData.position.height ?? 500}px`;      
      this.refreshHTML();
      return;
    }

    const hud = document.getElementById("hud");
    const zoneCard = document.createElement("div");
    zoneCard.classList.add("ft-zone-overlay");
    zoneCard.id = `ft-zone-overlay-${this.zoneData.id}`
    zoneCard.dataset.id = this.zoneData.id
    zoneCard.innerHTML = this.renderHTML();

    const pos = this.zoneData.position ?? {
      x: this.zoneData.x,
      y: this.zoneData.y,
      width: this.zoneData.width,
      height: this.zoneData.height
    };

    zoneCard.style.left = `${pos.x ?? 100}px`;
    zoneCard.style.top = `${pos.y ?? 100}px`;
    zoneCard.style.width = `${pos.width ?? 500}px`;
    zoneCard.style.height = `${pos.height ?? 500}px`;

    zoneCard.style.setProperty("--zone-color", this.zoneData.color ?? "#ffffff");

    this.element = zoneCard;
    this.attachDocumentListeners();
    this.attachElementListeners();
    hud.appendChild(zoneCard);
    return zoneCard;
  }

  destroy() {
    document.removeEventListener("pointermove", this._onDragMove);
    document.removeEventListener("pointerup", this._onDragEnd);
    document.removeEventListener("pointermove", this._onResizeMove);
    document.removeEventListener("pointerup", this._onResizeEnd);
    this.element?.remove();
    this.element = null;
  }

  renderHTML() {
    return `
      <div class="ft-zone-overlay-card">
        <div class="ft-zone-overlay-header">
          <div class="ft-zone-overlay-title">
            <span class="ft-zone-overlay-color"><i class="fa-solid fa-star"></i></span>
            ${this.zoneData.name}
          </div>
          ${this._renderModifyButton()}
        </div>
        ${this._renderStressTrack()}
        ${this._renderDescription()}
        ${this._renderAspects()}
        ${this._renderConsequences()}
        ${this._renderResizeHandle()}
      </div>
    `
  }

  refreshHTML() {
    if (!this.element) { return this.render(); }

    const pos = this.zoneData.position ?? {
      x: this.zoneData.x,
      y: this.zoneData.y,
      width: this.zoneData.width,
      height: this.zoneData.height
    };

    this.element.innerHTML = this.renderHTML();
    this.element.style.setProperty("--zone-color", this.zoneData.color ?? "#ffffff");
    this.element.style.left = `${pos.x ?? 100}px`;
    this.element.style.top = `${pos.y ?? 100}px`;
    this.element.style.width = `${pos.width ?? 500}px`;
    this.element.style.height = `${pos.height ?? 500}px`;      

    this.attachDocumentListeners();
  }

  _renderModifyButton() {
    if (!game.user.isGM) { return ""; }
    return `
      <div class="ft-zone-overlay-modify">
        <button class="ft-zone-overlay-modify-button" data-message-id="${this.zoneData.id}">
          <i class="fa-solid fa-screwdriver-wrench"></i>
        </button>
      </div>
    `    
  }

  _renderStressTrack() {
    if (!this.zoneData.enableStress) return "";

    const stress = this.zoneData.stress || [];

    let html = `<div class="ft-zone-overlay-stress-track">`;

    for (let i = 0; i < this.zoneData.stressBoxes; i++) {
      const checked = stress[i] ?? false;

      html += `
        <span class="ft-zone-overlay-stress-box" data-index="${i}">
          ${
            checked
              ? '<i class="fa-solid fa-square-xmark"></i>'
              : '<i class="fa-regular fa-square"></i>'
          }
        </span>
      `;
    }

    html += `</div>`;
    return html;
  }

  _renderDescription() {
    const description = this.zoneData.description ?? "";

    if (description === "") {return ""; }

    return `
      <div class="ft-zone-overlay-description">
        ${description}
      </div>
    `
  }

  _renderAspects() {
    if (!this.zoneData.enableAspects || !this.zoneData.aspects?.length) { return ""; }

    const invokeMap = canvas.scene.getFlag("fate-tools", "invokes") ?? {};

    let html = `
      <div class="ft-zone-overlay-section">
        <div class="ft-zone-overlay-section-header">
          Aspects
        </div>
    `;
    for (const aspect of this.zoneData.aspects) {
      const key = ["zone", this.zoneData.id, "aspect", aspect].join(":");
      const invokeData = invokeMap[key] ?? {"invokes": 0, "gm_invokes": 0}
      html += `
        <div class="ft-zone-overlay-row ft-zone-overlay-aspect-row">
          <div class="ft-zone-overlay-aspect-text">
            ${aspect}
          </div>
          <div class="ft-zone-overlay-invokes-container">
            <span class="ft-zone-overlay-player-invoke-badge">
              ${invokeData.invokes ?? 0}
            </span>
            <span class="ft-zone-overlay-gm-invoke-badge">
              ${invokeData.gm_invokes ?? 0}
            </span>
          </div>
        </div>      
      `
    };
    html += `</div>`;
    return html
  }

  _renderConsequences() {
    if (!this.zoneData.enableConsequences || !this.zoneData.consequences?.length) { return ""; }

    const invokeMap = canvas.scene.getFlag("fate-tools", "invokes") ?? {};

    let html = `
      <div class="ft-zone-overlay-section">
        <div class="ft-zone-overlay-section-header">
          Consequences
        </div>
    `;    
    for (const consequence of this.zoneData.consequences) {
      const key = ["zone", this.zoneData.id, "consequence", consequence].join(":");
      const invokeData = invokeMap[key] ?? {"invokes": 0, "gm_invokes": 0}
      html += `
        <div class="ft-zone-overlay-row ft-zone-overlay-consequence-row">
          <div class="ft-zone-overlay-consequence-text">
            ${consequence}
          </div>
          <div class="ft-zone-overlay-invokes-container">
            <span class="ft-zone-overlay-player-invoke-badge">
              ${invokeData.invokes ?? 0}
            </span>
            <span class="ft-zone-overlay-gm-invoke-badge">
              ${invokeData.gm_invokes ?? 0}
            </span>
          </div>
        </div>      
      `
    };
    html += `</div>`;
    return html
  }

  _renderResizeHandle() {
    return `<div class="ft-zone-overlay-resizer"></div>`
  }

  async savePosition() {
    const zones = foundry.utils.deepClone(
      canvas.scene.getFlag("fate-tools", "zones") ?? []
    );

    const index = zones.findIndex(z => z.id === this.zoneData.id);

    if (index !== -1) {
      zones[index].position = {
        x: this.element.offsetLeft,
        y: this.element.offsetTop,
        width: this.element.offsetWidth,
        height: this.element.offsetHeight
      };
    }

    await canvas.scene.setFlag("fate-tools", "zones", zones);
    Hooks.callAll("fateToolsInvokesChanged");
  }

  _onModifyClick() {
    new game.fateZones.ZoneConfig(this).render(true);
  }

  _onDragMove(event) {
    if (!this.dragging) return;

    const scale = canvas.stage.scale.x;

    const dx = (event.clientX - this.lastX) / scale;
    const dy = (event.clientY - this.lastY) / scale;

    this.element.style.left = `${this.element.offsetLeft + dx}px`;
    this.element.style.top = `${this.element.offsetTop + dy}px`;

    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  async _onDragEnd() {
    if (!this.dragging) return;

    this.dragging = false;

    await this.savePosition();
  }

  _onResizeMove(event) {
      if (!this.resizing) return;

      const scale = canvas.stage.scale.x;

      const dx =
        (event.clientX - this.lastX) / scale;

      const dy =
        (event.clientY - this.lastY) / scale;

      this.element.style.width = `${this.element.offsetWidth + dx}px`;
      this.element.style.height = `${this.element.offsetHeight + dy}px`;

      this.lastX = event.clientX;
      this.lastY = event.clientY;    
  }

  async _onResizeEnd(event) {
    if (this.resizing) {
      this.resizing = false;
      await this.savePosition();
    }    
  }

  attachDocumentListeners() {
    const header = this.element.querySelector(".ft-zone-overlay-header");
    const resizer = this.element.querySelector(".ft-zone-overlay-resizer");

    this.element.querySelectorAll(".ft-zone-overlay-modify-button").forEach(button => {

      button.addEventListener("pointerdown", event => {
        event.stopPropagation();
      });

      button.addEventListener("click", this._onModifyClick.bind(this));
    });

    this.element.querySelectorAll(".ft-zone-overlay-stress-box").forEach(box => { 
      box.addEventListener("click", this._onStressClick.bind(this)); 
    });

    header.addEventListener("pointerdown", event => {

      this.dragging = true;

      this.lastX = event.clientX;
      this.lastY = event.clientY;

    });

    resizer.addEventListener("pointerdown", event => {
      event.stopPropagation();

      this.resizing = true;

      this.lastX = event.clientX;
      this.lastY = event.clientY;   

    });  }

  attachElementListeners() {
    document.addEventListener("pointermove", this._onDragMove);
    document.addEventListener("pointerup", this._onDragEnd);
    document.addEventListener("pointermove", this._onResizeMove);
    document.addEventListener("pointerup", this._onResizeEnd);
  }  

  async _onStressClick(event) {
    const index = Number(event.currentTarget.dataset.index);
    this.zoneData.stress ??= [];
    this.zoneData.stress[index] = !this.zoneData.stress[index];
    await this.saveZoneData();
    this.refreshHTML();
  }

  async saveZoneData() {
    const zones = foundry.utils.deepClone(
      canvas.scene.getFlag("fate-tools", "zones") ?? []
    );

    const idx = zones.findIndex(
      z => z.id === this.zoneData.id
    );

    if (idx !== -1) {
      zones[idx] = this.zoneData;
    }

    await canvas.scene.setFlag("fate-tools", "zones", zones);
  }

}