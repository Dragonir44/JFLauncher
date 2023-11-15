// Importation des modules
const ipc = window.ipc
const store = new window.Store()
const os = window.os

let version = window.location.hash.substring(1);
document.getElementById('version').innerText = version;

// Variables globales
let pseudo = document.getElementById("pseudo");
let skin = document.getElementById("skin");
let deco = document.getElementById("deco");
let playbtn = document.getElementById("playbtn");
let ram = document.getElementById("ram");
let maxRam = os.totalmem() / 1024 / 1024 / 1024;
let ramValue = document.getElementById("ramValue");
let userDetails = JSON.parse(ipc.sendSync('getDetails', ''))
let progressBar = document.getElementById("progressBar");
let progress = document.getElementById("progress");
let progressStatus = document.getElementById("status");

ipc.on('progress', (event, data) => {
  progressBar.style.display = 'flex'
  progress.style.width = `${data.progress}%` || '0%'
  progressStatus.innerHTML = `Chargement de ${data.type} : ${data.progress || 0}%`
})

// Affichage des informations
pseudo.innerHTML = userDetails.profile.name;
skin.src = `https://mc-heads.net/avatar/${userDetails.profile.name}`;

ram.max = maxRam;
ram.value = store.get("ram") || 1;
ramValue.innerHTML = ram.value;
ram.addEventListener("input", () => {
  document.getElementById("ramValue").innerHTML = ram.value;
  store.set("ram", ram.value);
}) 

// Modal
var modal = document.getElementById("myModal");
var span = document.getElementsByClassName("close")[0];
document.getElementById("options").addEventListener("click", () => {
  modal.style.display = "block";
});
span.onclick = function () {
  modal.style.display = "none";
};
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

playbtn.onclick = () => {
  console.log('launch')
  ipc.send("launch", {ram: ram.value, channel: 'beta'});
  playbtn.disabled = true;
};

ipc.on('closed', (event, data) => {
  playbtn.disabled = false;
  progressBar.style.display = 'none'
  progress.style.width = '0%'
})

deco.onclick = () => {
  ipc.send("deco", "");
}

ipc.on('message', function(event, text) {
  var container = document.getElementById('messages');
  var message = document.createElement('div');
  console.log(text)
  message.innerHTML = text;
  container.appendChild(message);
})