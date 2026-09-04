let audioContext;
let analyser;
let microphone;
let isListening = false;
let peakVolume = 0;
let overlayCloseTimer = null;

const startBtn = document.getElementById('startBtn');
const testBtn = document.getElementById('testBtn');
const statusText = document.getElementById('statusText');
const roastText = document.getElementById('roastText');
const meterFill = document.getElementById('meterFill');

const roastOverlay = document.getElementById('roastOverlay');
const roastVideo = document.getElementById('roastVideo');
const overlayRoastText = document.getElementById('overlayRoastText');
const closeOverlayBtn = document.getElementById('closeOverlayBtn');
const overlayContent = document.getElementById('overlayContent');
const countdownLeader = document.getElementById('countdownLeader');
const countdownNum = document.getElementById('countdownNum');
const vhsLines = document.querySelector('.vhs-lines');
const tierAudio = document.getElementById('tierAudio');

const OVERLAY_DISPLAY_MS = 5000;

startBtn.addEventListener('click', async () => {
    if (!isListening) {
        await startMicrophone();
    } else {
        finishListening();
    }
});

testBtn.addEventListener('click', () => {
    sendVolumeData(Math.floor(Math.random() * 100));
});

closeOverlayBtn.addEventListener('click', closeOverlay);

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
        peakVolume = 0;

        startBtn.innerText = "🛑 Stop Listening";
        startBtn.classList.add('listening');
        statusText.innerText = "Status: Listening... click Stop when done 🎧";
        roastText.innerText = "Go on, crunch away!";
        roastText.style.display = 'block';

        function processAudio() {
            if (!isListening) return;

            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i] * dataArray[i];
            }
            let rms = Math.sqrt(sum / bufferLength);

            if (rms < 8) rms = 0;

            let volume = Math.min(100, Math.round((rms / 210) * 100));
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
        roastText.style.display = 'block';
    }
}

function finishListening() {
    isListening = false;
    if (audioContext) {
        audioContext.close();
    }
    startBtn.innerText = "🎤 Start Listening";
    startBtn.classList.remove('listening');
    meterFill.style.width = "0%";

    if (peakVolume > 0) {
        sendVolumeData(peakVolume);
    } else {
        statusText.innerText = "Status: Didn't hear much 🤔";
        roastText.innerText = "Try crunching a bit louder next time!";
        roastText.style.display = 'block';
    }
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
            roastText.innerText = "";
            roastText.style.display = 'none';

            startCountdown(data);

            document.body.classList.remove('shake-medium', 'shake-hard');
            if (data.tier === 4) {
                triggerShake('shake-medium');
            } else if (data.tier === 5) {
                triggerShake('shake-hard');
            }
        } else {
            statusText.innerText = 'Status: Processing Error';
            roastText.innerText = data.message || 'Failed to analyze sound.';
            roastText.style.display = 'block';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        statusText.innerText = 'Status: Connection Error';
        roastText.innerText = 'Could not reach backend server.';
        roastText.style.display = 'block';
    }
}

function startCountdown(data) {
    roastOverlay.classList.add('active');
    overlayContent.style.display = 'none';
    countdownLeader.classList.add('active');

    let count = 3;
    countdownNum.innerText = count;

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownNum.innerText = count;
        } else {
            clearInterval(countdownInterval);
            countdownLeader.classList.remove('active');
            showOverlay(data);
        }
    }, 700);
}

function showOverlay(data) {
    overlayContent.style.display = 'flex';

    if (data.roast && data.roast.trim() !== "") {
        overlayRoastText.innerText = data.roast;
        overlayRoastText.style.display = 'block';
    } else {
        overlayRoastText.innerText = "";
        overlayRoastText.style.display = 'none';
    }

    if (data.video) {
        roastVideo.src = `/static/videos/${data.video}`;
        roastVideo.style.display = 'block';
        roastVideo.currentTime = 0;
        roastVideo.play().catch(() => {});
    } else {
        roastVideo.style.display = 'none';
    }

    // Play tier-specific audio (e.g. tier 4 dramatic mp3) alongside the video
    if (data.audio) {
        tierAudio.src = `/static/audio/${data.audio}`;
        tierAudio.currentTime = 0;
        tierAudio.play().catch(() => {});
    } else {
        tierAudio.pause();
        tierAudio.src = "";
    }

    fireConfetti();
    vhsLines.classList.add('glitching');
    setTimeout(() => vhsLines.classList.remove('glitching'), 400);

    if (overlayCloseTimer) {
        clearTimeout(overlayCloseTimer);
    }
    overlayCloseTimer = setTimeout(closeOverlay, OVERLAY_DISPLAY_MS);
}

function closeOverlay() {
    roastOverlay.classList.remove('active');
    countdownLeader.classList.remove('active');
    overlayContent.style.display = 'none';
    roastVideo.pause();
    roastVideo.src = "";
    tierAudio.pause();
    tierAudio.src = "";
    if (overlayCloseTimer) {
        clearTimeout(overlayCloseTimer);
        overlayCloseTimer = null;
    }
}

function fireConfetti() {
    const burst = document.getElementById('confettiBurst');
    burst.innerHTML = '';
    burst.classList.remove('fire');

    const colors = ['#d4a017', '#8b1a1a', '#4a6f85', '#f0e6d2', '#e8bc4a'];
    for (let i = 0; i < 40; i++) {
        const piece = document.createElement('span');
        const angle = Math.random() * Math.PI * 2;
        const distance = 150 + Math.random() * 250;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        piece.style.setProperty('--tx', `${tx}px`);
        piece.style.setProperty('--ty', `${ty}px`);
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        burst.appendChild(piece);
    }
    void burst.offsetWidth;
    burst.classList.add('fire');
}

function triggerShake(className) {
    document.body.classList.remove(className);
    void document.body.offsetWidth;
    document.body.classList.add(className);
}