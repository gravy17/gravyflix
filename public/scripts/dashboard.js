// Card markup here mirrors partials/moviecard.ejs for canModify=true.
// Keep the two in sync -- this is the client-side render used after
// create/update, the EJS partial is the server-side render for first load.
function prepareMovieNode(movie) {
  const catalogCode = movie.id ? String(movie.id).slice(-6).toUpperCase() : null;

  const newnode = document.createElement("li");
  newnode.dataset.key = movie.id;
  newnode.dataset.title = movie.title || "";
  newnode.dataset.price = movie.price != null ? movie.price : "";
  newnode.dataset.description = movie.description || "";
  newnode.dataset.image = movie.image || "";
  newnode.dataset.formatValue = movie.format || "";
  newnode.dataset.condition = movie.condition || "";
  newnode.dataset.listingType = movie.listingType || "";

  newnode.innerHTML = `<a href="/${movie.id}" class="card">
    <div class="card__media">
      <img src="${movie.image || "/images/default-movie.jpg"}" class="card__image" alt="Image for ${movie.title}" />
      ${movie.format ? `<span class="badge badge-format">${movie.format}</span>` : ""}
    </div>
    <div class="card__content">
      <div class="card__heading">
        <div class="card__header-text">
          ${catalogCode ? `<p class="movie__catalog">Cat. #${catalogCode}</p>` : ""}
          <h3 class="movie__title">${movie.title}</h3>
        </div>
        <span class="modifybtns">
          <button class="edit-btn" data-edit="${movie.id}"><span>Edit</span><i class="edit-icon"></i></button>
          <button class="delete-btn" data-delete="${movie.id}"><span>Delete</span><i class="delete-icon"></i></button>
        </span>
      </div>
      ${movie.description ? `<p class="movie__description">${movie.description}</p>` : ""}
      ${movie.condition ? conditionRow(movie.condition) : ""}
      <div class="price-row">
        <span class="movie__price">₦${movie.price}</span>
        <span class="status-pill">Live listing</span>
      </div>
    </div>
  </a>`;
  newnode.querySelector(".edit-btn").addEventListener("click", prepareEditor);
  newnode
    .querySelector(".delete-btn")
    .addEventListener("click", prepareDeletion);
  return newnode;
}

const CONDITION_GRADE_2 = { Mint: 5, "Near Mint": 4, "Very Good": 3, Fair: 2, Poor: 1 };
function conditionRow(condition) {
  const filled = CONDITION_GRADE_2[condition] || 0;
  let dots = "";
  for (let i = 1; i <= 5; i++) {
    dots += `<span class="${i <= filled ? "filled" : ""}"></span>`;
  }
  return `<div class="condition-row"><div class="condition-bar">${dots}</div><span class="condition-label">${condition}</span></div>`;
}

document.getElementById("close-editor").addEventListener("click", () => {
  document.getElementById("bodyoverlay").style.visibility = "hidden";
  document.querySelector(".editor").style.display = "none";
});

//DELETING A MOVIE
function deleteCurrent(target, nodeToRemove, event) {
  fetch(`/api/movies/${target}`, {
    method: "DELETE",
  })
    .then((res) => {
      if (res.ok) {
        const listnode = nodeToRemove.parentElement;
        listnode.removeChild(nodeToRemove);
        const remainingMovie = listnode.querySelector("li");
        const nomovies = document.createElement("h2");
        nomovies.id = "no-movies";
        nomovies.innerText = "No movies. Create a new one";
        remainingMovie || listnode.appendChild(nomovies);
        document.getElementById("bodyoverlay").style.visibility = "hidden";
        document.querySelector(".deletewarning").style.display = "none";
      }
    })
    .catch(console.error);
}

function prepareDeletion(evt) {
  evt.preventDefault();
  evt.stopPropagation();
  const delTarget = this.dataset.delete;
  const movie = document.querySelector(`[data-key="${delTarget}"]`);
  const prompt = document.getElementById("deletewarning");
  document.getElementById("bodyoverlay").style.visibility = "visible";
  prompt.style.display = "block";
  document
    .getElementById("confirmdel")
    .addEventListener("click", deleteCurrent.bind(null, delTarget, movie));
}

document.getElementById("canceldel").addEventListener("click", () => {
  document.getElementById("bodyoverlay").style.visibility = "hidden";
  document.getElementById("deletewarning").style.display = "none";
});

[...document.querySelectorAll("button[data-delete]")].forEach((delBtn) => {
  delBtn.addEventListener("click", prepareDeletion);
});

//UPDATING A MOVIE
function updateCurrent(target, form, nodeToReplace, event) {
  let prePayload = new FormData(form);
  let payloadObj = Object.fromEntries(prePayload.entries());
  let payload = JSON.stringify(payloadObj);
  const opts = {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
  };
  fetch(`/api/movies/${target}`, opts)
    .then((res) => res.json())
    .then((data) => {
      if (data.updated) {
        const updated = prepareMovieNode(data.updated);
        nodeToReplace.replaceWith(updated);
        document.getElementById("bodyoverlay").style.visibility = "hidden";
        document.querySelector(".editor").style.display = "none";
      }
    })
    .catch(console.error);
}

function prepareEditor(evt) {
  evt.preventDefault();
  evt.stopPropagation();
  const editTarget = this.dataset.edit;
  const editor = document.getElementById("editor");
  const title = editor.querySelector('[name="title"]');
  const price = editor.querySelector('[name="price"]');
  const description = editor.querySelector('[name="description"]');
  const image = editor.querySelector('[name="image"]');
  const format = editor.querySelector('[name="format"]');
  const condition = editor.querySelector('[name="condition"]');
  const listingType = editor.querySelector('[name="listingType"]');
  const movie = document.querySelector(`[data-key="${editTarget}"]`);

  // Data attributes set at render time -- not scraped from rendered text,
  // so currency symbols / truncated descriptions can't corrupt the values.
  title.value = movie.dataset.title;
  price.value = movie.dataset.price;
  description.value = movie.dataset.description;
  image.value = movie.dataset.image;
  format.value = movie.dataset.formatValue;
  condition.value = movie.dataset.condition;
  listingType.value = movie.dataset.listingType || "Sale";

  editor.querySelector("h1").innerText = "Update Movie: " + title.value;
  const submit = editor.querySelector("#editSubmit");
  submit.value = "Update";
  const form = editor.querySelector("#edit-form");
  const newsubmit = submit.cloneNode(true);
  submit.replaceWith(newsubmit);
  newsubmit.addEventListener(
    "click",
    updateCurrent.bind(null, editTarget, form, movie)
  );
  editor.style.display = "block";
  document.getElementById("bodyoverlay").style.visibility = "visible";
}

[...document.querySelectorAll("button[data-edit]")].forEach((editBtn) => {
  editBtn.addEventListener("click", prepareEditor);
});

//CREATING A NEW MOVIE
function createNew(form, listnode, event) {
  const prePayload = new FormData(form);
  const payloadObj = Object.fromEntries(prePayload.entries());
  const payload = JSON.stringify(payloadObj);
  const opts = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: payload,
  };
  fetch("/api/movies", opts)
    .then((res) => res.json())
    .then((data) => {
      if (data.created) {
        const created = prepareMovieNode(data.created);
        const nomovies = document.getElementById("no-movies");
        nomovies && nomovies.parentNode.removeChild(nomovies);
        listnode.appendChild(created);
        document.getElementById("bodyoverlay").style.visibility = "hidden";
        document.querySelector(".editor").style.display = "none";
      }
    })
    .catch(console.error);
}

document.querySelector(".add-btn").addEventListener("click", () => {
  const editor = document.getElementById("editor");
  editor.querySelector('[name="title"]').value = null;
  editor.querySelector('[name="price"]').value = null;
  editor.querySelector('[name="description"]').value = null;
  editor.querySelector('[name="image"]').value = null;
  editor.querySelector('[name="format"]').value = "";
  editor.querySelector('[name="condition"]').value = "";
  editor.querySelector('[name="listingType"]').value = "Sale";
  const submit = editor.querySelector("#editSubmit");
  editor.querySelector("h1").innerText = "Add Movie";
  submit.value = "Create";
  const form = editor.querySelector("#edit-form");
  const movielist = document.querySelector(".cards");
  const newsubmit = submit.cloneNode(true);
  submit.replaceWith(newsubmit);
  newsubmit.addEventListener("click", createNew.bind(null, form, movielist));
  document.getElementById("bodyoverlay").style.visibility = "visible";
  editor.style.display = "block";
});

/* ---------- Trades in progress / completed / purchases completed ------
   API stubs -- placeholder endpoints/params, swap in real routes once
   ready. Rendering here mirrors partials/moviecard.ejs and the trade
   card design from the earlier preview; keep in sync if either changes.
------------------------------------------------------------------------ */

function fetchTradesInProgress() {
  return fetch("/api/trades?status=in-progress")
    .then((res) => res.json())
    .catch(() => ({ trades: [] }));
}

function fetchTradesCompleted() {
  return fetch("/api/trades?status=completed")
    .then((res) => res.json())
    .catch(() => ({ trades: [] }));
}

function fetchPurchasesCompleted() {
  return fetch("/api/sales?status=completed")
    .then((res) => res.json())
    .catch(() => ({ sales: [] }));
}

function getMyRole(trade, myUserId) {
  const sellerId = trade.seller && (trade.seller.id || trade.seller._id || trade.seller);
  if (myUserId && String(sellerId) === String(myUserId)) return "seller";
  return "buyer";
}

function tradeInProgressCardHTML(trade) {
  const myId = document.body.dataset.userId;
  const iAmSeller = getMyRole(trade, myId) === "seller";
  const myMovie = iAmSeller ? trade.seller_movie : trade.buyer_movie;
  const theirMovie = iAmSeller ? trade.buyer_movie : trade.seller_movie;
  const counterpart = iAmSeller ? trade.buyer : trade.seller;
  const myConfirmed = iAmSeller ? trade.seller_confirmed : trade.buyer_confirmed;
  const theirConfirmed = iAmSeller ? trade.buyer_confirmed : trade.seller_confirmed;

  let statusLabel = "Ready to confirm";
  let statusClass = "status-pill--action";
  if (myConfirmed && !theirConfirmed) {
    statusLabel = "Awaiting their confirmation";
    statusClass = "status-pill--pending";
  } else if (myConfirmed && theirConfirmed) {
    statusLabel = "Completed";
    statusClass = "status-pill--pending";
  }

  const counterpartName = counterpart ? counterpart.username || counterpart.fullname : "another collector";

  return `<li>
    <a href="/trades/${trade.id}" class="trade-card">
      <div class="trade-card__pair">
        <img class="trade-card__thumb" src="${(myMovie && myMovie.image) || "/images/default-movie.jpg"}" alt="">
        <span class="trade-card__arrow">&#8646;</span>
        <img class="trade-card__thumb" src="${(theirMovie && theirMovie.image) || "/images/default-movie.jpg"}" alt="">
      </div>
      <div class="trade-card__info">
        <p class="trade-card__title">${myMovie ? myMovie.title : "Your movie"} for ${theirMovie ? theirMovie.title : "their movie"}</p>
        <p class="trade-card__with">With ${counterpartName}</p>
        <span class="status-pill ${statusClass}">${statusLabel}</span>
      </div>
    </a>
  </li>`;
}

function receivedMovieCardHTML(movie, tagLabel) {
  const catalogCode = movie.id ? String(movie.id).slice(-6).toUpperCase() : null;
  return `<li>
    <a href="/${movie.id}" class="card">
      <div class="card__media">
        <img src="${movie.image || "/images/default-movie.jpg"}" class="card__image" alt="Image for ${movie.title}" />
        <span class="received-tag">${tagLabel}</span>
      </div>
      <div class="card__content">
        <div class="card__heading">
          <div class="card__header-text">
            ${catalogCode ? `<p class="movie__catalog">Cat. #${catalogCode}</p>` : ""}
            <h3 class="movie__title">${movie.title}</h3>
          </div>
        </div>
      </div>
    </a>
  </li>`;
}

function loadTradesInProgress() {
  const list = document.getElementById("trades-in-progress-list");
  const loading = document.getElementById("trades-loading");
  if (!list) return;
  fetchTradesInProgress().then((data) => {
    const trades = data.trades || [];
    if (loading) loading.textContent = trades.length ? `${trades.length} trade${trades.length === 1 ? "" : "s"} awaiting completion.` : "No trades in progress.";
    list.innerHTML = trades.map(tradeInProgressCardHTML).join("");
  });
}

function loadTradesCompleted() {
  const list = document.getElementById("trades-completed-list");
  const loading = document.getElementById("trades-completed-loading");
  if (!list) return;
  fetchTradesCompleted().then((data) => {
    const trades = data.trades || [];
    const myId = document.body.dataset.userId;
    const received = trades.map((trade) => (getMyRole(trade, myId) === "seller" ? trade.buyer_movie : trade.seller_movie)).filter(Boolean);
    if (loading) loading.textContent = received.length ? `${received.length} movie${received.length === 1 ? "" : "s"} received via trade.` : "No completed trades yet.";
    list.innerHTML = received.map((movie) => receivedMovieCardHTML(movie, "Received via trade")).join("");
  });
}

function loadPurchasesCompleted() {
  const list = document.getElementById("purchases-completed-list");
  const loading = document.getElementById("purchases-loading");
  if (!list) return;
  fetchPurchasesCompleted().then((data) => {
    const sales = data.sales || [];
    if (loading) loading.textContent = sales.length ? `${sales.length} movie${sales.length === 1 ? "" : "s"} purchased.` : "No completed purchases yet.";
    list.innerHTML = sales.map((sale) => receivedMovieCardHTML(sale.movie, `Purchased ₦${sale.valueAmount}`)).join("");
  });
}

if (document.getElementById("trades-in-progress-list")) {
  loadTradesInProgress();
  loadTradesCompleted();
  loadPurchasesCompleted();
}
