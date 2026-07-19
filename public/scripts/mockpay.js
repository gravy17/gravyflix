document.addEventListener("DOMContentLoaded", () => {
  const payBtn = document.getElementById("mockpay-pay");
  const cancelBtn = document.getElementById("mockpay-cancel");

  if (payBtn) {
    const reference = payBtn.dataset.reference;
    const callback = payBtn.dataset.callback;

    payBtn.addEventListener("click", () => {
      payBtn.disabled = true;
      payBtn.textContent = "Processing…";

      // Stands in for whatever happens on the real gateway's own hosted
      // page when a cardholder submits their details -- no API key here,
      // this is a browser-to-gateway call, not server-to-server.
      fetch(`/mockpay-provider/transaction/confirm/${reference}`, {
        method: "POST",
      })
        .then((res) => res.json())
        .then((data) => {
          const url = new URL(data.callback_url || callback);
          url.searchParams.set("reference", reference);
          window.location.href = url.toString();
        })
        .catch(() => {
          payBtn.disabled = false;
          payBtn.textContent = "Something went wrong — try again";
        });
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      window.history.back();
    });
  }
});
