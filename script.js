// Importation des modules
const ipc = window.ipc
const localStorage = window.localStorage
const store = new window.Store()

// Variables globales
let playbtn = document.getElementById("play");

// Lors d'un click sur le bouton play, non désactivé
playbtn.addEventListener("click", () => {
  playbtn.disabled = true;
  console.log("click")

  ipc.send("login", {})
});

if (store.get("userDetails")) {
    playbtn.disabled = true;
    ipc.send("loginToken", JSON.parse(store.get("userDetails")));
}

// Récéption de l'event erreur
ipc.on("err", (event, errorMessage) => {
  localStorage.clear();
  iziToast.error({
    id: "error",
    title: "Erreur",
    message: errorMessage,
    position: "bottomRight",
    transitionIn: "fadeInDown",
  });
  playbtn.disabled = false;
});