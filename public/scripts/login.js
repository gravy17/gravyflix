const form = document.getElementById("login-form");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  event.stopPropagation();
  const prePayload = new FormData(form);
  const payload = new URLSearchParams(prePayload);

  fetch("/api/login", {
    method: "POST",
    body: payload,
  })
    .then((res) => {
      if (res.ok) {
        window.location.assign("/my-movies");
      }
    })
    .catch((err) => {
      console.error(err);
    });
});
