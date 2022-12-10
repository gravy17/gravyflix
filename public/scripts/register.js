const form = document.getElementById("signup-form");
form.addEventListener("submit", (event) => {
  event.preventDefault();
  event.stopPropagation();
  const prePayload = new FormData(form);
  const payload = new URLSearchParams(prePayload);

  fetch("/api/register", {
    method: "POST",
    body: payload,
  })
    .then((res) => {
      if (res.ok) {
        window.location.assign("/login");
      }
    })
    .catch((err) => {
      console.error(err);
    });
});
