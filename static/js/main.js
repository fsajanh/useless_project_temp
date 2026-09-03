let audioContext;
let analyser;
let microphone;
let isListening = false;

const startBtn = document.getElementById('startBtn');
const statusText = document.getElementById('statusText');
const roastText = document.getElementById('roastText');

if (startBtn) {
    startBtn.addEventListener('click', async () => {
        if (!isListening) {
            await startMicrophone();
        } else {
            stopMicrophone();
        }
    });
}

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
        if (startBtn) startBtn.innerText = "Stop Listening";
        if (statusText) statusText.innerText = "Status: Listening to mic live...";
        if (roastText) roastText.innerText = "Make some crunching noise!";

        function processAudio() {
            if (!isListening) return;

            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            let rms = Math.sqrt(sum / bufferLength);
            let volume = Math.min(100, Math.round((rms / 128) * 100));

            if (volume > 35) {
                sendVolumeData(volume);
                stopMicrophone();
                return;
            }

            requestAnimationFrame(processAudio);
        }

        processAudio();

    } catch (err) {
        console.error('Microphone access denied or error:', err);
        if (statusText) statusText.innerText = 'Status: Microphone Access Denied';
        if (roastText) roastText.innerText = 'Please allow microphone access in your browser.';
    }
}

function stopMicrophone() {
    isListening = false;
    if (audioContext) {
        audioContext.close();
    }
    if (startBtn) startBtn.innerText = "Start Listening";
    if (statusText) statusText.innerText = "Status: Idle";
}

async function sendVolumeData(volumeValue) {
    if (statusText) statusText.innerText = `Status: Processing peak volume (${volumeValue})...`;

    try {
        const response = await fetch('/analyze-crunch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ volume: volumeValue })
        });

        const data = await response.json();

        if (response.ok && data.status === 'success') {
            if (statusText) statusText.innerText = `Status: Peak detected! (Volume: ${data.volume_received})`;
            if (roastText) roastText.innerText = data.roast;
        } else {
            if (statusText) statusText.innerText = 'Status: Processing Error';
            if (roastText) roastText.innerText = data.message || 'Failed to analyze sound.';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        if (statusText) statusText.innerText = 'Status: Connection Error';
        if (roastText) roastText.innerText = 'Could not reach backend server.';
    }
}