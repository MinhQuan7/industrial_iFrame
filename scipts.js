let drawing = false;
let drawInstance;
let currentGlowPath;
let currentMainPath;
let startPoint;
let isCtrlPressed = false;
let endCircle = null;
let lines = []; // Mảng để lưu trữ tất cả các line đã vẽ

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
  let lineGroup;

  drawInstance.on("mousedown", (e) => {
    if (!drawing) return;
    startPoint = { x: e.offsetX, y: e.offsetY };

    // Tạo group chứa các thành phần của line
    lineGroup = drawInstance.group().attr({ "data-line-group": true });

    // Tạo glow effect
    currentGlowPath = lineGroup.path(`M${startPoint.x},${startPoint.y}`).attr({
      fill: "none",
      stroke: "rgba(255, 255, 255, 0.4)",
      "stroke-width": 8,
      "stroke-linecap": "round",
      filter: "url(#glow)",
    });

    // Lớp giữa
    lineGroup.path(`M${startPoint.x},${startPoint.y}`).attr({
      fill: "none",
      stroke: "rgba(255, 255, 255, 0.6)",
      "stroke-width": 4,
      "stroke-linecap": "round",
      filter: "url(#glow)",
    });

    // Line chính
    currentMainPath = lineGroup
      .path(`M${startPoint.x},${startPoint.y}`)
      .addClass("main-line")
      .attr({
        fill: "none",
        stroke: "#FFFFFF",
        "stroke-width": 2,
        "stroke-linecap": "round",
        "data-original-width": 2,
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

    // Lưu line vào mảng quản lý
    if (lineGroup) {
      lines.push(lineGroup);
      lineGroup.node.addEventListener("click", handleLineClick);
    }

    // Reset các biến
    endCircle = null;
    currentGlowPath = null;
    currentMainPath = null;
    lineGroup = null;
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

//============Menu Drop Down Feature==============
let isSelectMode = false;
let selectedLine = null; // Line đang được chọn

// Xử lý menu hamburger
const hamburgerMenu = document.getElementById("hamburger-menu");
const dropdownMenu = document.getElementById("dropdown-menu");
const selectLineButton = document.getElementById("select-line-button");

hamburgerMenu.addEventListener("click", () => {
  dropdownMenu.classList.toggle("active");
});

// Đóng menu khi click ra ngoài
document.addEventListener("click", (e) => {
  if (!hamburgerMenu.contains(e.target) && !dropdownMenu.contains(e.target)) {
    dropdownMenu.classList.remove("active");
  }
});

// ============ Chức năng chọn và xóa line ============
function handleLineClick(e) {
  if (!isSelectMode || !e.target.closest("[data-line-group]")) return;

  const lineElement = e.target.closest("[data-line-group]");
  const lineGroup = SVG.get(lineElement);

  // Bỏ chọn line cũ
  if (selectedLine) {
    const prevMain = selectedLine.findOne(".main-line");
    prevMain.attr("stroke-width", prevMain.attr("data-original-width"));
  }

  // Chọn line mới
  selectedLine = lineGroup;
  const mainPath = selectedLine.findOne(".main-line");
  mainPath.attr("data-original-width", mainPath.attr("stroke-width"));
  mainPath.attr("stroke-width", 4); // Hiệu ứng phóng to
}

// ============ Chức năng xóa toàn bộ line ============
document.getElementById("clear-all-button").addEventListener("click", () => {
  lines.forEach((line) => line.remove());
  lines = [];
  selectedLine = null;
});

// Thêm sự kiện bàn phím để xóa line
document.addEventListener("keydown", (e) => {
  if (e.key === "Delete" && selectedLine) {
    // Xóa khỏi mảng quản lý
    const index = lines.indexOf(selectedLine);
    if (index > -1) lines.splice(index, 1);

    selectedLine.remove();
    selectedLine = null;
  }
});

selectLineButton.addEventListener("click", () => {
  isSelectMode = !isSelectMode;
  selectLineButton.classList.toggle("active");
  selectLineButton.textContent = isSelectMode
    ? "Đang chọn line"
    : "Chọn line để xóa";

  // Thêm/xóa hiệu ứng cursor
  const cursorStyle = isSelectMode ? "pointer" : "default";
  lines.forEach((line) => (line.node.style.cursor = cursorStyle));
});
