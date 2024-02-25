// Copyright 2023 The MediaPipe Authors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//      http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
const demosSection = document.getElementById("demos");
let handLandmarker = undefined;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;


// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
        },
        runningMode: runningMode,
        numHands: 2
    });
    demosSection.classList.remove("invisible");
};
createHandLandmarker();
/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/
// flip the wwb cam
document.getElementById("webcam").style.transform = "scaleX(-1)";

const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");


// Check if webcam access is supported.
const hasGetUserMedia = () => { var _a; return !!((_a = navigator.mediaDevices) === null || _a === void 0 ? void 0 : _a.getUserMedia); };
// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
}
else {
    console.warn("getUserMedia() is not supported by your browser");
}
// Enable the live webcam view and start detection.
function enableCam(event) {
    if (!handLandmarker) {
        console.log("Wait! objectDetector not loaded yet.");
        return;
    }
    if (webcamRunning === true) {
        webcamRunning = false;
        enableWebcamButton.innerText = "ENABLE PREDICTIONS";
    }
    else {
        webcamRunning = true;
        enableWebcamButton.innerText = "DISABLE PREDICTIONS";
    }
    // getUsermedia parameters.
    const constraints = {
        video: true
    };
    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
    });
}

function calculateDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

let lastVideoTime = -1;
let results = undefined;

const newCanvas = document.getElementById("draw_canvas");
const newCtx = newCanvas.getContext("2d");


const fingertipIndex = 8; // Adjust based on your model (index finger)

const points = [];

const CLEAR = false;

//button function
const clearButton = document.getElementById('clearButton');
clearButton.addEventListener('click', handleClearButtonClick);
function handleClearButtonClick() {
    CLEAR = true;
}

function drawPoint(x, y) {
    newCtx.beginPath();
    newCtx.arc(x*video.videoWidth, y*video.videoHeight, 10, 0, Math.PI * 2);
    newCtx.fill();
}

function drawFingertipTrace(fingertip) {
    // Store previous fingertip positions for tracing
    // Draw trace line from previous position (if available)
    points.push([fingertip.x*video.videoWidth,fingertip.y*video.videoHeight]); // Store the point
    if(CLEAR){
        points = [];
        CLEAR = false;
    }

    if (points.length < 2) return; // Need at least 2 points to draw a line
    newCtx.beginPath();
    newCtx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        newCtx.lineTo(points[i][0], points[i][1]);
    }
    newCtx.stroke();
}

function calculateFingerDistance(finger1, finger2) {
    const dx = (finger2.x - finger1.x)*video.videoWidth;
    const dy = (finger2.y - finger1.y)*video.videoHeight;
    return Math.sqrt(Math.abs(dx * dx + dy * dy));
}

function checkrange(thumbTip, indexFingerTip, middleFingerTip, range) {
    // Calculate distances between finger tips
    const distanceThumbIndex = calculateFingerDistance(thumbTip, indexFingerTip);
    const distanceThumbMiddle = calculateFingerDistance(thumbTip, middleFingerTip);
    const distanceIndexMiddle = calculateFingerDistance(indexFingerTip, middleFingerTip);

    // Check if all distances are within the specified range
    return distanceThumbIndex <= range && distanceThumbMiddle <= range && distanceIndexMiddle <= range;
}




async function predictWebcam() {
    newCanvas.style.width = video.videoWidth;
    newCanvas.style.height = video.videoHeight;
    newCanvas.width = video.videoWidth;
    newCanvas.height = video.videoHeight;

    canvasElement.style.width = video.videoWidth;
    canvasElement.style.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;
    // Now let's start detecting the stream.
    if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        await handLandmarker.setOptions({ runningMode: "VIDEO" });
    }

    canvasCtx.save();
    canvasCtx.translate(canvasElement.width, 0);
    canvasCtx.scale(-1, 1);

    newCtx.save();
    newCtx.translate(newCanvas.width, 0);
    newCtx.scale(-1, 1);

    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        results = handLandmarker.detectForVideo(video, startTimeMs);
    }
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.landmarks) {
        for (const landmarks of results.landmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 5
            });
            drawLandmarks(canvasCtx, landmarks, { color: "#FFFF00", lineWidth: 2 });
//            drawLandmarks(newCtx, landmarks, { color: "#FF0000", lineWidth: 2 });

//            draw trace\
            if(checkrange(landmarks[4],landmarks[8],landmarks[12],50)){
//                console.log(calculateDistanceBetweenFingers(landmarks[4], landmarks[8]))
                drawFingertipTrace(landmarks[8]);
            }

        }
    }
    canvasCtx.restore();
    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}