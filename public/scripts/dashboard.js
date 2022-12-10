function prepareMovieNode(movie) {
  const newnode = document.createElement("li");
  newnode.dataset.key = movie.id;
  newnode.innerHTML = `<a href="/${movie.id}" class="card">
    <img src="${
      movie.image || "/images/default-movie.jpg"
    }" class="card__image" alt="image for ${movie.title}" />
    <div class="card__overlay">
      <div class="card__header">
        <svg class="card__arc" xmlns="http://www.w3.org/2000/svg">
          <path d="M 40 80 c 40 0 40 -40 40 -40 v 40 Z"/>
        </svg>
        <span class="modifybtns">
          <button class="edit-btn" data-edit="${
            movie.id
          }">Edit Movie<i class="edit-icon"></i></button>
          <button class="delete-btn" data-delete="${
            movie.id
          }">Delete Movie<i class="delete-icon"></i></button>
        </span>
        <div class="card__header-text">
          <h3 class="movie__title">${movie.title}</h3>
          <span>₦</span><span class="movie__price">${movie.price}</span>
        </div>
      </div>
      <p class="movie__description">${movie.description}</p>
    </div>
  </a>`;
  newnode.querySelector(".edit-btn").addEventListener("click", prepareEditor);
  newnode
    .querySelector(".delete-btn")
    .addEventListener("click", prepareDeletion);
  return newnode;
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
  const movie = document.querySelector(`[data-key="${editTarget}"]`);
  title.value = movie.querySelector(".movie__title").innerText;
  price.value = movie.querySelector(".movie__price").innerText;
  description.value = movie.querySelector(".movie__description").innerText;
  image.value = movie.querySelector(".card__image").src;
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
