// Importation des modules
const ipc = window.ipc
const localStorage = window.localStorage

// Variables globales
let playbtn = document.getElementById("play");

// Lors d'un click sur le bouton play, non désactivé
playbtn.addEventListener("click", () => {
  playbtn.disabled = true;
  console.log("click")

  ipc.send("login", {})
});

if (store.get("token")) {
    playbtn.disabled = true;
    ipc.send("loginToken", JSON.parse(store.get("token")));
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