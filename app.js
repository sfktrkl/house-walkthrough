const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdce8e4);
scene.fog = new THREE.Fog(0xdce8e4, 24, 48);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.05, 80);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .82;
renderer.setClearColor(0xdce8e4, 1);
document.body.prepend(renderer.domElement);
document.querySelector('#boot')?.remove();

// Uniform daylight keeps the freely editable workspace readable without placed light objects.
scene.add(new THREE.AmbientLight(0xfffbf2, .48));
scene.add(new THREE.HemisphereLight(0xf8fbff, 0x7b867f, .72));
const sun = new THREE.DirectionalLight(0xfff0d1, 1.05);
sun.position.set(-8, 13, -6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = sun.shadow.camera.bottom = -12;
sun.shadow.camera.right = sun.shadow.camera.top = 12;
sun.shadow.bias = -.00025;
scene.add(sun);
const skyFill = new THREE.DirectionalLight(0xcfe5ff, .18);
skyFill.position.set(8, 7, 7);
scene.add(skyFill);

const palette = {
  wall: 0xf2eee5, trim: 0xd9d1c2, wood: 0x8d633f, darkWood: 0x4b3628,
  blue: 0x4f7180, green: 0x617866, rust: 0xa5573e, cream: 0xd8c6a7,
  black: 0x252827, metal: 0x737a78, glass: 0x80b8c5, white: 0xf5f2e9,
};
const material = (color, roughness = .9, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const movable = [];
const baseBlueprints = new Map();
let spawnSerial = 0;
let wallSerial = 0;
const wallMat = material(palette.wall, .92);
const floorRoot = new THREE.Group();
const wallRoot = new THREE.Group();
const furnitureRoot = new THREE.Group();
scene.add(floorRoot, wallRoot, furnitureRoot);

function meshBox(w, h, d, color, x = 0, y = h / 2, z = 0, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function wall(x, z, w, d, h = 2.75) {
  wallSerial += 1;
  const group = new THREE.Group();
  group.name = `Fixed wall ${wallSerial}`; group.position.set(x, 0, z);
  group.userData = {
    movable:true, displayName:`Wall ${w.toFixed(2)} x ${d.toFixed(2)} m`,
    objectId:`base:wall:${wallSerial}`, base:true, kind:'wall', wallSizeX:w, wallSizeZ:d
  };
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat.clone());
  m.position.set(0, h / 2, 0);
  m.castShadow = m.receiveShadow = true;
  group.add(m); wallRoot.add(group); movable.push(group);
  return group;
}

function floorRoom(name, area, x, z, w, d, color) {
  roomMeasurementLabel(`${name} label`, name, x, z, w, d);
}

function roomMeasurementLabel(objectName, roomName, x, z, width, depth) {
  const measuredArea = width * depth;
  const group = furniture(objectName, x, z, 0, g => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent:true, depthTest:false }));
    sprite.position.y = .34; sprite.scale.set(2.1,.66,1); sprite.renderOrder = 21;
    sprite.userData.measurementLabel = true; g.add(sprite);
    drawTextSprite(sprite, `${roomName}\n${measuredArea.toFixed(1)} m²`);
  });
  group.userData.kind = 'measurement'; group.userData.width = width; group.userData.depth = depth;
  group.userData.roomName = roomName; group.userData.base = true;
  group.userData.displayName = `${roomName} · ${measuredArea.toFixed(1)} m²`;
  return group;
}

// A single continuous floor replaces fixed room slabs and user-placeable floor tiles.
const ground = meshBox(200, .08, 200, 0xb8b6ae, 0, -.05, 0, floorRoot);
ground.receiveShadow = true;
const groundGrid = new THREE.GridHelper(200, 200, 0x737a78, 0x969a94);
groundGrid.position.y = .004;
groundGrid.material.transparent = true; groundGrid.material.opacity = .2;
floorRoot.add(groundGrid);

// Starting room labels are real measurement objects and contribute to the live area total.
floorRoom('Living + dining', '28.6', -3.5, -2.55, 5.6, 5.1, 0xb99a76);
floorRoom('Cross hall', '4.5', -3.5, .6, 5.6, .8, 0xc3beb0);
floorRoom('Kitchen', '12.5', -4.7, 3.15, 3.2, 3.9, 0xaeb8ad);
floorRoom('Small office', '8.6', -1.9, 3.15, 2.2, 3.9, 0xa9b6bd);
floorRoom('Main hall', '11.2', .05, 0, 1.1, 10.2, 0xc3beb0);
floorRoom('Bedroom', '20.4', 3.55, -3.25, 5.5, 3.7, 0xb9adab);
floorRoom('Bath + WC + foyer', '10.4', 3.55, -.25, 5.5, 1.9, 0xa7b8b5);
floorRoom('Music + library office', '23.1', 3.55, 3.0, 5.5, 4.2, 0xb6a688);

// Outside shell; the south entrance is left open.
wall(-3.48, -5.3, 5.84, .2); wall(3.48, -5.3, 5.84, .2);
wall(0, 5.3, 13.0, .2); wall(-6.5, 0, .2, 10.8); wall(6.5, 0, .2, 10.8);

// Left wing / main hall, with openings for living room and small office.
wall(-.65, -3.25, .14, 4.1); wall(-.65, -.05, .14, .3);
wall(-.65, 1.4, .14, .2); wall(-.65, 4.1, .14, 2.4);
// Right wing / main hall, with bedroom, foyer and studio openings.
wall(.7, -3.7, .14, 3.2); wall(.7, -1.0, .14, .45);
wall(.7, 1.25, .14, .7); wall(.7, 4.15, .14, 2.3);
// Left cross hall and north rooms.
wall(-4.75, .1, 3.5, .14); wall(-1.45, .1, 1.45, .14);
wall(-5.15, 1.1, 2.7, .14); wall(-3.85, 1.1, .5, .14); wall(-1.95, 1.1, 2.5, .14);
wall(-3.45, 3.2, .14, 4.2);
// Bedroom / wet rooms / studio bands.
wall(3.6, -1.3, 5.8, .14); wall(3.6, .8, 5.8, .14);
// One simple partition separates the guest WC from the full bathroom.
// The 90 cm opening between these two segments is the bathroom doorway.
wall(2.45, -.85, .14, .7); wall(2.45, .55, .14, .3);

function furniture(name, x, z, rotation, build) {
  const group = new THREE.Group();
  group.name = name; group.position.set(x, 0, z); group.rotation.y = rotation;
  group.userData.movable = true; group.userData.displayName = name;
  group.userData.objectId = `base:${name}`; group.userData.base = true;
  build(group); furnitureRoot.add(group); movable.push(group);
  return group;
}

