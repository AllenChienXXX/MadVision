// scripts.js

document.addEventListener('DOMContentLoaded', function () {
    const videoElement = document.getElementById('videoElement');
    const canvasElement = document.getElementById('canvasElement');
    const ctx = canvasElement.getContext('2d');
    let isModelLoaded = false;

    // Load the MediaPipe Hands model
    window.MediaPipe.Hands.load()
        .then(function (hands) {
            const poseNet = new PoseNet(hands);
            poseNet.run(videoElement, canvasElement, ctx);
            isModelLoaded = true;
        })
        .catch(function (err) {
            console.error('Error loading model:', err);
        });

    // Check if the model is loaded and display a message if not
    setInterval(function () {
        if (!isModelLoaded) {
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            ctx.font = '20px Arial';
            ctx.fillStyle = 'red';
            ctx.fillText('Loading model, please wait...', 10, 30);
        }
    }, 1000);
});

// Define the PoseNet function
const PoseNet = function (hands) {
    this.hands = hands;
    this.drawingColor = 'red';
    this.lineThickness = 5;
};

// Main loop for processing frames
PoseNet.prototype.run = function (videoElement, canvasElement, ctx) {
    const poseNet = this;
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;

    // Set canvas dimensions to match video dimensions
    canvasElement.width = videoWidth;
    canvasElement.height = videoHeight;

    function detectHands() {
        const flippedCanvas = cv2.flip(canvasElement, 1); // Flip canvas horizontally
        const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
        const frame = new cv2.Mat(videoHeight, videoWidth, cv2.CV_8UC4);
        frame.data.set(imageData.data);

        // Process frame with MediaPipe Hands
        const results = poseNet.hands.process(flippedCanvas);

        if (results.multiHandLandmarks) {
            for (const handLandmarks of results.multiHandLandmarks) {
                for (let idx = 0; idx < handLandmarks.landmark.length; idx++) {
                    const landmark = handLandmarks.landmark[idx];
                    const x = landmark.x * videoWidth;
                    const y = landmark.y * videoHeight;

                    // Draw a circle at each detected hand landmark
                    ctx.beginPath();
                    ctx.fillStyle = poseNet.drawingColor;
                    ctx.arc(x, y, poseNet.lineThickness, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }

        // Request the next frame
        requestAnimationFrame(detectHands);
    }

    // Start processing frames
    detectHands();
};
