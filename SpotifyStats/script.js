let jsonData;
let startYear;
let endYear;

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('controls').style.display = 'block';
        document.getElementById('filePrompt').style.display = 'none';

        // Извлечение года из имени файла
        const fileName = file.name;
        const yearMatch = fileName.match(/(\d{4})-(\d{4})/);
        if (yearMatch) {
            startYear = yearMatch[1];
            endYear = yearMatch[2];
            console.log(`Годы: ${startYear} - ${endYear}`);
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                jsonData = JSON.parse(e.target.result);
                populateMonthOptions();
            } catch (error) {
                alert("JSON load error!");
                console.error(error);
            }
        };
        reader.readAsText(file);
    }
});

function populateMonthOptions() {
    const monthSelect = document.getElementById("monthSelect");
    monthSelect.innerHTML = "";

    const uniqueMonths = new Set();
    jsonData.forEach(entry => {
        const date = new Date(entry.ts);
        const monthStr = `${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
        uniqueMonths.add(monthStr);
    });

    // Сортируем месяцы от самого позднего к самому раннему
    [...uniqueMonths].sort((a, b) => {
        const [monthA, yearA] = a.split('.');
        const [monthB, yearB] = b.split('.');
        return yearB - yearA || monthB - monthA; // Сортировка сначала по году, затем по месяцу
    }).forEach(month => {
        const option = document.createElement("option");
        option.value = month;
        option.textContent = month;
        monthSelect.appendChild(option);
    });

    populateDayOptions();
}

function populateDayOptions() {
    const selectedMonth = document.getElementById("monthSelect").value;
    const daySelect = document.getElementById("daySelect");
    daySelect.innerHTML = '<option value="all">Whole month</option>';

    const uniqueDays = new Set();
    jsonData.forEach(entry => {
        const date = new Date(entry.ts);
        const dayStr = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (dayStr.endsWith(selectedMonth.split('.')[0])) {
            uniqueDays.add(dayStr);
        }
    });

    [...uniqueDays].sort().forEach(day => {
        const option = document.createElement("option");
        option.value = day;
        option.textContent = day;
        daySelect.appendChild(option);
    });
}

function generateStats() {
    const selectedMonth = document.getElementById("monthSelect").value;
    const selectedDay = document.getElementById("daySelect").value;
    let filteredData = jsonData.filter(entry => {
        const date = new Date(entry.ts);
        const monthStr = `${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
        const dayStr = `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (selectedDay === "all") return monthStr === selectedMonth;
        return dayStr === selectedDay;
    });

    filteredData = filteredData.filter(entry => !(entry.ms_played < 10000 && entry.skipped));

    const totalListeningTime = filteredData.reduce((acc, entry) => acc + entry.ms_played, 0);
    const totalMinutes = totalListeningTime / 60000;

    const trackStats = {};
    filteredData.forEach(entry => {
        const track = `${entry.master_metadata_track_name} - ${entry.master_metadata_album_artist_name}`;
        if (!trackStats[track]) trackStats[track] = { time: 0, count: 0 };
        trackStats[track].time += entry.ms_played;
        trackStats[track].count += 1;
    });

    document.getElementById("listeningTimeValue").textContent = convertMinutes(totalMinutes);

    let statsHTML = "";
    Object.entries(trackStats).sort((a, b) => b[1].time - a[1].time).forEach(([track, data]) => {
        const shortenedTrack = track.length > 30 ? track.substring(0, 27) + "..." : track;
        statsHTML += `<li title="${track}">${shortenedTrack} — ${convertMinutes(data.time / 60000)} (${data.count}×)</li>`;
    });

    document.getElementById("statsList").innerHTML = statsHTML;
}



function generateOverallStats() {
    const totalListeningTime = jsonData.reduce((acc, entry) => acc + entry.ms_played, 0);
    const totalMinutes = totalListeningTime / 60000;

    const trackStats = {};
    jsonData.forEach(entry => {
        const track = `${entry.master_metadata_track_name} - ${entry.master_metadata_album_artist_name}`;
        if (!trackStats[track]) trackStats[track] = { time: 0, count: 0 };
        trackStats[track].time += entry.ms_played;
        trackStats[track].count += 1;
    });

    document.getElementById("listeningTimeValue").textContent = convertMinutes(totalMinutes);

    let statsHTML = "";
    Object.entries(trackStats).sort((a, b) => b[1].time - a[1].time).forEach(([track, data]) => {
        const shortenedTrack = track.length > 30 ? track.substring(0, 27) + "..." : track;
        statsHTML += `<li title="${track}">${shortenedTrack} — ${convertMinutes(data.time / 60000)} (${data.count}×)</li>`;
    });

    document.getElementById("statsList").innerHTML = statsHTML;
}


function convertMinutes(minutes) {
    return minutes >= 60 ? `${minutes.toFixed(1)} min (~${(minutes / 60).toFixed(1)} h)` : `${minutes.toFixed(1)} min`;
}

document.getElementById("fileInput").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById("fileLabel").textContent = "📂 Upload another JSON";
    }
});


document.getElementById("searchInput").addEventListener("input", searchTrack);

function searchTrack() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const statsContainer = document.getElementById("stats");
    const items = statsContainer.getElementsByTagName("li");

    for (let item of items) {
        const text = item.getAttribute("title") || item.innerText;
        item.style.display = text.toLowerCase().includes(query) ? "block" : "none";
    }
}

function toggleSearch() {
    const statsHeader = document.getElementById("statsHeader");
    statsHeader.classList.toggle("search-active");

    // Если скрываем поиск, очищаем поле
    if (!statsHeader.classList.contains("search-active")) {
        document.getElementById("searchInput").value = "";
        searchTrack(); // Обновляем список
    }
}



function toggleHelpPanel() {
    const panel = document.getElementById("helpPanel");
    panel.style.display = panel.style.display === "block" ? "none" : "block";
}


document.getElementById("fileInput").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById("controls").style.display = "block";
        document.getElementById("fileLabel").textContent = "📂 Upload another JSON";
    }
});
