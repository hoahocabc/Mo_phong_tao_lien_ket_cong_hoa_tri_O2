// Mô phỏng liên kết cộng hóa trị của phân tử O2
// Tác giả: Gemini

let fontRegular;
let playButton, resetButton, instructionsButton, overlapButton, sphereButton, labelButton;
let titleDiv, footerDiv, instructionsPopup;
let atoms = [];
let state = "idle";
let progress = 0;
let bondingProgress = 0;
let cloudRotationAngle = 0;
let clSphereRotation1 = 0;
let clSphereRotation2 = 0;
let showLabels = true;
let previousState = "idle";

const slowSpinSpeed = 0.025;
const fastSpinSpeed = 0.15;
const sphereRotationSpeed = 0.02;

const oOuterRadius = 50 + 40; 
const initialShellGap = 200;
const bondedShellOverlap = 28;
const bondDistance = (oOuterRadius * 2) - bondedShellOverlap;
const orbitalOffset = 3;

const initialDistance = oOuterRadius + initialShellGap + oOuterRadius;

let panX = 0;
let panY = 0;

function preload() {
    fontRegular = loadFont('https://fonts.gstatic.com/s/opensans/v27/mem8YaGs126MiZpBA-UFVZ0e.ttf');
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    background(0);
    perspective(PI / 3, width / height, 0.1, 4000);

    smooth();
    textFont(fontRegular);
    textAlign(CENTER, CENTER);
    noStroke();

    titleDiv = createDiv("MÔ PHỎNG LIÊN KẾT CỘNG HOÁ TRỊ O₂");
    titleDiv.style("position", "absolute");
    titleDiv.style("top", "10px");
    titleDiv.style("width", "100%");
    titleDiv.style("text-align", "center");
    titleDiv.style("font-size", "18px");
    titleDiv.style("color", "#fff");
    titleDiv.style("text-shadow", "2px 2px 5px rgba(0,0,0,0.7)");
    titleDiv.style("font-family", "Arial");

    footerDiv = createDiv("© HÓA HỌC ABC");
    footerDiv.style("position", "absolute");
    footerDiv.style("bottom", "10px");
    footerDiv.style("width", "100%");
    footerDiv.style("text-align", "center");
    footerDiv.style("font-size", "16px");
    footerDiv.style("color", "#fff");
    footerDiv.style("text-shadow", "2px 2px 5px rgba(0,0,0,0.7)");
    footerDiv.style("font-family", "Arial");

    createUI();
    resetSimulation();
}

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function createUI() {
    playButton = createButton("▶ Play");
    styleButton(playButton);
    playButton.mousePressed(() => {
        if (state === "idle" || state === "sphere_spinning") {
            state = "animating";
        }
    });

    resetButton = createButton("↺ Reset");
    styleButton(resetButton);
    resetButton.mousePressed(() => {
        resetSimulation();
    });

    overlapButton = createButton("Bật xen phủ");
    styleButton(overlapButton);
    overlapButton.mousePressed(() => {
        if (state === "done") {
            state = "overlap_spinning";
            overlapButton.html("Tắt xen phủ");
            sphereButton.html("Bật lớp cầu");
        } else if (state === "overlap_spinning") {
            state = "done";
            overlapButton.html("Bật xen phủ");
        }
    });

    sphereButton = createButton("Bật lớp cầu");
    styleButton(sphereButton);
    sphereButton.mousePressed(() => {
        if (state !== "sphere_spinning") {
            previousState = state;
            state = "sphere_spinning";
            sphereButton.html("Tắt lớp cầu");
            overlapButton.html("Bật xen phủ");
        } else {
            state = previousState;
            sphereButton.html("Bật lớp cầu");
            if (state === "overlap_spinning") {
                overlapButton.html("Tắt xen phủ");
            } else {
                overlapButton.html("Bật lớp cầu");
            }
        }
    });

    labelButton = createButton("Tắt nhãn");
    styleButton(labelButton);
    labelButton.mousePressed(() => {
        showLabels = !showLabels;
        labelButton.html(showLabels ? "Tắt nhãn" : "Bật nhãn");
    });

    instructionsButton = createButton("Hướng dẫn");
    styleButton(instructionsButton, true);
    instructionsButton.mousePressed(() => {
        instructionsPopup.style('display', 'block');
    });

    instructionsPopup = createDiv();
    instructionsPopup.id('instructions-popup');
    instructionsPopup.style('position', 'fixed');
    instructionsPopup.style('top', '50%');
    instructionsPopup.style('left', '50%');
    instructionsPopup.style('transform', 'translate(-50%, -50%)');
    instructionsPopup.style('background-color', 'rgba(0, 0, 0, 0.85)');
    instructionsPopup.style('border-radius', '12px');
    instructionsPopup.style('padding', '20px');
    instructionsPopup.style('color', '#fff');
    instructionsPopup.style('font-family', 'Arial');
    instructionsPopup.style('z-index', '1000');
    instructionsPopup.style('box-shadow', '0 4px 8px rgba(0, 0, 0, 0.2)');
    instructionsPopup.style('display', 'none');

    let popupContent = `
        <h2 style="font-size: 24px; margin-bottom: 15px; text-align: center;">Hướng dẫn sử dụng</h2>
        <ul style="list-style-type: none; padding: 0;">
            <li style="margin-bottom: 10px;">• Nhấn nút "Play" để bắt đầu quá trình mô phỏng liên kết cộng hóa trị.</li>
            <li style="margin-bottom: 10px;">• Sau khi mô phỏng hoàn tất, bạn có thể sử dụng chuột để xoay và xem mô hình từ các góc khác nhau.</li>
            <li style="margin-bottom: 10px;">• Giữ phím **Ctrl** và kéo chuột trái để di chuyển toàn bộ mô hình trên màn hình.</li>
            <li style="margin-bottom: 10px;">• Sử dụng con lăn chuột để phóng to hoặc thu nhỏ.</li>
            <li style="margin-bottom: 10px;">• Nhấn nút "Reset" để quay lại trạng thái ban đầu.</li>
            <li style="margin-bottom: 10px;">• Nhấn nút "Bật xen phủ" để hiển thị đám mây electron liên kết.</li>
            <li style="margin-bottom: 10px;">• Nhấn nút "Bật lớp cầu" để hiển thị lớp electron hóa trị dưới dạng mặt cầu.</li>
            <li style="margin-bottom: 10px;">• Nhấn nút "Bật/Tắt nhãn" để hiển thị/ẩn tên nguyên tố.</li>
        </ul>
        <button id="closePopup" style="display: block; width: 100%; padding: 10px; margin-top: 20px; font-size: 16px; border: none; border-radius: 6px; background-color: #36d1dc; color: #fff; cursor: pointer;">Đóng</button>
    `;
    instructionsPopup.html(popupContent);

    document.getElementById('closePopup').addEventListener('click', () => {
        instructionsPopup.style('display', 'none');
    });

    positionButtons();
}

