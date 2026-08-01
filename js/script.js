let currentSong = new Audio();
let songs;
let currFolder;

function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60)
    let secs = Math.floor(seconds % 60)

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

async function getsongs(folder) {
    // Normalize folder name (accept either "songs/AlbumName" or "AlbumName")
    let folderName = folder;
    if (folder.includes("/")) folderName = folder.split("/").pop();
    // Remove any backslash-encoding if present
    folderName = decodeURIComponent(folderName).replace(/%5C/g, "").replace(/\\/g, "");

    currFolder = `songs/${folderName}`;

    // Fetch the songs manifest (songs.json) inside the album folder
    let a = await fetch(`${currFolder}/songs.json`);
    if (!a.ok) {
        console.error("Could not load songs.json for folder:", currFolder);
        songs = [];
    } else {
        songs = await a.json();
    }

    // Render song list (keep UI same as before)
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    for (const song of songs) {
        const displayName = decodeURIComponent(song).replaceAll("%20", " ");
        songUL.innerHTML = songUL.innerHTML + `<li><img class="invert" src="img/music.svg" alt="music.svg">
                            <div class="info">
                                <div> ${displayName}</div>
                                <div>Talha</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="img/play.svg" alt="">
                            </div> </li>`
    }

    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach((e, idx) => {
        e.addEventListener("click", element => {
            playMusic(songs[idx])
        })
    })

    return songs

}

const playMusic = (track, pause = false) => {
    currentSong.src = `%5C${currFolder.replace("/", "%5C")}%5C` + track
    if (!pause) {
        currentSong.play()
        play.src = "img/pause.svg"
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00"

    // democode
    let songList = Array.from(
        document.querySelector(".songlist").getElementsByTagName("li")
    )

    let currentSongElement = songList.find(e =>
        e.querySelector(".info").firstElementChild.innerHTML.trim() ===
        decodeURI(track)
    )

    if (currentSongElement) {
        currentSongElement.scrollIntoView({
            behavior: "smooth",
            block: "center"
        })
    }

}

async function displayAlbums() {
    // Load the albums list from a manifest that works on GitHub Pages
    // albums.json contains an array of album folder names, e.g. ["Arctic_Monkeys"]
    let a = await fetch(`songs/albums.json`);
    if (!a.ok) {
        console.error("Could not load songs/albums.json");
        return;
    }
    const albumFolders = await a.json();

    let cardContainer = document.querySelector(".cardContainer")
    cardContainer.innerHTML = "";

    for (const folder of albumFolders) {
        const infoRes = await fetch(`songs/${folder}/info.json`);
        let info = { title: folder, description: "" };
        if (infoRes.ok) {
            info = await infoRes.json();
        }

        cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="40" height="40">
                                <circle cx="24" cy="24" r="24" fill="#1DB954" />
                                <path d="M20 15.5L34 24L20 32.5V15.5Z" fill="#000000" />
                            </svg>
                        </div>
                        <img src="songs/${folder}/cover.jpg" alt="Playlist">
                        <h3>${info.title}</h3>
                        <p>${info.description}</p>
                    </div>`
    }

    // Attach click handlers to the cards
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getsongs(item.currentTarget.dataset.folder)
            if (songs && songs.length) playMusic(songs[0])
        })
    })
}

async function main() {

    // Load a default album on startup by folder name
    await getsongs("Arctic_Monkeys")
    if (songs && songs.length) playMusic(songs[0], true)

    displayAlbums()

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
            play.src = "img/pause.svg"
        } else {
            currentSong.pause()
            play.src = "img/play.svg"
        }
    })

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    })

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })

    let previous = document.querySelector("#previous")
    previous.addEventListener("click", () => {
        currentSong.pause()
        const currentFile = decodeURIComponent(currentSong.src.split('/').pop());
        let index = songs.indexOf(currentFile)
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })

    let next = document.querySelector("#next")
    next.addEventListener("click", () => {
        currentSong.pause()
        const currentFile = decodeURIComponent(currentSong.src.split('/').pop());
        let index = songs.indexOf(currentFile)
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
    })

    // democode
    setInterval(() => {

        let current = decodeURIComponent(
            currentSong.src.split('/').pop()
        )

        document.querySelectorAll(".songlist li").forEach(li => {

            let song = li.querySelector(".info").firstElementChild
                .innerHTML
                .trim()

            let button = li.querySelector(".playnow img")

            if (!button) return

            if (
                !currentSong.paused &&
                current === song
            ) {
                button.src = "img/pause.svg"
            } else {
                button.src = "img/play.svg"
            }

        })

    }, 100)

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100
    })

    document.querySelector(".volume>img").addEventListener("click", e=>{
        if(e.target.src.includes("img/volume.svg")){
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg")
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;

        } else {
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg")
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })

}

main()