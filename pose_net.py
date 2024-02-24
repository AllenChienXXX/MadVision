import mediapipe as mp
import cv2

mp_hands = mp.solutions.hands
hands = mp_hands.Hands()

cap = cv2.VideoCapture(0)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print("Error: Failed to capture frame")
        break

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

    cv2.imshow("Finger Tip Tracking", frame)

    if cv2.waitKey(10) & 0xFF == ord('q'):
        break

# Release the VideoCapture and destroy any OpenCV windows
cap.release()
cv2.destroyAllWindows()