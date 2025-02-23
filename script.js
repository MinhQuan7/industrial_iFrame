let drawing = false;
let drawInstance;
let currentGlowPath;
let currentMainPath;
let startPoint;
let isCtrlPressed = false;
let endCircle = null;
let lines = []; // Mảng để lưu trữ tất cả các line đã vẽ

// Khôi phục các đường line từ LocalStorage khi trang được tải
window.addEventListener("load", () => {
  const savedLines = JSON.parse(localStorage.getItem("lines")) || [];
  drawInstance = SVG("#drawing-area").size("100%", "100%");
  savedLines.forEach((lineData) => {
    const lineGroup = drawInstance.group().attr({ "data-line-group": true });
    const pathString = `M${lineData.start.x},${lineData.start.y} L${lineData.end.x},${lineData.end.y}`;

    // Tạo glow effect
    lineGroup.path(pathString).attr({
      fill: "none",
      stroke: "rgba(255, 255, 255, 0.4)",
      "stroke-width": 8,
      "stroke-linecap": "round",
      filter: "url(#glow)",
    });

    // Lớp giữa
    lineGroup.path(pathString).attr({
      fill: "none",
      stroke: "rgba(255, 255, 255, 0.6)",
      "stroke-width": 4,
      "stroke-linecap": "round",
      filter: "url(#glow)",
    });

    // Line chính
    const mainPath = lineGroup.path(pathString).addClass("main-line").attr({
      fill: "none",
      stroke: "#FFFFFF",
      "stroke-width": 2,
      "stroke-linecap": "round",
      "data-original-width": 2,
    });

    lines.push(lineGroup);
    lineGroup.node.addEventListener("click", handleLineClick);
  });
});

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

function startDrawing() {
  if (!drawInstance) {
    drawInstance = SVG("#drawing-area").size("100%", "100%");
  }
  let lineGroup;

  drawInstance.on("mousedown", (e) => {
    if (!drawing) return;
    startPoint = { x: e.offsetX, y: e.offsetY };

    lineGroup = drawInstance.group().attr({ "data-line-group": true });

    currentGlowPath = lineGroup.path(`M${startPoint.x},${startPoint.y}`).attr({
      fill: "none",
      stroke: "rgba(255, 255, 255, 0.4)",
      "stroke-width": 8,
      "stroke-linecap": "round",
      filter: "url(#glow)",
    });

    lineGroup.path(`M${startPoint.x},${startPoint.y}`).attr({
      fill: "none",
      stroke: "rgba(255, 255, 255, 0.6)",
      "stroke-width": 4,
      "stroke-linecap": "round",
      filter: "url(#glow)",
    });

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

    const pathString = `M${startPoint.x},${startPoint.y} L${endPoint.x},${endPoint.y}`;
    currentGlowPath.plot(pathString);
    currentMainPath.plot(pathString);

    if (endCircle) endCircle.remove();

    endCircle = drawInstance.group();
    endCircle.circle(16).attr({
      cx: endPoint.x,
      cy: endPoint.y,
      fill: "rgba(255, 255, 255, 0.2)",
      filter: "url(#glow)",
    });
    endCircle.circle(10).attr({
      cx: endPoint.x,
      cy: endPoint.y,
      fill: "rgba(255, 255, 255, 0.4)",
      filter: "url(#glow)",
    });
    endCircle.circle(6).attr({
      cx: endPoint.x,
      cy: endPoint.y,
      fill: "#FFFFFF",
    });
  });

  drawInstance.on("mouseup", () => {
    if (!drawing) return;

    if (lineGroup) {
      lines.push(lineGroup);
      lineGroup.node.addEventListener("click", handleLineClick);

      // Lưu thông tin line vào LocalStorage
      const mainPath = lineGroup.findOne(".main-line");
      const pathData = mainPath.array();
      const start = pathData[0][1];
      const end = pathData[1][1];
      const lineData = {
        start: { x: start[0], y: start[1] },
        end: { x: end[0], y: end[1] },
      };
      saveLineToStorage(lineData);
    }

    if (endCircle) {
      endCircle.remove();
      endCircle = null;
    }

    currentGlowPath = null;
    currentMainPath = null;
    lineGroup = null;
  });
}