function styleButton(btn, isTransparent = false) {
    btn.style("width", "100px");
    btn.style("height", "30px");
    btn.style("padding", "0px");
    btn.style("font-size", "12px");
    btn.style("border-radius", "6px");
    btn.style("color", "#fff");
    btn.style("cursor", "pointer");
    btn.style("transition", "all 0.2s ease-in-out");
    btn.style("font-family", "Arial");
    btn.style("transform", "scale(1)");

    if (isTransparent) {
        btn.style("background", "rgba(0,0,0,0)");
        btn.style("border", "1px solid #fff");
        btn.style("box-shadow", "none");
    } else {
        btn.style("border", "none");
        btn.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
        btn.style("box-shadow", "3px 3px 6px rgba(0,0,0,0.4)");

        btn.mouseOver(() => {
            btn.style("background", "linear-gradient(145deg, #fc5c7d, #6a82fb)");
        });
        btn.mouseOut(() => {
            btn.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
        });
        btn.mousePressed(() => {
            btn.style("background", "linear-gradient(145deg, #8a2be2, #00ffff)");
        });
        btn.mouseReleased(() => {
            btn.style("background", "linear-gradient(145deg, #6a82fb, #fc5c7d)");
        });
    }
}

function positionButtons() {
    playButton.position(20, 20);
    resetButton.position(20, 60);
    overlapButton.position(20, 100);
    sphereButton.position(20, 140);
    labelButton.position(20, 180);
    instructionsButton.position(20, 220);
}

