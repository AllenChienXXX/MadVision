import mediapipe as mp
import cv2
import math
import numpy as np



class Pose_net():
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands()

        self.cap = cv2.VideoCapture(0)
        self.cap.set(cv2.CAP_PROP_FPS, 30)

        self.drawing_color = (255, 255, 255)  # Color for drawing
        self.line_thickness = 5  # Thickness of the lines
        self.prev_point = None  # Previous finger tip position
        self.drawing_lines = []  # List to store drawing lines

    def calculate_distance(point1, point2):
        return math.sqrt((point2[0] - point1[0])**2 + (point2[1] - point1[1])**2)

    def draw_on_frame(self, frame, lines):
        for line in lines:
            for i in range(1, len(line)):
                cv2.line(frame, line[i-1], line[i], self.drawing_color, self.line_thickness)
        return frame

    def draw_finger(self, idx, fnumber, frame, landmark):
        if idx == fnumber:  # Index finger tip landmark id
            h, w, c = frame.shape
            cx, cy = int(landmark.x * w), int(landmark.y * h)
            cv2.circle(frame, (cx, cy), 10, (255, 0, 255), cv2.FILLED)

    def draw(self):
        while self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret:
                print("Error: Failed to capture frame")
                break

            frame = cv2.flip(frame, 1)

            #create an empty frame
            empty_frame = np.zeros_like(frame)

            # Convert the image to RGB and process it with Mediapipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.hands.process(rgb_frame)

            if results.multi_hand_landmarks:
                for hand_landmarks in results.multi_hand_landmarks:
                    if hand_landmarks.landmark[self.mp_hands.HandLandmark.INDEX_FINGER_TIP].x > hand_landmarks.landmark[self.mp_hands.HandLandmark.WRIST].x:
                        continue
                    thumb_tip = None
                    index_tip = None
                    for idx, landmark in enumerate(hand_landmarks.landmark):
                        self.draw_finger(idx, 8, empty_frame, landmark)
                        self.draw_finger(idx,4, empty_frame, landmark)

                        # Get the coordinates of the tip of the thumb and index finger
                        if idx == 4:  # Thumb tip landmark id
                            h, w, c = frame.shape
                            thumb_tip = (int(landmark.x * w), int(landmark.y * h))
                        elif idx == 8:  # Index finger tip landmark id
                            h, w, c = frame.shape
                            index_tip = (int(landmark.x * w), int(landmark.y * h))

                    if thumb_tip is not None and index_tip is not None:
                        # Calculate distance between thumb and index finger
                        distance = Pose_net.calculate_distance(thumb_tip, index_tip)

                        if distance < 50:  # Threshold distance
                            self.prev_point = None
                            #don't draw
                        else:
                            # Add current finger tip position to drawing lines
                            if self.prev_point is not None:
                                self.drawing_lines[-1].append(index_tip)
                            else:
                                self.drawing_lines.append([index_tip])
                            self.prev_point = index_tip
            empty_frame = Pose_net.draw_on_frame(self, empty_frame, self.drawing_lines)

            cv2.imshow("Finger Tip Tracking", empty_frame)

            if cv2.waitKey(10) & 0xFF == ord('q'):
                break
        # Release the VideoCapture and destroy any OpenCV windows
        self.cap.release()
        cv2.destroyAllWindows()