function drawTextSprite(sprite, text) {
  const canvas = document.createElement('canvas');
  canvas.width = 768; canvas.height = 240;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(15,18,18,.92)';
  ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.roundRect(8, 8, 752, 224, 28); ctx.fill(); ctx.stroke();
  const lines = String(text).split('\n').slice(0, 3);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((line, index) => {
    ctx.font = `${index ? 600 : 750} ${index ? 45 : 54}px Arial, sans-serif`;
    ctx.fillStyle = index ? '#ffb85c' : '#ffffff';
    const y = lines.length === 1 ? 120 : 83 + index * 68;
    ctx.fillText(line.slice(0, 34), 384, y);
  });
  sprite.material.map?.dispose();
  sprite.material.map = new THREE.CanvasTexture(canvas);
  sprite.material.map.encoding = THREE.sRGBEncoding;
  sprite.material.needsUpdate = true;
}

function textLabel(name, x, z, text, base = false) {
  const group = furniture(name, x, z, 0, g => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
    sprite.position.y = .32; sprite.scale.set(2.35, .73, 1); sprite.renderOrder = 20;
    sprite.userData.textSprite = true; g.add(sprite); drawTextSprite(sprite, text);
  });
  group.userData.kind = 'label'; group.userData.text = text; group.userData.base = base;
  return group;
}

function updateTextLabel(group, text) {
  if (!group || group.userData.kind !== 'label') return;
  group.userData.text = text;
  group.userData.displayName = text.replace(/\n/g, ' · ');
  const sprite = group.children.find(child => child.userData.textSprite);
  if (sprite) drawTextSprite(sprite, text);
  if (selectedItems.has(group)) refreshSelectionUI();
}

function sofa(name, x, z, length, color, rotation = 0) {
  return furniture(name, x, z, rotation, g => {
    meshBox(length, .35, .78, color, 0, .35, 0, g);
    meshBox(length, .62, .18, color, 0, .72, .31, g);
    meshBox(.18, .52, .82, color, -length / 2 + .09, .48, 0, g);
    meshBox(.18, .52, .82, color, length / 2 - .09, .48, 0, g);
  });
}

function simpleChair(name, x, z, color, rotation = 0) {
  return furniture(name, x, z, rotation, g => {
    meshBox(.68, .18, .68, color, 0, .47, 0, g);
    meshBox(.68, .72, .13, color, 0, .78, .28, g);
    for (const sx of [-.25, .25]) for (const sz of [-.25, .25]) meshBox(.07, .43, .07, palette.darkWood, sx, .215, sz, g);
  });
}

function table(name, x, z, w, d, color, rotation = 0, round = false) {
  return furniture(name, x, z, rotation, g => {
    let top;
    if (round) {
      top = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, .08, 32), material(color));
      top.position.y = .75; top.castShadow = true; g.add(top);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(.08, .11, .7, 16), material(palette.darkWood));
      stem.position.y = .38; g.add(stem);
    } else {
      meshBox(w, .09, d, color, 0, .76, 0, g);
      for (const sx of [-w/2+.12,w/2-.12]) for (const sz of [-d/2+.12,d/2-.12]) meshBox(.08,.72,.08,palette.darkWood,sx,.36,sz,g);
    }
  });
}

function cabinet(name, x, z, w, d, h, color, rotation = 0) {
  return furniture(name, x, z, rotation, g => {
    meshBox(w, h, d, color, 0, h / 2, 0, g);
    const doors = Math.max(1, Math.round(w / .5));
    for (let i = 1; i < doors; i++) meshBox(.012, h * .9, .015, palette.darkWood, -w/2 + w*i/doors, h*.5, -d/2-.01, g);
  });
}

function desk(name, x, z, w, rotation = 0) {
  return furniture(name, x, z, rotation, g => {
    meshBox(w, .08, .72, palette.wood, 0, .75, 0, g);
    meshBox(.09, .71, .64, palette.darkWood, -w/2+.12, .36, 0, g);
    meshBox(.09, .71, .64, palette.darkWood, w/2-.12, .36, 0, g);
    meshBox(.58, .34, .06, palette.black, 0, 1.08, .03, g);
    meshBox(.06, .25, .06, palette.metal, 0, .89, .03, g);
  });
}

function bookshelf(name, x, z, w, h = 2.2, rotation = 0) {
  return furniture(name, x, z, rotation, g => {
    meshBox(w, h, .28, palette.darkWood, 0, h/2, 0, g);
    meshBox(w-.12, h-.12, .03, palette.cream, 0, h/2, -.16, g);
    for (let y=.42; y<h-.1; y+=.42) meshBox(w, .055, .34, palette.wood, 0, y, -.02, g);
    const colors = [palette.rust, palette.blue, palette.green, palette.cream];
    for (let i=0;i<Math.floor(w*6);i++) meshBox(.09, .27+(i%3)*.035, .11, colors[i%4], -w/2+.12+i*.15, .61+(i%4)*.42, -.2, g);
  });
}

// Living + dining: 3-seat, 2-seat, two armchairs, 75-inch TV, table for eight and console.
sofa('Three-seat sofa', -3.6, -2.65, 2.35, palette.green, 0);
sofa('Two-seat sofa', -5.7, -3.15, 1.65, palette.blue, -Math.PI/2);
simpleChair('Armchair 1', -1.5, -2.15, palette.rust, Math.PI/2);
simpleChair('Armchair 2', -1.5, -3.25, palette.rust, Math.PI/2);
cabinet('TV console', -3.55, -4.9, 2.1, .38, .46, palette.darkWood);
furniture('75-inch TV', -3.55, -5.02, 0, g => meshBox(1.67, .96, .05, palette.black, 0, 1.18, 0, g));
table('Eight-seat dining table', -3.65, -.65, 2.05, .95, palette.wood);
for (const [i,p] of [[1,[-4.35,-1.38]],[2,[-3.65,-1.38]],[3,[-2.95,-1.38]],[4,[-4.35,.08]],[5,[-3.65,.08]],[6,[-2.95,.08]],[7,[-4.85,-.65]],[8,[-2.45,-.65]]]) simpleChair(`Dining chair ${i}`, p[0], p[1], palette.cream, i<4?Math.PI:i<7?0:i===7?-Math.PI/2:Math.PI/2);
cabinet('Living console', -6.05, -.55, 1.45, .38, .82, palette.wood, -Math.PI/2);