function resetSimulation() {
    atoms = [];
    showLabels = true;
    labelButton.html("Tắt nhãn");

    atoms.push(new Atom(-initialDistance / 2, 0, "O", 8, [2, 6], color(255, 165, 0)));
    atoms.push(new Atom(initialDistance / 2, 0, "O", 8, [2, 6], color(100, 255, 255)));

    state = "idle";
    previousState = "idle";
    progress = 0;
    bondingProgress = 0;
    cloudRotationAngle = 0;
    clSphereRotation1 = 0;
    clSphereRotation2 = 0;
    panX = 0;
    panY = 0;
    overlapButton.html("Bật xen phủ");
    sphereButton.html("Bật lớp cầu");
}

function drawBillboardText(textStr, x, y, z, size) {
    push();
    translate(x, y, z);
    textSize(size);
    text(textStr, 0, 0);
    pop();
}

function draw() {
    background(0);

    if (keyIsDown(17) && mouseIsPressed) {
        panX += (mouseX - pmouseX);
        panY += (mouseY - pmouseY);
    } else {
        orbitControl();
    }

    translate(panX, panY);

    ambientLight(80);
    pointLight(255, 255, 255, 0, 0, 300);

    let currentDist;
    if (state === "idle" || (state === "sphere_spinning" && previousState === "idle")) {
        currentDist = initialDistance;
    } else if (state === "animating") {
        progress += 0.01;
        let t_move = easeInOutQuad(progress);
        currentDist = lerp(initialDistance, bondDistance, t_move);

        if (progress >= 1) {
            progress = 1;
            state = "bonding";
        }
    } else if (state === "bonding") {
        bondingProgress += 0.02;
        currentDist = bondDistance;

        if (bondingProgress >= 1) {
            bondingProgress = 1;
            state = "done";
        }
    } else { // This covers "done", "overlap_spinning", and "sphere_spinning" after bonding
        currentDist = bondDistance;
    }

    atoms[0].pos.x = -currentDist / 2;
    atoms[1].pos.x = currentDist / 2;
    
    for (let atom of atoms) {
        push();
        translate(atom.pos.x, atom.pos.y, 0);
        atom.show();
        pop();
    }
    
    if (showLabels) {
        for (let atom of atoms) {
            atom.drawLabel();
        }
    }

    if (state === "overlap_spinning") {
        cloudRotationAngle += 0.1;
        drawElectronClouds();
    } else if (state === "sphere_spinning") {
        drawElectronSpheres();
    }
}

function drawElectronClouds() {
    // Giảm bán kính chính của torus
    const cloudRadius = atoms[0].shellRadii[1] - 10;
    const cloudWidth = 15;

    let blendedColor = lerpColor(color(255, 165, 0), color(100, 255, 255), 0.5);
    blendedColor.setAlpha(255);

    push();
    translate(atoms[0].pos.x, atoms[0].pos.y, 0);
    rotateZ(cloudRotationAngle);
    noStroke();
    fill(blendedColor);
    torus(cloudRadius, cloudWidth, 12, 12);
    pop();

    push();
    translate(atoms[1].pos.x, atoms[1].pos.y, 0);
    rotateZ(cloudRotationAngle);
    noStroke();
    fill(blendedColor);
    torus(cloudRadius, cloudWidth, 12, 12);
    pop();
}

