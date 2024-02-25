
async function classifyCanvas(canvasElement) {
    // Load the pre-trained MobileNet model from TensorFlow Hub
    const mobilenet = await tf.loadGraphModel('https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/4/default/1', { fromTFHub: true });
    // Get the 2D rendering context of the canvas
    const ctx = canvasElement.getContext('2d');
    // Get the image data from the canvas
    const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
    // Convert the image data to a tensor
    const tensor = tf.browser.fromPixels(imageData).resizeNearestNeighbor([224, 224]).toFloat().expandDims();
    // Normalize the tensor (optional)
    const normalizedTensor = tensor.div(tf.scalar(255));
    // Perform image classification
    const predictions = await mobilenet.predict(normalizedTensor).data();
    // Display the top 5 predictions
    const top5 = Array.from(predictions)
        .map((probability, index) => ({ probability, index }))
        .sort((a, b) => b.probability - a.probability)
        .slice(0, 5);

    return top5;
}