let drawing = false;
let drawInstance;
let currentGlowPath; // Đường hào quang neon
let currentMainPath; // Đường chính
let startPoint;
let isCtrlPressed = false;

// Theo dõi phím Ctrl
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey) {
    isCtrlPressed = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (!e.ctrlKey) {
    isCtrlPressed = false;
  }
});

// Nút bắt đầu/dừng vẽ
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

function startDrawing() {
  drawInstance = SVG("#drawing-area").size("100%", "100%");

  drawInstance.on("mousedown", (e) => {
    if (!drawing) return;
    startPoint = { x: e.offsetX, y: e.offsetY };

    // Tạo đường hào quang neon
    currentGlowPath = drawInstance
      .path(`M${startPoint.x},${startPoint.y}`)
      .attr({
        fill: "none",
        stroke: "#FFFFFF ", // Màu xanh neon
        "stroke-width": 3, // Rộng để tạo hiệu ứng glow
        opacity: 0.3, // Độ mờ cho hào quang
        "stroke-linecap": "round", // Bo tròn đầu mút
      });

    // Tạo đường chính
    currentMainPath = drawInstance
      .path(`M${startPoint.x},${startPoint.y}`)
      .attr({
        fill: "none",
        stroke: "#FFFFFF", // Màu xanh neon
        "stroke-width": 3, // Mỏng hơn để làm lõi
        "stroke-linecap": "round", // Bo tròn đầu mút
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

    // Cập nhật cả hai đường
    currentGlowPath.plot(
      `M${startPoint.x},${startPoint.y} L${endPoint.x},${endPoint.y}`
    );
    currentMainPath.plot(
      `M${startPoint.x},${startPoint.y} L${endPoint.x},${endPoint.y}`
    );
  });

  drawInstance.on("mouseup", () => {
    if (!drawing) return;
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
