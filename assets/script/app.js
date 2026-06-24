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

const searchInput = document.querySelector('.search-bar input');
const sidebarPlaylists = document.getElementById('sidebar-playlists');
const artistButtons = document.querySelectorAll('.artist-btn');

let songs = [];
let songIndex = 0;
let isPlaying = false;
let currentVolume = 0.5;
let isMuted = false;

const STORAGE_KEY = 'music_player_state';
const ITUNES_API_BASE = 'https://itunes.apple.com/search';

const ARTIST_POOL = [
    'Tamer Hosny',
    'Tamer Ashour',
    'Mohamed Ramadan',
    'Amr Diab',
    'Sherine',
    'Mohamed Hamaki',
    'Hassan Shakosh',
    'Ahmed Saad',
    'Mostafa Amar',
    'Angham',
    'Nancy Ajram',
    'Mohamed Mounir',
    'Wael Kfoury',
    'Cairokee',
    'Saad Lamjarred',
    'Hamza Namira',
    'Akram',
    'Marwan Pablo',
    'Wegz',
    'Assala'
];

audio.volume = currentVolume;
volumeFill.style.width = `${currentVolume * 100}%`;

function getRandomArtists(count) {
    const pool = [...ARTIST_POOL];
    const picked = [];
    while (picked.length < count && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(randomIndex, 1)[0]);
    }
    return picked;
}

async function fetchSongsFromItunes(query, limit = 12) {
    const params = new URLSearchParams({
        term: query,
        media: 'music',
        entity: 'song',
        limit: limit,
        country: 'EG'
    });

    const url = `${ITUNES_API_BASE}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`);
    }

    const data = await response.json();

    return (data.results || [])
        .filter(track => track.previewUrl)
        .map(mapItunesTrackToSong);
}

function mapItunesTrackToSong(track) {
    return {
        name: track.trackName,
        artist: track.artistName,
        album: track.collectionName || track.trackName,
        date: formatReleaseDate(track.releaseDate),
        cover: track.artworkUrl100
            ? track.artworkUrl100.replace('100x100bb', '600x600bb')
            : './assets/images/Aleb.jpg',
        src: track.previewUrl,
        isPreview: true,
        durationMs: track.trackTimeMillis
    };
}

function formatReleaseDate(isoDate) {
    if (!isoDate) return 'غير معروف';
    const releaseDate = new Date(isoDate);
    const diffYears = new Date().getFullYear() - releaseDate.getFullYear();
    if (diffYears <= 0) return 'هذا العام';
    if (diffYears === 1) return 'سنة واحدة';
    return `${diffYears} سنوات`;
}

const fallbackSongs = [
    {
        name: "Aleb Fel Dafater",
        artist: "مسلم - Muslim",
        album: "Aleb Fel Dafater",
        date: "3 years ago",
        cover: "https://3mmarx3.github.io/Music_Player/assets/images/Aleb.jpg",
        src: "https://3mmarx3.github.io/Music_Player/music/Aleb.mp3",
        isPreview: false
    },
    {
        name: "Meen Kan Sabab",
        artist: "مسلم - Muslim",
        album: "Meen Kan Sabab",
        date: "3 years ago",
        cover: "https://3mmarx3.github.io/Music_Player/assets/images/Meen.jpg",
        src: "https://3mmarx3.github.io/Music_Player/music/Meen.mp3",
        isPreview: false
    },
    {
        name: "Ghasb Anny",
        artist: "Zap Tharwat, Sary Hany, Muslim",
        album: "Ghasb Anny",
        date: "3 years ago",
        cover: "https://3mmarx3.github.io/Music_Player/assets/images/Ghasb.jpg",
        src: "https://3mmarx3.github.io/Music_Player/music/Ghasb.mp3",
        isPreview: false
    },
    {
        name: "Etnaseet",
        artist: "مسلم - Muslim",
        album: "Etnaseet",
        date: "2 years ago",
        cover: "https://3mmarx3.github.io/Music_Player/assets/images/Etnaseet.jpeg",
        src: "https://3mmarx3.github.io/Music_Player/music/Etnaseet.mp3",
        isPreview: false
    },
    {
        name: "Abl Ma Awsalek",
        artist: "مسلم - Muslim",
        album: "Abl Ma Awsalek",
        date: "3 years ago",
        cover: "https://3mmarx3.github.io/Music_Player/assets/images/AblMaAwsalek.jpg",
        src: "https://3mmarx3.github.io/Music_Player/music/AblMaAwsalek.mp3",
        isPreview: false
    },
    {
        name: "Saban Aleiki",
        artist: "مسلم - Muslim",
        album: "Saban Aleiki",
        date: "1 year ago",
        cover: "https://3mmarx3.github.io/Music_Player/assets/images/SabanAleiki.jpg",
        src: "https://3mmarx3.github.io/Music_Player/music/SabanAleiki.mp3",
        isPreview: false
    }
];

