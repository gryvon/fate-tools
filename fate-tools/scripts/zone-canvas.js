import { ZonePlaceable } from "./zone-placeable.js";
import { ZoneManager } from "./zone-manager.js";

export class ZoneCanvas {

  static renderedZones = new Map();

  static async drawAll() {

    this.clear();

    const zones =
      await ZoneManager.getZones();

    for (const data of zones) {

      const zone = new ZonePlaceable(data);

      zone.draw();

      zone.x = data.x;
      zone.y = data.y;

      canvas.stage.addChild(zone);

      this.renderedZones.set(
        data.id,
        zone
      );
    }
  }

  static clear() {

    for (const zone of this.renderedZones.values()) {
      zone.destroy({
        children: true
      });
    }

    this.renderedZones.clear();
  }

}