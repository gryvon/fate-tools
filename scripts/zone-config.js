const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } =
  foundry.applications.api;

export class ZoneConfig extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(zone, options = {}) {
    super(options);

    this.zone = zone;
  }

  static DEFAULT_OPTIONS = {
    id: "fate-zone-config",
    window: {
      title: "Zone Configuration"
    },
    position: {
      width: 500,
      height: "auto"
    }
  };

  static PARTS = {
    form: {
      template: "modules/fate-tools/templates/zone-config.hbs"
    }
  };

  async _prepareContext() {
    return {
      zone: this.zone.zoneData,
      aspectsText: (this.zone.zoneData.aspects ?? []).join("\n"),
      consequencesText: (this.zone.zoneData.consequences ?? []).join("\n")
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);

    const html = this.element;

    html.querySelector("form")?.addEventListener("submit", this._onSubmit.bind(this));

    this.element.querySelector(".ft-zoneconfig-delete")?.addEventListener("click", this._onDelete.bind(this));  
    this.element.querySelectorAll("[data-target]").forEach(cb => { cb.addEventListener("change", this._onToggleSection.bind(this)); });
    this.element.querySelectorAll("[data-target]").forEach(cb => { this._onToggleSection({ currentTarget: cb }); });

  }

  async _onSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    //const formData = foundry.applications.ux.FormDataExtended.fromForm(form).object;
    const formData = new foundry.applications.ux.FormDataExtended(form).object;

    const data = foundry.utils.expandObject(formData);

    const description = (data.description ?? "").trim();
    const aspects = (data.aspects ?? "").split("\n").map(a => a.trim()).filter(a => a.length);
    const consequences = (data.consequences ?? "").split("\n").map(c => c.trim()).filter(c => c.length);
    const stressBoxes = Number(data.stressBoxes);
    const stress = [
      ...this.zone.zoneData.stress
    ];

    while (stress.length < stressBoxes) {
      stress.push(false);
    }

    while (stress.length > stressBoxes) {
      stress.pop();
    }

    const update = {
      name: data.name,
      color: data.color,
      description,
      stressBoxes,
      stress,
      enableStress:
        data.enableStress ?? false,
      enableAspects:
        data.enableAspects ?? false,
      enableConsequences:
        data.enableConsequences ?? false,
      aspects,
      consequences
    };

    await game.fateZones.ZoneManager.updateZone(this.zone.zoneData.id, update);

    Object.assign(this.zone.zoneData, update);

    this.zone.render();

    Hooks.callAll("updateScene");

    await this.close();
  }

  async _onDelete(event) {
    event.preventDefault();

    const confirmed = await DialogV2.confirm({
      window: {
        title: "Delete Zone"
      },
      content:
        "<p>Are you sure you want to delete this Zone?</p>"
    });

    if (!confirmed) return;

    await game.fateZones.ZoneManager.deleteZone(
      this.zone.zoneData.id
    );

    await game.fateZones.ZoneManager.renderAll();

    await this.close();
  }

  _onToggleSection(event) {
    const checkbox = event.currentTarget;
    const section = this.element.querySelector(`#${checkbox.dataset.target}`);

    if (!section) return;

    section.style.display = checkbox.checked ? "block" : "none";
  }

}


/*export class ZoneConfig extends FormApplication {

  constructor(zone, options = {}) {
    super(options);

    this.zone = zone;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(
      super.defaultOptions,
      {
        id: "fate-zone-config",
        title: "Zone Configuration",
        template:
          "modules/fate-tools/templates/zone-config.hbs",
        width: 500,
        height: "auto",
        closeOnSubmit: true
      }
    );
  }

  getData() {

    return {
      zone: this.zone.zoneData,
      aspectsText: (this.zone.zoneData.aspects ?? []).join("\n"),
      consequencesText: (this.zone.zoneData.consequences ?? []).join("\n")
    };
  }

  async _updateObject(event, formData) {

    const data = foundry.utils.expandObject(
      formData
    );

    const aspects = (data.aspects ?? "").split("\n").map(a => a.trim()).filter(a => a.length);

    const consequences = (data.consequences ?? "").split("\n").map(c => c.trim()).filter(c => c.length);

    const stressBoxes = Number(data.stressBoxes);

    const stress = [...this.zone.zoneData.stress];

    while (stress.length < stressBoxes) { stress.push(false); }

    while (stress.length > stressBoxes) { stress.pop(); }

    await game.fateZones.ZoneManager.updateZone(
      this.zone.zoneData.id,
      {
        name: data.name,
        color: data.color,
        stressBoxes,
        stress,
        enableStress: data.enableStress ?? false,
        enableAspects: data.enableAspects ?? false,
        enableConsequences: data.enableConsequences ?? false,
        aspects,
        consequences
      }
    );

    Object.assign(
      this.zone.zoneData,
      {
        name: data.name,
        color: data.color,
        stressBoxes,
        stress,
        enableStress: data.enableStress ?? false,
        enableAspects: data.enableAspects ?? false,
        enableConsequences: data.enableConsequences ?? false,
        aspects,
        consequences
      }
    );

    this.zone.render();
  }

  async _onDelete(event) {
    event.preventDefault();

    const confirmed = await Dialog.confirm({
        title: "Delete Zone",
        content: "<p>Are you sure you want to delete this Zone?</p>"
      });

    if (!confirmed) return;

    await game.fateZones.ZoneManager.deleteZone(this.zone.zoneData.id);
    await game.fateZones.ZoneManager.renderAll();
    this.close();
  }

    activateListeners(html) {

    super.activateListeners(html);

    html.find(".delete-zone").click(this._onDelete.bind(this));
  }
}*/