// Compact separate kitchen: L-shaped worktop and full appliance set.
cabinet('Kitchen counter north', -4.75, 4.95, 2.8, .58, .9, palette.cream);
cabinet('Kitchen counter west', -6.05, 3.15, 3.1, .58, .9, palette.cream, Math.PI/2);
cabinet('Fridge', -5.85, 4.65, .78, .72, 1.95, palette.metal);
cabinet('Oven', -4.45, 4.92, .62, .58, .9, palette.black);
cabinet('Dishwasher', -5.55, 2.35, .62, .58, .9, palette.metal, Math.PI/2);
furniture('Sink', -3.75, 4.88, 0, g => meshBox(.7,.04,.42,palette.metal,0,.94,0,g));

// Small office: 1.6 m desk, clothes drawers and a small library.
desk('Small office desk 1.6 m', -2.05, 4.65, 1.6);
simpleChair('Small office chair', -2.05, 3.9, palette.blue, Math.PI);
cabinet('Office drawers', -3.05, 2.1, .8, .48, 1.0, palette.wood, -Math.PI/2);
bookshelf('Small library', -1.05, 3.05, 1.55, 1.8, Math.PI/2);

// Bedroom: custom 180 × 220 bed, two 4-door wardrobes, drawers, bedside tables and makeup desk.
furniture('Bed 180 × 220', 2.5, -2.65, Math.PI/2, g => {
  meshBox(2.2, .34, 1.8, palette.cream, 0, .38, 0, g);
  meshBox(.14, 1.0, 1.92, palette.darkWood, -1.08, .58, 0, g);
  meshBox(.72, .13, .62, palette.white, -.55, .62, -.45, g);
  meshBox(.72, .13, .62, palette.white, -.55, .62, .45, g);
});
cabinet('Wardrobe A — 4 door', 6.05, -4.25, 1.8, .6, 2.25, palette.cream, Math.PI/2);
cabinet('Wardrobe B — 4 door', 6.05, -2.25, 1.8, .6, 2.25, palette.cream, Math.PI/2);
cabinet('Bedroom drawers 1', 1.45, -4.82, 1.05, .48, .86, palette.wood, Math.PI);
cabinet('Bedroom drawers 2', 2.65, -4.82, 1.05, .48, .86, palette.wood, Math.PI);
cabinet('Bedside table 1', 1.25, -1.72, .48, .45, .5, palette.wood, Math.PI);
cabinet('Bedside table 2', 3.75, -1.72, .48, .45, .5, palette.wood, Math.PI);
desk('Makeup desk', 4.25, -4.72, 1.15);
simpleChair('Makeup chair', 4.25, -4.02, palette.cream, 0);
furniture('Bedroom TV', 2.5, -5.02, 0, g => meshBox(1.25, .72, .05, palette.black, 0, 1.38, 0, g));

// Clear wet core: guest WC on the left; full bathroom and laundry on the right.
furniture('Bathroom shower', 5.72, -.67, 0, g => {
  meshBox(1.0, .08, .9, palette.white, 0, .04, 0, g);
  meshBox(.04, 2.05, .9, palette.glass, .48, 1.03, 0, g);
  meshBox(1.0, 2.05, .04, palette.glass, 0, 1.03, .43, g);
});
cabinet('Bathroom sink', 3.2, -.92, .82, .44, .82, palette.wood, Math.PI);
furniture('Bathroom toilet', 4.25, -.62, Math.PI, g => meshBox(.42, .45, .68, palette.white, 0, .27, 0, g));
cabinet('Washing machine', 4.75, .38, .62, .62, .86, palette.white, Math.PI);
cabinet('Dryer', 5.48, .38, .62, .62, .86, palette.white, Math.PI);
furniture('Guest WC toilet', 1.35, -.62, Math.PI, g => meshBox(.42, .45, .68, palette.white, 0, .27, 0, g));
cabinet('Guest WC sink', 2.05, .35, .42, .34, .78, palette.white, Math.PI);

// Music/library office: 1.8 m desk, books behind it, digital piano, guitar and reading corner.
desk('Large office desk 1.8 m', 4.7, 2.15, 1.8, Math.PI/2);
simpleChair('Large office chair', 5.35, 2.15, palette.blue, -Math.PI/2);
bookshelf('Books behind desk', 6.12, 2.15, 2.15, 2.25, Math.PI/2);
bookshelf('Main library wall', 3.55, 4.92, 3.2, 2.25, 0);
furniture('Digital piano', 1.35, 3.65, Math.PI/2, g => {
  meshBox(1.42, .18, .45, palette.black, 0, .82, 0, g);
  meshBox(1.35, .08, .35, palette.white, 0, .78, -.12, g);
  for (const sx of [-.58,.58]) meshBox(.07,.75,.35,palette.black,sx,.39,0,g);
});
furniture('Piano bench', 2.0, 3.65, Math.PI/2, g => meshBox(.62,.46,.34,palette.darkWood,0,.3,0,g));
furniture('Guitar stand', 1.25, 4.75, 0, g => { meshBox(.34,.56,.12,palette.wood,0,.62,0,g); meshBox(.11,.75,.08,palette.wood,0,1.25,0,g); });
table('Coffee table', 3.5, 2.9, .75, .75, palette.wood, 0, true);
simpleChair('Reading chair 1', 2.75, 2.85, palette.rust, -Math.PI/2);
simpleChair('Reading chair 2', 4.25, 2.85, palette.green, Math.PI/2);

const catalogLabels = {
  textLabel:'Text label', measurement:'Room measurement', sofa3:'3-seat sofa', sofa2:'2-seat sofa', armchair:'Armchair',
  shapeSquare:'Square 1 x 1', shapeRectangle:'Rectangle 2 x 1', shapeCircle:'Circle 1 m',
  shapeTriangle:'Triangle 1 m', shapeCube:'Cube 1 m', shapeBox:'Box 2 x 1',
  shapeCylinder:'Cylinder', shapeSphere:'Sphere',
  diningChair:'Dining chair', diningTable:'Dining table', coffeeTable:'Coffee table',
  tv75:'75-inch TV', tvConsole:'TV console', sideboard:'Sideboard', desk160:'Desk 1.6 m',
  desk180:'Desk 1.8 m', officeChair:'Office chair', bookshelfSmall:'Bookcase 1.5 m',
  bookshelfLarge:'Bookcase 3.0 m', drawers:'Drawers', bed180:'Bed 180 x 220',
  wardrobe4:'4-door wardrobe', bedside:'Bedside table', piano:'Digital piano',
  pianoBench:'Piano bench', guitar:'Guitar', baseCabinet:'Base cabinet', fridge:'Fridge',
  sink:'Sink', toilet:'Toilet', shower:'Shower', washer:'Washer / dryer',
  wall05:'Wall 0.5 m', wall1:'Wall 1 m', wall2:'Wall 2 m', wall3:'Wall 3 m', wall4:'Wall 4 m',
};

