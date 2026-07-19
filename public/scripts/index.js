window.addEventListener("DOMContentLoaded", () => {
  const darkToggle = document.querySelector("input#darkmode");
  if (darkToggle) {
    darkToggle.addEventListener("change", function (el) {
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
      const mode = localStorage.getItem("darkmode") === "true";
      darkToggle.checked = mode;
      if (mode) {
        document.body.classList.add("darkmode");
        document.body.classList.remove("lightmode");
      } else {
        document.body.classList.remove("darkmode");
        document.body.classList.add("lightmode");
      }
    }
  }

  if (window.location.pathname === "/" || window.location.pathname === "/my-movies") {
    attachImageFallback(document);
  }

  initBrowsePage();
});

function attachImageFallback(scope) {
  [...scope.querySelectorAll(".card__image")].forEach((image) => {
    image.addEventListener("error", () => {
      image.src = "/images/default-movie.jpg";
    });
  });
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ---------- API stubs -------------------------------------------------
   Endpoints/params below are placeholders for wiring purposes only --
   swap in the real routes/response shapes once the API is ready. Each
   stub currently resolves with an empty result so the UI stays usable
   with nothing plugged in.
------------------------------------------------------------------------ */

function searchMovies(query) {
  return fetch(`/api/movies/search?q=${encodeURIComponent(query)}`)
    .then((res) => res.json())
    .catch(() => ({ movies: [] }));
}

function fetchMoviesByFormat(formatSlug) {
  const url =
    formatSlug && formatSlug !== "all"
      ? `/api/movies?format=${encodeURIComponent(formatSlug)}`
      : "/api/movies";
  return fetch(url)
    .then((res) => res.json())
    .catch(() => ({ movies: [] }));
}

function fetchMarketplaceStats() {
  return fetch("/api/stats/marketplace")
    .then((res) => res.json())
    .catch(() => ({ verifiedSellers: null, tradedThisMonth: null }));
}

function proposeTrade(movieId) {
  return fetch(`/api/movies/${movieId}/trade`, { method: "POST" }).then((res) =>
    res.json()
  );
}

function buyNow(movieId) {
  return fetch(`/api/movies/${movieId}/buy`, { method: "POST" }).then((res) =>
    res.json()
  );
}

/* ---------- Browse page (index.ejs) ------------------------------------ */

const CONDITION_GRADE = { Mint: 5, "Near Mint": 4, "Very Good": 3, Fair: 2, Poor: 1 };

function browseCardHTML(movie) {
  const catalogCode = movie.id ? String(movie.id).slice(-6).toUpperCase() : null;
  const conditionFilled = movie.condition ? CONDITION_GRADE[movie.condition] || 0 : 0;
  const formatSlug = movie.format
    ? movie.format.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    : "";
  const openToTrade = movie.listingType === "Trade" || movie.listingType === "Both";
  const actionLabel = movie.listingType === "Trade" ? "Propose trade" : "Buy now";
  const seller =
    movie.createdBy && typeof movie.createdBy === "object"
      ? movie.createdBy.username || movie.createdBy.fullname
      : null;
  const sellerLocation =
    movie.createdBy && typeof movie.createdBy === "object" ? movie.createdBy.location : null;
  const sellerRating =
    movie.createdBy && typeof movie.createdBy === "object" ? movie.createdBy.rating : null;
  const sellerInitials = seller ? seller.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() : "GF";

  let dots = "";
  for (let i = 1; i <= 5; i++) dots += `<span class="${i <= conditionFilled ? "filled" : ""}"></span>`;

  return `<li data-key="${movie.id}" data-format="${formatSlug}">
    <a href="/${movie.id}" class="card">
      <div class="card__media">
        <img src="${movie.image || "/images/default-movie.jpg"}" class="card__image" alt="Image for ${movie.title}" />
        ${movie.format ? `<span class="badge badge-format">${movie.format}</span>` : ""}
        ${openToTrade ? `<span class="badge badge-trade">Open to trade</span>` : ""}
      </div>
      <div class="card__content">
        <div class="card__heading">
          <div class="card__header-text">
            ${catalogCode ? `<p class="movie__catalog">Cat. #${catalogCode}</p>` : ""}
            <h3 class="movie__title">${movie.title}</h3>
          </div>
        </div>
        ${movie.description ? `<p class="movie__description">${movie.description}</p>` : ""}
        ${movie.condition ? `<div class="condition-row"><div class="condition-bar">${dots}</div><span class="condition-label">${movie.condition}</span></div>` : ""}
        ${
          seller
            ? `<div class="seller-row"><div class="avatar">${sellerInitials}</div><div>
                <div class="seller-name">${seller}${sellerLocation ? ` · <span class="seller-loc">${sellerLocation}</span>` : ""}${sellerRating ? ` <span class="seller-rating">★ ${sellerRating}</span>` : ""}</div>
              </div></div>`
            : ""
        }
        <div class="price-row">
          <span class="movie__price">₦${movie.price}</span>
          <span class="view-pill">${actionLabel}</span>
        </div>
      </div>
    </a>
  </li>`;
}

function renderMovieResults(movies) {
  const list = document.getElementById("movie-results");
  if (!list) return;
  if (!movies || !movies.length) {
    list.innerHTML = `<h3 id="no-movies">No movies match that search.</h3>`;
    return;
  }
  list.innerHTML = movies.map(browseCardHTML).join("");
  attachImageFallback(list);
}

function initBrowsePage() {
  const searchInput = document.getElementById("movie-search");
  const filters = document.getElementById("format-filters");
  const statSellers = document.querySelector("#stat-sellers b");
  const statVolume = document.querySelector("#stat-volume b");

  if (!searchInput && !filters && !statSellers) return; // not the browse page

  if (searchInput) {
    const runSearch = debounce((query) => {
      if (!query) {
        // empty query -- fall back to the current format filter, if any
        const activeChip = filters && filters.querySelector(".chip.active");
        fetchMoviesByFormat(activeChip ? activeChip.dataset.format : "all").then((data) =>
          renderMovieResults(data.movies)
        );
        return;
      }
      searchMovies(query).then((data) => renderMovieResults(data.movies));
    }, 300);

    searchInput.addEventListener("input", (e) => runSearch(e.target.value.trim()));
  }

  if (filters) {
    const chips = filters.querySelectorAll(".chip");
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        if (searchInput) searchInput.value = "";
        fetchMoviesByFormat(chip.dataset.format).then((data) => renderMovieResults(data.movies));
      });
    });
  }

  if (statSellers || statVolume) {
    fetchMarketplaceStats().then((stats) => {
      if (statSellers) statSellers.textContent = stats.verifiedSellers ?? "—";
      if (statVolume) statVolume.textContent = stats.tradedThisMonth ?? "—";
    });
  }
}
