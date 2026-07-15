export class ActiveAspects {

  static async show() {

    const aspects =
      await game.fateTools
        .AspectManager
        .getSceneAspects();

    const groups = {};

    for (const aspect of aspects) {

    const key =
      `${aspect.sourceId}`;

      if (!groups[key]) {

        groups[key] = {
          sourceType: aspect.sourceType,
          sourceName: aspect.sourceName,
          aspects: []
        };

      }

      groups[key].aspects.push(aspect);

    }

    const regularAspects =
      aspects.filter(
        a => a.type === "aspect"
      );

    const consequences =
      aspects.filter(
        a => a.type === "consequence"
      );

    let content = "";

    for (const group of Object.values(groups)) {

      content += `
        <h2>${group.sourceName}</h2>

        <ul>

      ${group.aspects.map(a => {

        if (a.type === "consequence") {

          const severity =
            a.severity.replace(
              " Consequence",
              ""
            );

          return `
            <li>
              [Consequence]
              [${severity}]
              ${a.name}
              <a
                class="invoke-minus"
                data-key="${game.fateTools.AspectManager.getAspectKey(a)}"
              >
                -
              </a>

              ${a.invokes}

              <a
                class="invoke-plus"
                data-key="${game.fateTools.AspectManager.getAspectKey(a)}"
              >
                +
              </a>
            </li>
          `;
        }

        return `
          <li>
            [Aspect]
            ${a.name}
            <a
              class="invoke-minus"
              data-key="${game.fateTools.AspectManager.getAspectKey(a)}"
            >
              -
            </a>

            ${a.invokes}

            <a
              class="invoke-plus"
              data-key="${game.fateTools.AspectManager.getAspectKey(a)}"
            >
              +
            </a>
          </li>
        `;

      }).join("")}

        </ul>
      `;

    }

    const dialog = new Dialog({
      title: "Active Aspects",

      content,

      buttons: {
        close: {
          label: "Close"
        }
      },

      default: "close"

    });

    dialog.render(true);

    Hooks.once(
      "renderDialog",
      (app, html) => {

        html.find(".invoke-plus").click(
          async event => {

            const key =
              event.currentTarget
                .dataset.key;

            console.log("Clicked:", key);
            

            const aspect =
              await game.fateTools
                .AspectManager
                .getAspectByKey(key);

            console.log("Aspect:", aspect);

            if (!aspect) return;

            await game.fateTools
              .AspectManager
              .setInvokes(
                aspect,
                aspect.invokes + 1
              );

            app.close();

            game.fateTools
              .ActiveAspects
              .show();

          }
        );
        
        html.find(".invoke-minus").click(
          async event => {

            const key =
              event.currentTarget
                .dataset.key;

            const aspect =
              await game.fateTools
                .AspectManager
                .getAspectByKey(key);

            if (!aspect) return;

            await game.fateTools
              .AspectManager
              .setInvokes(
                aspect,
                Math.max(
                  0,
                  aspect.invokes - 1
                )
              );

            app.close();

            game.fateTools
              .ActiveAspects
              .show();

          }
        );
      }
    );

  }

}