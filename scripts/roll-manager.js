export class ModifyRollDialog extends foundry.applications.api.ApplicationV2
{
  constructor(messageId) {
    super();
    this.messageId = messageId;
  }

  static DEFAULT_OPTIONS = {
    id: "fate-tools-modify-roll",
    tag: "section",
    window: {
      title: "Modify Roll"
    },
    position: {
      width: 350,
      height: "auto"
    }
  };

  async _renderHTML() {
    return `
      <div class="ft-modify-roll-new">
        <label>
          Description:
        </label>
        <input type="text" name="modify-roll-name">
      </div>
      <div class="ft-modify-roll-new">
        <label>
          Modifier:
        </label>
        <input type="number" value="0" name="modify-roll-value">
        <div class="ft-new-aspect-buttons">
          <button type="button" class="ft-create-aspect">
            Create
          </button>
        </div>
      </div>
    `
  }

  async _replaceHTML(result, element) {
    element.innerHTML = result;
    element.querySelector(".ft-create-aspect")?.addEventListener("click", async() => {
      const desc = element.querySelector('[name="modify-roll-name"]')?.value?.trim();
      const modifier = Number(element.querySelector('[name="modify-roll-value"]')?.value) || 0;
      if (!desc) { return; }
      const msg = game.messages.get(this.messageId);
      const rollData = msg.getFlag("fate-tools", "rollData") ?? [];
      const modifiers = rollData.modifiers ?? [];
      modifiers.push(
        {
          name: desc,
          type: "manual",
          value: modifier
        }
      );
      await msg.setFlag("fate-tools", "rollData", rollData);
      await msg.update({});

      this.close();
    })
  }

}

export class RollManager {

  static extractRollData(message) {
    if (!message.rolls?.length) return;

    const flavorDiv = document.createElement("div");

    flavorDiv.innerHTML = message.flavor ?? "";

    const skill = flavorDiv.querySelector("h1")?.textContent?.trim() ?? "";

    const flavorText = flavorDiv.textContent ?? "";

    const rankMatch = flavorText.match(/Skill rank:\s*(-?\d+)\s*\((.*?)\)/);

    const rank = rankMatch? Number(rankMatch[1]): 0;

    const ladder = rankMatch? rankMatch[2]: "None";

    const stuntMatch = flavorText.match(/Stunt:\s*(.*?)\s*\(\+?(-?\d+)\)/);

    const roll = message.rolls[0];

    const fateTerm = roll.terms.find(t => t.results);

    const dice = fateTerm?.results?.map(r => r.result) ?? [];

    return {
      messageId: message.id,
      actorId: message.speaker.actor,
      tokenId: message.speaker.token,
      actorName: message.speaker.alias,
      skill,
      rank,
      ladder,
      dice,
      total: roll.total,
      modifiers: [
        ...(stuntMatch
          ? [{
              type: "stunt",
              name:
                stuntMatch[1].trim(),
              value:
                Number(
                  stuntMatch[2]
                )
            }]
          : [])
      ],
      /* rerolls: [] */
    };
  }

  static renderRollCard(rollData, invokes) {
    const html = `
      <div class="ft-roll-card">
        ${this._renderHeader(rollData)}
        ${this._renderActor(rollData)}
        ${this._renderDice(rollData)}
        ${this._renderRerolls(invokes)}
        ${this._renderModifiers(rollData)}
        ${this._renderInvokes(invokes)}
        ${this._renderTotal(rollData, invokes)}
        ${this._renderInvokeButton(rollData, invokes)}
      </div>
    `;

    return html;
  }

  static _renderHeader(rollData) {

    return `
      <div class="ft-roll-header">
        <div class="ft-roll-skill-title">
          ${rollData.skill}
        </div>
        ${this._renderModifyButton(rollData)}
      </div>

    `;

  }

  static _renderActor(rollData) {

    return `
      <div class="ft-roll-actor">

        ${rollData.actorName}

      </div>
    `;

  }

  static _renderDice(rollData) {

    return `
      <div class="ft-roll-row-dice">
          ${rollData.dice
            .map(d =>
              this._renderDie(d)
            )
            .join("")}
      </div>
    `;

  }