function drawElectronSpheres() {
    clSphereRotation1 += sphereRotationSpeed;
    clSphereRotation2 += sphereRotationSpeed;

    const oOrbitalRadius = atoms[0].shellRadii[1] + 6;

    let blendedSphereColor = lerpColor(color(255, 165, 0), color(100, 255, 255), 0.5);
    blendedSphereColor.setAlpha(255);

    push();
    translate(atoms[0].pos.x, atoms[0].pos.y, 0);
    rotateY(clSphereRotation1);
    noStroke();
    fill(blendedSphereColor);
    sphere(oOrbitalRadius);
    stroke(255);
    strokeWeight(0.75);
    noFill();
    sphere(oOrbitalRadius);
    pop();

    push();
    translate(atoms[1].pos.x, atoms[1].pos.y, 0);
    rotateY(clSphereRotation2);
    noStroke();
    fill(blendedSphereColor);
    sphere(oOrbitalRadius);
    stroke(255);
    strokeWeight(0.75);
    noFill();
    sphere(oOrbitalRadius);
    pop();
}

class Atom {
    constructor(x, y, label, protons, shellCounts, electronCol) {
        this.pos = createVector(x, y, 0);
        this.label = label;
        this.protons = protons;
        this.shells = [];
        this.shellRadii = [];

        this.electronSpinSpeeds = [];

        let baseR = 50;
        let increment = 40;

        this.nonBondingPairAngles = [
            { angle: radians(90), spread: radians(5) },
            { angle: radians(270), spread: radians(5) }
        ];

        this.otherElectronCol = (electronCol.levels[0] === 255 && electronCol.levels[1] === 165) ? color(100, 255, 255) : color(255, 165, 0);

        for (let i = 0; i < shellCounts.length; i++) {
            let radius = baseR + i * increment;
            this.shellRadii.push(radius);
            let shellElectrons = [];
            for (let j = 0; j < shellCounts[i]; j++) {
                shellElectrons.push({
                    angle: (TWO_PI / shellCounts[i]) * j,
                    col: electronCol,
                    isShared: false
                });
            }
            this.shells.push(shellElectrons);

            this.electronSpinSpeeds.push(slowSpinSpeed);
        }
        
        const outerShellIndex = this.shells.length - 1;
        this.electronSpinSpeeds[outerShellIndex] = fastSpinSpeed;

        let sharedElectronCount = 0;
        for (let i = 0; i < this.shells[outerShellIndex].length && sharedElectronCount < 2; i++) {
            if (!this.shells[outerShellIndex][i].isShared) {
                this.shells[outerShellIndex][i].isShared = true;
                sharedElectronCount++;
            }
        }
    }
    
    drawLabel() {
        push();
        fill(255);
        noStroke();
        textSize(24);
        let x_pos = this.pos.x;
        let y_pos = this.shellRadii[this.shells.length - 1] + 30;
        drawBillboardText(this.label, x_pos, y_pos, 0, 24);
        pop();
    }

