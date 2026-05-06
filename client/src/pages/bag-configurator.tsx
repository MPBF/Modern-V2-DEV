import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Menu, X, Boxes } from "lucide-react";

const SCALE = 10;

type PlasticType = "ldpe" | "hdpe";
type HandleType = "vest" | "banana" | "loop" | "none";

const PRESET_COLORS = [
  "#ffffff",
  "#222222",
  "#dc2626",
  "#2563eb",
  "#16a34a",
  "#facc15",
  "#f97316",
  "#9333ea",
  "#92400e",
];

function getPlasticMaterial(
  type: PlasticType,
  colorHex: string,
  thickness: number,
) {
  const opts: THREE.MeshPhysicalMaterialParameters = {
    color: new THREE.Color(colorHex),
    side: THREE.DoubleSide,
    transparent: true,
  };

  const thicknessRatio = (thickness - 35) / (150 - 35);

  if (type === "ldpe") {
    opts.roughness = 0.15;
    opts.metalness = 0.1;
    opts.transmission = 0.8 - thicknessRatio * 0.4;
    opts.opacity = 0.6 + thicknessRatio * 0.35;
  } else {
    opts.roughness = 0.6;
    opts.metalness = 0.0;
    opts.transmission = 0.0;
    opts.opacity = 0.9 + thicknessRatio * 0.1;
  }
  return new THREE.MeshPhysicalMaterial(opts);
}

