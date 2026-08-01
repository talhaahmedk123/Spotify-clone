let currentSong = new Audio();
let songs = [];
let currFolder = "";

const playButton = document.querySelector("#play");
const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next");
const volumeInput = document.querySelector(".range input");
const volumeIcon = document.querySelector(".volume > img");
const songListElement = document.querySelector(".songlist ul");
const cardContainer = document.querySelector(".cardContainer");
const songInfoElement = document.querySelector(".songinfo");
const songTimeElement = document.querySelector(".songtime");
const seekBar = document.querySelector(".seekbar");
const circle = document.querySelector(".circle");
const hamburger = document.querySelector(".hamburger");
const closeButton = document.querySelector(".close");

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function normalizeFolderName(folder) {
    if (!folder) return "";
    let folderName = String(folder).trim();
    if (folderName.endsWith("/") || folderName.endsWith("\\")) {
        folderName = folderName.slice(0, -1);
    }
    if (folderName.includes("/") || folderName.includes("\\")) {
        const segments = folderName.split(/[/\\]/).filter(Boolean);
        folderName = segments.pop();
    }
    return decodeURIComponent(folderName).replace(/%5C/gi, "").replace(/\\/g, "");
}

function sanitizeUrlSegment(segment) {
    if (segment === undefined || segment === null) return "";
    return encodeURIComponent(String(segment).trim().replace(/\\/g, ""));
}

function buildAssetUrl(...segments) {
    return `./${segments.map(sanitizeUrlSegment).join("/")}`;
}

function buildFolderUrl(folder = currFolder) {
    return buildAssetUrl("songs", folder);
}

function isSafeUrl(url) {
    return (
        typeof url === "string" &&
        url.length > 0 &&
        !url.includes("undefined") &&
        !url.includes("%5C") &&
        !url.includes("songs/songs")
    );
}

async function urlExists(url) {
    try {
        const response = await fetch(url, { cache: "no-store" });
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function waitForAudioReady(timeout = 5000) {
    if (currentSong.readyState >= 2) return true;

    return new Promise(resolve => {
        let settled = false;
        const onReady = () => settle(true);
        const onError = () => settle(false);
        const timer = setTimeout(() => settle(currentSong.readyState >= 2), timeout);

        function clear() {
            clearTimeout(timer);
            currentSong.removeEventListener("loadedmetadata", onReady);
            currentSong.removeEventListener("canplay", onReady);
            currentSong.removeEventListener("error", onError);
        }

        function settle(value) {
            if (settled) return;
            settled = true;
            clear();
            resolve(value);
        }

        currentSong.addEventListener("loadedmetadata", onReady);
        currentSong.addEventListener("canplay", onReady);
        currentSong.addEventListener("error", onError);
    });
}

function updateSongListButtons() {
    const currentTrack = decodeURIComponent((currentSong.src || "").split("/").pop() || "");
    document.querySelectorAll(".songlist li").forEach(li => {
        const songName = li.querySelector(".info")?.firstElementChild?.textContent?.trim();
        const button = li.querySelector(".playnow img");
        if (!button || !songName) return;
        button.src = !currentSong.paused && currentTrack === songName ? "img/pause.svg" : "img/play.svg";
    });
}

async function getsongs(folder) {
    const folderName = normalizeFolderName(folder);
    currFolder = folderName;

    const songsJsonUrl = `${buildFolderUrl(folderName)}/songs.json`;
    if (!isSafeUrl(songsJsonUrl)) {
        console.error("Invalid songs.json URL for folder:", folderName, songsJsonUrl);
        songs = [];
        songListElement.innerHTML = "";
        return songs;
    }

    const response = await fetch(songsJsonUrl, { cache: "no-store" });
    if (!response.ok) {
        console.error("Could not load songs.json for folder:", folderName, response.status, response.statusText);
        songs = [];
        songListElement.innerHTML = "";
        return songs;
    }

    songs = await response.json();
    songListElement.innerHTML = "";

    songs.forEach(song => {
        const displayName = decodeURIComponent(String(song)).replaceAll("%20", " ");
        songListElement.insertAdjacentHTML(
            "beforeend",
            `<li>
                <img class="invert" src="img/music.svg" alt="music icon">
                <div class="info">
                    <div>${displayName}</div>
                    <div>Talha</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="img/play.svg" alt="play">
                </div>
            </li>`
        );
    });

    songListElement.querySelectorAll("li").forEach((item, idx) => {
        item.addEventListener("click", async () => {
            await playMusic(songs[idx]);
        });
    });

    updateSongListButtons();
    return songs;
}

async function playMusic(track, autoplay = true) {
    if (!track || !currFolder) return;

    const displayName = decodeURIComponent(String(track)).replaceAll("%20", " ");
    const trackUrl = `${buildFolderUrl(currFolder)}/${sanitizeUrlSegment(track)}`;
    if (!isSafeUrl(trackUrl)) {
        console.error("Invalid audio URL generated:", trackUrl);
        return;
    }

    if (!isSafeUrl(trackUrl)) {
        console.error("Invalid audio URL generated:", trackUrl);
        return;
    }

    currentSong.pause();
    currentSong.src = trackUrl;
    currentSong.load();
    currentSong.currentTime = 0;

    songInfoElement.textContent = displayName;
    songTimeElement.textContent = "00:00 / 00:00";

    const songList = Array.from(document.querySelectorAll(".songlist li"));
    const currentSongElement = songList.find(e =>
        e.querySelector(".info")?.firstElementChild?.textContent?.trim() === displayName
    );

    if (currentSongElement) {
        currentSongElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    let playAttempt = null;
    if (autoplay) {
        playButton.src = "img/pause.svg";
        playAttempt = currentSong.play().catch(error => {
            console.warn("Playback blocked or delayed:", error);
            playButton.src = "img/play.svg";
            return null;
        });
    } else {
        playButton.src = "img/play.svg";
    }

    const audioReady = await waitForAudioReady();
    if (!audioReady) {
        console.error("Audio could not be loaded for:", trackUrl);
        return;
    }

    updateSongListButtons();
    if (playAttempt) {
        await playAttempt;
    }
}

async function displayAlbums() {
    const albumsUrl = buildAssetUrl("songs", "albums.json");
    const response = await fetch(albumsUrl);
    if (!response.ok) {
        console.error("Could not load songs/albums.json");
        return;
    }

    const albumFolders = await response.json();
    cardContainer.innerHTML = "";

    for (const folder of albumFolders) {
        const folderName = normalizeFolderName(folder);
        let info = { title: folderName, description: "" };
        const infoUrl = `${buildFolderUrl(folderName)}/info.json`;
        const infoRes = await fetch(infoUrl, { cache: "no-store" });
        if (infoRes.ok) {
            info = await infoRes.json();
        }

        let folderSongs = [];
        const songsUrl = `${buildFolderUrl(folderName)}/songs.json`;
        const songsRes = await fetch(songsUrl, { cache: "no-store" });
        if (songsRes.ok) {
            folderSongs = await songsRes.json();
        }

        const coverUrl = `${buildFolderUrl(folderName)}/cover.jpg`;
        cardContainer.insertAdjacentHTML(
            "beforeend",
            `<div data-folder="${folderName}" class="card">
                <div class="play">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="40" height="40">
                        <circle cx="24" cy="24" r="24" fill="#1DB954" />
                        <path d="M20 15.5L34 24L20 32.5V15.5Z" fill="#000000" />
                    </svg>
                </div>
                <img src="${coverUrl}" alt="Playlist cover">
                <h3>${info.title}</h3>
                <p>${info.description}</p>
            </div>`
        );

        const currentCard = cardContainer.lastElementChild;
        if (currentCard) {
            currentCard.dataset.songs = JSON.stringify(folderSongs);
        }
    }

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            const folder = card.dataset.folder;
            const preloadedSongs = card.dataset.songs ? JSON.parse(card.dataset.songs) : [];
            currFolder = normalizeFolderName(folder);
            if (preloadedSongs.length) {
                playMusic(preloadedSongs[0], true);
            }
            await getsongs(folder);
        });
    });
}

