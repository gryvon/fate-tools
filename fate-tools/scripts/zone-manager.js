export class ZoneManager {

  static async getZones(scene = canvas.scene) {

    return scene.getFlag(
      "fate-zones",
      "zones"
    ) ?? [];
  }

  static async saveZones(zones) {

    return canvas.scene.setFlag(
      "fate-zones",
      "zones",
      zones
    );
  }

  static async createZone(data) {

    if (!game.user.isGM) {
      ui.notifications.warn(
        "Only GMs may create Zones."
      );
      return;
    }

    const zones = await this.getZones();

    data.id = foundry.utils.randomID();

    zones.push(data);

    await this.saveZones(zones);

    return data;
  }

  static async updateZone(id, updates) {

    if (!game.user.isGM) {
      ui.notifications.warn(
        "Only GMs may modify Zones."
      );
      return;
    }

    const zones = await this.getZones();

    const zone = zones.find(z => z.id === id);

    if (!zone) return;

    foundry.utils.mergeObject(
      zone,
      updates
    );

    await this.saveZones(zones);
  }

  static async deleteZone(id) {

    if (!game.user.isGM) {
      ui.notifications.warn(
        "Only GMs may delete Zones."
      );
      return;
    }

    const zones = await this.getZones();

    await this.saveZones(
      zones.filter(z => z.id !== id)
    );
  }

  static async createDefaultZone(x = 100, y = 100) {

    if (!game.user.isGM) {
      ui.notifications.warn(
        "Only GMs may create Zones."
      );
      return;
    }

    const zone = {
      id: foundry.utils.randomID(),

      name: "New Zone",
      color: "#FFFFFF",

      x,
      y,

      width: 300,
      height: 100,

      enableStress: false,
      stressBoxes: 3,

      stress: [
        false,
        false,
        false
      ],

      enableAspects: false,
      aspects: [],

      enableConsequences: false,
      consequences: []
    };

    const zones = await this.getZones();

    zones.push(zone);

    await this.saveZones(zones);

    await game.fateZones.ZoneCanvas.drawAll();

    return zone;
  }

}