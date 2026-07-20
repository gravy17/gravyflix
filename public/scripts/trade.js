/* ---------- API stubs -------------------------------------------------
   Placeholder endpoints -- swap in the real routes once ready.
------------------------------------------------------------------------ */
function fetchTradeById(id) {
  return fetch(`/api/trades/${id}`).then((res) => res.json());
}

function confirmTrade(id) {
  return fetch(`/api/trades/${id}/confirm`, { method: "POST" }).then((res) =>
    res.json()
  );
}

function submitTradeRating(id, rating) {
  return fetch(`/api/trades/${id}/rate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating: rating }),
  }).then((res) => res.json());
}

function getMyRole(trade, myUserId) {
  const sellerId = trade.seller && (trade.seller.id || trade.seller._id || trade.seller);
  if (myUserId && String(sellerId) === String(myUserId)) return "seller";
  return "buyer";
}

let selectedRating = 0;

function render(trade) {
  const root = document.getElementById("trade-detail-root");
  const myId = document.body.dataset.userId;
  const iAmSeller = getMyRole(trade, myId) === "seller";

  const myMovie = iAmSeller ? trade.seller_movie : trade.buyer_movie;
  const incomingMovie = iAmSeller ? trade.buyer_movie : trade.seller_movie;
  const counterpart = iAmSeller ? trade.buyer : trade.seller;
  const myConfirmed = iAmSeller ? trade.seller_confirmed : trade.buyer_confirmed;
  const myRatingGiven = iAmSeller ? trade.buyer_rating : trade.seller_rating;

  const counterpartName = counterpart ? counterpart.username || counterpart.fullname : "your trade partner";
  const counterpartLocation = counterpart ? [counterpart.city, counterpart.country_code].filter(Boolean).join(", ") : "";
  const counterpartRating = counterpart ? counterpart.rating : null;
  const counterpartInitials = counterpartName.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "GF";

  let confirmHTML;
  if (trade.completed) {
    confirmHTML = `<button class="button is-done" disabled>Trade completed &#10003;</button>`;
  } else if (myConfirmed) {
    confirmHTML = `<button class="button" disabled>You confirmed &#10003; — waiting on ${counterpartName}</button>`;
  } else {
    confirmHTML = `<button class="button" id="confirm-btn">Confirm completion</button>`;
  }

  const activeStars = myRatingGiven || selectedRating;
  let starsHTML = "";
  for (let i = 1; i <= 5; i++) {
    starsHTML += `<button type="button" data-star="${i}" class="${i <= activeStars ? "filled" : ""}" ${myRatingGiven ? "disabled" : ""}>&#9733;</button>`;
  }
  const ratingSubmitHTML = myRatingGiven
    ? `<button class="button button--ghost is-done" disabled>Rating submitted &#10003;</button>`
    : `<button class="button button--ghost" id="submit-rating-btn" ${selectedRating ? "" : "disabled"}>Submit rating</button>`;

  root.innerHTML = `
    <div class="trade-detail">
      <p class="trade-detail__label">You're receiving</p>
      <div class="listing-summary">
        <img class="listing-summary__image" src="${(incomingMovie && incomingMovie.image) || "/images/default-movie.jpg"}" alt="">
        <div>
          <p class="listing-summary__title">${incomingMovie ? incomingMovie.title : "Movie"}</p>
          <p class="listing-summary__meta">${incomingMovie ? [incomingMovie.format, incomingMovie.condition].filter(Boolean).join(" · ") : ""}</p>
        </div>
      </div>

      <p class="trade-detail__label" style="margin-top:20px;">You're sending</p>
      <div class="listing-summary">
        <img class="listing-summary__image" src="${(myMovie && myMovie.image) || "/images/default-movie.jpg"}" alt="">
        <div>
          <p class="listing-summary__title">${myMovie ? myMovie.title : "Movie"}</p>
          <p class="listing-summary__meta">${myMovie ? [myMovie.format, myMovie.condition].filter(Boolean).join(" · ") : ""}</p>
        </div>
      </div>

      <div class="trade-detail__counterpart">
        <div class="avatar avatar--lg">${counterpartInitials}</div>
        <div>
          <p class="seller-name">${counterpartName}</p>
          <p class="seller-meta">
            ${counterpartLocation ? `<span>${counterpartLocation}</span>` : ""}
            ${counterpartRating ? `<span class="seller-rating">${counterpartRating}%</span>` : ""}
          </p>
        </div>
      </div>

      ${confirmHTML}

      <div class="rating-widget">
        <p>Rate ${counterpartName}</p>
        <div class="rating-stars">${starsHTML}</div>
        ${ratingSubmitHTML}
        ${myRatingGiven ? "" : '<p class="rating-note">Select a star rating, then submit.</p>'}
      </div>
    </div>
  `;

  wireInteractions(trade);
}

function wireInteractions(trade) {
  const confirmBtn = document.getElementById("confirm-btn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Confirming…";
      confirmTrade(trade.id)
        .then((data) => {
          Object.assign(trade, data.trade || {});
          const myId = document.body.dataset.userId;
          if (getMyRole(trade, myId) === "seller") trade.seller_confirmed = true;
          else trade.buyer_confirmed = true;
          render(trade);
        })
        .catch(() => {
          confirmBtn.disabled = false;
          confirmBtn.textContent = "Couldn't confirm — try again";
        });
    });
  }

  document.querySelectorAll(".rating-stars button:not(:disabled)").forEach((star) => {
    star.addEventListener("click", () => {
      selectedRating = Number(star.dataset.star);
      render(trade);
    });
  });

  const submitRatingBtn = document.getElementById("submit-rating-btn");
  if (submitRatingBtn) {
    submitRatingBtn.addEventListener("click", () => {
      submitRatingBtn.disabled = true;
      submitRatingBtn.textContent = "Submitting…";
      submitTradeRating(trade.id, selectedRating)
        .then(() => {
          const myId = document.body.dataset.userId;
          if (getMyRole(trade, myId) === "seller") trade.buyer_rating = selectedRating;
          else trade.seller_rating = selectedRating;
          render(trade);
        })
        .catch(() => {
          submitRatingBtn.disabled = false;
          submitRatingBtn.textContent = "Couldn't submit — try again";
        });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("trade-detail-root");
  const tradeId = root && root.dataset.tradeId;
  if (!root || !tradeId) return;
  fetchTradeById(tradeId)
    .then((data) => render(data.trade))
    .catch(() => {
      root.innerHTML = '<p class="dashboard-empty">Couldn\'t load this trade.</p>';
    });
});
