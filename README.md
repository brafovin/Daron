# Big Duck Chase

A browser game: a very large duck chases you. Throw bananas to make it slip in
a cartoonishly funny way. Customize the duck's colors, size, speed, hat, and
name — or pick one of the built-in presets.

## Play

Open `index.html` in a web browser. No build step, no dependencies.

Or serve it locally:

```
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Controls

- **Move:** WASD or arrow keys
- **Aim:** mouse
- **Throw banana:** Space or click (arcs forward; if it misses, it leaves a
  slip-peel on the ground)
- **Restart:** R

## Goal

Survive as long as you can. Cause as many slips as possible. A direct banana
hit slips the duck; a thrown banana that lands also leaves a peel the duck can
slip on later.

## Customization

Everything in the right-hand panel updates live:

- **Presets:** Classic, Evil, Royal, Party, Chill
- **Colors:** body, beak, eyes, wing
- **Size & speed** sliders
- **Hats:** top hat, party hat, crown, backwards cap
- **Name** (shown above the duck)

## Files

- `index.html` — layout and controls
- `style.css` — styling
- `duck.js` — duck rendering + preset definitions
- `game.js` — game loop, physics, input, scene
