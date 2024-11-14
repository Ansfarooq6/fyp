const backdrop = document.querySelector('.backdrop');
const sideDrawer = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('#side-menu-toggle');

function backdropClickHandler() {
  backdrop.style.display = 'none';
  sideDrawer.classList.remove('open');
}

let hoverAnim = () => {
  let dropdowns = document.querySelectorAll(".dropdown");

  dropdowns.forEach((dropdown) => {
    let dropdownMenu = dropdown.querySelector(".dropdown-menu");

    dropdown.addEventListener("mouseenter", () => {
      dropdownMenu.style.display = "block";
    });

    dropdown.addEventListener("mouseleave", () => {
      dropdownMenu.style.display = "none";
    });
  });
};

hoverAnim();

function menuToggleClickHandler() {
  backdrop.style.display = 'block';
  sideDrawer.classList.add('open');
}

backdrop.addEventListener('click', backdropClickHandler);
menuToggle.addEventListener('click', menuToggleClickHandler);

document.addEventListener('DOMContentLoaded', () => {
  const dropdownToggle = document.getElementById('adminDropdown');
  const dropdownMenu = document.querySelector('.dropdown-menu');

  dropdownToggle.addEventListener('click', (e) => {
    e.preventDefault();
    dropdownMenu.classList.toggle('show');
  });
});
