let drawing = false;
let drawInstance;
let currentGlowPath;
let currentMainPath;
let startPoint;
let isCtrlPressed = false;
let endCircle = null;

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey) isCtrlPressed = true;
});

document.addEventListener("keyup", (e) => {
  if (!e.ctrlKey) isCtrlPressed = false;
});

document.getElementById("draw-button").addEventListener("click", () => {
  drawing = !drawing;
  if (drawing) {
    document.getElementById("draw-button").textContent = "Dừng vẽ";
    startDrawing();
  } else {
    document.getElementById("draw-button").textContent = "Bắt đầu vẽ";
    stopDrawing();
  }
});

function createNeonEffect(path, color, width, blur) {
  path.attr({
    filter: drawInstance
      .defs()
      .element("filter")
      .attr({
        id: `glow-${Date.now()}`,
        x: "-50%",
        y: "-50%",
        width: "200%",
        height: "200%",
      })
      .element("feGaussianBlur")
      .attr({
        result: "blur",
        stdDeviation: blur,
      }),
  });
}

function startDrawing() {
  drawInstance = SVG("#drawing-area").size("100%", "100%");

  drawInstance.on("mousedown", (e) => {
    if (!drawing) return;
    startPoint = { x: e.offsetX, y: e.offsetY };

    // Create outer glow
    currentGlowPath = drawInstance
      .path(`M${startPoint.x},${startPoint.y}`)
      .attr({
        fill: "none",
        stroke: "rgba(255, 255, 255, 0.4)",
        "stroke-width": 8,
        "stroke-linecap": "round",
        filter: "url(#glow)",
      });

    // Create middle layer
    let middleGlow = drawInstance
      .path(`M${startPoint.x},${startPoint.y}`)
      .attr({
        fill: "none",
        stroke: "rgba(255, 255, 255, 0.6)",
        "stroke-width": 4,
        "stroke-linecap": "round",
        filter: "url(#glow)",
      });

    // Create core line
    currentMainPath = drawInstance
      .path(`M${startPoint.x},${startPoint.y}`)
      .attr({
        fill: "none",
        stroke: "#FFFFFF",
        "stroke-width": 2,
        "stroke-linecap": "round",
      });

    // Create filter for glow effect
    let filter = drawInstance
      .defs()
      .element("filter")
      .attr({
        id: "glow",
      })
      .element("feGaussianBlur")
      .attr({
        stdDeviation: "3",
        result: "coloredBlur",
      });
  });

  drawInstance.on("mousemove", (e) => {
    if (!drawing || !currentMainPath) return;
    let endPoint = { x: e.offsetX, y: e.offsetY };

    if (isCtrlPressed) {
      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const length = Math.sqrt(dx * dx + dy * dy);
      endPoint = snapToAngle(startPoint, angle, length);
    }

    // Update all paths
    const pathString = `M${startPoint.x},${startPoint.y} L${endPoint.x},${endPoint.y}`;
    currentGlowPath.plot(pathString);
    currentMainPath.plot(pathString);

    // Remove previous end circle if it exists
    if (endCircle) endCircle.remove();

    // Create end circle with glow
    endCircle = drawInstance.group();

    // Outer glow circle
    endCircle.circle(16).attr({
      cx: endPoint.x,
      cy: endPoint.y,
      fill: "rgba(255, 255, 255, 0.2)",
      filter: "url(#glow)",
    });

    // Middle glow circle
    endCircle.circle(10).attr({
      cx: endPoint.x,
      cy: endPoint.y,
      fill: "rgba(255, 255, 255, 0.4)",
      filter: "url(#glow)",
    });

    // Core circle
    endCircle.circle(6).attr({
      cx: endPoint.x,
      cy: endPoint.y,
      fill: "#FFFFFF",
    });
  });

  drawInstance.on("mouseup", () => {
    if (!drawing) return;
    // Keep the end circle visible after mouseup
    endCircle = null;
    currentGlowPath = null;
    currentMainPath = null;
  });
}

function snapToAngle(start, angle, length) {
  const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  let closestAngle = snapAngles[0];
  let minDiff = Math.abs(angle - snapAngles[0]);

  for (let i = 1; i < snapAngles.length; i++) {
    const diff = Math.abs(angle - snapAngles[i]);
    if (diff < minDiff) {
      minDiff = diff;
      closestAngle = snapAngles[i];
    }
  }

  const radian = closestAngle * (Math.PI / 180);
  const adjustedX = start.x + length * Math.cos(radian);
  const adjustedY = start.y + length * Math.sin(radian);
  return { x: adjustedX, y: adjustedY };
}

function stopDrawing() {
  drawInstance.off("mousedown");
  drawInstance.off("mousemove");
  drawInstance.off("mouseup");
}
