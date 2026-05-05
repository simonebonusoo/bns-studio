document.addEventListener("DOMContentLoaded", () => {
  const mobileNav = document.getElementById("MobileNav");
  const mobileNavToggle = document.querySelector("[data-mobile-nav-toggle]");
  const cartDrawer = document.querySelector("[data-cart-drawer]");
  const cartOpenButtons = document.querySelectorAll("[data-cart-drawer-open]");
  const cartCloseButtons = document.querySelectorAll("[data-cart-drawer-close]");

  if (mobileNavToggle && mobileNav) {
    mobileNavToggle.addEventListener("click", () => {
      const expanded = mobileNavToggle.getAttribute("aria-expanded") === "true";
      mobileNavToggle.setAttribute("aria-expanded", String(!expanded));
      mobileNav.hidden = expanded;
    });
  }

  function openCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.hidden = true;
    document.body.style.overflow = "";
  }

  cartOpenButtons.forEach((button) => {
    button.addEventListener("click", openCartDrawer);
  });

  cartCloseButtons.forEach((button) => {
    button.addEventListener("click", closeCartDrawer);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCartDrawer();
  });
});
