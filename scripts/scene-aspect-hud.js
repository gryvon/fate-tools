export class SceneAspectHUD {

  static element = null;

  static render() {

    this.destroy();

    const gameAspects =
      game.fateTools.AspectManager
        .getGameAspects();

    const sceneAspects =
      game.fateTools.AspectManager
        .getSituationAspects();

    const countdowns =
      this.getCountdowns();

    const div =
      document.createElement("div");

    div.id =
      "fate-tools-scene-hud";

    div.innerHTML = `

      <h3>Game Aspects</h3>

      ${gameAspects.map(a => `
        <div>
          ${a.name}
          (${a.invokes})
        </div>
      `).join("")}

      <h3>Scene Aspects</h3>

      ${sceneAspects.map(a => `
        <div>
          ${a.name}
          (${a.invokes})
        </div>
      `).join("")}

      <h3>Countdowns</h3>

      ${ this._drawCountdownBoxes()}
    `;

    document.body.appendChild(
      div
    );

    div.querySelectorAll(
      ".fate-tools-countdown-box"
    ).forEach(box => {

      box.addEventListener(
        "click",
        async event => {

          const id =
            event.currentTarget.dataset.id;

          const index =
            Number(
              event.currentTarget.dataset.index
            );

          const countdowns =
            foundry.utils.deepClone(
              game.settings.get(
                "fate-core-official",
                "countdowns"
              )
            );

          countdowns[id].boxes[index] =
            !countdowns[id].boxes[index];

          await game.settings.set(
            "fate-core-official",
            "countdowns",
            countdowns
          );

          Hooks.callAll("fateToolsInvokesChanged");

        }
      );

    });

const players =
  document.querySelector("#players");

const bottomOffset =
  players
    ? players.offsetHeight + 10
    : 10;

div.style.bottom =
  `${bottomOffset}px`;

    this.element = div;

  }

  static destroy() {

    this.element?.remove();

    this.element = null;

  }

  static getCountdowns() {

    const countdowns =
      game.settings.get(
        "fate-core-official",
        "countdowns"
      );

    if (!countdowns) {
      return [];
    }

    return Object.values(countdowns);

  }

  static _drawCountdownBoxes() {

    const countdowns =
      game.settings.get(
        "fate-core-official",
        "countdowns"
      ) ?? {};

    const boxes =
      Object.entries(countdowns)
        .map(([id, cd]) => {

          const name =
            cd.name.replace(
              /<[^>]*>/g,
              ""
            );

    const boxHtml =
      `<div class="fate-tools-countdown-track">` +
      cd.boxes
        .map((v, i) => `
          <div
            class="fate-tools-countdown-box ${v ? "filled" : ""}"
            data-id="${id}"
            data-index="${i}"
          ></div>
        `)
        .join("")
      + `</div>`;

              return `

                <div class="fate-tools-countdown-container">

                  <div class="fate-tools-countdown-title">${name}</div>

                  <div >${boxHtml}</div>

                </div>

              `;

            })
            .join("");

    return boxes;

  }
}