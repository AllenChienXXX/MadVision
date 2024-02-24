navigator.mediaDevices.getUserMedia({ video: true })
.then(function(stream) {
    var videoElement = document.getElementById('videoElement');
    videoElement.srcObject = stream;
})
.catch(function(err) {
    console.error('Error accessing the camera: ' + err);
});

