import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

import PageLayout from "../components/layout/PageLayout";
import { Button } from "../components/ui/button";

type BagType = "tshirt" | "diecut" | "softloop" | "none";
type PrintMode = "text" | "image";

interface BagColorProps {
  hex: string;
  roughness: number;
  transmission: number;
  metalness?: number;
  opacity?: number;
  transparent?: boolean;
  ior?: number;
  thickness?: number;
}

const BAG_COLORS: Record<string, BagColorProps> = {
  "أزرق": { hex: "#0047AB", roughness: 0.4, transmission: 0, metalness: 0.1 },
  "سماوي": { hex: "#87CEEB", roughness: 0.4, transmission: 0, metalness: 0.1 },
  "شفاف": {
    hex: "#FFFFFF",
    roughness: 0.1,
    transmission: 0.95,
    opacity: 1,
    transparent: true,
    ior: 1.5,
    thickness: 0.1,
  },
  "ثلجي": {
    hex: "#FAFAFA",
    roughness: 0.6,
    transmission: 0.8,
    opacity: 1,
    transparent: true,
    ior: 1.2,
    thickness: 0.5,
  },
  "أبيض": { hex: "#FFFFFF", roughness: 0.4, transmission: 0, metalness: 0 },
  "أصفر": { hex: "#FFD700", roughness: 0.4, transmission: 0, metalness: 0.1 },
  "برتقالي": { hex: "#FF8C00", roughness: 0.4, transmission: 0, metalness: 0.1 },
  "أخضر": { hex: "#008000", roughness: 0.4, transmission: 0, metalness: 0.1 },
  "ذهبي": { hex: "#D4AF37", roughness: 0.25, transmission: 0, metalness: 0.8 },
  "رمادي": { hex: "#808080", roughness: 0.5, transmission: 0, metalness: 0.1 },
  "بني": { hex: "#8B4513", roughness: 0.6, transmission: 0, metalness: 0.1 },
  "فضي": { hex: "#C0C0C0", roughness: 0.2, transmission: 0, metalness: 0.9 },
  "بيج": { hex: "#F5F5DC", roughness: 0.5, transmission: 0, metalness: 0 },
  "عاجي": { hex: "#FFFFF0", roughness: 0.5, transmission: 0, metalness: 0 },
  "أحمر": { hex: "#DC143C", roughness: 0.4, transmission: 0, metalness: 0.1 },
  "وردي": { hex: "#FFC0CB", roughness: 0.4, transmission: 0, metalness: 0 },
  "تركوازي": { hex: "#40E0D0", roughness: 0.4, transmission: 0, metalness: 0.1 },
  "تفاحي": { hex: "#8DB600", roughness: 0.4, transmission: 0, metalness: 0.1 },
};

const LIGHT_COLORS = new Set(["شفاف", "ثلجي", "أبيض", "عاجي"]);

const BAG_TYPE_OPTIONS: Array<{ value: BagType; label: string }> = [
  { value: "tshirt", label: "علاق" },
  { value: "diecut", label: "بنانة" },
  { value: "softloop", label: "مقبض شريطي" },
  { value: "none", label: "بدون مقبض" },
];

