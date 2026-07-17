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

      ${countdowns.map(cd => {

        if (cd.visible !== "visible")
          return "";

        const name =
          cd.name.replace(
            /<[^>]*>/g,
            ""
          );

        const boxes =
          cd.boxes
            .map(v =>
              v ? "■" : "□"
            )
            .join(" ");

        return `

          <div class="fate-tools-countdown">

            <div>
              ${name}
            </div>

            <div>
              ${boxes}
            </div>

          </div>

        `;

      }).join("")}

    `;

    document.body.appendChild(
      div
    );

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
}