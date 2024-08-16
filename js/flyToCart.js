function flyToCart(flyer, flyTo) {
  // Clone the flyer image
  const flyerClone = flyer.cloneNode(true);
  flyerClone.classList.add('flyer-clone');
  
  // Apply initial styles to the cloned flyer
  const f = flyer.getBoundingClientRect();
  flyerClone.style.position = 'absolute';
  flyerClone.style.left = `${f.left}px`;
  flyerClone.style.top = `${f.top}px`;
  flyerClone.style.width = `${f.width}px`;
  flyerClone.style.height = `${f.height}px`;
  flyerClone.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
  flyerClone.style.zIndex = 1000;

  // Append the clone to the body
  document.body.appendChild(flyerClone);

  // Get the destination bounding rectangle
  const ft = flyTo.getBoundingClientRect();

  // Calculate translation distances
  const deltaX = ft.left - f.left;
  const deltaY = ft.top - f.top;
  const scale = Math.min(ft.width / f.width, ft.height / f.height); // Scale to fit

  // Trigger the transform for the animation
  requestAnimationFrame(() => {
    flyerClone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
    flyerClone.style.opacity = 0;
  });

  // After the animation duration, remove the clone
  flyerClone.addEventListener('transitionend', () => {
    flyerClone.remove();
  });
}
