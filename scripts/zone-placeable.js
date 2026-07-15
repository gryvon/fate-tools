export class ZonePlaceable extends PIXI.Container {

  constructor(data) {
    super();

    this.zoneData = data;

    this.dragging = false;
    this.dragOffset = null;

    this.resizing = false;
    this.resizeOffset = null;

    this.stressGraphics = [];

    this.eventMode = "static";

    this.interactive = true;
    this.cursor = "move";

    this._boundDragMove =
      this._onDragMove.bind(this);

    this._boundDragEnd =
      this._onDragEnd.bind(this);

    this.on(
      "pointerdown",
      this._onDragStart.bind(this)
    );

    this.on(
      "rightdown",
      this._onConfigure.bind(this)
    );

    canvas.stage.on(
      "pointermove",
      this._boundDragMove
    );

    canvas.stage.on(
      "pointerup",
      this._boundDragEnd
    );

    canvas.stage.on(
      "pointerupoutside",
      this._boundDragEnd
    );

    this.on(
    "pointerover",
    this._onHoverIn.bind(this)
    );

    this.on(
    "pointerout",
    this._onHoverOut.bind(this)
    );

    this.isHovered = false;

  }

  draw() {

    const scale = this._getUIScale();

    this.removeChildren();

    this.stressGraphics = [];

    this._drawBackground();
    this._drawTitle();
    this._drawStress();
    this._drawAspects();
    this._drawConsequences();
    this._drawResizeHandle();

    return this;
  }

  _drawBackground() {

    const scale = this._getUIScale();

    const bg = new PIXI.Graphics();

    /* bg.lineStyle(2, 0xFFFFFF, 1); */

    if (!this.zoneData.color)
      this.zoneData.color = "#FFFFFF"

    bg.lineStyle(
      2,
      PIXI.utils.string2hex(
        this.zoneData.color
      ),
      1
    );

    const fillAlpha =
      this.isHovered ? 0.9 : 0.4;

    bg.beginFill(
      0x000000,
      fillAlpha
    );

    const height =
      this._getCalculatedHeight();

      this.zoneData.height = height;

      bg.drawRoundedRect(
        0,
        0,
        this.zoneData.width,
        height,
        6
      );

        bg.endFill();

        this.addChild(bg);

        this.background = bg;
      }

  _drawTitle() {

    const scale = this._getUIScale();

    const titleBg =
    new PIXI.Graphics();

    titleBg.beginFill(
    PIXI.utils.string2hex(
    this.zoneData.color
    ),
    0.3
    );

    titleBg.drawRoundedRect(
      5 * scale,
      5 * scale,
      this.zoneData.width - (10 * scale),
      24 * scale,
      4 * scale
    );

    titleBg.endFill();

    this.addChild(titleBg);


    const text = new PIXI.Text(
      this.zoneData.name,
      {
        fill: this.zoneData.color,
      
        fontSize: Math.round(
          18 * scale
        ),

        fontWeight: "bold"
      }
    );

    text.x = 10 * scale;
    text.y = 5 * scale;

    this.addChild(text);

    this.titleText = text;
  }

  _drawStress() {

    const scale = this._getUIScale();

    if (!this.zoneData.enableStress)
      return;

    const stress = this.zoneData.stress || [];

    const boxSize = Math.round(18 * scale);
    const spacing = Math.round(24 * scale);
    const totalWidth = ((this.zoneData.stressBoxes - 1) * spacing) + boxSize;
    const startX = (this.zoneData.width - totalWidth) / 2;

    for (let i = 0; i < this.zoneData.stressBoxes; i++) {

      const checked = stress[i] ?? false;

      const box = new PIXI.Graphics();

      box.lineStyle(2, 0xFFFFFF, 1);

      if (checked) {
        box.beginFill(0xFFFFFF, 1);
      }

      box.drawRect(
        0,
        0,
        boxSize,
        boxSize
      );

      if (checked) {
        box.endFill();
      }

      box.x = startX + (i * spacing);

      box.y = 35 * scale;

      box.eventMode = "static";
      box.interactive = true;
      box.buttonMode = true;

      box.hitArea =
        new PIXI.Rectangle(
          0,
          0,
          boxSize,
          boxSize
        );

      box.on("pointertap", (event) => {

        event.stopPropagation();

        this._onStressClicked(i);

      }); 

      box.on("pointerover", () => {

      box.alpha = 1;


      });

      box.on("pointerout", () => {

      box.alpha = 0.7;

      });


      this.addChild(box);

      this.stressGraphics.push(box);
    }
  }

  async _onStressClicked(index) {

    if (!game.user.isGM) return;

    const stress = [
      ...this.zoneData.stress
    ];

    stress[index] = !stress[index];

    this.zoneData.stress = stress;

    await game.fateZones
      .ZoneManager
      .updateZone(
        this.zoneData.id,
        { stress }
      );

    this.draw();
  }

   _onDragStart(event) {

    event.stopPropagation();

    if (!game.user.isGM) return;

    this.dragging = true;

    const pos = event.data.getLocalPosition(
      canvas.stage
    );

    this.dragOffset = {
      x: pos.x - this.x,
      y: pos.y - this.y
    };

  }

  _onDragMove(event) {
    if (this.resizing) {

      const pos =
        event.data.getLocalPosition(
          canvas.stage
        );

      this.zoneData.width =
        Math.max(
          150,
          pos.x - this.x
        );

      this.draw();

      return;
    }

    if (!this.dragging) return;

    const pos =
      event.data.getLocalPosition(
        canvas.stage
      );

    this.x =
      pos.x -
      this.dragOffset.x;

    this.y =
      pos.y -
      this.dragOffset.y;

  }

  async _onDragEnd() {

    if (this.resizing) {

      this.resizing = false;

      await game.fateZones
        .ZoneManager
        .updateZone(
          this.zoneData.id,
          {
            width:
              this.zoneData.width
          }
        );

      return;
    }

    if (!this.dragging) return;

    this.dragging = false;

    await game.fateZones
      .ZoneManager
      .updateZone(
        this.zoneData.id,
        {
          x: this.x,
          y: this.y
        }
      );
  }
 
  _onConfigure(event) {

    event.stopPropagation();

    if (!game.user.isGM) return;

    new game.fateZones.ZoneConfig(
      this
    ).render(true);
  }

  _drawAspects() {

    const scale = this._getUIScale();

    if (
      !this.zoneData.enableAspects ||
      !this.zoneData.aspects?.length
    ) return;

    let y = 35 * scale;

    if (this.zoneData.enableStress) {
      y += 30 * scale;
    }

    const header = new PIXI.Text(
      "★ Aspects",
      {
        fill: "#FFD700",
        fontSize: Math.round(14 * this._getUIScale()),
        fontWeight: "bold"
      }
    );

    header.x = 10;
    header.y = y;

    this.addChild(header);

    y += 20 * scale;

    for (const aspect of this.zoneData.aspects) {

      const text = new PIXI.Text(
        `• ${aspect}`,
        {
          fill: "#FFFFFF",
          fontSize: Math.round(12 * this._getUIScale()),

          wordWrap: true,

        wordWrapWidth:
          this.zoneData.width - 30
        }
      );

      text.x = 15 * scale;
      text.y = y;

      this.addChild(text);

      y += text.height + 2;
    }
  }

  _drawConsequences() {

    const scale = this._getUIScale();

    if (
      !this.zoneData.enableConsequences ||
      !this.zoneData.consequences?.length
    ) return;

    let y = 35 * scale;

    if (this.zoneData.enableStress) {
      y += 30 * scale;
    }

    // Move below aspects if they exist
    if (
      this.zoneData.enableAspects &&
      this.zoneData.aspects?.length
    ) {

      y += 20 * scale; // Aspects header

      for (const aspect of this.zoneData.aspects) {

        const tempText = new PIXI.Text(
          `• ${aspect}`,
          {
            fill: "#FFFFFF",
            fontSize: Math.round(12 * this._getUIScale()),

            wordWrap: true,

            wordWrapWidth:
              this.zoneData.width - 30
          }
        );

        y += tempText.height + 2;
      }

      y += 10 * scale;
    }

    const header = new PIXI.Text(
      "⚠ Consequences",
      {
        fill: "#FF6666",
        fontSize: Math.round(14 * this._getUIScale()),
        fontWeight: "bold"
      }
    );

    header.x = 10 * scale;
    header.y = y;

    this.addChild(header);

    y += 20 * scale;

    for (const consequence of this.zoneData.consequences) {

      const text = new PIXI.Text(
        `• ${consequence}`,
        {
          fill: "#FFFFFF",
          fontSize: Math.round(12 * this._getUIScale()),

          wordWrap: true,

          wordWrapWidth:
            this.zoneData.width - 30
        }
      );

      text.x = 15 * scale;
      text.y = y;

      this.addChild(text);

      y += text.height + 2;
    }

  }

  _getCalculatedHeight() {

    const scale = this._getUIScale();

    let height = 35 * scale;

    if (this.zoneData.enableStress) {
      height += 30 * scale;
    }

    if (
      this.zoneData.enableAspects &&
      this.zoneData.aspects?.length
    ) {

      height += 20 * scale;

      for (const aspect of this.zoneData.aspects) {

        const text = new PIXI.Text(
          `• ${aspect}`,
          {
            fill: "#FFFFFF",

            fontSize: Math.round(
              12 * scale
            ),

            wordWrap: true,

            wordWrapWidth:
              this.zoneData.width - 30
          }
        );

        height += text.height + 2;
      }

      height += 10 * scale;
    }

    if (
      this.zoneData.enableConsequences &&
      this.zoneData.consequences?.length
    ) {

      height += 20 * scale;

      for (const consequence of this.zoneData.consequences) {

        const text = new PIXI.Text(
          `• ${consequence}`,
          {
            fill: "#FFFFFF",

            fontSize: Math.round(
              12 * scale
            ),

            wordWrap: true,

            wordWrapWidth:
              this.zoneData.width - 30
          }
        );

        height += text.height + 2;
      }

      height += 10 * scale;
    }

    return Math.max(height, 100);
  }

  _drawResizeHandle() {

    const handle = new PIXI.Graphics();

    handle.lineStyle(
      2,
      0xFFFFFF,
      1
    );

    handle.moveTo(0, 12);
    handle.lineTo(12, 0);

    handle.moveTo(4, 12);
    handle.lineTo(12, 4);

    handle.moveTo(8, 12);
    handle.lineTo(12, 8);

    handle.x =
      this.zoneData.width - 16;

    handle.y =
      this.zoneData.height - 16;

    handle.hitArea = new PIXI.Rectangle(
      0,
      0,
      16,
      16
    );

    handle.eventMode = "static";
    handle.interactive = true;
    handle.cursor = "nwse-resize";

    handle.on(
      "pointerdown",
      this._onResizeStart.bind(this)
    );

    this.addChild(handle);

    this.resizeHandle = handle;
  }

  _onResizeStart(event) {

    event.stopPropagation();

    if (!game.user.isGM) return;

    this.resizing = true;

  }

  _onHoverIn() {
    this.isHovered = true;
    this.draw();
  }

  _onHoverOut() {
    this.isHovered = false;
    this.draw();
  }

  _getUIScale() {

    return Math.max(
      0.75,
      this.zoneData.width / 300
    );

  }

}

