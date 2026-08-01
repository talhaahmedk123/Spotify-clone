let currentSong = new Audio();
let songs = [];
let currFolder = "";
const playButton = document.querySelector("#play");
const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next");
const volumeInput = document.querySelector(".range input");
const volumeIcon = document.querySelector(".volume > img");

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function normalizeFolderName(folder) {
    let folderName = folder;
    if (folder.includes("/")) folderName = folder.split("/").pop();
    return decodeURIComponent(folderName).replace(/%5C/g, "").replace(/\\/g, "");
}

async function getsongs(folder) {
    const folderName = normalizeFolderName(folder);
    currFolder = `songs/${folderName}`;

    const response = await fetch(`${encodeURI(currFolder)}/songs.json`);
    if (!response.ok) {
        console.error("Could not load songs.json for folder:", currFolder);
        songs = [];
    } else {
        songs = await response.json();
    }

    const songUL = document.querySelector(".songlist ul");
    songUL.innerHTML = "";

    songs.forEach(song => {
        const displayName = decodeURIComponent(song).replaceAll("%20", " ");
        songUL.insertAdjacentHTML(
            "beforeend",
            `<li><img class="invert" src="img/music.svg" alt="music icon">
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

    songUL.querySelectorAll("li").forEach((item, idx) => {
        item.addEventListener("click", () => {
            playMusic(songs[idx]);
        });
    });

    return songs;
}

async function playMusic(track, pause = false) {
    if (!track || !currFolder) return;

    const trackUrl = `${encodeURI(currFolder)}/${encodeURIComponent(track)}`;
    currentSong.pause();
    currentSong.src = trackUrl;
    currentSong.load();

    document.querySelector(".songinfo").textContent = decodeURI(track);
    document.querySelector(".songtime").textContent = "00:00 / 00:00";

    const songList = Array.from(document.querySelectorAll(".songlist li"));
    const currentSongElement = songList.find(e =>
        e.querySelector(".info").firstElementChild.textContent.trim() ===
        decodeURI(track)
    );

    if (currentSongElement) {
        currentSongElement.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    if (!pause) {
        try {
            await currentSong.play();
            playButton.src = "img/pause.svg";
        } catch (error) {
            console.warn("Playback interrupted or blocked:", error);
            playButton.src = "img/play.svg";
        }
    } else {
        playButton.src = "img/play.svg";
    }
}

async function displayAlbums() {
    const response = await fetch("songs/albums.json");
    if (!response.ok) {
        console.error("Could not load songs/albums.json");
        return;
    }

    const albumFolders = await response.json();
    const cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    for (const folder of albumFolders) {
        let info = { title: folder, description: "" };
        const infoRes = await fetch(`${encodeURI(`songs/${folder}`)}/info.json`);
        if (infoRes.ok) {
            try {
                info = await infoRes.json();
            } catch (error) {
                console.warn(`Invalid JSON in songs/${folder}/info.json`, error);
            }
        }

        cardContainer.insertAdjacentHTML(
            "beforeend",
            `<div data-folder="${folder}" class="card">
                <div class="play">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="40" height="40">
                        <circle cx="24" cy="24" r="24" fill="#1DB954" />
                        <path d="M20 15.5L34 24L20 32.5V15.5Z" fill="#000000" />
                    </svg>
                </div>
                <img src="${encodeURI(`songs/${folder}`)}/cover.jpg" alt="Playlist cover">
                <h3>${info.title}</h3>
                <p>${info.description}</p>
            </div>`
        );
    }

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            const folder = card.dataset.folder;
            const albumSongs = await getsongs(folder);
            if (albumSongs && albumSongs.length) {
                await playMusic(albumSongs[0], true);
            }
        });
    });
}

async function main() {
    currentSong.volume = 0.1;
    if (volumeInput) volumeInput.value = 10;

    await displayAlbums();
    await getsongs("Arctic_Monkeys");
    if (songs.length) {
        await playMusic(songs[0], true);
    }

    playButton.addEventListener("click", async () => {
        if (!currentSong.src) return;
        if (currentSong.paused) {
            try {
                await currentSong.play();
                playButton.src = "img/pause.svg";
            } catch (error) {
                console.warn("Playback interrupted or blocked:", error);
                playButton.src = "img/play.svg";
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
        document.querySelector(".songtime").textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
        document.querySelector(".circle").style.left = `${progress}%`;
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = rect.width ? (e.clientX - rect.left) / rect.width : 0;
        document.querySelector(".circle").style.left = `${percent * 100}%`;
        currentSong.currentTime = (currentSong.duration || 0) * percent;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previousButton.addEventListener("click", async () => {
        if (!songs.length) return;
        const currentFile = decodeURIComponent(currentSong.src.split("/").pop());
        const index = songs.indexOf(currentFile);
        if (index > 0) {
            await playMusic(songs[index - 1]);
        }
    });

    nextButton.addEventListener("click", async () => {
        if (!songs.length) return;
        const currentFile = decodeURIComponent(currentSong.src.split("/").pop());
        const index = songs.indexOf(currentFile);
        if (index >= 0 && index < songs.length - 1) {
            await playMusic(songs[index + 1]);
        }
    });

    setInterval(() => {
        const current = decodeURIComponent(currentSong.src.split("/").pop() || "");
        document.querySelectorAll(".songlist li").forEach(li => {
            const song = li.querySelector(".info").firstElementChild.textContent.trim();
            const button = li.querySelector(".playnow img");
            if (!button) return;
            button.src = !currentSong.paused && current === song ? "img/pause.svg" : "img/play.svg";
        });
    }, 100);

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
