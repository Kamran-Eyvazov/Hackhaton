import { HandLandmarker, FilesetResolver } from '/mediapipe/vision_bundle.mjs';

const WASM = '/mediapipe/wasm';
const MODEL = '/mediapipe/hand_landmarker.task';
let landmarker;
async function getLandmarker() {
  if (landmarker) return landmarker;
  const fileset = await FilesetResolver.forVisionTasks(WASM);
  landmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL },
    runningMode: 'VIDEO',
    numHands: 2
  });
  return landmarker;
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function countHand(h) {
  const w = h[0];
  let n = 0;
  // 4 barmaq: ucu biləkdən pip oynağından daha uzaqdadırsa, açıqdır
  [[8, 6], [12, 10], [16, 14], [20, 18]].forEach(([tip, pip]) => {
    if (dist(h[tip], w) > dist(h[pip], w) * 1.15) n++;
  });
  // baş barmaq: ucu kiçik barmağın dibindən IP oynağından uzaqdadırsa, açıqdır
  if (dist(h[4], h[17]) > dist(h[3], h[17]) * 1.1) n++;
  return n;
}

export async function openFingerCounter(onPick) {
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
  box.innerHTML = `<div style="background:#fff;border-radius:14px;padding:16px;max-width:520px;width:100%;text-align:center;font-family:sans-serif">
    <h3 style="margin:0 0 8px">🖐 Cavabı barmaqla göstər</h3>
    <video id="fv" autoplay playsinline muted style="width:100%;border-radius:10px;background:#000;transform:scaleX(-1)"></video>
    <div id="fs" style="font-size:22px;font-weight:700;margin:10px 0;min-height:32px">Kamera açılır...</div>
    <div id="fb" style="display:flex;gap:8px;justify-content:center"></div>
    <small style="color:#666;display:block;margin-top:10px">Köməkçi prototip. Təsdiqlənmiş işarə dili tərcüməsi deyil. Görüntü serverə göndərilmir.</small>
    <button id="fx" style="margin-top:10px">Bağla</button></div>`;
  document.body.append(box);
  const $ = s => box.querySelector(s);
  const video = $('#fv'), status = $('#fs'), btns = $('#fb');

  let stream, raf, closed = false, last = -1, streak = 0;
  const close = () => {
    closed = true; cancelAnimationFrame(raf);
    stream?.getTracks().forEach(t => t.stop());
    box.remove();
  };
  $('#fx').onclick = close;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
    video.srcObject = stream;
    status.textContent = 'Model yüklənir...';
    const lm = await getLandmarker();
    await video.play();

    const loop = () => {
      if (closed) return;
      const res = lm.detectForVideo(video, performance.now());
      if (!res.landmarks.length) {
        last = -1; streak = 0;
        status.textContent = 'Əlini kameraya aydın göstər';
      } else {
        const n = Math.min(10, res.landmarks.reduce((a, h) => a + countHand(h), 0));
        streak = n === last ? streak + 1 : 1;
        last = n;
        status.textContent = `Rəqəm: ${n}`;
        if (streak >= 20) { // təxminən 1 saniyə sabit qalıbsa, qəbul et
          showResult(n);
          return;
        }
      }
      raf = requestAnimationFrame(loop);
    };

    const showResult = n => {
      status.textContent = `Rəqəm: ${n}. Düzdürmü?`;
      btns.innerHTML = '';
      const ok = document.createElement('button');
      ok.textContent = '✔ Yaz'; ok.onclick = () => { onPick(n); close(); };
      const again = document.createElement('button');
      again.textContent = '↻ Təkrar'; again.onclick = () => { btns.innerHTML = ''; streak = 0; last = -1; loop(); };
      btns.append(ok, again);
    };
    loop();
  } catch (e) {
    status.textContent = 'Kamera və ya model açılmadı: ' + e.message;
  }
}