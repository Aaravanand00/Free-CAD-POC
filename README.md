# FreeCAD-Inspired Parametric CAD PoC

This PoC demonstrates how multiple interaction systems (snapping, measurement, and collaboration) can be unified through a single reference-based model, instead of being implemented as isolated features. 

Unlike a standard drawing tool (like MS Paint or early-stage Canva) where you store raw pixel coordinates, this project follows the **FreeCAD core principle**: **Geometry is a set of relationships, not just data points.**

## 🧠 The Key Idea: References over Coordinates

If you measure the distance between two points, a normal app might just record `150px`. 

In this system, we record a **Parametric Reference**: `Rectangle1@top_left` to `Circle2@center`. 

**Why does this matter?** 
If you resize the rectangle or move the circle, the measurement doesn't break. It's not "dead data." The system re-resolves those references on every frame. This is the foundation of modern engineering software.

## ⚙️ Features

-   **Parametric Geometry**: Shapes (`Line`, `Circle`, `Rectangle`) are defined by parameters.
-   **Semantic Snapping**: An intentional snapping system that understands engineering intent. It prioritizes **Vertices** over **Centers** and **Midpoints**.
-   **Dynamic Measurement**: Measures distances that update in real-time as you modify the underlying geometry.
-   **Collaboration Layer**: Threaded annotations ("Check this fillet") that are anchored to specific geometric features, not just random screen locations.

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🧪 Demo Script (Try this!)

To see the system in action:
1.  **Draw a Rectangle** (use the Square icon).
2.  **Draw a Circle** (Circle icon) starting from one of the rectangle's corners (`RECTANGLE1@top_left`).
3.  **Measure**: Click the Ruler icon. Snap to a rectangle corner, then to the circle's center.
4.  **Annotate**: Click the Message icon and snap to the circle center. Add a comment like "Hole alignment?".
5.  **Modify**: Switch to the Pointer tool, select the Rectangle in the "MODELS" list, and change its properties. Watch how the measurement and the annotation tag follow the geometry perfectly.

---

## 🔥 Design Decisions

I didn’t store geometry as raw coordinates because that approach breaks as soon as relationships matter. 

Instead, I used reference-based links like `Circle1@center`. This allowed every system (snapping, measurement, annotations) to depend on meaning rather than position.

Separating the system into **Geometry**, **Snap**, **Measurement**, and **Collaboration** layers also helped keep responsibilities clear. It made it easier to reason about behavior and avoid coupling everything into one place.

The snapping priority (**Vertex > Center > Midpoint**) was a small but important decision. Without it, the system felt unpredictable in dense areas. With it, interaction became much more intentional.

---

## 📸 Demo

![Prototype Validation](./cad_parametric_validation.png)

**Figure: Prototype demonstrating parametric snapping and reference-based interaction.**

The scene shows multiple shapes interacting through semantic snap points. This setup was used to validate snapping priority, reference resolution, and how measurements and annotations remain stable even when geometry changes.

---

## 🛠️ Implementation / Approach

The system uses a custom-built **Semantic Resolution Engine**. When you click on a snap point, the system doesn't save `{x, y}`, it saves a pointer to the geometry's internal point map. 

During the render loop, the **Measurement Engine** queries these pointers. If the underlying shape has been moved (e.g., via the Properties sidebar), the engine resolves the *new* coordinates of the semantic points before calculating the distance. This ensures 100% data integrity without manual updates.

---

## 🚀 Future Work

The next logical step would be to extend this system with a constraint solver, allowing references not just to observe geometry, but to actively control it (e.g., changing a measurement value would resize the underlying shape).

Another important direction would be integrating this approach into a 3D environment, where snapping and references operate across planes and volumes instead of a 2D canvas.

Finally, collaboration could be extended with real-time multi-user synchronization and conflict resolution strategies. 

Built by a senior engineer with a passion for open-source CAD architecture. Enjoy! 🚀
