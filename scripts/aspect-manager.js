export class AspectManager {

  static getAspectKey(aspect) {

    return [
      aspect.sourceType,
      aspect.sourceId,
      aspect.type,
      aspect.name
    ].join(":");

  }

  static async getAspectByKey(key) {

    const aspects =
      await this.getSceneAspects();

    return aspects.find(
      a => this.getAspectKey(a) === key
    );

  }

  static async getInvokeMap() {

    return (
      canvas.scene.getFlag(
        "fate-tools",
        "invokes"
      ) ?? {}
    );

  }

  static async saveInvokeMap(map) {

    await canvas.scene.setFlag(
      "fate-tools",
      "invokes",
      map
    );

  }

  static async setInvokes(
    aspect,
    count
  ) {

    const map =
      await this.getInvokeMap();

    const key =
      this.getAspectKey(aspect);

    map[key] = Math.max(
      0,
      count
    );

    await this.saveInvokeMap(map);

    Hooks.callAll("fateToolsInvokesChanged");

  }

  static async getInvokes(aspect) {

    const map =
      await this.getInvokeMap();

    const key =
      this.getAspectKey(aspect);

    return map[key] ?? 0;

  }

  static async getSceneAspects() {

    const aspects = [];

    aspects.push(
      ...(await this.getZoneAspects())
    );

    return aspects;
  }

  static async getZoneAspects() {

    const zones =
      await game.fateZones
        .ZoneManager
        .getZones();

    const aspects = [];

    for (const zone of zones) {

      if (!zone.enableAspects)
        continue;

      for (const aspect of zone.aspects) {

        const aspectData = {

          id:
            foundry.utils.randomID(),

          name: aspect,

          type: "aspect",

          sourceType: "zone",

          sourceId: zone.id,

          sourceName: zone.name,

          visible: true

        };

        aspectData.invokes =
          await this.getInvokes(
            aspectData
          );

        aspects.push(
          aspectData
        );

      }

    }

    return aspects;

  }

  static async getActorAspects() {

    const aspects = [];

    for (const token of canvas.scene.tokens.contents) {

      const actor = token.actor;

      if (!actor) continue;

      if (!game.user.isGM) {

        const canObserve =
          actor.testUserPermission(
            game.user,
            CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER
          );

        if (!canObserve) continue;

      }

      const actorAspects =
        actor.system?.aspects ?? {};

      for (const aspect of Object.values(actorAspects)) {

        if (!aspect.value?.trim())
          continue;

        const aspectData = {

          id:
            foundry.utils.randomID(),

          name: aspect.value,

          type: "aspect",

          sourceType: "actor",

          // TOKEN identity
          sourceId: token.id,

          sourceName: token.actor.name,

          category: aspect.name,

          visible: true

        };

        aspectData.invokes =
          await this.getInvokes(
            aspectData
          );

        aspects.push(
          aspectData
        );

      }

    }

    return aspects;

  }

  static async getActorConsequences() {

    const consequences = [];

    for (const token of canvas.scene.tokens.contents) {

      const actor = token.actor;

      if (!actor) continue;

      const tracks =
        actor.system?.tracks ?? {};

      for (const track of Object.values(tracks)) {

        if (
          !track.aspect ||
          typeof track.aspect !== "object"
        ) continue;

        const name =
          track.aspect.name?.trim();

        if (!name) continue;

        const consequenceData = {

          id:
            foundry.utils.randomID(),

          name,

          type: "consequence",

          sourceType: "consequence",

          // TOKEN identity
          sourceId: token.id,

          sourceName: token.actor.name,

          severity: track.name,

          visible: true

        };

        consequenceData.invokes =
          await this.getInvokes(
            consequenceData
          );

        consequences.push(
          consequenceData
        );

      }

    }

    return consequences;

  }

  static async getSceneAspects() {

    return [

      ...(await this.getZoneAspects()),

      ...(await this.getActorAspects()),

      ...(await this.getActorConsequences())

    ];

  }

  static async invoke(aspect) {
    const invokeContext = game.fateTools.pendingInvoke;
    const actor = game.actors.get(invokeContext.actorId);
    const fatePoints = actor.system.details.fatePoints.current;
    const hasFreeInvokes = aspect.invokes > 0;
    const canSpendFatePoint = fatePoints > 0;
    const gmUser = game.users.find(u => u.isGM);
    const gmFatePoints = gmUser?.getFlag("fate-core-official", "gmfatepoints") ?? 0;

    new Dialog({
      title: `Invoke: ${aspect.name}`,
      content: `
        <form>
          <h3>Payment</h3>
          <label>
            <input type="radio" name="payment" value="free"
              ${hasFreeInvokes ? "checked" : ""}
              ${!hasFreeInvokes ? "disabled" : ""}
            >
            Use Free Invoke
            (${aspect.invokes})
          </label>
            ${game.user.isGM ? `
            <br>
            <label>
              <input
                type="radio" name="payment" value="gmfatepoint"
                ${gmFatePoints <= 0
                  ? "disabled"
                  : ""
                }
              >
              Spend GM Fate Point
              (${gmFatePoints})

            </label>` : ""}
          <br>
          <label>
            <input
              type="radio"
              name="payment"
              value="fatepoint"
              ${!canSpendFatePoint ? "disabled" : ""}
              ${!hasFreeInvokes ? "checked" : ""}
            />

            Spend Fate Point (${fatePoints})
          </label>
          <hr>
          <h3>Effect</h3>
          <label>
            <input type="radio" name="effect" value="+2" checked>
            +2 Bonus
          </label>
          <br>
          <label>
            <input type="radio" name="effect" value="reroll">
            Reroll
          </label>

        </form>`,
      buttons: {
        invoke: {
          label: "Invoke",
          callback: async html => {
            const payment = html.find("[name='payment']:checked").val();
            const effect = html.find("[name='effect']:checked").val();
            await this.resolveInvoke(aspect, payment, effect);
          }
        }
      }
    }).render(true);
  }

  static async resolveInvoke(aspect, payment, effect) {

    const invokeContext = game.fateTools.pendingInvoke;

    if (!invokeContext) return;

    const msg = game.messages.get(invokeContext.messageId);

    if (!msg) return;

    const invokes = msg.getFlag("fate-tools", "invokes") ?? [];

    const invokeData = {
      aspect: aspect.name,
      payment,
      effect,
      user: game.user.name
    };

    // Handle rerolls

    if (effect === "reroll") {
      const roll = msg.rolls[0];
      const rerolled = await roll.reroll();
      invokeData.original = roll.total;
      invokeData.rerolled = rerolled.total;
    }

    invokes.push(invokeData);

    await msg.setFlag("fate-tools", "invokes", invokes);

    // Spend payment

    if (payment === "free") { await this.setInvokes(aspect, aspect.invokes - 1); }

    if (payment === "fatepoint") {
      const actor = game.actors.get(invokeContext.actorId);
      const current = actor.system.details.fatePoints.current;
      await actor.update({
        "system.details.fatePoints.current":
          current - 1
      });
    }

    if (payment === "gmfatepoint") {
      const gmUser = game.users.find(u => u.isGM);
      const current = gmUser.getFlag("fate-core-official", "gmfatepoints") ?? 0;
      await gmUser.setFlag("fate-core-official", "gmfatepoints", current - 1);
    }

  }
}