function spawnedName(type) {
  spawnSerial += 1;
  return `${catalogLabels[type] || type} ${spawnSerial}`;
}

function buildCatalogObject(type, name) {
  if (type === 'textLabel') return textLabel(name, 0, 0, 'New label');
  if (type === 'shapeSquare') return furniture(name, 0, 0, 0, g => meshBox(1,.25,1,palette.blue,0,.125,0,g));
  if (type === 'shapeRectangle') return furniture(name, 0, 0, 0, g => meshBox(2,.25,1,palette.green,0,.125,0,g));
  if (type === 'shapeCircle') return furniture(name, 0, 0, 0, g => {
    const shape = new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,.25,32), material(palette.rust));
    shape.position.y = .125; shape.castShadow = shape.receiveShadow = true; g.add(shape);
  });
  if (type === 'shapeTriangle') return furniture(name, 0, 0, 0, g => {
    const shape = new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.25,3), material(palette.cream));
    shape.position.y = .125; shape.castShadow = shape.receiveShadow = true; g.add(shape);
  });
  if (type === 'shapeCube') return furniture(name, 0, 0, 0, g => meshBox(1,1,1,palette.blue,0,.5,0,g));
  if (type === 'shapeBox') return furniture(name, 0, 0, 0, g => meshBox(2,.5,1,palette.green,0,.25,0,g));
  if (type === 'shapeCylinder') return furniture(name, 0, 0, 0, g => {
    const shape = new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,1,32), material(palette.rust));
    shape.position.y = .5; shape.castShadow = shape.receiveShadow = true; g.add(shape);
  });
  if (type === 'shapeSphere') return furniture(name, 0, 0, 0, g => {
    const shape = new THREE.Mesh(new THREE.SphereGeometry(.5,24,16), material(palette.cream));
    shape.position.y = .5; shape.castShadow = shape.receiveShadow = true; g.add(shape);
  });
  if (type === 'sofa3') return sofa(name, 0, 0, 2.35, palette.green);
  if (type === 'sofa2') return sofa(name, 0, 0, 1.65, palette.blue);
  if (type === 'armchair') return simpleChair(name, 0, 0, palette.rust);
  if (type === 'diningChair') return simpleChair(name, 0, 0, palette.cream);
  if (type === 'diningTable') return table(name, 0, 0, 2.05, .95, palette.wood);
  if (type === 'coffeeTable') return table(name, 0, 0, .75, .75, palette.wood, 0, true);
  if (type === 'tv75') return furniture(name, 0, 0, 0, g => meshBox(1.67,.96,.05,palette.black,0,1.18,0,g));
  if (type === 'tvConsole') return cabinet(name, 0, 0, 2.1, .38, .46, palette.darkWood);
  if (type === 'sideboard') return cabinet(name, 0, 0, 1.45, .38, .82, palette.wood);
  if (type === 'desk160') return desk(name, 0, 0, 1.6);
  if (type === 'desk180') return desk(name, 0, 0, 1.8);
  if (type === 'officeChair') return simpleChair(name, 0, 0, palette.blue);
  if (type === 'bookshelfSmall') return bookshelf(name, 0, 0, 1.5, 1.8);
  if (type === 'bookshelfLarge') return bookshelf(name, 0, 0, 3.0, 2.25);
  if (type === 'drawers') return cabinet(name, 0, 0, 1.05, .48, .86, palette.wood);
  if (type === 'bed180') return furniture(name, 0, 0, 0, g => {
    meshBox(2.2,.34,1.8,palette.cream,0,.38,0,g); meshBox(.14,1,1.92,palette.darkWood,-1.08,.58,0,g);
    meshBox(.72,.13,.62,palette.white,-.55,.62,-.45,g); meshBox(.72,.13,.62,palette.white,-.55,.62,.45,g);
  });
  if (type === 'wardrobe4') return cabinet(name, 0, 0, 1.8, .6, 2.25, palette.cream);
  if (type === 'bedside') return cabinet(name, 0, 0, .48, .45, .5, palette.wood);
  if (type === 'piano') return furniture(name, 0, 0, 0, g => {
    meshBox(1.42,.18,.45,palette.black,0,.82,0,g); meshBox(1.35,.08,.35,palette.white,0,.78,-.12,g);
    for (const sx of [-.58,.58]) meshBox(.07,.75,.35,palette.black,sx,.39,0,g);
  });
  if (type === 'pianoBench') return furniture(name, 0, 0, 0, g => meshBox(.62,.46,.34,palette.darkWood,0,.3,0,g));
  if (type === 'guitar') return furniture(name, 0, 0, 0, g => { meshBox(.34,.56,.12,palette.wood,0,.62,0,g); meshBox(.11,.75,.08,palette.wood,0,1.25,0,g); });
  if (type === 'baseCabinet') return cabinet(name, 0, 0, .8, .58, .9, palette.cream);
  if (type === 'fridge') return cabinet(name, 0, 0, .78, .72, 1.95, palette.metal);
  if (type === 'sink') return cabinet(name, 0, 0, .82, .44, .82, palette.wood);
  if (type === 'toilet') return furniture(name, 0, 0, 0, g => meshBox(.42,.45,.68,palette.white,0,.27,0,g));
  if (type === 'shower') return furniture(name, 0, 0, 0, g => {
    meshBox(1,.08,.9,palette.white,0,.04,0,g); meshBox(.04,2.05,.9,palette.glass,.48,1.03,0,g); meshBox(1,2.05,.04,palette.glass,0,1.03,.43,g);
  });
  if (type === 'washer') return cabinet(name, 0, 0, .62, .62, .86, palette.white);
  const wallWidths = { wall05:.5, wall1:1, wall2:2, wall3:3, wall4:4 };
  if (wallWidths[type]) {
    const object = furniture(name, 0, 0, 0, g => meshBox(wallWidths[type],2.75,.14,palette.wall,0,1.375,0,g));
    object.userData.kind = 'wall'; object.userData.wallSizeX = wallWidths[type]; object.userData.wallSizeZ = .14; return object;
  }
  return null;
}

