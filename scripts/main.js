// Define the PoseNet function
const PoseNet = function() {
  this.hands = new window.MediaPipe.Hands({ maxNumHands: 1 });
  this.cap = new cv2.VideoCapture(0);
  this.cap.set(cv2.CAP_PROP_FPS, 30);

  this.drawingColor = new cv2.Scalar(255, 255, 255);
  this.lineThickness = 5;
  this.prevPoint = null;
  this.drawingLines = [];
};

// Calculate distance between two points
PoseNet.prototype.calculateDistance = function(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Draw lines on the frame
PoseNet.prototype.drawOnFrame = function(frame, lines) {
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      cv2.line(frame, line[i - 1], line[i], this.drawingColor, this.lineThickness);
    }
  }
  return frame;
};

// Draw circle on specific finger landmarks
PoseNet.prototype.drawFinger = function(idx, fingerId, frame, landmarks) {
  if (idx === fingerId) {
    const h = frame.height;
    const w = frame.width;
    const cx = Math.round(landmarks[idx].x * w);
    const cy = Math.round(landmarks[idx].y * h);
    cv2.circle(frame, { x: cx, y: cy }, 10, new cv2.Scalar(255, 0, 255), cv2.FILLED);
  }
};

// Main loop for processing frames
PoseNet.prototype.run = function() {
  while (this.cap.isOpened()) {
    const ret, frame = this.cap.read();
    if (!ret) {
      console.error("Error: Failed to capture frame");
      break;
    }

    // Flip the frame and convert to RGB
    const flippedFrame = cv2.flip(frame, 1);
    const rgbFrame = cv2.cvtColor(flippedFrame, cv2.COLOR_BGR2RGB);

    // Process frame with MediaPipe hands
    const results = this.hands.process(rgbFrame);

    if (results.multiHandLandmarks) {
      for (const handLandmarks of results.multiHandLandmarks) {
        if (handLandmarks.landmark[window.MediaPipe.HandLandmark.INDEX_FINGER_TIP].x > handLandmarks.landmark[window.MediaPipe.HandLandmark.WRIST].x) {
          continue;
        }

        let thumbTip = null;
        let indexTip = null;

        for (let idx = 0; idx < handLandmarks.landmark.length; idx++) {
          this.drawFinger(idx, 8, frame, handLandmarks.landmark); // Draw thumb
          this.drawFinger(idx, 4, frame, handLandmarks.landmark); // Draw index finger

          // Get coordinates of thumb and index finger tips
          if (idx === 4) {
            thumbTip = { x: Math.round(handLandmarks.landmark[idx].x * frame.width), y: Math.round(handLandmarks.landmark[idx].y * frame.height)
