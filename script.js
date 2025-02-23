let drawing = false;
let drawInstance;
let currentGlowPath;
let currentMainPath;
let startPoint;
let isCtrlPressed = false;
let endCircle = null;
let lines = []; // Mảng để lưu trữ tất cả các line đã vẽ
let isCapsLockOn = false; // Biến để theo dõi trạng thái Caps Lock

window.addEventListener("load", () => {
  lines = [];
  drawing = false;
  currentGlowPath = null;
  currentMainPath = null;
  const drawInstance = SVG("#drawing-area").size("100%", "100%");
  const defs = drawInstance.defs();

  // Kiểm tra và tạo filter glow nếu chưa tồn tại
  let glowFilter = defs.findOne("#glow");
  if (!glowFilter) {
    glowFilter = defs.element("filter", {
      id: "glow",
      filterUnits: "objectBoundingBox",
      x: "-25%",
      y: "-25%",
      width: "150%",
      height: "150%",
    });

    // Thêm GaussianBlur
    glowFilter.element("feGaussianBlur", {
      stdDeviation: "3",
      in: "SourceAlpha",
      result: "blur",
    });

    // Thêm Merge Node
    const merge = glowFilter.element("feMerge");
    merge.element("feMergeNode", { in: "blur" });
    merge.element("feMergeNode", { in: "SourceGraphic" });
  }

  // Khôi phục các đường line từ LocalStorage
  const savedLines = JSON.parse(localStorage.getItem("lines")) || [];
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

    // Vẽ lại chấm tròn ở đầu line nếu có
    if (lineData.hasStartCircle) {
      const startCircle = lineGroup.group();
      startCircle.circle(16).attr({
        cx: lineData.start.x,
        cy: lineData.start.y,
        fill: "rgba(255, 255, 255, 0.2)",
        filter: "url(#glow)",
      });
      startCircle.circle(10).attr({
        cx: lineData.start.x,
        cy: lineData.start.y,
        fill: "rgba(255, 255, 255, 0.4)",
        filter: "url(#glow)",
      });
      startCircle.circle(6).attr({
        cx: lineData.start.x,
        cy: lineData.start.y,
        fill: "#FFFFFF",
      });
    }

    lines.push(lineGroup);
    lineGroup.node.addEventListener("click", handleLineClick);
  });
});

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey) isCtrlPressed = true;
  if (e.getModifierState("CapsLock")) {
    isCapsLockOn = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (!e.ctrlKey) isCtrlPressed = false;
  if (e.key === "CapsLock") {
    isCapsLockOn = e.getModifierState("CapsLock");
  }
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
    if (!drawInstance.findOne("#glow")) {
      const glowFilter = drawInstance.filter({
        id: "glow",
        width: "150%",
        height: "150%",
        x: "-25%",
        y: "-25%",
      });
      glowFilter.feGaussianBlur({
        in: "SourceAlpha",
        stdDeviation: "3",
        result: "blur",
      });
      const feMerge = glowFilter.feMerge();
      feMerge.feMergeNode({ in: "blur" });
      feMerge.feMergeNode({ in: "SourceGraphic" });
    }
  }

  drawInstance.on("mousedown", (e) => {
    if (!drawing) return;

    // Tính toán tọa độ chính xác trong SVG
    const svgRect = drawInstance.node.getBoundingClientRect();
    startPoint = {
      x: e.clientX - svgRect.left,
      y: e.clientY - svgRect.top,
    };

    lineGroup = drawInstance.group().attr({ "data-line-group": true });

    // Vẽ chấm tròn ở đầu line nếu Caps Lock được bật
    if (isCapsLockOn) {
      const startCircle = lineGroup.group();
      startCircle.circle(16).attr({
        cx: startPoint.x,
        cy: startPoint.y,
        fill: "rgba(255, 255, 255, 0.2)",
        filter: "url(#glow)",
      });
      startCircle.circle(10).attr({
        cx: startPoint.x,
        cy: startPoint.y,
        fill: "rgba(255, 255, 255, 0.4)",
        filter: "url(#glow)",
      });
      startCircle.circle(6).attr({
        cx: startPoint.x,
        cy: startPoint.y,
        fill: "#FFFFFF",
      });
    }

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
    if (!drawing || !currentMainPath || !startPoint) return; // Thêm !startPoint

    // Tính toán endPoint tương tự như startPoint
    const svgRect = drawInstance.node.getBoundingClientRect();
    let endPoint = {
      x: e.clientX - svgRect.left,
      y: e.clientY - svgRect.top,
    };

    if (isCtrlPressed) {
      const dx = endPoint.x - startPoint.x;
      const dy = endPoint.y - startPoint.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const length = Math.sqrt(dx * dx + dy * dy);
      endPoint = snapToAngle(startPoint, angle, length);
    }

    const pathString = `M${startPoint?.x || 0},${startPoint?.y || 0} L${
      endPoint?.x || 0
    },${endPoint?.y || 0}`;
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
    if (!drawing || !lineGroup || !currentMainPath) return; // Thêm điều kiện

    const pathData = currentMainPath.array();
    if (pathData.length < 2) return; // Kiểm tra đường dẫn hợp lệ

    const start = pathData[0][1];
    const end = pathData[1][1];
    const lineData = {
      start: { x: start[0], y: start[1] },
      end: { x: end[0], y: end[1] },
      hasStartCircle: isCapsLockOn,
    };

    saveLineToStorage(lineData);
    lines.push(lineGroup);
    lineGroup.node.addEventListener("click", handleLineClick);

    if (endCircle) {
      endCircle.remove();
      endCircle = null;
    }

    currentGlowPath = null;
    currentMainPath = null;
    lineGroup = null;
  });
}

