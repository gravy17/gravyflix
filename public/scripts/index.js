window.addEventListener("DOMContentLoaded", () => {
  document
    .querySelector("input#darkmode")
    .addEventListener("change", function (el) {
      localStorage.setItem("darkmode", el.target.checked);
      if (el.target.checked) {
        document.body.classList.add("darkmode");
        document.body.classList.remove("lightmode");
      } else {
        document.body.classList.remove("darkmode");
        document.body.classList.add("lightmode");
      }
    });

  if (localStorage.getItem("darkmode") !== null) {
    document.querySelector("input#darkmode").checked =
      localStorage.getItem("darkmode") === "true";
    const mode = localStorage.getItem("darkmode") === "true";
    if (mode) {
      document.body.classList.add("darkmode");
      document.body.classList.remove("lightmode");
    } else {
      document.body.classList.remove("darkmode");
      document.body.classList.add("lightmode");
    }
  }

  if (window.location.href === "/" || window.location.href === "/my-movies") {
    const images = [...document.querySelectorAll(".card__image")];
    images.map((image) => {
      image.addEventListener("error", () => {
        image.src = "/images/default-movie.jpg";
      });
    });
  }
});
