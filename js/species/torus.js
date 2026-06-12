/* species/torus.js
   Torus form pass, extracted from specimen_torus_v10.html. Classic
   script; registers under window.SPECIES.

   3D species. The caller owns THREE and the WebGLRenderer (one
   renderer is shared across all 3D species instances on a page);
   the instance owns its scene, mesh, materials, lights, and readback
   canvases. renderForm renders at form.W x form.H, so the same
   instance can serve forms of different sizes. */

window.SPECIES = window.SPECIES || {};

SPECIES.torus = {
  name: "torus",
  is3D: true,

  DEFAULTS: {
    species: "torus",
    breed:   "halftone",

    geometry: {
      type:     "torus",
      R:        1.00,
      r:        0.30,
      rotation: [90, 0, 0],
      segR:     32,
      segT:     128
    },

    camera: {
      fov:      30,
      position: [0.00, 1.05, 3.30],
      target:   [0, 0, 0]
    },

    light: {
      keyIntensity: 1.20,
      direction:    [0.30, 1.00, 0.45],
      ambient:      0.10
    },

    tone: {
      blackPoint: 0.0,
      whitePoint: 1.0,
      gamma:      1.0
    },

    polarity: "positive",
    fillLuma: 0.00,

    breeds: {
      raster_vertical: {
        spacing:    1.6,
        segmentLen: 6,
        jitterX:    0.4,
        weightBase: 1.0,
        weightVar:  0.35,
        lumaWeight: 0.40
      },
      stipple: {
        density:     0.14,
        dotSizeBase: 1.6,
        dotSizeVar:  0.40,
        jitter:      0.5
      },
      halftone: {
        cellSize:  6.00,
        dotSize:   0.85,
        coverage:  0.85,
        jitter:    0.00
      },
      riso_noise: {
        density:     0.12,
        dotSizeBase: 1.4,
        dotSizeVar:  0.40,
        jitter:      0.5,
        misreg:      1.5,
        // Layer order is paint order; later layers sit on top.
        // lumaResponse > 0  → layer prefers shadow
        // lumaResponse < 0  → layer prefers light
        // lumaResponse = 0  → uniform across the form
        layers: [
          { color: [20, 18, 14, 240],   offset: [0.0, 0.0],   densityMult: 1.00, lumaResponse:  0.60 }, // black
          { color: [232, 89, 79, 220],  offset: [1.5, -0.8],  densityMult: 0.55, lumaResponse:  0.00 }, // riso red
          { color: [248, 215, 88, 220], offset: [-1.2, 1.5],  densityMult: 0.40, lumaResponse: -0.30 }, // riso yellow
          { color: [64, 110, 178, 220], offset: [2.0, 1.2],   densityMult: 0.35, lumaResponse:  0.50 }  // riso blue
        ]
      },
      color_blocking: {
        density:     0.25,
        dotSizeBase: 1.4,
        dotSizeVar:  0.30,
        jitter:      0.5,
        shading:     0.30,
        defaultColor: [40, 36, 30, 200],
        regions: [
          { dirX: 0, dirY:  1, dirZ: 0, threshold: 0.40, color: [64, 110, 178, 220] },
          { dirX: 0, dirY: -1, dirZ: 0, threshold: 0.40, color: [58, 140, 80, 220] },
          { dirX: 0, dirY:  0, dirZ: 1, threshold: 0.65, color: [248, 215, 88, 220] }
        ]
      },
      outline: {
        weight: 1.5,
        jitter: 0.00
      },
      color_cluster: {
        count: 300,
        size: 8,
        sizeVar: 0.50,
        circlePct: 100,
        quadPct: 0,
        trianglePct: 0,
        rotation: 0,
        opacity: 1.0,
        baseColor: [0, 60, 50],
        harmony: "triadic",
        darkMix: 0.0,
        lumaResponse: 0.0,
        noiseFreq: 0.02,
        noiseStrength: 0.0,
        scatter: 0
      },
      dot_matrix: {
        cellSize:       5,
        markSize:       0.70,
        glyph:          "dot",
        noiseFreq:      0.015,
        noiseStrength:  0.60,
        jitter:         0.00
      }
    },

    paperGrain: 0.55,
    inkColor:   [14, 13, 11],
    inkAlpha:   232,

    seed: 1138
  },

  /* Random builds for the pool. Sampling bounds follow the test-page
     sliders: tube r 0.10-0.45, rotation -180..180 per axis, camera
     elevation and distance within the slider band. R has no slider
     and stays 1.0; apparent size comes from placement. */
  randomGeometry(rng) {
    return {
      type: "torus",
      R: 1.00,
      r: +(0.10 + rng() * 0.35).toFixed(3),
      rotation: [
        Math.round(rng() * 360 - 180),
        Math.round(rng() * 360 - 180),
        Math.round(rng() * 360 - 180)
      ],
      segR: 32,
      segT: 128
    };
  },

  randomCamera(rng) {
    return {
      fov: 30,
      position: [0.00, +(0.30 + rng() * 1.50).toFixed(2), +(2.60 + rng() * 1.90).toFixed(2)],
      target: [0, 0, 0]
    };
  },

  create({ THREE, renderer }) {
    const DEG2RAD = Math.PI / 180;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 4 / 3, 0.1, 100);

    const litMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0, roughness: 0.9 });

    const normalMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vObjectNormal;
        void main() {
          vObjectNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vObjectNormal;
        void main() {
          gl_FragColor = vec4(normalize(vObjectNormal) * 0.5 + 0.5, 1.0);
        }
      `
    });

    const mesh = new THREE.Mesh(new THREE.TorusGeometry(1, 0.3, 32, 128), litMaterial);
    scene.add(mesh);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    scene.add(keyLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambient);

    const litCanvas = document.createElement('canvas');
    const litCtx = litCanvas.getContext('2d');
    const normalCanvas = document.createElement('canvas');
    const normalCtx = normalCanvas.getContext('2d');

    let lastR = -1;
    let lastr = -1;

    function renderForm(s, form) {
      const W = form.W, H = form.H;

      if (renderer.domElement.width !== W || renderer.domElement.height !== H) {
        renderer.setSize(W, H);
      }
      if (litCanvas.width !== W || litCanvas.height !== H) {
        litCanvas.width = W;  litCanvas.height = H;
        normalCanvas.width = W;  normalCanvas.height = H;
      }

      camera.position.set(...s.camera.position);
      camera.fov = s.camera.fov;
      camera.aspect = W / H;
      camera.lookAt(...s.camera.target);
      camera.updateProjectionMatrix();

      keyLight.position.set(...s.light.direction);
      keyLight.intensity = s.light.keyIntensity;
      ambient.intensity = s.light.ambient;

      mesh.rotation.set(
        s.geometry.rotation[0] * DEG2RAD,
        s.geometry.rotation[1] * DEG2RAD,
        s.geometry.rotation[2] * DEG2RAD
      );

      if (s.geometry.R !== lastR || s.geometry.r !== lastr) {
        mesh.geometry.dispose();
        mesh.geometry = new THREE.TorusGeometry(
          s.geometry.R, s.geometry.r, s.geometry.segR, s.geometry.segT
        );
        lastR = s.geometry.R;
        lastr = s.geometry.r;
      }

      renderer.render(scene, camera);

      litCtx.clearRect(0, 0, W, H);
      litCtx.drawImage(renderer.domElement, 0, 0);
      const img = litCtx.getImageData(0, 0, W, H);

      const { silhouette, luma, normals } = form;
      const total = W * H;
      let minL = 1, maxL = 0, sumL = 0, count = 0;
      for (let i = 0; i < total; i++) {
        const r = img.data[i * 4];
        const g = img.data[i * 4 + 1];
        const b = img.data[i * 4 + 2];
        const a = img.data[i * 4 + 3];
        if (a > 24) {
          silhouette[i] = 1;
          const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          luma[i] = l;
          if (l < minL) minL = l;
          if (l > maxL) maxL = l;
          sumL += l;
          count++;
        } else {
          silhouette[i] = 0;
          luma[i] = 0;
        }
      }
      form.lumaMin  = count ? minL : 0;
      form.lumaMax  = count ? maxL : 0;
      form.lumaMean = count ? sumL / count : 0;

      // ---- Pass 2: normals ----
      mesh.material = normalMaterial;
      renderer.render(scene, camera);
      normalCtx.clearRect(0, 0, W, H);
      normalCtx.drawImage(renderer.domElement, 0, 0);
      const normalImg = normalCtx.getImageData(0, 0, W, H);

      for (let i = 0; i < total; i++) {
        if (silhouette[i] === 0) {
          normals[i * 3]     = 0;
          normals[i * 3 + 1] = 0;
          normals[i * 3 + 2] = 0;
          continue;
        }
        normals[i * 3]     = (normalImg.data[i * 4]     / 255) * 2 - 1;
        normals[i * 3 + 1] = (normalImg.data[i * 4 + 1] / 255) * 2 - 1;
        normals[i * 3 + 2] = (normalImg.data[i * 4 + 2] / 255) * 2 - 1;
      }

      mesh.material = litMaterial;
    }

    return { renderForm, litCanvas, normalCanvas };
  }
};