  static _renderDie(value) {

    switch (value) {

      case 1:
        return `<span class="ft-die plus"></span>
        `;

      case -1:
        return `
          <span class="ft-die minus"></span>
        `;

      default:
        return `
          <span class="ft-die blank"></span>
        `;

    }
  }
  static _renderModifiers(rollData) {

    let html = `
      <div class="ft-roll-row">

        <span>
          Skill
        </span>

        <span>
          ${rollData.rank >= 0 ? "+" : ""}
          ${rollData.rank}
        </span>

      </div>
    `;

    html += rollData.modifiers.map(mod => `
      <div class="ft-roll-row">

        <span>
          ${mod.name}
        </span>

        <span>
          ${mod.value >= 0 ? "+" : ""}
          ${mod.value}
        </span>

      </div>

    `).join("");

    return html;
  }

  static _renderInvokes(invokes) {

    if (!invokes?.length) {
      return "";
    }

    return invokes.map(invoke => `

      <div class="ft-roll-row">

        <span>
          ${invoke.aspect}
          (${invoke.payment})
        </span>

        <span>

          ${invoke.effect === "+2"
            ? "+2"
            : "Reroll"}

        </span>

      </div>

    `).join("");

  }

  static _renderTotal(rollData, invokes) {

    const total = this._calculateTotal(rollData, invokes);
    const ladder = this._getLadder(total);

    return `
      <div class="ft-roll-total">
        <div class="ft-roll-total-value">
          ${total >= 0 ? "+" : ""}
          ${total}
        </div>
        <div class="ft-roll-total-ladder">
          (${ladder})
        </div>
      </div>
    `;

  }

  static _renderModifyButton(rollData) {
    return `
      <div class="ft-roll-modify">
        <button class="ft-roll-modify-button" data-message-id="${rollData.messageId}">
          <i class="fa-solid fa-screwdriver-wrench"></i>
        </button>
      </div>
    `
  }

  static _renderInvokeButton(rollData) {

    return `

      <div class="ft-roll-invoke">

        <button class="ft-roll-invoke-button"
          data-message-id="${rollData.messageId}"
          data-actor-id="${rollData.actorId}"
          data-token-id="${rollData.tokenId}"
        >

          <i class="fa-solid fa-bolt-lightning"></i>

          Invoke!

        </button>

      </div>

    `;

  }

static _renderRerolls(invokes) {

  const reroll =
    invokes
      .filter(i => i.effect === "reroll")
      .at(-1);

  if (!reroll) {
    return "";
  }

  return `
    <div class="ft-reroll-section">
      <div class="ft-reroll-label">
        Rerolled
      </div>
      <div class="ft-roll-row-dice">
        ${reroll.rerolledDice.map(d => this._renderDie(d)).join("")}
      </div>
    </div>
  `;

}

  static _calculateTotal(rollData, invokes) {

    let last_dice = this.getCurrentDice(invokes);

    let total = last_dice.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    if (invokes?.length > 0) {
      for (const invoke of invokes) {

        if (invoke.effect === "+2") {
          total += 2;
        }

        if (invoke.effect === "reroll") {
          total = invoke.rerolled;
        }
      }
    }

    if (rollData.modifiers?.length > 0) {
      for (const mod of rollData.modifiers) {
        total += mod.value;
      }
    }

    return total;
  }

  static _getLadder(value) {

    if (value >= 8) return "Legendary";
    if (value >= 6) return "Fantastic";
    if (value >= 5) return "Superb";
    if (value >= 4) return "Great";
    if (value >= 3) return "Good";
    if (value >= 2) return "Fair";
    if (value >= 1) return "Average";
    if (value >= 0) return "Mediocre";
    if (value >= -1) return "Poor";
    if (value >= -2) return "Terrible";

    return "Catastrophic";
  }

static getCurrentDice(invokes) {
  /* const invokes = message.getFlag("fate-tools", "invokes") ?? []; */
  const reroll = invokes.filter(i => i.effect === "reroll").at(-1);
  if (reroll?.rerolledDice?.length) { return reroll.rerolledDice; }
  return ( message.getFlag("fate-tools", "rollData")?.dice ?? [] );
}}