function saveLineToStorage(lineData, hasStartCircle) {
  const savedLines = JSON.parse(localStorage.getItem("lines")) || [];
  lineData.hasStartCircle = hasStartCircle; // Thêm trạng thái start circle
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

// Các phần còn lại như Menu Drop Down, Delete Line, Full Screen Feature giữ nguyên
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
  clearAllLinesFromStorage();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && currentMainPath) {
    if (lineGroup) {
      lineGroup.remove();
      lineGroup = null;
    }
    currentGlowPath = null;
    currentMainPath = null;
    if (endCircle) {
      endCircle.remove();
      endCircle = null;
    }
  }

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

const fullscreenButton = document.getElementById("fullscreen-button");

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    enterFullscreen();
  } else {
    exitFullscreen();
  }
}

function enterFullscreen() {
  const element = document.documentElement;
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

function handleFullscreenChange() {
  if (document.fullscreenElement) {
    document.body.classList.add("fullscreen-mode");
  } else {
    document.body.classList.remove("fullscreen-mode");
  }
}

fullscreenButton.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", handleFullscreenChange);
document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
document.addEventListener("mozfullscreenchange", handleFullscreenChange);
document.addEventListener("MSFullscreenChange", handleFullscreenChange);

//=============E-Ra Service================
const eraWidget = new EraWidget();
const lake = document.querySelector(".lakeClo-value");
const waterFilterPH = document.querySelector(".waterFilter-pH");
const waterFilterDoDuc = document.querySelector(".waterFilter-doDuc");
const waterFilterCloDu = document.querySelector(".waterFilter-cloDu");
const officePower = document.querySelector(".office-powerConsump");
const factoryTemp = document.querySelector(".factory-temperature");
const factoryHumid = document.querySelector(".factory-humidity");

let configLake = null,
  configwaterFilterPH = null,
  configwaterFilterDoDuc = null,
  configwaterFilterCloDu = null,
  configofficePower = null,
  configfactoryTemp = null,
  configfactoryHumid = null;
eraWidget.init({
  onConfiguration: (configuration) => {
    configLake = configuration.realtime_configs[0];
    configwaterFilterPH = configuration.realtime_configs[1];
    configwaterFilterDoDuc = configuration.realtime_configs[2];
    configwaterFilterCloDu = configuration.realtime_configs[3];
    configofficePower = configuration.realtime_configs[4];
    configfactoryTemp = configuration.realtime_configs[5];
    configfactoryHumid = configuration.realtime_configs[6];

    console.log("Configuration:", {
      configLake,
      configwaterFilterPH,
      configwaterFilterDoDuc,
      configwaterFilterCloDu,
      configofficePower,
      configfactoryTemp,
      configfactoryHumid,
    });
  },
  onValues: (values) => {
    if (configLake && values[configLake.id]) {
      const lakeValue = values[configLake.id].value;
      if (lake) lake.textContent = lakeValue;
    }

    if (configwaterFilterPH && values[configwaterFilterPH.id]) {
      const pHValue = values[configwaterFilterPH.id].value;
      if (waterFilterPH) waterFilterPH.textContent = pHValue;
    }

    if (configwaterFilterDoDuc && values[configwaterFilterDoDuc.id]) {
      const doducValue = values[configwaterFilterDoDuc.id].value;
      if (waterFilterDoDuc) waterFilterDoDuc.textContent = doducValue;
    }

    if (configwaterFilterCloDu && values[configwaterFilterCloDu.id]) {
      const cloValue = values[configwaterFilterCloDu.id].value;
      if (waterFilterCloDu) waterFilterCloDu.textContent = cloValue;
    }

    if (configofficePower && values[configofficePower.id]) {
      const powerValue = values[configofficePower.id].value;
      if (officePower) officePower.textContent = powerValue + " kWh";
    }

    if (configfactoryTemp && values[configfactoryTemp.id]) {
      const tempValue = values[configfactoryTemp.id].value;
      if (factoryTemp) factoryTemp.textContent = tempValue + "℃";
    }

    if (configfactoryHumid && values[configfactoryHumid.id]) {
      const humidValue = values[configfactoryHumid.id].value;
      if (factoryHumid) factoryHumid.textContent = humidValue + "%";
    }
  },
});
