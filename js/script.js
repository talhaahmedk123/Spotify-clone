let currentSong = new Audio();
let songs;
let currFolder;

function formatTime(seconds) {
    let minutes = Math.floor(seconds / 60)
    let secs = Math.floor(seconds % 60)

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

async function getsongs(folder) {
    currFolder = folder;
    // let a = await fetch(`http://127.0.0.1:3000/${folder}/`)

    let a = await fetch(`${folder}/`);

    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response
    let as = div.getElementsByTagName("a")
    songs = []
    for (let i = 0; i < as.length; i++) {
        const element = as[i]
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`%5C${folder.replace("/", "%5C")}%5C`)[1])
        }
    }

    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li><img class="invert" src="img/music.svg" alt="music.svg">
                            <div class="info">
                                <div> ${song.replaceAll("%20", " ").replaceAll("%5", " ")}</div>
                                <div>Talha</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="img/play.svg" alt="">
                            </div> </li>`
    }

    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())
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
    // let a = await fetch(`http://127.0.0.1:3000/songs/`)
    
    let a = await fetch(`${folder}/`);
    
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response
    let anchors = div.getElementsByTagName("a")
    let cardContainer = document.querySelector(".cardContainer")
    let array = Array.from(anchors)
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
    if (e.href.includes("%5Csongs%5C")) {
        let folder = e.href.split("%5C").pop().replace("/", "")
        // let a = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`)

        let a = await fetch("../songs/" + folder + "/info.json");


        let responce = await a.json();
        cardContainer.innerHTML = cardContainer.innerHTML + `<div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="40" height="40">
                                <circle cx="24" cy="24" r="24" fill="#1DB954" />
                                <path d="M20 15.5L34 24L20 32.5V15.5Z" fill="#000000" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="Playlist">
                        <h3>${responce.title}</h3>
                        <p>${responce.description}</p>
                    </div>`
    }
}

Array.from(document.getElementsByClassName("card")).forEach(e => {
    e.addEventListener("click", async item => {
        songs = await getsongs(`songs%5C${item.currentTarget.dataset.folder}`)
        playMusic(songs[0])
    })
})
}

async function main() {

    await getsongs("songs/Arctic_Monkeys")
    playMusic(songs[0], true)

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

        let index = songs.indexOf(currentSong.src.split("%5C").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })

    let next = document.querySelector("#next")
    next.addEventListener("click", () => {
        currentSong.pause()

        let index = songs.indexOf(currentSong.src.split("%5C").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
    })

    // democode
    setInterval(() => {

        let current = decodeURIComponent(
            currentSong.src.split("%5C").pop()
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