export default function BagConfigurator() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const printCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const bagGroupRef = useRef<THREE.Group | null>(null);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const floorMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const printTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const uploadedImageRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [panelOpen, setPanelOpen] = useState(true);

  const [type, setType] = useState<PlasticType>("ldpe");
  const [handle, setHandle] = useState<HandleType>("vest");
  const [width, setWidth] = useState(40); // cm (zougi)
  const [heightIn, setHeightIn] = useState(24); // inches
  const [depth, setDepth] = useState(10); // cm
  const [thickness, setThickness] = useState(50); // microns
  const [bagColor, setBagColor] = useState("#ffffff");

  const [printText, setPrintText] = useState("");
  const [floorColor, setFloorColor] = useState("#cbd5e1");
  const [lightIntensity, setLightIntensity] = useState(100); // %
  const [printVersion, setPrintVersion] = useState(0);

  // depth max = 50% of width
  const depthMax = useMemo(() => Math.floor(width / 2), [width]);
  useEffect(() => {
    if (depth > depthMax) setDepth(depthMax);
  }, [depthMax, depth]);

  // ---- Init scene ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e2e8f0");
    sceneRef.current = scene;

    const w = container.clientWidth;
    const h = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(5, 3, 7);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 15;
    controls.target.set(0, 2, 0);
    controlsRef.current = controls;

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    ambientRef.current = ambient;

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(4, 8, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const backLight = new THREE.PointLight(0xf8fafc, 0.5);
    backLight.position.set(-4, 4, -4);
    scene.add(backLight);

    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      color: "#cbd5e1",
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    floorMatRef.current = floorMat;

    const bagGroup = new THREE.Group();
    scene.add(bagGroup);
    bagGroupRef.current = bagGroup;

    const onResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      cameraRef.current.aspect = cw / ch;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(cw, ch);
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      const disposed = new Set<unknown>();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry && !disposed.has(mesh.geometry)) {
          mesh.geometry.dispose();
          disposed.add(mesh.geometry);
        }
        const mat = mesh.material as
          | THREE.Material
          | THREE.Material[]
          | undefined;
        if (Array.isArray(mat)) {
          mat.forEach((m) => {
            if (!disposed.has(m)) {
              m.dispose();
              disposed.add(m);
            }
          });
        } else if (mat && !disposed.has(mat)) {
          mat.dispose();
          disposed.add(mat);
        }
      });
      printTextureRef.current?.dispose();
      printTextureRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      bagGroupRef.current = null;
      ambientRef.current = null;
      dirLightRef.current = null;
      floorMatRef.current = null;
    };
  }, []);

  // Lighting intensity
  useEffect(() => {
    const scale = lightIntensity / 100;
    if (ambientRef.current) ambientRef.current.intensity = 0.7 * scale;
    if (dirLightRef.current) dirLightRef.current.intensity = 1.2 * scale;
  }, [lightIntensity]);

  // Floor + background color
  useEffect(() => {
    if (floorMatRef.current) floorMatRef.current.color.set(floorColor);
    if (sceneRef.current && sceneRef.current.background instanceof THREE.Color) {
      sceneRef.current.background.set(floorColor);
    }
  }, [floorColor]);

  // Print canvas / texture
  useEffect(() => {
    const canvas = printCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const img = uploadedImageRef.current;
    if (img) {
      const imgAspect = img.width / img.height;
      let drawW = canvas.width * 0.6;
      let drawH = drawW / imgAspect;
      if (drawH > canvas.height * 0.6) {
        drawH = canvas.height * 0.6;
        drawW = drawH * imgAspect;
      }
      ctx.drawImage(
        img,
        (canvas.width - drawW) / 2,
        (canvas.height - drawH) / 2,
        drawW,
        drawH,
      );
    } else if (printText) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.font = "bold 100px Tajawal, sans-serif";
      ctx.fillStyle = "#0f172a";
      ctx.fillText(printText, cx, cy);
      ctx.strokeStyle = "#0ea5e9";
      ctx.lineWidth = 4;
      ctx.strokeText(printText, cx + 5, cy + 5);
    }

    if (!printTextureRef.current) {
      const tex = new THREE.CanvasTexture(canvas);
      const renderer = rendererRef.current;
      if (renderer) tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      printTextureRef.current = tex;
    } else {
      printTextureRef.current.needsUpdate = true;
    }
  }, [printVersion, printText]);

  // Bag geometry rebuild
  useEffect(() => {
    const bagGroup = bagGroupRef.current;
    const controls = controlsRef.current;
    if (!bagGroup || !controls) return;

    while (bagGroup.children.length > 0) {
      const child = bagGroup.children[0] as THREE.Mesh;
      bagGroup.remove(child);
      child.geometry?.dispose?.();
      const mat = child.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose?.();
    }

    const w_cm = width;
    const h_cm = heightIn * 2.54;
    const w = w_cm / SCALE;
    const h = h_cm / SCALE;
    let d = depth / SCALE;
    if (d === 0) d = 0.02;

    const material = getPlasticMaterial(type, bagColor, thickness);

    const geo = new THREE.BoxGeometry(w, h, d, 32, 32, 4);
    geo.translate(0, h / 2, 0);

    const vestHandleHeightCm = Math.min(15, Math.max(10, h_cm * 0.25));
    const vestHandleUnits = vestHandleHeightCm / SCALE;

    const pos = geo.getAttribute("position");
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      const yNorm = y / h;

      if (Math.abs(x) > w / 2 - 0.05 && Math.abs(z) < d / 4) {
        x -= Math.sign(x) * (d * 0.4);
      }

      if (handle === "vest") {
        const handleThreshold = (h - vestHandleUnits) / h;
        if (yNorm > handleThreshold) {
          if (Math.abs(x) < w * 0.25) {
            const dip =
              vestHandleUnits * Math.cos((x / (w * 0.25)) * (Math.PI / 2));
            y -= dip;
          } else {
            x *= 0.9;
          }
        }
      } else {
        if (yNorm > 0.85) {
          z *= 0.2;
        }
      }

      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();

    const bagMesh = new THREE.Mesh(geo, material);
    bagMesh.castShadow = true;
    bagGroup.add(bagMesh);

    if (handle === "banana") {
      const holeGeo = new THREE.TorusGeometry(w * 0.12, 0.02, 16, 32);
      holeGeo.scale(1, 0.35, 1);
      const holeMat = new THREE.MeshBasicMaterial({
        color: 0x1e293b,
        transparent: true,
        opacity: 0.5,
      });
      const hole = new THREE.Mesh(holeGeo, holeMat);
      hole.position.set(0, h * 0.85, 0);
      bagGroup.add(hole);
    } else if (handle === "loop") {
      const handleGeo = new THREE.TorusGeometry(
        w * 0.2,
        0.04,
        16,
        32,
        Math.PI,
      );
      const h1 = new THREE.Mesh(handleGeo, material);
      h1.position.set(0, h * 0.98, d / 2);
      const h2 = new THREE.Mesh(handleGeo, material);
      h2.position.set(0, h * 0.98, -d / 2);
      bagGroup.add(h1, h2);
    }

    if (printTextureRef.current) {
      const printMat = new THREE.MeshBasicMaterial({
        map: printTextureRef.current,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      });
      const printGeo = geo.clone();
      const printMesh = new THREE.Mesh(printGeo, printMat);
      printMesh.scale.set(1.002, 1.002, 1.002);
      bagGroup.add(printMesh);
    }

    controls.target.set(0, h / 2, 0);
  }, [type, handle, width, heightIn, depth, thickness, bagColor, printVersion]);

  const onUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        uploadedImageRef.current = img;
        setPrintVersion((v) => v + 1);
      };
      img.src = String(evt.target?.result || "");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      dir="rtl"
      className="relative pt-16 lg:pr-64 min-h-screen bg-slate-100"
    >
      <div
        className="relative w-full flex"
        style={{ height: "calc(100vh - 4rem)", minHeight: "600px" }}
      >
        {/* Panel first in DOM → in RTL flex it appears on the RIGHT (matches mockup) */}
        <div
          className={`relative h-full bg-white/95 backdrop-blur shadow-2xl overflow-y-auto flex-shrink-0 flex-col gap-4 border-l border-slate-200 transition-all duration-300 ${
            panelOpen
              ? "w-full sm:w-[22rem] p-4 flex"
              : "w-0 p-0 overflow-hidden hidden"
          }`}
          style={{ fontFamily: "Tajawal, sans-serif" }}
        >
        <div className="border-b border-slate-200 pb-2 flex justify-between items-center sticky top-0 bg-white/95 z-10">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
            <Boxes className="h-5 w-5 text-blue-500" />
            المواصفات الفنية
          </h1>
          <button
            onClick={() => setPanelOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
            aria-label="إغلاق اللوحة"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* القياسات */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 space-y-3">
          <h2 className="text-sm font-bold text-slate-700">القياسات</h2>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-slate-600">العرض (زوجي):</label>
              <span className="text-xs font-bold text-blue-600">
                {width} سم
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={80}
              step={2}
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-sky-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-slate-600">الطول (زوجي):</label>
              <span className="text-xs font-bold text-blue-600">
                {heightIn} بوصة
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={38}
              step={2}
              value={heightIn}
              onChange={(e) => setHeightIn(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-sky-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-slate-600">
                الطية (حتى 50% من العرض):
              </label>
              <span className="text-xs font-bold text-blue-600">
                {depth} سم
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={depthMax}
              step={1}
              value={depth}
              onChange={(e) => setDepth(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-sky-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-slate-600">السماكة:</label>
              <span className="text-xs font-bold text-blue-600">
                {thickness} مايكرون
              </span>
            </div>
            <input
              type="range"
              min={35}
              max={150}
              step={1}
              value={thickness}
              onChange={(e) => setThickness(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-sky-500"
            />
          </div>
        </div>

        {/* المادة والمقبض */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 space-y-3">
          <h2 className="text-sm font-bold text-slate-700">المادة والمقبض</h2>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PlasticType)}
              className="text-xs bg-slate-50 border border-slate-200 rounded p-1.5 outline-none focus:border-blue-400"
            >
              <option value="ldpe">LDPE (شفاف/ناعم)</option>
              <option value="hdpe">HDPE (معتم/قوي)</option>
            </select>
            <select
              value={handle}
              onChange={(e) => setHandle(e.target.value as HandleType)}
              className="text-xs bg-slate-50 border border-slate-200 rounded p-1.5 outline-none focus:border-blue-400"
            >
              <option value="vest">علاقي (T-Shirt)</option>
              <option value="banana">بنانة (Die-Cut)</option>
              <option value="loop">ملحوم (Loop)</option>
              <option value="none">بدون مقبض</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">
              لون الكيس الأساسي:
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBagColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border ${
                    bagColor === c
                      ? "outline outline-[3px] outline-sky-500 outline-offset-2 border-gray-300"
                      : "border-gray-300"
                  }`}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </div>

        {/* البيئة والإضاءة */}
        <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 space-y-3">
          <h2 className="text-sm font-bold text-slate-700">البيئة والإضاءة</h2>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-slate-600">شدة الإضاءة:</label>
              <span className="text-xs font-bold text-blue-600">
                {lightIntensity}%
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={200}
              step={1}
              value={lightIntensity}
              onChange={(e) => setLightIntensity(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none accent-sky-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">
              لون الاستوديو (الأرضية والخلفية):
            </label>
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded border border-slate-200">
              <input
                type="color"
                value={floorColor}
                onChange={(e) => setFloorColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
              />
              <span className="text-xs text-slate-500 font-medium px-1">
                انقر لاختيار لون البيئة
              </span>
            </div>
          </div>
        </div>

        {/* التصميم والطباعة */}
        <div className="bg-blue-50/40 rounded-lg p-3 shadow-sm border border-blue-100 space-y-3">
          <h2 className="text-sm font-bold text-blue-900">
            التصميم (محاكاة الطباعة)
          </h2>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              إرفاق تصميم جاهز (صورة شفافة PNG يفضل)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={onUploadImage}
              className="w-full text-xs text-slate-500 file:ml-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
            />
          </div>

          <div className="text-center text-xs text-slate-400 my-1">- أو -</div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">
              نص بديل (طباعة فلكسو)
            </label>
            <input
              type="text"
              value={printText}
              onChange={(e) => setPrintText(e.target.value)}
              placeholder="اكتب لترى محاكاة الفلكسو..."
              className="w-full bg-white border border-slate-200 rounded p-1.5 text-xs outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setPrintVersion((v) => v + 1)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-xs transition-colors"
            >
              تطبيق التصميم
            </button>
            <button
              onClick={() => {
                uploadedImageRef.current = null;
                setPrintVersion((v) => v + 1);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-1.5 px-3 rounded text-xs transition-colors"
              title="إزالة الصورة المرفقة"
            >
              إزالة الصورة
            </button>
          </div>
        </div>
        </div>

        {/* 3D canvas container — visually on the LEFT in RTL flex (after panel in DOM) */}
        <div ref={containerRef} className="relative flex-1 min-w-0 h-full" />

        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute top-4 right-4 z-20 bg-white p-2 rounded-lg shadow-md text-blue-600"
            aria-label="فتح اللوحة"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
      </div>

      <canvas
        ref={printCanvasRef}
        width={1024}
        height={1024}
        style={{ display: "none" }}
      />
    </div>
  );
}
