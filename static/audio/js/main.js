let audioContext;
let analyser;
let microphone;
let isListening = false;
let listenWindowActive = false;
let peakVolume = 0;
let listenTimeoutId = null;

const LISTEN_DURATION_MS = 5000; // 5 seconds

const startBtn = document.getElementById('startBtn');
const testBtn = document.getElementById('testBtn');
const statusText = document.getElementById('statusText');
const roastText = document.getElementById('roastText');
const meterFill = document.getElementById('meterFill');

startBtn.addEventListener('click', async () => {
    if (!isListening) {
        await startMicrophone();
    } else {
        stopMicrophone();
    }
});

testBtn.addEventListener('click', () => {
    sendVolumeData(Math.floor(Math.random() * 100));
});

async function startMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        microphone.connect(analyser);

        isListening = true;
        listenWindowActive = true;
        peakVolume = 0;

        startBtn.innerText = "🛑 Stop Listening";
        startBtn.classList.add('listening');
        statusText.innerText = "Status: Listening for 5 seconds... 🎧";
        roastText.innerText = "Go on, crunch away!";

        // End the 5-second listening window
        listenTimeoutId = setTimeout(() => {
            listenWindowActive = false;
            if (peakVolume > 0) {
                sendVolumeData(peakVolume);
            } else {
                statusText.innerText = "Status: Didn't hear much 🤔";
                roastText.innerText = "Try crunching a bit louder next time!";
            }
            stopMicrophone();
        }, LISTEN_DURATION_MS);

        function processAudio() {
            if (!isListening || !listenWindowActive) return;

            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            let rms = Math.sqrt(sum / bufferLength);
            let volume = Math.min(100, Math.round((rms / 128) * 100));

            meterFill.style.width = volume + "%";

            if (volume > peakVolume) {
                peakVolume = volume;
            }

            requestAnimationFrame(processAudio);
        }
        processAudio();
    } catch (err) {
        console.error('Microphone access denied or error:', err);
        statusText.innerText = 'Status: Microphone Access Denied';
        roastText.innerText = 'Please allow microphone access in your browser.';
    }
}

function stopMicrophone() {
    isListening = false;
    listenWindowActive = false;
    if (listenTimeoutId) {
        clearTimeout(listenTimeoutId);
        listenTimeoutId = null;
    }
    if (audioContext) {
        audioContext.close();
    }
    startBtn.innerText = "🎤 Start Listening";
    startBtn.classList.remove('listening');
    meterFill.style.width = "0%";
}

async function sendVolumeData(volumeValue) {
    statusText.innerText = `Status: Processing peak volume (${volumeValue})... ⏳`;
    try {
        const response = await fetch('/analyze-crunch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ volume: volumeValue })
        });
        const data = await response.json();
        if (response.ok && data.status === 'success') {
            statusText.innerText = `Status: Peak detected! (Volume: ${data.volume_received}) ✅`;
            roastText.innerText = data.roast;
        } else {
            statusText.innerText = 'Status: Processing Error';
            roastText.innerText = data.message || 'Failed to analyze sound.';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        statusText.innerText = 'Status: Connection Error';
        roastText.innerText = 'Could not reach backend server.';
    }
}