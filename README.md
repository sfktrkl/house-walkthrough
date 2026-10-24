# House Walkthrough Studio

House Walkthrough Studio is a real-scale 3D editor for designing, measuring, furnishing, and exploring a custom home layout.

## Open it

Double-click `index.html` and open it with Firefox. The project is self-contained and does not need an internet connection.

## Live area tracking

There is no fixed house-size claim because the walls are editable. The **Measured space** panel sums the area of all room-measurement rectangles currently in the layout and shows their count. A large continuous ground plane covers the workspace; the supplied plan and furniture are only a movable starting example.

## Controls

- **Feature guide:** press `H` or use **Features (H)** for the complete in-app feature and shortcut list.
- **Floor plan / edit:** press `P`; right-drag to rotate the camera, middle-drag to pan, and scroll to zoom. Left-drag is reserved for moving objects, and the continuous floor is not selectable.
- **Add objects:** use the left catalog to add furniture, combinable basic shapes, modular walls, or text labels at the centre of the plan.
- **Multi-select and move:** left-click toggles an object in or out of the selection, and `Esc` clears the selection. Drag a selected object to move the entire group anywhere on the continuous ground plane.
- **Rotate:** press `R` to rotate all selected objects 90° around their shared center.
- **Stack and scale shapes:** select one or more basic shapes, then press `E` to set their elevation above the floor or `K` to enter a uniform or X/Y/Z scale. Y controls height.
- **Delete:** select an object and press `Delete` / `Backspace`, or use **Delete selected**.
- **Edit text:** select exactly one text or measurement label and press `T`, or use **Edit label**.
- **Measure a room:** choose **Measure room**, then drag a rectangle over the plan. Its area is calculated in m² at real scale. Only the finished text label remains, so measurements do not block object selection.
- **Pan the plan camera:** middle-drag on the 3D view.
- **Fine adjustment:** arrow keys move the selected item in 10 cm steps.
- **Walk inside:** press `V`, then use `W A S D` and the mouse. Press `Esc` to release the pointer.
- **Reset layout:** press `0` to remove spawned objects and restore the initial arrangement.
- **Save layout:** press `Ctrl+S` to write the current arrangement to a JSON file. Firefox downloads it; browsers supporting the File System Access API show a Save dialog.
- **Load layout:** press `Ctrl+O` to choose a previously saved JSON file and restore that arrangement.

All object positions, spawned duplicates, labels, and deletions are saved automatically in browser local storage.
