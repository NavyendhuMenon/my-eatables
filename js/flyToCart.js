function flyToCart(flyer, flyTo) {
  const flyerClone = flyer.cloneNode(true);
  flyerClone.classList.add('flyer-clone');

  document.body.appendChild(flyerClone);

  // Get bounding rectangles
  const ft = flyTo.getBoundingClientRect();
  const f = flyer.getBoundingClientRect();

  // Calculate translation distances
  const deltaX = ft.left - f.left;
  const deltaY = ft.top - f.top;

  // Apply transform and transition
  flyerClone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.5)`;
  flyerClone.style.opacity = 0;

  // After the animation duration, remove the clone
  setTimeout(() => {
      flyerClone.remove();
  }, 500); // Adjust timing to match your animation duration
}
