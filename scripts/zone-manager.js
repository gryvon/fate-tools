export class ZoneManager {

  static renderers = new Map();

  static renderAll() {
    const zones = canvas.scene.getFlag("fate-tools", "zones") ?? [];

    const activeIds = new Set(zones.map(z => z.id));

    // Remove renderers for deleted zones
    for (const [id, renderer] of this.renderers) {

      if (!activeIds.has(id)) {
        renderer.destroy();
        this.renderers.delete(id);
      }

    }

    // Render or update existing zones
    for (const zone of zones) {

      let renderer = this.renderers.get(zone.id);

      if (!renderer) {
        renderer = new game.fateZones.ZoneCardRenderer(zone);
        console.log(zone)
        this.renderers.set(zone.id, renderer);
        renderer.render();
      } else {
        renderer.zoneData = zone;
        renderer.refreshHTML();
      }
    }
  }

  static destroyAll() {
    for (const renderer of this.renderers.values()) {
      renderer.destroy();
    }
    this.renderers.clear();
  }

  static async getZones(scene = canvas.scene) {

    return scene.getFlag("fate-tools", "zones") ?? [];
  }

  static async saveZones(zones) {
    return canvas.scene.setFlag("fate-tools", "zones", zones);
  }

  static async createZone(data) {

    if (!game.user.isGM) { ui.notifications.warn("Only GMs may create Zones.");
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
      ui.notifications.warn("Only GMs may modify Zones.");
      return;
    }

    const zones = await this.getZones();

    const zone = zones.find(z => z.id === id);

    if (!zone) return;

    foundry.utils.mergeObject(zone, updates);

    await this.saveZones(zones);
  }

  static async deleteZone(id) {

    if (!game.user.isGM) { 
      ui.notifications.warn("Only GMs may delete Zones.");
      return;
    }

    const zones = await this.getZones();

    await this.saveZones(zones.filter(z => z.id !== id));
  }

  static async createDefaultZone(x = 100, y = 100) {

    if (!game.user.isGM) {
      ui.notifications.warn("Only GMs may create Zones.");
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

    await this.renderAll();

    return zone;
  }

}

/*
export class ZoneManager {

  static async getZones(scene = canvas.scene) {

    return scene.getFlag("fate-tools", "zones") ?? [];
  }

  static async saveZones(zones) {
    return canvas.scene.setFlag("fate-tools", "zones", zones);
  }

  static async createZone(data) {

    if (!game.user.isGM) { ui.notifications.warn("Only GMs may create Zones.");
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
      ui.notifications.warn("Only GMs may modify Zones.");
      return;
    }

    const zones = await this.getZones();

    const zone = zones.find(z => z.id === id);

    if (!zone) return;

    foundry.utils.mergeObject(zone, updates);

    await this.saveZones(zones);
  }

  static async deleteZone(id) {

    if (!game.user.isGM) { 
      ui.notifications.warn("Only GMs may delete Zones.");
      return;
    }

    const zones = await this.getZones();

    await this.saveZones(zones.filter(z => z.id !== id));
  }

  static async createDefaultZone(x = 100, y = 100) {

    if (!game.user.isGM) {
      ui.notifications.warn("Only GMs may create Zones.");
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

    await this.renderAll();

    return zone;
  }

  static renderedZones = new Map();

  static renderAll() {

//    this.destroyAll();

    const zones = canvas.scene.getFlag("fate-tools", "zones") ?? [];

    for (const zone of zones) {

      const renderer = new game.fateZones.ZoneCardRenderer(zone);

      renderer.render();

      this.renderedZones.set(zone.id, renderer);
    }
  }

  static destroyAll() {

    for (const renderer of this.renderedZones.values()) {
      renderer.destroy();
    }

    this.renderedZones.clear();
  }


} */