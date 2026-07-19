/* ---------- API stubs -------------------------------------------------
   Placeholder endpoints/params -- swap in the real routes once ready.
------------------------------------------------------------------------ */
function fetchMyCatalog() {
  return fetch("/api/movies/mine")
    .then((res) => res.json())
    .catch(() => ({ movies: [] }));
}

// Real endpoint now (not a stub) -- POST /api/movies/:id/buy creates a
// pending Sale and returns { sale, authorizationUrl }. authorizationUrl
// points at MockPay's hosted checkout (see mockpay.ejs/mockpay.js), which
// redirects back to the app's completion callback once "paid".
function buyNow(movieId) {
  return fetch(`/api/movies/${movieId}/buy`, { method: "POST" }).then((res) =>
    res.json()
  );
}

function proposeTrade(movieId, buyerMovieId) {
  return fetch(`/api/movies/${movieId}/trade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ buyerMovie: buyerMovieId }),
  }).then((res) => res.json());
}

/* ---------- UI helpers ------------------------------------------------ */
function setBusy(btn, label) {
  btn.disabled = true;
  btn.textContent = label;
  btn.classList.remove("is-done", "is-error");
}
function setDone(btn, label) {
  btn.disabled = true;
  btn.textContent = label;
  btn.classList.remove("is-error");
  btn.classList.add("is-done");
}
function setError(btn, label) {
  btn.disabled = false;
  btn.textContent = label;
  btn.classList.remove("is-done");
  btn.classList.add("is-error");
}

function openModal(modal) {
  if (modal) modal.style.display = "flex";
}
function closeModal(modal) {
  if (modal) modal.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  const buyBtn = document.getElementById("open-buy-modal");
  const tradeBtn = document.getElementById("open-trade-modal");
  const buyModal = document.getElementById("buy-modal");
  const tradeModal = document.getElementById("trade-modal");

  if (buyBtn) {
    buyBtn.addEventListener("click", () => {
      if (!document.body.dataset.user) {
        window.location.href = "/login";
        return;
      }
      openModal(buyModal);
    });
  }
  const buyClose = document.getElementById("buy-modal-close");
  if (buyClose) buyClose.addEventListener("click", () => closeModal(buyModal));

  if (tradeBtn) {
    tradeBtn.addEventListener("click", () => {
      if (!document.body.dataset.user) {
        window.location.href = "/login";
        return;
      }
      openModal(tradeModal);
      populateBuyerCatalog();
    });
  }
  const tradeClose = document.getElementById("trade-modal-close");
  if (tradeClose) tradeClose.addEventListener("click", () => closeModal(tradeModal));

  function populateBuyerCatalog() {
    const select = document.getElementById("buyer-movie-select");
    if (!select) return;
    select.innerHTML = '<option value="">Loading your catalog…</option>';
    fetchMyCatalog().then((data) => {
      const movies = (data.movies || []).filter((m) => m.active !== false);
      if (!movies.length) {
        select.innerHTML = '<option value="">You have no active listings to offer</option>';
        return;
      }
      select.innerHTML =
        '<option value="">Select a movie to offer</option>' +
        movies
          .map(
            (m) =>
              `<option value="${m.id}">${m.title}${m.format ? " · " + m.format : ""}</option>`
          )
          .join("");
    });
  }

  const mockpayContinue = document.getElementById("mockpay-continue");
  if (mockpayContinue) {
    mockpayContinue.addEventListener("click", () => {
      const movieId = mockpayContinue.dataset.movie;
      setBusy(mockpayContinue, "Preparing checkout…");
      buyNow(movieId)
        .then((data) => {
          if (data.authorizationUrl) {
            window.location.href = data.authorizationUrl;
          } else {
            setError(mockpayContinue, "Couldn't start checkout — try again");
          }
        })
        .catch(() => setError(mockpayContinue, "Couldn't start checkout — try again"));
    });
  }

  const tradeSubmit = document.getElementById("trade-submit");
  if (tradeSubmit) {
    tradeSubmit.addEventListener("click", () => {
      const movieId = tradeSubmit.dataset.movie;
      const buyerMovieId = document.getElementById("buyer-movie-select").value;
      if (!buyerMovieId) {
        alert("Select a movie to offer first.");
        return;
      }
      setBusy(tradeSubmit, "Sending…");
      proposeTrade(movieId, buyerMovieId)
        .then(() => {
          setDone(tradeSubmit, "Proposal sent ✓");
          setTimeout(() => closeModal(tradeModal), 1200);
        })
        .catch(() => setError(tradeSubmit, "Couldn't send — try again"));
    });
  }
});
