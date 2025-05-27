let model;
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Load the COCO-SSD model and start the camera
window.onload = async () => {
  model = await cocoSsd.load();
  await startCamera();
  window.addEventListener('touchstart', handleTouch);
};

// Start the device camera (prefer back camera on mobiles)
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } } // request rear camera
    });
    video.srcObject = stream;
    await video.play();
  } catch (error) {
    console.warn("Rear camera not found, falling back to any camera:", error);
    // fallback to any available camera (usually front)
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
  }
}

// Handle screen touch to detect and describe objects
async function handleTouch() {
  if (!model || !video) return;

  const predictions = await model.detect(video);
  const labels = predictions.map(pred => pred.class).join(', ');
  speakWithPersonality(labels);
  drawBoxes(predictions);
}

// Draw bounding boxes and labels on canvas
function drawBoxes(predictions) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  predictions.forEach(pred => {
    const [x, y, width, height] = pred.bbox;
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText(pred.class, x, y - 5);
  });
}

// Speak in a friendly, human-like voice with random personality
function speakWithPersonality(objects) {
  const greetings = [
    "Hey buddy, I see",
    "Guess what? I spotted",
    "Look around! There's",
    "Here's what I found:",
    "Yo! I noticed"
  ];

  const message = new SpeechSynthesisUtterance();
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  message.text = objects
    ? `${greeting} ${objects}.`
    : "Hmm... I couldn't spot anything clearly right now.";

  message.lang = 'en-US';
  message.pitch = 1.3; // Friendly tone
  message.rate = 0.95; // Natural pace
  message.volume = 1;

  const voices = speechSynthesis.getVoices();
  const preferredVoice = voices.find(voice =>
    voice.name.includes('Google') || voice.name.includes('Microsoft')
  );
  if (preferredVoice) {
    message.voice = preferredVoice;
  }

  speechSynthesis.cancel(); // Prevent overlapping speech
  speechSynthesis.speak(message);
}