function createSpawn(type, options = {}) {
  const name = options.name || spawnedName(type);
  const object = buildCatalogObject(type, name);
  if (!object) return null;
  object.userData.base = false;
  object.userData.catalogType = type;
  object.userData.objectId = options.id || `spawn:${Date.now()}:${spawnSerial}`;
  object.userData.displayName = options.displayName || name;
  if (options.text && object.userData.kind === 'label') updateTextLabel(object, options.text);
  if (options.select !== false) { setSelected(object); toast(`${catalogLabels[type]} added`); }
  return object;
}

function updateMeasurementLabel(group) {
  const area = group.userData.width * group.userData.depth;
  const text = `${group.userData.roomName}\n${area.toFixed(1)} m²`;
  group.userData.displayName = `${group.userData.roomName} · ${area.toFixed(1)} m²`;
  const sprite = group.children.find(child => child.userData.measurementLabel);
  if (sprite) drawTextSprite(sprite, text);
  if (selectedItems.has(group)) refreshSelectionUI();
}

function measurementSummary() {
  const measurements = movable.filter(object => object.userData.kind === 'measurement');
  return {
    count:measurements.length,
    area:measurements.reduce((total, object) => total + object.userData.width * object.userData.depth, 0)
  };
}

function updateMeasuredAreaStats() {
  const summary = measurementSummary();
  document.querySelector('#totalMeasuredArea').textContent = `${summary.area.toFixed(1)} m²`;
  document.querySelector('#measurementCount').textContent = summary.count;
}

function createMeasurement(width, depth, x, z, options = {}) {
  width = Math.max(.1, width); depth = Math.max(.1, depth);
  const name = options.name || spawnedName('measurement');
  const roomName = options.roomName || 'Room';
  const group = furniture(name, x, z, 0, g => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent:true, depthTest:false }));
    sprite.position.y = .34; sprite.scale.set(2.1,.66,1); sprite.renderOrder = 21;
    sprite.userData.measurementLabel = true; g.add(sprite);
  });
  group.userData.base = false; group.userData.catalogType = 'measurement';
  group.userData.objectId = options.id || `measure:${Date.now()}:${spawnSerial}`;
  group.userData.kind = 'measurement'; group.userData.width = width; group.userData.depth = depth;
  group.userData.roomName = roomName; updateMeasurementLabel(group);
  if (Number.isFinite(options.rotation)) group.rotation.y = options.rotation;
  if (options.select !== false) setSelected(group);
  updateMeasuredAreaStats();
  return group;
}

function renameMeasurement(group) {
  if (!group || group.userData.kind !== 'measurement') return;
  const value = prompt('Room name:', group.userData.roomName || 'Room');
  if (value === null || !value.trim()) return;
  group.userData.roomName = value.trim(); updateMeasurementLabel(group); saveLayout();
}

function cloneObject(source) {
  const clone = source.clone(true);
  clone.traverse(child => {
    if (!child.material) return;
    child.material = child.material.clone();
    if (child.material.map) child.material.map = child.material.map.clone();
  });
  return clone;
}

function registerObject(object) {
  furnitureRoot.add(object); movable.push(object); return object;
}

function captureBaseBlueprints() {
  movable.forEach(object => {
    object.userData.base = true;
    baseBlueprints.set(object.userData.objectId, cloneObject(object));
  });
}

function removeObject(object, shouldSave = true) {
  if (!object) return;
  const index = movable.indexOf(object);
  if (index >= 0) movable.splice(index, 1);
  if (object.parent) object.parent.remove(object);
  if (selectedItems.has(object)) { selectedItems.delete(object); refreshSelectionUI(); }
  updateMeasuredAreaStats();
  if (shouldSave) { saveLayout(); toast('Object deleted'); }
}

captureBaseBlueprints();

const orbit = new THREE.OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true; orbit.maxPolarAngle = Math.PI / 2.04;
orbit.enablePan = true;
orbit.mouseButtons.LEFT = -1;
orbit.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
orbit.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
const walk = new THREE.PointerLockControls(camera, renderer.domElement);
let mode = 'plan';
const keys = new Set();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let selected = null;
const selectedItems = new Set();
let dragging = false;
let dragStartPoint = new THREE.Vector3();
let dragStarts = new Map();
let rightDown = null;
let measureMode = false;
let measuring = false;
let measureStart = null;
let measureDraft = null;
const selectionEl = document.querySelector('#selection');
const crosshair = document.querySelector('#crosshair');

function clearMeasureDraft() {
  if (measureDraft?.parent) measureDraft.parent.remove(measureDraft);
  measureDraft = null; measureStart = null; measuring = false;
}

function setMeasureMode(active) {
  measureMode = active;
  if (!active) clearMeasureDraft();
  document.querySelector('#measureBtn').classList.toggle('primary', active);
  renderer.domElement.style.cursor = active ? 'crosshair' : '';
  if (active) { setSelected(null); selectionEl.textContent = 'Drag a rectangle to measure a room'; }
  else if (!selected) selectionEl.textContent = 'No object selected';
}

function snapPlanPoint(point) {
  return new THREE.Vector3(
    Math.round(point.x * 10) / 10, 0,
    Math.round(point.z * 10) / 10
  );
}

function beginMeasurement(point) {
  clearMeasureDraft(); measureStart = snapPlanPoint(point); measuring = true;
  const fill = new THREE.Mesh(
    new THREE.BoxGeometry(1,.035,1),
    new THREE.MeshBasicMaterial({ color:0xffb85c, transparent:true, opacity:.3, depthWrite:false })
  );
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1,.045,1)),
    new THREE.LineBasicMaterial({ color:0xff8c1a })
  );
  measureDraft = new THREE.Group();
  fill.position.y = .035; outline.position.y = .04;
  measureDraft.userData.fill = fill; measureDraft.userData.outline = outline;
  measureDraft.add(fill, outline); scene.add(measureDraft);
  updateMeasurementDraft(measureStart);
}

function updateMeasurementDraft(point) {
  if (!measureDraft || !measureStart) return;
  const end = snapPlanPoint(point);
  const width = Math.max(.1, Math.abs(end.x-measureStart.x));
  const depth = Math.max(.1, Math.abs(end.z-measureStart.z));
  measureDraft.position.set((end.x+measureStart.x)/2, 0, (end.z+measureStart.z)/2);
  measureDraft.userData.fill.scale.set(width,1,depth);
  measureDraft.userData.outline.scale.set(width,1,depth);
  measureDraft.userData.width = width; measureDraft.userData.depth = depth;
  selectionEl.textContent = `Measuring: ${width.toFixed(1)} × ${depth.toFixed(1)} m = ${(width*depth).toFixed(1)} m²`;
}

