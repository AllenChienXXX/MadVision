import mediapipe as mp
import cv2
import math

mp_hands = mp.solutions.hands
hands = mp_hands.Hands()

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FPS, 30)

drawing_color = (255, 255, 255)  # Color for drawing
line_thickness = 5  # Thickness of the lines
prev_point = None  # Previous finger tip position
drawing_lines = []  # List to store drawing lines

def calculate_distance(point1, point2):
    return math.sqrt((point2[0] - point1[0])**2 + (point2[1] - point1[1])**2)

def draw_on_frame(frame, lines):
    for line in lines:
        for i in range(1, len(line)):
            cv2.line(frame, line[i-1], line[i], drawing_color, line_thickness)
    return frame

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("Error: Failed to capture frame")
        break

    frame = cv2.flip(frame, 1)
    # Convert the image to RGB and process it with Mediapipe
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hands.process(rgb_frame)

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            if hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP].x > hand_landmarks.landmark[mp_hands.HandLandmark.WRIST].x:
                continue
            thumb_tip = None
            index_tip = None
            for idx, landmark in enumerate(hand_landmarks.landmark):
                if idx == 8:  # Index finger tip landmark id
                    h, w, c = frame.shape
                    cx, cy = int(landmark.x * w), int(landmark.y * h)
                    cv2.circle(frame, (cx, cy), 10, (255, 0, 255), cv2.FILLED)

                # Get the coordinates of the tip of the thumb and index finger
                if idx == 4:  # Thumb tip landmark id
                    h, w, c = frame.shape
                    thumb_tip = (int(landmark.x * w), int(landmark.y * h))
                elif idx == 8:  # Index finger tip landmark id
                    h, w, c = frame.shape
                    index_tip = (int(landmark.x * w), int(landmark.y * h))

            if thumb_tip is not None and index_tip is not None:
                # Calculate distance between thumb and index finger
                distance = calculate_distance(thumb_tip, index_tip)

                if distance < 50:  # Threshold distance
                    # Add current finger tip position to drawing lines
                    if prev_point is not None:
                        drawing_lines[-1].append(index_tip)
                    else:
                        drawing_lines.append([index_tip])
                    prev_point = index_tip
                else:
                    prev_point = None

    frame = draw_on_frame(frame, drawing_lines)

    cv2.imshow("Finger Tip Tracking", frame)


    if cv2.waitKey(10) & 0xFF == ord('q'):
        break

# Release the VideoCapture and destroy any OpenCV windows
cap.release()
cv2.destroyAllWindows()