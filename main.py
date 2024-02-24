# from pose_net import *
from flask import Flask, Response, render_template
import cv2

app = Flask(__name__, )

@app.route('/')
def index():
    return render_template('index.html')

# @app.route('/video')
# def video():
#     return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=8080)


# if __name__ == "__main__":
#     pose = Pose_net()
#     pose.draw();
#     print(pose.drawing_lines)
