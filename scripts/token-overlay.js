const FONT_SIZE = 16;
const BOX_SIZE = 16;
const BOX_SPACING = 24;
const LABEL_WIDTH = 30;
const ROW_HEIGHT = 24;
const PADDING = 20;
const LEFT_MARGIN = 0;

export class TokenOverlayManager {

  static renderedOverlays =
    new Map();

  static drawAll() {

    this.clear();

    for (const token of canvas.tokens.placeables) {

      if (!token.actor) continue;
      if (!token.hover && !token.controlled) continue;

      const overlay = new TokenOverlay(token);

      const nameplateOffset = token.nameplate?.visible ? token.nameplate.height : 0;

      const bounds = overlay.getLocalBounds();

      overlay.x = Math.round(token.x + (token.w / 2) - (bounds.width / 2) - bounds.x);

      //overlay.x = Math.round(token.x + (token.w / 2) - (overlay.width / 2));
      overlay.y = Math.round(token.y + token.h + 5 + nameplateOffset);

      canvas.fateTools.addChild(
        overlay
      );

      this.renderedOverlays.set(
        token.id,
        overlay
      );

    }

  }

  static clear() {

    for (const overlay of this.renderedOverlays.values()) {

      overlay.destroy({
        children: true
      });

    }

    this.renderedOverlays.clear();

  }

}

export class TokenOverlay extends PIXI.Container {

  constructor(token) {

    super();

    this.token = token;

    this.draw();

  }

  draw() {

    this.removeChildren();

    const tracks =
      this.token.actor.system.tracks;

    let y = 7;

    // Draw stress tracks

    for (const [trackId, track] of Object.entries(tracks)) {

      if (track.boxes > 0) {

        this._drawStressTrack(
          trackId,
          track,
          y
        );

        y += ROW_HEIGHT;

      }

    }

    // Build consequence text

    const lines = [];

    for (const track of Object.values(tracks)) {

      if (
        track.aspect &&
        track.aspect.name?.trim()
      ) {

        lines.push(
          `${track.name.replace(" Consequence", "")}: ${track.aspect.name}`
        );

      }

    }

    // Draw consequences

    if (lines.length) { 
      const text =
        new PIXI.Text(
          lines.join("\n"),
          {
            fill: 0xCCCCCC,
            fontSize: FONT_SIZE - 2
          }
        );

      text.x = LEFT_MARGIN;
      text.y = y + 4;

      text.x = Math.round(text.x);
      text.y = Math.round(text.y);

      this.addChild(text);
    }

    // Background LAST

    const bg =
      new PIXI.Graphics();

    bg.beginFill(
      0x000000,
      0.5
    );

    bg.drawRoundedRect(
      -PADDING,
      -2,
      this.width + (PADDING * 2),
      this.height + PADDING + 2,
      4
    );

    bg.endFill();

    this.addChildAt(bg, 0);

  }

  _drawStressTrack(
    trackId,
    track,
    y
  ) {

    const label =
      new PIXI.Text(
        track.name.charAt(0),
        {
          fill: 0xFFFFFF,
          fontSize: FONT_SIZE
        }
      );

    label.x = LEFT_MARGIN;
    label.y = y;


    label.x = Math.round(label.x);
    label.y = Math.round(label.y);

    this.addChild(label);

    let x = LABEL_WIDTH;

    for (
      let i = 0;
      i < track.boxes;
      i++
    ) {

      const box =
        new PIXI.Graphics();

      box.lineStyle(
        1,
        0xFFFFFF
      );

      if (track.box_values[i]) {

        box.beginFill(
          0x00AA00
        );

      }

      box.drawRect(
        0,
        0,
        BOX_SIZE,
        BOX_SIZE
      );

      box.endFill();

      box.x = x;
      box.y = y + 1;

      box.eventMode = "static";
      box.cursor = "pointer";

      box.on("pointerdown", async () => {
        const values =
          [...track.box_values];

        values[i] =
          !values[i];

        await this.token.actor.update({
          [`system.tracks.${trackId}.box_values`]:
            values
        });
      });

      box.hitArea =
        new PIXI.Rectangle(
          0,
          0,
          BOX_SIZE,
          BOX_SIZE
        );

      this.addChild(box);

      x += BOX_SPACING;

    }

  }

  async _updateStress(track, box_values) {
    const values = [...tack.box]
  }

}