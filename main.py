from pose_net import *
# from flask import Flask, Response, render_template
# import cv2
#
# app = Flask(__name__, )
#
# @app.route('/')
# def index():
#     return render_template('index.html')
#
# def gen_frames():
#     cap = cv2.VideoCapture(0)
#     while True:
#         ret, frame = cap.read()
#         if not ret:
#             break
#         # Convert frame to bytes for streaming
#         ret, buffer = cv2.imencode('.jpg', frame)
#         frame_bytes = buffer.tobytes()
#         yield (b'--frame\r\n'
#                b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
#
# @app.route('/video')
# def video():
#     return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')
#
# if __name__ == '__main__':
#     app.run(host='0.0.0.0', debug=True, port=8080)


if __name__ == "__main__":
    pose = Pose_net()
    pose.draw();
    print(pose.drawing_lines)
