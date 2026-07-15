export class ZoneConfig extends FormApplication {

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
      aspectsText:
        (this.zone.zoneData.aspects ?? [])
          .join("\n"),
      consequencesText:
        (this.zone.zoneData.consequences ?? [])
          .join("\n")
    };

  }

  async _updateObject(event, formData) {

    const data = foundry.utils.expandObject(
      formData
    );

    const aspects =
      (data.aspects ?? "")
        .split("\n")
        .map(a => a.trim())
        .filter(a => a.length);

    const consequences =
      (data.consequences ?? "")
        .split("\n")
        .map(c => c.trim())
        .filter(c => c.length);

    const stressBoxes =
      Number(data.stressBoxes);

    const stress =
      [...this.zone.zoneData.stress];

    while (stress.length < stressBoxes) {
      stress.push(false);
    }

    while (stress.length > stressBoxes) {
      stress.pop();
    }

    await game.fateZones.ZoneManager.updateZone(
      this.zone.zoneData.id,
      {
        name: data.name,
        color: data.color,

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
      }
    );

    Object.assign(
      this.zone.zoneData,
      {
        name: data.name,
        color: data.color,
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
      }
    );

    this.zone.draw();
  }

  async _onDelete(event) {

    event.preventDefault();

    const confirmed =
      await Dialog.confirm({

        title: "Delete Zone",

        content:
          "<p>Are you sure you want to delete this Zone?</p>"

      });

    if (!confirmed) return;

    await game.fateZones
      .ZoneManager
      .deleteZone(
        this.zone.zoneData.id
      );

    await game.fateZones
      .ZoneCanvas
      .drawAll();

    this.close();

  }

    activateListeners(html) {

    super.activateListeners(html);

    html.find(".delete-zone").click(
      this._onDelete.bind(this)
    );

  }
}