function finishMeasurement() {
  if (!measureDraft) return;
  const { width, depth } = measureDraft.userData;
  const { x, z } = measureDraft.position;
  clearMeasureDraft();
  if (width < .2 || depth < .2) { setMeasureMode(false); toast('Drag a larger rectangle'); return; }
  const object = createMeasurement(width, depth, x, z);
  setMeasureMode(false); setSelected(object); saveLayout(); toast(`${(width*depth).toFixed(1)} m² room measured`);
}

function planView() {
  mode = 'plan'; walk.unlock(); orbit.enabled = true;
  camera.position.set(0, 15.8, 9.5); orbit.target.set(0, 0, 0); orbit.update();
  movable.forEach(o => { if (o.userData.kind === 'label' || o.userData.kind === 'measurement') o.visible = true; });
  crosshair.style.display = 'none';
  document.querySelector('#planBtn').classList.add('primary');
  document.querySelector('#walkBtn').classList.remove('primary');
}

function walkView() {
  setMeasureMode(false); mode = 'walk'; orbit.enabled = false;
  movable.forEach(o => { if (o.userData.kind === 'label' || o.userData.kind === 'measurement') o.visible = false; });
  camera.position.set(0, 1.65, -4.65); camera.rotation.set(0, 0, 0);
  walk.lock(); crosshair.style.display = 'block';
  document.querySelector('#walkBtn').classList.add('primary');
  document.querySelector('#planBtn').classList.remove('primary');
}

function rootsFromIntersections(items) {
  for (const hit of items) {
    let o = hit.object;
    while (o && !o.userData.movable) o = o.parent;
    if (o?.userData.movable) return o;
  }
  return null;
}

function isBasicShape(item) {
  return Boolean(item?.userData.catalogType?.startsWith('shape'));
}

function highlightObject(item, active) {
  item.traverse(o => {
    if (!o.isMesh || !o.material.emissive) return;
    if (active) {
      if (o.userData.originalEmissive === undefined) o.userData.originalEmissive = o.material.emissive.getHex();
      o.material.emissive.setHex(0x3b2810);
    } else if (o.userData.originalEmissive !== undefined) {
      o.material.emissive.setHex(o.userData.originalEmissive);
    }
  });
}

function refreshSelectionUI() {
  const items = [...selectedItems];
  selected = items.at(-1) || null;
  if (!items.length) selectionEl.textContent = 'No object selected';
  else if (items.length > 1) selectionEl.textContent = `${items.length} objects selected`;
  else {
    const item = items[0];
    const detail = isBasicShape(item)
      ? ` · elevation ${item.position.y.toFixed(2)} m · scale ${item.scale.x.toFixed(2)}, ${item.scale.y.toFixed(2)}, ${item.scale.z.toFixed(2)}`
      : '';
    selectionEl.textContent = `Selected: ${item.userData.displayName}${detail}`;
  }
  const shapesOnly = items.length > 0 && items.every(isBasicShape);
  document.querySelector('#elevationBtn').disabled = !shapesOnly;
  document.querySelector('#scaleBtn').disabled = !shapesOnly;
}

function clearSelection() {
  selectedItems.forEach(item => highlightObject(item, false));
  selectedItems.clear(); refreshSelectionUI();
}

function setSelected(item) {
  clearSelection();
  if (item) { selectedItems.add(item); highlightObject(item, true); }
  refreshSelectionUI();
}

function addSelected(item) {
  if (!item || selectedItems.has(item)) return;
  selectedItems.add(item); highlightObject(item, true); refreshSelectionUI();
}

function removeSelected(item) {
  if (!item || !selectedItems.has(item)) return;
  highlightObject(item, false); selectedItems.delete(item); refreshSelectionUI();
}

function pointerFromEvent(e) {
  pointer.x = e.clientX / innerWidth * 2 - 1;
  pointer.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
}

renderer.domElement.addEventListener('pointerdown', e => {
  if (mode !== 'plan') return;
  pointerFromEvent(e);
  if (e.button === 2) {
    rightDown = {
      x:e.clientX, y:e.clientY,
      item:rootsFromIntersections(raycaster.intersectObjects(movable, true))
    };
    return;
  }
  if (e.button !== 0) return;
  if (measureMode) {
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(floorPlane, hit)) {
      orbit.enabled = false; beginMeasurement(hit);
      renderer.domElement.setPointerCapture(e.pointerId);
    }
    return;
  }
  const item = rootsFromIntersections(raycaster.intersectObjects(movable, true));
  if (!item) return;
  addSelected(item);
  orbit.enabled = false;
  const hit = new THREE.Vector3(); raycaster.ray.intersectPlane(floorPlane, hit);
  dragStartPoint.copy(hit);
  dragStarts = new Map([...selectedItems].map(object => [object, object.position.clone()]));
  dragging = true;
  renderer.domElement.setPointerCapture(e.pointerId);
}, true);
renderer.domElement.addEventListener('pointermove', e => {
  if (measuring && measureMode && mode === 'plan') {
    pointerFromEvent(e); const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(floorPlane, hit)) updateMeasurementDraft(hit);
    return;
  }
  if (!dragging || !selectedItems.size || mode !== 'plan') return;
  pointerFromEvent(e); const hit = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(floorPlane, hit)) {
    const dx = hit.x-dragStartPoint.x, dz = hit.z-dragStartPoint.z;
    dragStarts.forEach((start, object) => {
      object.position.x = start.x+dx; object.position.z = start.z+dz;
    });
  }
}, true);
renderer.domElement.addEventListener('pointerup', e => {
  if (e.button === 2 && rightDown) {
    const moved = Math.hypot(e.clientX-rightDown.x, e.clientY-rightDown.y);
    if (moved < 5 && rightDown.item) removeSelected(rightDown.item);
    rightDown = null; return;
  }
  if (measuring) {
    finishMeasurement();
    setTimeout(() => { if (mode === 'plan') orbit.enabled = true; }, 0);
    return;
  }
  if (!dragging) return;
  dragging = false; saveLayout();
  setTimeout(() => { if (mode === 'plan') orbit.enabled = true; }, 0);
}, true);
renderer.domElement.addEventListener('contextmenu', e => {
  e.preventDefault(); e.stopPropagation();
});
renderer.domElement.addEventListener('auxclick', e => {
  if (e.button === 1 || e.button === 2) { e.preventDefault(); e.stopPropagation(); }
});

