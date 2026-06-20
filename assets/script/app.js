const audio = document.getElementById('audio');
const playBtn = document.getElementById('play');
const playBtnMain = document.querySelector('.play-btn-main');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const progressContainer = document.getElementById('progress-container');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const tracklistContainer = document.getElementById('tracklist-container');

const currentImg = document.getElementById('current-img');
const currentName = document.getElementById('current-name');
const currentArtist = document.getElementById('current-artist');

const headerCover = document.getElementById('header-cover');
const headerTitle = document.getElementById('header-title');

const volumeIcon = document.getElementById('volume-icon');
const volumeBg = document.getElementById('volume-bg');
const volumeFill = document.getElementById('volume-fill');
const fullscreenBtn = document.getElementById('fullscreen-btn');

let songs = [];
let songIndex = 0;
let isPlaying = false;
let currentVolume = 0.5;
let isMuted = false;

audio.volume = currentVolume;
volumeFill.style.width = `${currentVolume * 100}%`;

async function fetchSongs() {
    try {
        const response = await fetch('./assets/data/songs.json');
        songs = await response.json();
        renderTracklist();
        if (songs.length > 0) {
            loadSong(songIndex);
        }
    } catch (error) {
        console.error(error);
    }
}

function renderTracklist() {
    const headerHtml = `
        <div class="tracklist-header">
            <div class="col-index">#</div>
            <div class="col-title">Title</div>
            <div class="col-album">Album</div>
            <div class="col-date">Date Added</div>
            <div class="col-time"><i class="far fa-clock"></i></div>
        </div>
    `;
    tracklistContainer.innerHTML = headerHtml;

    songs.forEach((song, index) => {
        const row = document.createElement('div');
        row.classList.add('track-row');
        row.setAttribute('data-index', index);
        row.innerHTML = `
            <div class="col-index">${index + 1}</div>
            <div class="col-title">
                <img src="${song.cover}" alt="track">
                <div class="track-details">
                    <span class="track-name">${song.name}</span>
                    <span class="track-artist">${song.artist}</span>
                </div>
            </div>
            <div class="col-album">${song.album}</div>
            <div class="col-date">${song.date}</div>
            <div class="col-time time-display">--:--</div>
        `;
        
        const tempAudio = new Audio(song.src);
        tempAudio.addEventListener('loadedmetadata', () => {
            let mins = Math.floor(tempAudio.duration / 60);
            let secs = Math.floor(tempAudio.duration % 60);
            if (secs < 10) secs = `0${secs}`;
            row.querySelector('.time-display').innerText = `${mins}:${secs}`;
        });
        
        row.addEventListener('click', () => {
            songIndex = index;
            loadSong(songIndex);
            playSong();
        });

        tracklistContainer.appendChild(row);
    });
}

function loadSong(index) {
    if (!songs.length) return;
    
    audio.src = songs[index].src;
    
    currentName.innerText = songs[index].name;
    currentArtist.innerText = songs[index].artist;
    currentImg.src = songs[index].cover;
    
    headerCover.src = songs[index].cover;
    headerTitle.innerText = songs[index].name;
    
    const trackRows = document.querySelectorAll('.track-row');
    trackRows.forEach(row => row.classList.remove('playing'));
    if (trackRows[index]) {
        trackRows[index].classList.add('playing');
    }
}

function playSong() {
    isPlaying = true;
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    playBtnMain.innerHTML = '<i class="fas fa-pause"></i>';
    audio.play();
}

function pauseSong() {
    isPlaying = false;
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    playBtnMain.innerHTML = '<i class="fas fa-play"></i>';
    audio.pause();
}

function togglePlay() {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
}

function prevSong() {
    songIndex--;
    if (songIndex < 0) {
        songIndex = songs.length - 1;
    }
    loadSong(songIndex);
    if (isPlaying) playSong();
}

function nextSong() {
    songIndex++;
    if (songIndex > songs.length - 1) {
        songIndex = 0;
    }
    loadSong(songIndex);
    if (isPlaying) playSong();
}

function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    if (isNaN(duration)) return;
    
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;

    let currentMins = Math.floor(currentTime / 60);
    let currentSecs = Math.floor(currentTime % 60);
    if (currentSecs < 10) currentSecs = `0${currentSecs}`;
    currentTimeEl.innerText = `${currentMins}:${currentSecs}`;
}

function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}

function setVolume(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    currentVolume = clickX / width;
    
    if (currentVolume < 0.05) currentVolume = 0;
    if (currentVolume > 0.95) currentVolume = 1;
    
    audio.volume = currentVolume;
    volumeFill.style.width = `${currentVolume * 100}%`;
    isMuted = currentVolume === 0;
    updateVolumeIcon();
}

function toggleMute() {
    if (isMuted) {
        isMuted = false;
        audio.volume = currentVolume || 0.5;
        volumeFill.style.width = `${(currentVolume || 0.5) * 100}%`;
    } else {
        isMuted = true;
        audio.volume = 0;
        volumeFill.style.width = `0%`;
    }
    updateVolumeIcon();
}

function updateVolumeIcon() {
    volumeIcon.className = '';
    if (isMuted || audio.volume === 0) {
        volumeIcon.className = 'fas fa-volume-mute';
    } else if (audio.volume < 0.5) {
        volumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-up';
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        fullscreenBtn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i>';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            fullscreenBtn.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
        }
    }
}

audio.addEventListener('loadedmetadata', () => {
    let mins = Math.floor(audio.duration / 60);
    let secs = Math.floor(audio.duration % 60);
    if (secs < 10) secs = `0${secs}`;
    durationEl.innerText = `${mins}:${secs}`;
});

playBtn.addEventListener('click', togglePlay);
playBtnMain.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
audio.addEventListener('timeupdate', updateProgress);
progressContainer.addEventListener('click', setProgress);
audio.addEventListener('ended', nextSong);
volumeBg.addEventListener('click', setVolume);
volumeIcon.addEventListener('click', toggleMute);
fullscreenBtn.addEventListener('click', toggleFullscreen);

fetchSongs();