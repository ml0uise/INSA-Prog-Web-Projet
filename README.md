# INSA’s Grade Rain of Death  
**Mini Web Game Project – INSA Toulouse (3rd Year MIC)**

## 📚 Academic Context

This project was developed as part of the **Web Programming course** during our **third year in the MIC curriculum**.

The objective of the assignment was to design and implement a **fully playable browser-based video game** using standard web technologies, while respecting specific pedagogical constraints related to JavaScript programming, DOM manipulation, and software structure.

---

## 🎮 Project Overview

**INSA’s Grade Rain of Death** is a 2D arcade-style game playable directly in the browser.  
The player controls a character who must dodge or catch falling objects (“notes”), each having different effects on score and lives.

The game supports:
- **Single-player and two-player modes**
- **Session-based high score persistence**
- **Sound effects and background music**
- **Animated UI and visual feedback**

The gameplay logic is implemented using an object-oriented JavaScript architecture, with a central game engine responsible for state management, rendering, and updates.

---

## 🛠️ Technologies Used

- **HTML5**
  - Page structure
  - `<canvas>` elements for rendering
- **CSS3**
  - Layout (Flexbox)
  - Animations and neon-style visual effects
- **JavaScript (ES6)**
  - Game engine and loop
  - Object-oriented programming
  - DOM manipulation
  - Event handling
  - Session storage (cookies & `sessionStorage`)

No external JavaScript frameworks were used.

---

## 🧱 Project Structure

```text
/
├── index.html              # Main HTML entry point
├── css/
│   └── game.css            # Global styles, animations, UI effects
├── js/
│   ├── cookies.js          # Session storage, player names, highscores
│   ├── NoteType.js         # Note behavior strategies
│   ├── Note.js             # Falling note entity
│   ├── Game.js             # Core game engine and main loop
│   ├── game.js             # Game initialization and asset binding
│   ├── highscores.js       # Highscores rendering logic
│   └── main.js             # Global control flow, input routing, and UI transitions
└── assets/
    ├── images/             # Sprites, UI icons, backgrounds
    └── sounds/             # Sound effects and background music
```

## 🧠 Pedagogical Objectives Addressed

This project fulfills the mandatory requirements defined in the course specifications:

- ✔ Use of **Strings** and string manipulation  
- ✔ Creation and usage of **multiple JavaScript functions**  
- ✔ Correct use of **conditional statements** (`if / else`)  
- ✔ Implementation of **varied loop types**:
  - `for`
  - `while`
  - `for...in`
  - `for...of`
- ✔ Use of **table**
- ✔ **JavaScript validation** (player name input)
- ✔ Creation of **custom objects and prototypes**
- ✔ Extensive **DOM manipulation**
- ✔ **Session-based highscores system**

Several **bonus extensions** were also implemented:
- Multiplayer support
- Audio feedback
- Difficulty scaling over time
- Animated UI effects

---

## 🎯 Controls

### Menu
- **ENTER**: Start / restart the game  
- **SPACE**: Show highscores
- **P**: Toggle between 1-player and 2-player mode

### Gameplay
- **← / →** or **Q / D**: Move the Player 1 or 2 to the Left / Right

---

## 💾 Data Persistence

- Player names, scores, and highscores are stored using **`sessionStorage`**
- Data persists **only during the browser session**, as required by the assignment
- No server-side storage is used

---

## 🚀 How to Run the Project

1. Download or clone the project files  
2. Open `index.html` in a modern web browser  
3. **Enable sound** in the browser for the full experience  
4. Press **ENTER** to start playing  

No build step or local server is required.

Or you can access it on one of our production servers :

- https://etud.insa-toulouse.fr/~cdura/3A-Projet-Prog-Web
- https://etud.insa-toulouse.fr/~fdelbreil/insa_s_grade_rain_of_death/

---

## 👥 Authors

This project was developed as a **group assignment** by students of **INSA Toulouse – MIC (3rd Year)**.  
Each group member contributed to design, implementation, testing, and documentation.

---

## 📄 License

This project is intended **solely for academic use** within the context of INSA Toulouse coursework.  
No commercial use is intended.