function rotateSelected() {
  if (!selectedItems.size) return;
  const items = [...selectedItems];
  const center = items.reduce((sum, object) => {
    sum.x += object.position.x; sum.z += object.position.z; return sum;
  }, { x:0, z:0 });
  center.x /= items.length; center.z /= items.length;
  items.forEach(object => {
    const dx=object.position.x-center.x, dz=object.position.z-center.z;
    object.position.x=center.x+dz; object.position.z=center.z-dx;
    object.rotation.y += Math.PI/2;
  });
  saveLayout(); refreshSelectionUI();
}

function currentLayoutObjects() {
  return movable.map(o => ({
    id:o.userData.objectId, base:Boolean(o.userData.base), template:o.userData.catalogType || null,
    name:o.name, displayName:o.userData.displayName, kind:o.userData.kind || null,
    text:o.userData.text || null, roomName:o.userData.roomName || null,
    width:o.userData.width || null, depth:o.userData.depth || null,
    x:o.position.x, y:o.position.y, z:o.position.z, r:o.rotation.y,
    sx:o.scale.x, sy:o.scale.y, sz:o.scale.z
  }));
}

function saveLayout() {
  localStorage.setItem('compact-home-layout-v2', JSON.stringify({ version:3, objects:currentLayoutObjects() }));
}

function clearMovableObjects() {
  setMeasureMode(false);
  setSelected(null);
  movable.forEach(object => { if (object.parent) object.parent.remove(object); });
  movable.length = 0;
}

function applyLayoutV3(state) {
  clearMovableObjects();
  state.objects.forEach(record => {
    let object = null;
    if (record.base && baseBlueprints.has(record.id)) object = registerObject(cloneObject(baseBlueprints.get(record.id)));
    else if (record.template === 'measurement' && Number.isFinite(record.width) && Number.isFinite(record.depth)) {
      object = createMeasurement(record.width, record.depth, record.x || 0, record.z || 0, {
        id:record.id, name:record.name, roomName:record.roomName, rotation:record.r, select:false
      });
    }
    else if (record.template) object = createSpawn(record.template, {
      id:record.id, name:record.name, displayName:record.displayName, text:record.text, select:false
    });
    if (!object) return;
    object.userData.objectId = record.id;
    object.userData.base = Boolean(record.base);
    object.userData.displayName = record.displayName || record.name;
    if (Number.isFinite(record.x) && Number.isFinite(record.z)) object.position.set(record.x, Number.isFinite(record.y) ? record.y : 0, record.z);
    if (Number.isFinite(record.r)) object.rotation.y = record.r;
    if (Number.isFinite(record.sx) && Number.isFinite(record.sy) && Number.isFinite(record.sz)) object.scale.set(record.sx, record.sy, record.sz);
    if (record.base && object.userData.kind === 'measurement') {
      const migratedName = record.roomName || record.text?.replace(/\n\d+(?:\.\d+)?\s*m²\s*$/, '') || object.userData.roomName;
      object.userData.roomName = migratedName; updateMeasurementLabel(object);
    }
    if (record.text && object.userData.kind === 'label') {
      const text = record.base ? record.text.replace(/\n\d+(?:\.\d+)?\s*m²\s*$/, '') : record.text;
      updateTextLabel(object, text);
    }
    if (object.userData.kind === 'label' || object.userData.kind === 'measurement') object.visible = mode === 'plan';
  });
  updateMeasuredAreaStats();
}

async function exportLayout() {
  saveLayout();
  const summary = measurementSummary();
  const payload = JSON.stringify({
    format: 'compact-home-layout', version: 3, measuredAreaM2:summary.area,
    savedAt: new Date().toISOString(), objects: currentLayoutObjects()
  }, null, 2);
  const filename = `house-layout-${new Date().toISOString().slice(0, 10)}.json`;
  try {
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'House layout', accept: { 'application/json': ['.json'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(payload); await writable.close();
    } else {
      const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url; link.download = filename; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    toast('Layout file saved');
  } catch (error) {
    if (error?.name !== 'AbortError') toast('Could not save layout');
  }
}

async function importLayout(file) {
  try {
    const payload = JSON.parse(await file.text());
    if (Array.isArray(payload.objects)) applyLayoutV3(payload);
    else {
      const state = payload.furniture || payload;
      movable.forEach(o => {
        const saved = state[o.name];
        if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.z) && Number.isFinite(saved.r)) {
          o.position.set(saved.x, 0, saved.z); o.rotation.y = saved.r;
        }
      });
    }
    saveLayout(); setSelected(null); toast('Layout file loaded');
  } catch {
    toast('Invalid layout file');
  }
}

function restoreLayout() {
  const raw = localStorage.getItem('compact-home-layout-v2'); if (!raw) return;
  try {
    const state = JSON.parse(raw);
    if (state.version === 3 && Array.isArray(state.objects)) applyLayoutV3(state);
    else movable.forEach(o => { const s=state[o.name]; if(s){o.position.x=s.x;o.position.z=s.z;o.rotation.y=s.r;} });
  } catch { toast('Saved layout could not be restored'); }
}

function resetLayout() {
  clearMovableObjects();
  baseBlueprints.forEach(prototype => registerObject(cloneObject(prototype)));
  movable.forEach(o => { if (o.userData.kind === 'label' || o.userData.kind === 'measurement') o.visible = mode === 'plan'; });
  updateMeasuredAreaStats();
  localStorage.removeItem('compact-home-layout-v2'); toast('Original layout restored');
}

function editSelectedText() {
  if (selectedItems.size !== 1) { toast('Select exactly one label'); return; }
  const item = [...selectedItems][0];
  if (item.userData.kind === 'measurement') { renameMeasurement(item); return; }
  if (item.userData.kind !== 'label') { toast('Select a text or measurement label'); return; }
  const value = prompt('Label text (use | for a second line):', (item.userData.text || '').replace(/\n/g, ' | '));
  if (value === null || !value.trim()) return;
  updateTextLabel(item, value.trim().replace(/\s*\|\s*/g, '\n')); saveLayout();
}

function setShapeElevation() {
  const items = [...selectedItems];
  if (!items.length || !items.every(isBasicShape)) { toast('Select one or more basic shapes'); return; }
  const value = prompt('Elevation above floor in metres:', items[0].position.y.toFixed(2));
  if (value === null) return;
  const elevation = Number(value.replace(',', '.'));
  if (!Number.isFinite(elevation)) { toast('Enter a valid elevation'); return; }
  items.forEach(item => { item.position.y = elevation; });
  saveLayout(); refreshSelectionUI();
}

