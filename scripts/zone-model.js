const fields = foundry.data.fields;

export class ZoneDataModel extends foundry.abstract.DataModel {

  static defineSchema() {
    return {

      name: new fields.StringField({
        required: true,
        initial: "New Zone"
      }),

      x: new fields.NumberField({
        required: true,
        initial: 0
      }),

      y: new fields.NumberField({
        required: true,
        initial: 0
      }),

      width: new fields.NumberField({
        required: true,
        initial: 300
      }),

      height: new fields.NumberField({
        required: true,
        initial: 120
      }),

      stressBoxes: new fields.NumberField({
        required: true,
        initial: 3,
        min: 1,
        max: 20
      }),

      stress: new fields.ArrayField(
        new fields.BooleanField(),
        {
          initial: [false, false, false]
        }
      ),

      enableAspects: new fields.BooleanField({
        initial: true
      }),

      aspects: new fields.ArrayField(
        new fields.StringField(),
        {
          initial: []
        }
      ),

      enableConsequences: new fields.BooleanField({
        initial: false
      }),

      consequences: new fields.ArrayField(
        new fields.StringField(),
        {
          initial: []
        }
      )

    };
  }

}