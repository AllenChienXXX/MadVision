import mediapipe as mp
import cv2

mp_hands = mp.solutions.hands
hands = mp_hands.Hands()

cap = cv2.VideoCapture(0)

drawing_color = (255, 0, 255)  # Color for drawing
line_thickness = 5  # Thickness of the lines
prev_point = None  # Previous finger tip position
drawing_lines = []  # List to store drawing lines

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
            for idx, landmark in enumerate(hand_landmarks.landmark):
                # Get the coordinates of the tip of the index finger
                if idx == 8:  # Index finger tip landmark id
                    h, w, c = frame.shape
                    cx, cy = int(landmark.x * w), int(landmark.y * h)
                    cv2.circle(frame, (cx, cy), 10, (255, 0, 255), cv2.FILLED)

                    if prev_point is not None:
                        drawing_lines[-1].append((cx, cy))
                    else:
                        drawing_lines.append([(cx, cy)])
                    prev_point = (cx, cy)
    frame = draw_on_frame(frame, drawing_lines)

    cv2.imshow("Finger Tip Tracking", frame)

    if cv2.waitKey(10) & 0xFF == ord('q'):
        break

# Release the VideoCapture and destroy any OpenCV windows
cap.release()
cv2.destroyAllWindows()