    show() {
        push();
        fill(255, 0, 0);
        sphere(20);

        push();
        fill(255, 255, 0);
        textSize(16);
        let xOffset = 0;
        if (this.pos.x < 0) {
            xOffset = 7;
        } else {
            xOffset = -7;
        }
        translate(xOffset, 0, 21);
        text("+" + this.protons, 0, 0);
        pop();
        pop();

        for (let i = 0; i < this.shells.length; i++) {
            noFill();
            stroke(255);
            strokeWeight(1);
            let radius = this.shellRadii[i];
            drawSmoothCircle(radius);
        }

        noStroke();

        const outerShellIndex = this.shells.length - 1;

        const sharedElectronGap = 12;
        const sharedPairGap = 12;
        const electronSize = 6;

        const finalSharedPositions_hong = [
            { x: -(sharedPairGap / 2), y: -(sharedElectronGap / 2) },
            { x: -(sharedPairGap / 2), y: (sharedElectronGap / 2) }
        ];

        const finalSharedPositions_xanh = [
            { x: (sharedPairGap / 2), y: -(sharedElectronGap / 2) },
            { x: (sharedPairGap / 2), y: (sharedElectronGap / 2) }
        ];

        let nonSharedCount = 0;
        let sharedCount = 0;

        for (let i = 0; i < this.shells.length; i++) {
            let radius = this.shellRadii[i];
            
            if ((state === "overlap_spinning" || state === "sphere_spinning") && i === outerShellIndex) {
                continue;
            }

            for (let j = 0; j < this.shells[i].length; j++) {
                let e = this.shells[i][j];
                let ex, ey;
                
                if (state === "idle" || state === "animating") {
                    e.angle += slowSpinSpeed;
                    ex = cos(e.angle) * radius;
                    ey = sin(e.angle) * radius;
                } else {
                    if (i < outerShellIndex) {
                        e.angle += this.electronSpinSpeeds[i];
                        ex = cos(e.angle) * radius;
                        ey = sin(e.angle) * radius;
                    } else {
                        let t_bonding = easeInOutQuad(bondingProgress); 
                        let initialAngle = (TWO_PI / this.shells[i].length) * j;
                        let initialX = cos(initialAngle) * radius;
                        let initialY = sin(initialAngle) * radius;

                        if (e.isShared) {
                            let finalX, finalY;
                            if (this.pos.x < 0) {
                                if (sharedCount === 0) {
                                    finalX = finalSharedPositions_hong[0].x;
                                    finalY = finalSharedPositions_hong[0].y;
                                } else {
                                    finalX = finalSharedPositions_hong[1].x;
                                    finalY = finalSharedPositions_hong[1].y;
                                }
                            } else {
                                if (sharedCount === 0) {
                                    finalX = finalSharedPositions_xanh[0].x;
                                    finalY = finalSharedPositions_xanh[0].y;
                                } else {
                                    finalX = finalSharedPositions_xanh[1].x;
                                    finalY = finalSharedPositions_xanh[1].y;
                                }
                            }
                            ex = lerp(initialX, finalX - this.pos.x, t_bonding);
                            ey = lerp(initialY, finalY, t_bonding);
                            sharedCount++;
                        } else {
                            const pair = this.nonBondingPairAngles[floor(nonSharedCount / 2)];
                            const angleDirection = (nonSharedCount % 2 === 0) ? -1 : 1;
                            let finalAngle = pair.angle + (angleDirection * pair.spread);
                            let finalX = cos(finalAngle) * radius;
                            let finalY = sin(finalAngle) * radius;
                            const horizontalShift = (this.pos.x < 0) ? 7 : -7;
                            finalX += horizontalShift;
                            ex = lerp(initialX, finalX, t_bonding);
                            ey = lerp(initialY, finalY, t_bonding);
                            nonSharedCount++;
                        }
                    }
                }

                push();
                translate(ex, ey, 0);
                fill(e.col);
                sphere(electronSize);
                if (state !== "overlap_spinning" && state !== "sphere_spinning") {
                    push();
                    fill(255);
                    drawBillboardText("-", 0, -electronSize * 2, 0, 10);
                    pop();
                }
                pop();
            }
        }
    }
}

function drawSmoothCircle(radius) {
    let numPoints = 200;
    beginShape();
    for (let i = 0; i < numPoints; i++) {
        let angle = map(i, 0, numPoints, 0, TWO_PI);
        let x = radius * cos(angle);
        let y = radius * sin(angle);
        vertex(x, y);
    }
    endShape(CLOSE);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    perspective(PI / 3, windowWidth / windowHeight, 0.1, 4000);
    positionButtons();
}