async function main() {
    currentSong.volume = 0.1;
    if (volumeInput) volumeInput.value = 10;

    await displayAlbums();
    await getsongs("Arctic_Monkeys");
    if (songs.length) {
        await playMusic(songs[0], false);
    }

    playButton.addEventListener("click", async () => {
        if (!currentSong.src && songs.length) {
            await playMusic(songs[0]);
            return;
        }

        if (!currentSong.src) return;
        if (currentSong.paused) {
            try {
                await currentSong.play();
                playButton.src = "img/pause.svg";
            } catch (error) {
                console.warn("Playback blocked or delayed:", error);
            }
        } else {
            currentSong.pause();
            playButton.src = "img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        const duration = currentSong.duration || 0;
        const currentTime = currentSong.currentTime || 0;
        const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
        songTimeElement.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
        circle.style.left = `${progress}%`;
    });

    currentSong.addEventListener("ended", async () => {
        if (!songs.length || !currentSong.src) return;
        const currentFile = decodeURIComponent((currentSong.src || "").split("/").pop() || "");
        const index = songs.indexOf(currentFile);
        if (index >= 0 && index < songs.length - 1) {
            await playMusic(songs[index + 1]);
        }
    });

    currentSong.addEventListener("error", () => {
        console.error("Audio element error:", currentSong.error);
    });

    seekBar.addEventListener("click", e => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = rect.width ? (e.clientX - rect.left) / rect.width : 0;
        circle.style.left = `${percent * 100}%`;
        currentSong.currentTime = (currentSong.duration || 0) * percent;
    });

    hamburger.addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    closeButton.addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previousButton.addEventListener("click", async () => {
        if (!songs.length || !currentSong.src) return;
        const currentFile = decodeURIComponent(currentSong.src.split("/").pop() || "");
        const index = songs.indexOf(currentFile);
        if (index > 0) {
            await playMusic(songs[index - 1]);
        }
    });

    nextButton.addEventListener("click", async () => {
        if (!songs.length || !currentSong.src) return;
        const currentFile = decodeURIComponent(currentSong.src.split("/").pop() || "");
        const index = songs.indexOf(currentFile);
        if (index >= 0 && index < songs.length - 1) {
            await playMusic(songs[index + 1]);
        }
    });

    setInterval(updateSongListButtons, 100);

    volumeInput.addEventListener("input", e => {
        currentSong.volume = parseFloat(e.target.value) / 100;
    });

    volumeIcon.addEventListener("click", () => {
        if (volumeIcon.src.includes("volume.svg")) {
            volumeIcon.src = "img/mute.svg";
            currentSong.volume = 0;
            volumeInput.value = 0;
        } else {
            volumeIcon.src = "img/volume.svg";
            currentSong.volume = 0.1;
            volumeInput.value = 10;
        }
    });
}

main();