export default function BagConfigurator() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const bagGroupRef = useRef<THREE.Group | null>(null);
  const bagMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const printMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const printCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const printTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const measurementLinesRef = useRef<{
    w: THREE.Line;
    h: THREE.Line;
    g: THREE.Line;
  } | null>(null);
  const labelWRef = useRef<HTMLDivElement | null>(null);
  const labelHRef = useRef<HTMLDivElement | null>(null);
  const labelGRef = useRef<HTMLDivElement | null>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // State
  const [type, setType] = useState<BagType>("tshirt");
  const [width, setWidth] = useState(30);
  const [height, setHeight] = useState(40);
  const [gusset, setGusset] = useState(10);
  const [colorName, setColorName] = useState<string>("أزرق");
  const [colorsSide1, setColorsSide1] = useState(2);
  const [colorsSide2, setColorsSide2] = useState(1);
  const [printMode, setPrintMode] = useState<PrintMode>("text");
  const [printText, setPrintText] = useState("علامتك التجارية");
  const [printColor, setPrintColor] = useState("#000000");
  const [printSize, setPrintSize] = useState(80);
  const [printImgSize, setPrintImgSize] = useState(150);
  const [imageVersion, setImageVersion] = useState(0);

  const totalColors = colorsSide1 + colorsSide2;
  const colorsExceeded = totalColors > 8;

  // ---- Init scene (run once) ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      1,
      1000,
    );
    camera.position.set(60, 40, 80);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 30;
    controls.maxDistance = 200;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(50, 60, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);
    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-50, 30, -50);
    scene.add(backLight);
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);

    // Materials
    bagMaterialRef.current = new THREE.MeshPhysicalMaterial({
      side: THREE.DoubleSide,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
    });

    // Print canvas / texture
    const printCanvas = document.createElement("canvas");
    printCanvas.width = 1024;
    printCanvas.height = 1024;
    printCanvasRef.current = printCanvas;
    const printTexture = new THREE.CanvasTexture(printCanvas);
    printTexture.colorSpace = THREE.SRGBColorSpace;
    printTextureRef.current = printTexture;

    printMaterialRef.current = new THREE.MeshPhysicalMaterial({
      map: printTexture,
      transparent: true,
      opacity: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    // Measurement lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
    const makeLine = () => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(6), 3),
      );
      return new THREE.Line(geo, lineMaterial);
    };
    const wLine = makeLine();
    const hLine = makeLine();
    const gLine = makeLine();
    scene.add(wLine, hLine, gLine);
    measurementLinesRef.current = { w: wLine, h: hLine, g: gLine };

    const onResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect =
        container.clientWidth / container.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      controls.update();
      updateLabels();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      controls.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
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
      printTexture.dispose();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      bagGroupRef.current = null;
      bagMaterialRef.current = null;
      printMaterialRef.current = null;
      printTextureRef.current = null;
      measurementLinesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Update labels each frame helper ----
  function updateLabels() {
    const camera = cameraRef.current;
    const container = containerRef.current;
    if (!camera || !container || !bagGroupRef.current) return;

    const w = stateRef.current.w;
    const h = stateRef.current.h;
    const g = stateRef.current.g;
    const hw = w / 2;
    const hh = h / 2;
    const hd = (g > 0 ? g : 0.5) / 2;
    const offset = 3;

    if (labelWRef.current) {
      labelWRef.current.textContent = `العرض: ${w} سم`;
      const v = new THREE.Vector3(0, -hh - offset, hd).project(camera);
      labelWRef.current.style.left = `${(v.x * 0.5 + 0.5) * container.clientWidth}px`;
      labelWRef.current.style.top = `${(v.y * -0.5 + 0.5) * container.clientHeight}px`;
      labelWRef.current.style.opacity = "1";
    }
    if (labelHRef.current) {
      labelHRef.current.textContent = `الطول: ${h} سم`;
      const v = new THREE.Vector3(-hw - offset, 0, hd).project(camera);
      labelHRef.current.style.left = `${(v.x * 0.5 + 0.5) * container.clientWidth}px`;
      labelHRef.current.style.top = `${(v.y * -0.5 + 0.5) * container.clientHeight}px`;
      labelHRef.current.style.opacity = "1";
    }
    if (labelGRef.current) {
      if (g > 0) {
        labelGRef.current.textContent = `الطية: ${g} سم`;
        const v = new THREE.Vector3(hw + offset, -hh, 0).project(camera);
        labelGRef.current.style.left = `${(v.x * 0.5 + 0.5) * container.clientWidth}px`;
        labelGRef.current.style.top = `${(v.y * -0.5 + 0.5) * container.clientHeight}px`;
        labelGRef.current.style.opacity = "1";
      } else {
        labelGRef.current.style.opacity = "0";
      }
    }
  }

  // Mirror state into a ref for use in the rAF callback (avoids stale closure)
  const stateRef = useRef({ w: width, h: height, g: gusset });
  useEffect(() => {
    stateRef.current = { w: width, h: height, g: gusset };
  }, [width, height, gusset]);

  // ---- Build bag geometry ----
  useEffect(() => {
    const scene = sceneRef.current;
    const bagMaterial = bagMaterialRef.current;
    const printMaterial = printMaterialRef.current;
    if (!scene || !bagMaterial || !printMaterial) return;

    // Remove old bag
    if (bagGroupRef.current) {
      scene.remove(bagGroupRef.current);
      bagGroupRef.current.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
      });
      bagGroupRef.current = null;
    }

    const bagGroup = new THREE.Group();
    scene.add(bagGroup);
    bagGroupRef.current = bagGroup;

    const hw = width / 2;
    const hh = height / 2;
    const d = gusset > 0 ? gusset : 0.2;
    const hd = d / 2;

    const shape = new THREE.Shape();
    shape.moveTo(-hw, -hh);
    shape.lineTo(hw, -hh);

    const handleHeight = 10;
    const handleWidth = width * 0.25;

    if (type === "tshirt") {
      shape.lineTo(hw, hh + handleHeight);
      shape.lineTo(hw - handleWidth, hh + handleHeight);
      shape.lineTo(hw - handleWidth, hh);
      shape.lineTo(-hw + handleWidth, hh);
      shape.lineTo(-hw + handleWidth, hh + handleHeight);
      shape.lineTo(-hw, hh + handleHeight);
      shape.lineTo(-hw, -hh);
    } else {
      shape.lineTo(hw, hh);
      shape.lineTo(-hw, hh);
      shape.lineTo(-hw, -hh);
    }

    if (type === "diecut") {
      const holePath = new THREE.Path();
      const holeW = Math.min(width * 0.3, 12) / 2;
      const holeH = 3;
      const holeY = hh - 6;
      holePath.absellipse(0, holeY, holeW, holeH, 0, Math.PI * 2, false, 0);
      shape.holes.push(holePath);
    }

    const shapeGeo = new THREE.ShapeGeometry(shape, 32);

    // ShapeGeometry assigns raw (x,y) world coords as UVs, which makes the
    // print texture sample only a tiny 1cm×1cm corner of the canvas. We
    // recompute UVs so the 1024×1024 print canvas maps across the whole
    // shape's bounding rectangle.
    {
      const pos = shapeGeo.attributes.position as THREE.BufferAttribute;
      const minX = -hw;
      const maxX = hw;
      const minY = -hh;
      const maxY = type === "tshirt" ? hh + handleHeight : hh;
      const dx = maxX - minX || 1;
      const dy = maxY - minY || 1;
      const uvs = new Float32Array(pos.count * 2);
      for (let i = 0; i < pos.count; i++) {
        uvs[i * 2] = (pos.getX(i) - minX) / dx;
        uvs[i * 2 + 1] = (pos.getY(i) - minY) / dy;
      }
      shapeGeo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    }

    const frontMesh = new THREE.Mesh(shapeGeo, bagMaterial);
    frontMesh.position.z = hd;
    frontMesh.castShadow = true;
    frontMesh.receiveShadow = true;
    bagGroup.add(frontMesh);

    const printMesh = new THREE.Mesh(shapeGeo, printMaterial);
    printMesh.position.z = hd;
    bagGroup.add(printMesh);

    const backMesh = new THREE.Mesh(shapeGeo, bagMaterial);
    backMesh.position.z = -hd;
    backMesh.rotation.y = Math.PI;
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;
    bagGroup.add(backMesh);

    const addWall = (
      w: number,
      h: number,
      px: number,
      py: number,
      pz: number,
      rx?: number,
      ry?: number,
    ) => {
      const geo = new THREE.PlaneGeometry(w, h);
      const mesh = new THREE.Mesh(geo, bagMaterial);
      mesh.position.set(px, py, pz);
      if (rx) mesh.rotation.x = rx;
      if (ry) mesh.rotation.y = ry;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      bagGroup.add(mesh);
    };

    // Bottom
    addWall(width, d, 0, -hh, 0, Math.PI / 2, 0);

    if (type === "tshirt") {
      const sideHeight = height + handleHeight;
      const centerY = (-hh + (hh + handleHeight)) / 2;
      addWall(d, sideHeight, -hw, centerY, 0, 0, Math.PI / 2);
      addWall(d, sideHeight, hw, centerY, 0, 0, Math.PI / 2);
      addWall(handleWidth, d, -hw + handleWidth / 2, hh + handleHeight, 0, Math.PI / 2, 0);
      addWall(handleWidth, d, hw - handleWidth / 2, hh + handleHeight, 0, Math.PI / 2, 0);
      addWall(d, handleHeight, hw - handleWidth, hh + handleHeight / 2, 0, 0, Math.PI / 2);
      addWall(d, handleHeight, -hw + handleWidth, hh + handleHeight / 2, 0, 0, Math.PI / 2);
      addWall(width - handleWidth * 2, d, 0, hh, 0, Math.PI / 2, 0);
    } else {
      addWall(d, height, -hw, 0, 0, 0, Math.PI / 2);
      addWall(d, height, hw, 0, 0, 0, Math.PI / 2);
    }

    if (type === "softloop") {
      const loopRadius = width * 0.15;
      const tubeRadius = 0.6;
      const loopGeo = new THREE.TorusGeometry(
        loopRadius,
        tubeRadius,
        8,
        32,
        Math.PI,
      );
      const handleFront = new THREE.Mesh(loopGeo, bagMaterial);
      handleFront.position.set(0, hh, hd);
      handleFront.castShadow = true;
      const handleBack = new THREE.Mesh(loopGeo, bagMaterial);
      handleBack.position.set(0, hh, -hd);
      handleBack.castShadow = true;
      bagGroup.add(handleFront, handleBack);
    }

    // Update measurement lines
    const lines = measurementLinesRef.current;
    if (lines) {
      const offset = 3;
      const wPos = (lines.w.geometry.attributes.position as THREE.BufferAttribute)
        .array as Float32Array;
      wPos[0] = -hw; wPos[1] = -hh - offset; wPos[2] = hd;
      wPos[3] = hw; wPos[4] = -hh - offset; wPos[5] = hd;
      lines.w.geometry.attributes.position.needsUpdate = true;

      const hPos = (lines.h.geometry.attributes.position as THREE.BufferAttribute)
        .array as Float32Array;
      hPos[0] = -hw - offset; hPos[1] = -hh; hPos[2] = hd;
      hPos[3] = -hw - offset; hPos[4] = hh; hPos[5] = hd;
      lines.h.geometry.attributes.position.needsUpdate = true;

      if (gusset > 0) {
        lines.g.visible = true;
        const gPos = (lines.g.geometry.attributes.position as THREE.BufferAttribute)
          .array as Float32Array;
        gPos[0] = hw + offset; gPos[1] = -hh; gPos[2] = hd;
        gPos[3] = hw + offset; gPos[4] = -hh; gPos[5] = -hd;
        lines.g.geometry.attributes.position.needsUpdate = true;
      } else {
        lines.g.visible = false;
      }
    }
  }, [type, width, height, gusset]);

  // ---- Apply color material ----
  useEffect(() => {
    const bagMaterial = bagMaterialRef.current;
    const printMaterial = printMaterialRef.current;
    if (!bagMaterial || !printMaterial) return;

    const cProps = BAG_COLORS[colorName];
    if (!cProps) return;

    bagMaterial.color.set(cProps.hex);
    bagMaterial.roughness = cProps.roughness;
    bagMaterial.metalness = cProps.metalness ?? 0;

    if (cProps.transparent) {
      bagMaterial.transparent = true;
      bagMaterial.transmission = cProps.transmission;
      bagMaterial.opacity = cProps.opacity ?? 1;
      bagMaterial.ior = cProps.ior ?? 1.5;
      bagMaterial.thickness = cProps.thickness ?? 0.1;
    } else {
      bagMaterial.transparent = false;
      bagMaterial.transmission = 0;
      bagMaterial.opacity = 1;
    }
    bagMaterial.needsUpdate = true;

    printMaterial.roughness = cProps.roughness;
    printMaterial.metalness = cProps.metalness ?? 0;
    printMaterial.needsUpdate = true;
  }, [colorName]);

  // ---- Update print canvas ----
  useEffect(() => {
    const canvas = printCanvasRef.current;
    const tex = printTextureRef.current;
    if (!canvas || !tex) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 1024, 1024);
    const yOffset = type === "tshirt" ? 620 : 512;

    if (printMode === "text") {
      if (printText.trim() !== "") {
        ctx.fillStyle = printColor;
        ctx.font = `bold ${printSize * 2}px Tajawal, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(printText, 512, yOffset);
      }
    } else if (printMode === "image" && loadedImageRef.current) {
      const img = loadedImageRef.current;
      const maxDim = printImgSize * 4;
      let w = img.width;
      let h = img.height;
      const scale = Math.min(maxDim / w, maxDim / h);
      w *= scale;
      h *= scale;

      ctx.drawImage(img, 512 - w / 2, yOffset - h / 2, w, h);

      try {
        const imgData = ctx.getImageData(0, 0, 1024, 1024);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235) {
            data[i + 3] = 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch {
        // ignore (e.g., tainted canvas)
      }
    }

    tex.needsUpdate = true;
  }, [type, printMode, printText, printColor, printSize, printImgSize, imageVersion]);

  const onUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        loadedImageRef.current = img;
        setImageVersion((v) => v + 1);
      };
      img.src = String(evt.target?.result || "");
    };
    reader.readAsDataURL(file);
  };

  const colorEntries = useMemo(() => Object.entries(BAG_COLORS), []);

  const stepHeader = (n: number, title: string, accent = "blue") => (
    <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
      <span
        className={`w-6 h-6 rounded flex items-center justify-center text-sm bg-${accent}-100 text-${accent}-600`}
      >
        {n}
      </span>
      {title}
    </h3>
  );

  return (
    <PageLayout
      title="معالج تصميم الأكياس"
      description="صمّم الكيس بصرياً واضبط مواصفاته الفنية في الوقت الفعلي"
      actions={
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/">
            <ArrowRight className="h-4 w-4" />
            العودة للرئيسية
          </Link>
        </Button>
      }
    >
      <div
        dir="rtl"
        className="grid gap-4 lg:grid-cols-[24rem_1fr]"
        style={{ fontFamily: "Tajawal, sans-serif" }}
      >
        {/* Sidebar / Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[calc(100vh-12rem)]">
          <div className="p-5 bg-blue-600 text-white text-center">
            <h2 className="text-xl font-bold">مُصمم الأكياس المتقدم</h2>
            <p className="text-xs text-blue-100 mt-1">
              تخصيص الأبعاد، الألوان، والطباعة
            </p>
          </div>

          <div className="p-5 space-y-6 overflow-y-auto flex-1">
            {/* 1. Bag Type */}
            <div className="space-y-3">
              {stepHeader(1, "نوع الكيس")}
              <div className="grid grid-cols-2 gap-2">
                {BAG_TYPE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition ${
                      type === opt.value
                        ? "bg-blue-50 border-blue-500 dark:bg-blue-900/30"
                        : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="bagType"
                      value={opt.value}
                      checked={type === opt.value}
                      onChange={() => setType(opt.value)}
                      className="text-blue-600 w-4 h-4"
                    />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 2. Dimensions */}
            <div className="space-y-4">
              {stepHeader(2, "المقاسات بالسم")}

              {[
                {
                  label: "العرض (Width)",
                  value: width,
                  set: setWidth,
                  min: 15,
                  max: 60,
                },
                {
                  label: "الطول (Height)",
                  value: height,
                  set: setHeight,
                  min: 20,
                  max: 80,
                },
                {
                  label: "الطية / العمق (Gusset)",
                  value: gusset,
                  set: setGusset,
                  min: 0,
                  max: 25,
                },
              ].map((d) => (
                <div key={d.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <label>{d.label}</label>
                    <span className="font-bold text-blue-600">
                      {d.value} سم
                    </span>
                  </div>
                  <input
                    type="range"
                    min={d.min}
                    max={d.max}
                    value={d.value}
                    onChange={(e) => d.set(parseInt(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              ))}
            </div>

            {/* 3. Bag Color */}
            <div className="space-y-3">
              {stepHeader(3, "لون الكيس الأساسي")}
              <div className="flex flex-wrap gap-2">
                {colorEntries.map(([name, props]) => {
                  const active = colorName === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setColorName(name)}
                      title={name}
                      style={{
                        backgroundColor: props.hex,
                        ...(LIGHT_COLORS.has(name)
                          ? { border: "1px solid #ccc" }
                          : {}),
                      }}
                      className={`w-8 h-8 rounded-full cursor-pointer transition shadow-sm ${
                        active
                          ? "ring-2 ring-offset-2 ring-blue-600 scale-110"
                          : "hover:scale-110"
                      }`}
                    />
                  );
                })}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                اللون المختار:{" "}
                <span className="font-bold text-gray-800 dark:text-gray-100">
                  {colorName}
                </span>
              </div>
            </div>

            {/* 4. Print Colors */}
            <div className="space-y-4 bg-gray-50 dark:bg-gray-700/40 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              {stepHeader(4, "تفاصيل الطباعة", "purple")}
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                الحد الأقصى الإجمالي للألوان هو 8 ألوان. (ملاحظة: إذا كان اللون
                أسود في الوجه الأول وأسود في الوجه الثاني، فإنه يُحسب كلونين).
              </p>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm mb-1">الوجه الأول (A)</label>
                  <input
                    type="number"
                    min={0}
                    max={8}
                    value={colorsSide1}
                    onChange={(e) =>
                      setColorsSide1(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-full border rounded p-2 text-center text-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white dark:bg-gray-800 dark:border-gray-600"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm mb-1">الوجه الثاني (B)</label>
                  <input
                    type="number"
                    min={0}
                    max={8}
                    value={colorsSide2}
                    onChange={(e) =>
                      setColorsSide2(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="w-full border rounded p-2 text-center text-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white dark:bg-gray-800 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="pt-1">
                <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded shadow-sm border dark:border-gray-700">
                  <span className="text-sm font-bold">
                    إجمالي الألوان المستخدمة:
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      colorsExceeded ? "text-red-600" : "text-purple-600"
                    }`}
                  >
                    {totalColors} / 8
                  </span>
                </div>
                {colorsExceeded && (
                  <p className="text-red-500 text-xs mt-2 font-bold">
                    عذراً، لا يمكن تجاوز 8 ألوان كحد أقصى للطباعة!
                  </p>
                )}
              </div>
            </div>

            {/* 5. Print Design */}
            <div className="space-y-4 bg-gray-50 dark:bg-gray-700/40 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              {stepHeader(5, "تصميم الطباعة الحية", "green")}

              <div className="flex gap-2">
                {[
                  { mode: "text" as PrintMode, label: "إضافة نص" },
                  { mode: "image" as PrintMode, label: "رفع شعار" },
                ].map((t) => (
                  <button
                    key={t.mode}
                    type="button"
                    onClick={() => setPrintMode(t.mode)}
                    className={`flex-1 text-center p-2 border rounded transition ${
                      printMode === t.mode
                        ? "bg-blue-50 border-blue-500 dark:bg-blue-900/30"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {printMode === "text" ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={printText}
                    onChange={(e) => setPrintText(e.target.value)}
                    placeholder="أدخل النص هنا..."
                    className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600"
                  />
                  <div className="flex gap-3 items-center">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        لون النص
                      </label>
                      <input
                        type="color"
                        value={printColor}
                        onChange={(e) => setPrintColor(e.target.value)}
                        className="w-10 h-10 p-0 border-0 rounded cursor-pointer bg-transparent"
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        حجم الطباعة
                      </label>
                      <input
                        type="range"
                        min={20}
                        max={250}
                        value={printSize}
                        onChange={(e) => setPrintSize(parseInt(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onUploadImage}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-600 text-sm cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                    سيتم إزالة الخلفية البيضاء للشعار تلقائياً لمحاكاة الطباعة
                    المفرغة على الكيس.
                  </p>
                  <div className="flex flex-col mt-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      حجم الشعار
                    </label>
                    <input
                      type="range"
                      min={50}
                      max={400}
                      value={printImgSize}
                      onChange={(e) => setPrintImgSize(parseInt(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3D Viewer */}
        <div className="relative bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div
            ref={containerRef}
            className="w-full"
            style={{ height: "min(75vh, 720px)", minHeight: "480px" }}
          />

          {/* Measurement labels */}
          <div
            ref={labelWRef}
            className="absolute pointer-events-none px-2 py-1 rounded text-xs whitespace-nowrap text-white shadow"
            style={{
              background: "rgba(0,0,0,0.75)",
              transform: "translate(-50%, -50%)",
              opacity: 0,
              transition: "opacity .2s",
            }}
          />
          <div
            ref={labelHRef}
            className="absolute pointer-events-none px-2 py-1 rounded text-xs whitespace-nowrap text-white shadow"
            style={{
              background: "rgba(0,0,0,0.75)",
              transform: "translate(-50%, -50%)",
              opacity: 0,
              transition: "opacity .2s",
            }}
          />
          <div
            ref={labelGRef}
            className="absolute pointer-events-none px-2 py-1 rounded text-xs whitespace-nowrap text-white shadow"
            style={{
              background: "rgba(0,0,0,0.75)",
              transform: "translate(-50%, -50%)",
              opacity: 0,
              transition: "opacity .2s",
            }}
          />

          <div className="absolute bottom-4 left-4 bg-white/80 dark:bg-gray-900/70 backdrop-blur px-3 py-2 rounded-lg shadow text-xs text-gray-600 dark:text-gray-300 pointer-events-none">
            اسحب بالماوس للتدوير • استخدم العجلة للتقريب
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