function saveState() {
    const state = {
        songs: songs,
        songIndex: songIndex,
        currentTime: audio.currentTime || 0,
        currentVolume: currentVolume,
        isMuted: isMuted,
        headerTitleText: headerTitle.innerText
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error('فشل حفظ الحالة:', error);
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (error) {
        console.error('فشل قراءة الحالة المحفوظة:', error);
        return null;
    }
}

async function fetchSongs() {
    const savedState = loadState();

    if (savedState && Array.isArray(savedState.songs) && savedState.songs.length > 0) {
        songs = savedState.songs;
        songIndex = savedState.songIndex || 0;
        currentVolume = typeof savedState.currentVolume === 'number' ? savedState.currentVolume : 0.5;
        isMuted = !!savedState.isMuted;

        renderTracklist();
        loadSong(songIndex, false);

        audio.volume = isMuted ? 0 : currentVolume;
        volumeFill.style.width = `${(isMuted ? 0 : currentVolume) * 100}%`;
        updateVolumeIcon();

        if (savedState.headerTitleText) {
            headerTitle.innerText = savedState.headerTitleText;
        }

        audio.addEventListener('loadedmetadata', function restoreTime() {
            if (savedState.currentTime && savedState.currentTime < audio.duration) {
                audio.currentTime = savedState.currentTime;
            }
            audio.removeEventListener('loadedmetadata', restoreTime);
        });

        return;
    }

    songs = fallbackSongs;
    renderTracklist();
    if (songs.length > 0) {
        loadSong(songIndex);
    }
}

async function handleSearch(query) {
    if (!query || !query.trim()) return;
    await loadArtistSongs(query.trim());
}

async function loadArtistSongs(artistName) {
    setSearchLoadingState(true);

    try {
        const results = await fetchSongsFromItunes(artistName, 12);

        if (results.length === 0) {
            alert('لا توجد نتائج لهذا الفنان أو الأغنية. جرب اسم آخر.');
            return;
        }

        songs = results;
        songIndex = 0;
        renderTracklist();
        loadSong(songIndex);
        headerTitle.innerText = artistName;
        saveState();

    } catch (error) {
        console.error('فشل البحث عبر iTunes API:', error);
        alert('حصل خطأ في الاتصال بـ iTunes. تأكد من الإنترنت وحاول تاني.');
    } finally {
        setSearchLoadingState(false);
    }
}

function setSearchLoadingState(isLoading) {
    if (!searchInput) return;
    searchInput.placeholder = isLoading ? 'جاري البحث...' : 'What do you want to play?';
    searchInput.disabled = isLoading;
}

searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleSearch(searchInput.value);
    }
});

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
                    <span class="track-name">
                        ${song.name}
                        ${song.isPreview ? '<span class="preview-badge">Preview 30s</span>' : ''}
                    </span>
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
            const timeEl = row.querySelector('.time-display');
            if (timeEl) timeEl.innerText = `${mins}:${secs}`;
        });

        row.addEventListener('click', () => {
            songIndex = index;
            loadSong(songIndex);
            playSong();
        });

        tracklistContainer.appendChild(row);
    });
}

function loadSong(index, autoSave = true) {
    if (!songs.length) return;

    audio.src = songs[index].src;

    currentName.innerText = songs[index].name;
    currentArtist.innerText = songs[index].artist;
    currentImg.src = songs[index].cover;

    headerCover.src = songs[index].cover;

    const trackRows = document.querySelectorAll('.track-row');
    trackRows.forEach(row => row.classList.remove('playing'));
    if (trackRows[index]) {
        trackRows[index].classList.add('playing');
    }

    if (autoSave) saveState();
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
    saveState();
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
    saveState();
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
    saveState();
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

audio.addEventListener('timeupdate', () => {
    if (Math.floor(audio.currentTime) % 3 === 0) {
        saveState();
    }
});

window.addEventListener('beforeunload', saveState);

async function setupSidebarArtists() {
    const buttons = sidebarPlaylists.querySelectorAll('.artist-btn');
    const randomArtists = getRandomArtists(buttons.length);

    for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];
        const artistName = randomArtists[i];
        const imgEl = btn.querySelector('.artist-img');

        if (!artistName) {
            btn.style.display = 'none';
            continue;
        }

        try {
            const params = new URLSearchParams({
                term: artistName,
                media: 'music',
                entity: 'album',
                limit: 1,
                country: 'EG'
            });
            const response = await fetch(`${ITUNES_API_BASE}?${params.toString()}`);
            const data = await response.json();
            const album = (data.results || [])[0];

            if (album && album.artworkUrl100) {
                btn.setAttribute('data-artist', artistName);
                btn.setAttribute('title', artistName);
                imgEl.setAttribute('alt', artistName);
                imgEl.src = album.artworkUrl100.replace('100x100bb', '200x200bb');
                btn.style.display = '';

                btn.addEventListener('click', () => {
                    loadArtistSongs(artistName);
                });
            } else {
                btn.style.display = 'none';
            }
        } catch (error) {
            console.error(`فشل جلب بيانات ${artistName}:`, error);
            btn.style.display = 'none';
        }
    }
}

setupSidebarArtists();

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