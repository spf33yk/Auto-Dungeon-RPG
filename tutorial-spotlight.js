const outlineSpace = 7;

function visibleOpening(target, width, height) {
  const bounds = target.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return null;
  let left = Math.max(0, bounds.left - outlineSpace);
  let top = Math.max(0, bounds.top - outlineSpace);
  let right = Math.min(width, bounds.right + outlineSpace);
  let bottom = Math.min(height, bounds.bottom + outlineSpace);

  // Root overflow is handled by the viewport bounds above.
  for (let parent = target.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
    const {overflowX, overflowY} = getComputedStyle(parent);
    if (overflowX === 'visible' && overflowY === 'visible') continue;
    const clip = parent.getBoundingClientRect();
    if (overflowX !== 'visible') {
      left = Math.max(left, clip.left);
      right = Math.min(right, clip.right);
    }
    if (overflowY !== 'visible') {
      top = Math.max(top, clip.top);
      bottom = Math.min(bottom, clip.bottom);
    }
  }

  if (right <= left || bottom <= top) return null;
  return [left, top, right - left, bottom - top];
}

export function createTutorialSpotlight(canvas) {
  const ctx = canvas.getContext('2d');
  let frame = 0;
  let marked = [];
  let lastLayout = '';

  function clear() {
    cancelAnimationFrame(frame);
    marked.forEach(target => target.classList.remove('tutorial-target'));
    marked = [];
    lastLayout = '';
    canvas.hidden = true;
  }

  function show(selector) {
    clear();
    function update() {
      const width = innerWidth;
      const height = innerHeight;
      const targets = [];
      const openings = [];
      // The editor can replace cards and slots while a step is in progress.
      for (const target of document.querySelectorAll(selector)) {
        if (target.disabled || !target.getClientRects().length) continue;
        if (getComputedStyle(target).visibility !== 'visible') continue;
        const opening = visibleOpening(target, width, height);
        if (!opening) continue;
        targets.push(target);
        openings.push(opening);
      }
      marked.forEach(target => {
        if (!targets.includes(target)) target.classList.remove('tutorial-target');
      });
      targets.forEach(target => {
        if (!marked.includes(target)) target.classList.add('tutorial-target');
      });
      marked = targets;
      canvas.hidden = openings.length === 0;

      const layout = JSON.stringify([width, height, openings]);
      if (openings.length && layout !== lastLayout) {
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctx.fillRect(0, 0, width, height);
        openings.forEach(opening => ctx.clearRect(...opening));
      }
      lastLayout = layout;
      frame = requestAnimationFrame(update);
    }
    update();
  }

  return {show, clear};
}
