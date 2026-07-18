export class ActiveAspects {

  static _instance = null;

  static async show() {

    if(this._instance) {this._instance.bringToTop(); return; }

    let content = await this.getContent()

    const dialog = new Dialog({
      title: "Active Aspects",
      content,
      buttons: {
        close: {
          label: "Close"
        }
      },
      default: "close",
      close: () => { ActiveAspects._instance = null; }
    });

    this._instance = dialog;
    dialog.render(true);

    Hooks.once("renderDialog", (app, html) => { this._attachHandlers(app, html); }
      );

  }

  static async getContent() {

    const invokeContext = game.fateTools.pendingInvoke;

    let content = "";

    if (invokeContext) {
      const msg = game.messages.get(invokeContext.messageId);

      content += `
      <div class="invoke-context">

        <h2>
          Invoking With
        </h2>

        <p>
          ${msg.speaker.alias}
        </p>

        <p>
          Current Roll:
          ${msg.rolls[0].total}
        </p>

      </div>

      <hr>
      `;

    }

    const aspects = await game.fateTools.AspectManager.getSceneAspects();

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

  for (const group of Object.values(groups)) {

    content += `
      <h2>${group.sourceName}</h2>

      <ul>

        ${group.aspects.map(a => {

          const invokeButton =
          invokeContext
          ? `
                  <a
                    class="invoke-aspect"
                    data-key="${game.fateTools.AspectManager.getAspectKey(a)}"
                  >
                    <i class="fa-solid fa-bolt-lightning"></i>
                    Invoke
                  </a>
            `
            : "";

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

                ${invokeButton}

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

              ${invokeButton}

            </li>

                `;

                }).join("")}

      </ul>
              `;

            }

            return content;

          }

          static async refresh() {
            if (!this._instance) { return; }
            const content = await this.getContent();
            const html = this._instance.element;
            html.find(".dialog-content").html(content);
            this._attachHandlers(this._instance, html);
          }

          static _attachHandlers(app, html) {
            html.find(".invoke-plus").click(
              async event => {
                const key = event.currentTarget.dataset.key;
                const aspect = await game.fateTools.AspectManager.getAspectByKey(key);
                if (!aspect) { return; }
                await game.fateTools.AspectManager.setInvokes(aspect, aspect.invokes + 1);
                await game.fateTools.ActiveAspects.refresh();
              }
              );

            html.find(".invoke-minus").click(
              async event => {
                const key = event.currentTarget.dataset.key;
                const aspect = await game.fateTools.AspectManager.getAspectByKey(key);
                if (!aspect) return;
                await game.fateTools.AspectManager.setInvokes(aspect, Math.max(0, aspect.invokes - 1));
                await game.fateTools.ActiveAspects.refresh();
              }
              );

            html.find(".invoke-aspect").click(
              async event => {
                const key = event.currentTarget.dataset.key;
                const aspect = await game.fateTools.AspectManager.getAspectByKey(key);
                if (!aspect) return;
                await game.fateTools.AspectManager.invoke(aspect);
              }
              );
          }
        }