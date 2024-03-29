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
import * as utils from './utils.js';
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

var CLEAR = false;

//button function
const clearButton = document.getElementById('clearButton');
clearButton.addEventListener("click", handleClearButtonClick);
function handleClearButtonClick() {
    console.log("clear")
    CLEAR = true;
}

function drawPoint(x, y) {
    newCtx.beginPath();
    newCtx.arc(x*video.videoWidth, y*video.videoHeight, 10, 0, Math.PI * 2);
    newCtx.fill();
}

function drawFingertipTrace(fingertip, adddraw) {
    // Store previous fingertip positions for tracing
    // Draw trace line from previous position (if available)
    if(CLEAR || points.length>10000){
        points.splice(0, points.length); // Remove all elements starting from index 0
        CLEAR = false;
    }

    if(adddraw){
        points.push([fingertip.x*video.videoWidth,fingertip.y*video.videoHeight]); // Store the point
    }
    if (points.length < 2) return; // Need at least 2 points to draw a line

    let prevPoint = points[0];
    newCtx.strokeStyle = 'blue';
    newCtx.lineWidth = 2;
   for (let i = 1; i < points.length; i++) {
        const currentPoint = points[i];
        const distance = calculateDistance(currentPoint[0],currentPoint[1],prevPoint[0],prevPoint[1])
        console.log(distance)
        if (distance > 30) {
            // Start a new line
            newCtx.beginPath();
            newCtx.moveTo(currentPoint[0], currentPoint[1]);
        } else {
            // Continue drawing on the same line
            newCtx.lineTo(currentPoint[0], currentPoint[1]);
            newCtx.stroke();
        }
        prevPoint = currentPoint;
    }
}

function calculateFingerDistance(finger1, finger2) {
    const dx = (finger2.x - finger1.x);
    const dy = (finger2.y - finger1.y);
    const dz = (finger2.z - finger1.z);

    return Math.sqrt(Math.abs(dx * dx + dy * dy + dz * dz));
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
            if(calculateFingerDistance(landmarks[4],landmarks[8])<0.05){
//                console.log(calculateFingerDistance(landmarks[4], landmarks[8]))
                drawFingertipTrace(landmarks[8], true);
            }else{
                drawFingertipTrace(landmarks[8], false);

            }

        }
    }
    canvasCtx.restore();
    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
        window.requestAnimationFrame(predictWebcam);
    }
}
