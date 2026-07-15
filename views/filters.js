document.addEventListener('DOMContentLoaded', function () {
  var chips = document.querySelectorAll('#format-filters .chip');
  var items = document.querySelectorAll('.cards > li');

  if (!chips.length) return;

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');

      var format = chip.getAttribute('data-format');
      items.forEach(function (li) {
        var card = li.querySelector('.card');
        var show = format === 'all' || (card && card.getAttribute('data-format') === format);
        li.style.display = show ? '' : 'none';
      });
    });
  });
});
