import { ZoneDataModel } from "./zone-model.js";

export class ZoneDocument {

  constructor(data) {
    this.data = new ZoneDataModel(data);
  }

  get name() {
    return this.data.name;
  }

  get stress() {
    return this.data.stress;
  }

  get stressBoxes() {
    return this.data.stressBoxes;
  }

}