function saveLineToStorage(lineData) {
  const savedLines = JSON.parse(localStorage.getItem("lines")) || [];
  savedLines.push(lineData);
  localStorage.setItem("lines", JSON.stringify(savedLines));
}

function removeLineFromStorage(lineData) {
  let savedLines = JSON.parse(localStorage.getItem("lines")) || [];
  savedLines = savedLines.filter(
    (line) =>
      line.start.x !== lineData.start.x ||
      line.start.y !== lineData.start.y ||
      line.end.x !== lineData.end.x ||
      line.end.y !== lineData.end.y
  );
  localStorage.setItem("lines", JSON.stringify(savedLines));
}

function clearAllLinesFromStorage() {
  localStorage.removeItem("lines");
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

  if (endCircle) {
    endCircle.remove();
    endCircle = null;
  }
}

//============Menu Drop Down Feature==============
let isSelectMode = false;
let selectedLine = null;

const hamburgerMenu = document.getElementById("hamburger-menu");
const dropdownMenu = document.getElementById("dropdown-menu");
const selectLineButton = document.getElementById("select-line-button");

hamburgerMenu.addEventListener("click", () => {
  dropdownMenu.classList.toggle("active");
});

document.addEventListener("click", (e) => {
  if (!hamburgerMenu.contains(e.target) && !dropdownMenu.contains(e.target)) {
    dropdownMenu.classList.remove("active");
  }
});
//=============Delete Line==================
function handleLineClick(e) {
  if (!isSelectMode) return;

  const lineElement = e.target.closest("g[data-line-group]");
  if (!lineElement) {
    console.error("lineElement is not a valid SVG element");
    return;
  }

  const lineGroup = SVG.adopt(lineElement);

  if (selectedLine) {
    const prevMain = selectedLine.findOne(".main-line");
    prevMain.attr({
      stroke: "#FFFFFF",
      "stroke-width": prevMain.attr("data-original-width"),
    });
  }

  selectedLine = lineGroup;
  const mainPath = selectedLine.findOne(".main-line");
  mainPath.attr({
    stroke: "green",
    "stroke-width": 4,
  });
}

document.getElementById("clear-all-button").addEventListener("click", () => {
  lines.forEach((line) => line.remove());
  lines = [];
  selectedLine = null;
  clearAllLinesFromStorage(); // Xóa tất cả khỏi LocalStorage
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Delete" && selectedLine) {
    const index = lines.indexOf(selectedLine);
    if (index > -1) lines.splice(index, 1);

    const mainPath = selectedLine.findOne(".main-line");
    const pathData = mainPath.array();
    const start = pathData[0][1];
    const end = pathData[1][1];
    const lineData = {
      start: { x: start[0], y: start[1] },
      end: { x: end[0], y: end[1] },
    };
    removeLineFromStorage(lineData);

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

  const cursorStyle = isSelectMode ? "pointer" : "default";
  lines.forEach((line) => (line.node.style.cursor = cursorStyle));
});

// ============== Full Screen Feature ===============
const fullscreenButton = document.getElementById("fullscreen-button");

// Hàm toggle full screen
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    enterFullscreen();
  } else {
    exitFullscreen();
  }
}

// Hàm vào full screen
function enterFullscreen() {
  const element = document.documentElement;

  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    /* Firefox */
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    /* Chrome, Safari & Opera */
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    /* IE/Edge */
    element.msRequestFullscreen();
  }
}

// Hàm thoát full screen
function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    /* Firefox */
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    /* Chrome, Safari & Opera */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    /* IE/Edge */
    document.msExitFullscreen();
  }
}

// Xử lý sự kiện thay đổi trạng thái full screen
function handleFullscreenChange() {
  if (document.fullscreenElement) {
    fullscreenButton.textContent = "Thoát toàn màn hình";
    document.body.classList.add("fullscreen-mode");
  } else {
    fullscreenButton.textContent = "Toàn màn hình";
    document.body.classList.remove("fullscreen-mode");
  }
}

// Thêm event listeners
fullscreenButton.addEventListener("click", toggleFullscreen);

// Theo dõi sự kiện full screen change cho các trình duyệt khác nhau
document.addEventListener("fullscreenchange", handleFullscreenChange);
document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
document.addEventListener("mozfullscreenchange", handleFullscreenChange);
document.addEventListener("MSFullscreenChange", handleFullscreenChange);