function setShapeScale() {
  const items = [...selectedItems];
  if (!items.length || !items.every(isBasicShape)) { toast('Select one or more basic shapes'); return; }
  const first = items[0].scale;
  const value = prompt('Scale multiplier: one number, or X, Y (height), Z:', `${first.x.toFixed(2)}, ${first.y.toFixed(2)}, ${first.z.toFixed(2)}`);
  if (value === null) return;
  const parts = value.trim().split(/[\s,;]+/).filter(Boolean).map(Number);
  const scale = parts.length === 1 ? [parts[0],parts[0],parts[0]] : parts;
  if (scale.length !== 3 || scale.some(number => !Number.isFinite(number) || number <= 0)) {
    toast('Use one positive number or three: X, Y, Z'); return;
  }
  items.forEach(item => item.scale.set(scale[0],scale[1],scale[2]));
  saveLayout(); refreshSelectionUI();
}

function deleteSelection() {
  const items = [...selectedItems];
  if (!items.length) return;
  items.forEach(item => removeObject(item, false));
  clearSelection(); saveLayout();
  toast(`${items.length} object${items.length === 1 ? '' : 's'} deleted`);
}

function toast(text) {
  const el=document.querySelector('#toast'); el.textContent=text; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),1400);
}

function toggleFeatures(force) {
  const panel = document.querySelector('#featuresPanel');
  const open = force ?? !panel.classList.contains('open');
  panel.classList.toggle('open', open);
  panel.setAttribute('aria-hidden', String(!open));
  document.querySelector('#helpBtn').classList.toggle('primary', open);
}

document.querySelector('#planBtn').addEventListener('click', () => { planView(); setMeasureMode(false); });
document.querySelector('#walkBtn').addEventListener('click', walkView);
document.querySelector('#measureBtn').addEventListener('click', () => {
  if (mode !== 'plan') planView();
  setMeasureMode(!measureMode);
});
document.querySelector('#rotateBtn').addEventListener('click', rotateSelected);
document.querySelector('#editTextBtn').addEventListener('click', editSelectedText);
document.querySelector('#deleteBtn').addEventListener('click', deleteSelection);
document.querySelector('#elevationBtn').addEventListener('click', setShapeElevation);
document.querySelector('#scaleBtn').addEventListener('click', setShapeScale);
document.querySelector('#saveBtn').addEventListener('click', exportLayout);
document.querySelector('#loadBtn').addEventListener('click', () => document.querySelector('#loadInput').click());
document.querySelector('#loadInput').addEventListener('change', event => {
  const [file] = event.target.files;
  if (file) importLayout(file);
  event.target.value = '';
});
document.querySelector('#resetBtn').addEventListener('click', resetLayout);
document.querySelector('#helpBtn').addEventListener('click', () => toggleFeatures());
document.querySelectorAll('[data-spawn]').forEach(button => button.addEventListener('click', () => {
  const type = button.dataset.spawn;
  let text = null;
  if (type === 'textLabel') {
    text = prompt('What should the label say? Use | for a second line.', 'New label');
    if (text === null || !text.trim()) return;
    text = text.trim().replace(/\s*\|\s*/g, '\n');
  }
  if (mode !== 'plan') planView();
  const object = createSpawn(type, text ? { text } : {});
  if (object) saveLayout();
}));
addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') { e.preventDefault(); exportLayout(); return; }
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyO') { e.preventDefault(); document.querySelector('#loadInput').click(); return; }
  if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat) {
    if (e.code === 'KeyH') {
      if (mode === 'walk') planView();
      toggleFeatures(); return;
    }
    if (e.code === 'KeyP') { planView(); setMeasureMode(false); return; }
    if (e.code === 'KeyV') { toggleFeatures(false); walkView(); return; }
    if (e.code === 'KeyM') {
      if (mode !== 'plan') planView();
      setMeasureMode(!measureMode); return;
    }
    if (mode === 'plan' && selectedItems.size && e.code === 'KeyE') { setShapeElevation(); return; }
    if (mode === 'plan' && selectedItems.size && e.code === 'KeyK') { setShapeScale(); return; }
    if (e.code === 'Digit0') { resetLayout(); return; }
  }
  keys.add(e.code);
  if (e.code === 'Escape') {
    if (measureMode) { setMeasureMode(false); orbit.enabled = true; }
    toggleFeatures(false);
    if (mode === 'plan') clearSelection();
    return;
  }
  if (mode==='plan' && selectedItems.size) {
    if(e.code==='KeyR' && !e.repeat) rotateSelected();
    if(e.code==='KeyT' && !e.repeat) editSelectedText();
    if(e.code==='Delete' || e.code==='Backspace') { e.preventDefault(); deleteSelection(); return; }
    const n=.1;
    selectedItems.forEach(item => {
      if(e.code==='ArrowLeft') item.position.x-=n; if(e.code==='ArrowRight') item.position.x+=n;
      if(e.code==='ArrowUp') item.position.z-=n; if(e.code==='ArrowDown') item.position.z+=n;
    });
    if(e.code.startsWith('Arrow')) { e.preventDefault(); saveLayout(); refreshSelectionUI(); }
  }
});
addEventListener('keyup', e => keys.delete(e.code));

function playerCollides(pos) {
  const radius=.23;
  return movable.some(object => {
    if (object.userData.kind !== 'wall') return false;
    const horizontal = Math.abs(Math.cos(object.rotation.y)) > .5;
    const halfX = (horizontal ? object.userData.wallSizeX : object.userData.wallSizeZ) / 2;
    const halfZ = (horizontal ? object.userData.wallSizeZ : object.userData.wallSizeX) / 2;
    return Math.abs(pos.x-object.position.x) < halfX+radius && Math.abs(pos.z-object.position.z) < halfZ+radius;
  });
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  if(mode==='walk' && walk.isLocked) {
    const old=camera.position.clone(); const speed=2.4*dt;
    if(keys.has('KeyW')) walk.moveForward(speed); if(keys.has('KeyS')) walk.moveForward(-speed);
    if(keys.has('KeyA')) walk.moveRight(-speed); if(keys.has('KeyD')) walk.moveRight(speed);
    camera.position.y=1.65; if(playerCollides(camera.position)) camera.position.copy(old);
  } else if(mode==='plan') { orbit.update(); }
  renderer.render(scene,camera);
}

restoreLayout(); updateMeasuredAreaStats(); planView(); animate();
addEventListener('resize', () => { camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
