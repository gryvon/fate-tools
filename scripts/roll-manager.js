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

    return `
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
  }

  static _renderHeader(rollData) {

    return `
      <div class="ft-roll-header">

        ${rollData.skill}

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

    html += rollData.modifiers
      .map(mod => `

        <div class="ft-roll-row">

          <span>
            ${mod.name}
          </span>

          <span>
            ${mod.value >= 0 ? "+" : ""}
            ${mod.value}
          </span>

        </div>

      `)
      .join("");

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

        ${reroll.rerolledDice
          .map(d => this._renderDie(d))
          .join("")}

      </div>

    </div>

  `;

}

  static _calculateTotal(rollData, invokes) {

    let total = rollData.total;

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
}