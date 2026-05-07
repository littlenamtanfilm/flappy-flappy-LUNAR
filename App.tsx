@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
@import "tailwindcss";

@theme {
  --font-press-start: "Press Start 2P", system-ui, sans-serif;
}

body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #000;
  font-family: var(--font-press-start);
}

canvas {
  display: block;
  image-rendering: pixelated;
}

.pixel-card {
  background: white;
  border: 4px solid #000;
  box-shadow: 8px 8px 0px rgba(0, 0, 0, 0.2);
}

.pixel-button {
  background: #ffcc00;
  border: 4px solid #000;
  box-shadow: 4px 4px 0px #000;
  image-rendering: pixelated;
  transition: transform 0.1s;
}

.pixel-button:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #000;
}

.credit-text {
  font-family: var(--font-press-start);
  font-size: 8px;
  color: rgba(0, 0, 0, 0.3);
  pointer-events: none;
}
