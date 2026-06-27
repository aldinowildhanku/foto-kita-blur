"use client";

import { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import { AnimatePresence, motion } from "framer-motion";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

const YOUTUBE_ID = "ytMxh-_6EcI";

function isPeace(landmarks: Array<{ x: number; y: number; z: number }>) {
  if (!landmarks?.length) return false;
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const ringTip = landmarks[16];
  const ringPip = landmarks[14];
  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];

  const indexUp = indexTip.y < indexPip.y;
  const middleUp = middleTip.y < middlePip.y;
  const ringClosed = ringTip.y > ringPip.y;
  const pinkyClosed = pinkyTip.y > pinkyPip.y;

  return indexUp && middleUp && ringClosed && pinkyClosed;
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<"hero" | "camera">("hero");
  const [status, setStatus] = useState("Tap start untuk mengaktifkan kamera");
  const [peaceDetected, setPeaceDetected] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraActivated, setCameraActivated] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [donationVisible, setDonationVisible] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showAudioPopup, setShowAudioPopup] = useState(false);
  const [volume, setVolume] = useState(70);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (view === "camera") {
      setDonationVisible(true);
    } else {
      setDonationVisible(false);
    }
  }, [view]);

  const cleanupCamera = () => {
    setCameraActivated(false);
    setCameraReady(false);
    setPeaceDetected(false);
    if (animationRef.current) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (handLandmarkerRef.current) {
      handLandmarkerRef.current.close();
      handLandmarkerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const updateVolume = (nextVolume: number) => {
    const normalized = Math.max(0, Math.min(100, nextVolume));
    setVolume(normalized);
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(normalized);
    }
  };

  const playAudio = () => {
    if (!playerRef.current) return;
    playerRef.current.unMute();
    playerRef.current.setVolume(volume);
    playerRef.current.seekTo(44, true);
    playerRef.current.playVideo();
    setAudioPlaying(true);
  };

  const pauseAudio = () => {
    if (!playerRef.current) return;
    playerRef.current.pauseVideo();
    setAudioPlaying(false);
  };

  const stopAudio = () => {
    if (!playerRef.current) return;
    playerRef.current.pauseVideo();
    playerRef.current.seekTo(44, true);
    setAudioPlaying(false);
  };

  const startCamera = async () => {
    if (cameraActivated || !videoRef.current) return;
    setCameraError(null);
    setCameraActivated(true);
    setStatus("Meminta izin kamera...");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-tasks/hand_landmarker/hand_landmarker.task",
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      handLandmarkerRef.current = handLandmarker;
      setCameraReady(true);
      setStatus("Arahkan tangan peace ke kamera untuk blur estetik");

      const analyzeFrame = () => {
        if (!videoRef.current || !handLandmarkerRef.current) return;

        let result;
        try {
          result = handLandmarkerRef.current.detectForVideo(
            videoRef.current,
            performance.now()
          );
        } catch (error) {
          try {
            result = handLandmarkerRef.current.detect(videoRef.current);
          } catch (fallbackError) {
            setStatus("Deteksi kamera gagal, refresh halaman untuk mencoba lagi.");
            return;
          }
        }

        const hasPeace = (result?.landmarks ?? []).some((hand) => isPeace(hand));
        setPeaceDetected(hasPeace);
        setStatus(
          hasPeace
            ? "Peace terdeteksi! Background blur aktif"
            : "Tunjukkan gesture peace di depan kamera"
        );
        animationRef.current = window.requestAnimationFrame(analyzeFrame);
      };

      animationRef.current = window.requestAnimationFrame(analyzeFrame);
    } catch (_error) {
      setCameraError(
        "Gagal akses kamera. Pastikan kamu berada di HTTPS atau localhost, lalu izinkan kamera di browser."
      );
      setStatus("Klik tombol lagi untuk mencoba ulang.");
      setCameraActivated(false);
    }
  };

  useEffect(() => {
    if (view !== "camera") return;
    return () => cleanupCamera();
  }, [view]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050608] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-0 sm:opacity-100">
          <YouTube
            videoId={YOUTUBE_ID}
            opts={{
              playerVars: {
                autoplay: 1,
                mute: 1,
                start: 44,
                controls: 0,
                loop: 1,
                playlist: YOUTUBE_ID,
                modestbranding: 1,
                playsinline: 1,
                disablekb: 1,
              },
            }}
            onReady={(event: any) => {
              playerRef.current = event.target;
              if (event.target.setVolume) {
                event.target.setVolume(volume);
              }
              event.target.mute();
              event.target.seekTo(44, true);
              event.target.playVideo();
            }}
            className="absolute inset-0 h-full w-full"
            iframeClassName="absolute inset-0 h-full w-full"
          />
        </div>
        <div
          className={`absolute inset-0 transition-all duration-700 ${
            peaceDetected
              ? "bg-black/72 backdrop-blur-3xl"
              : "bg-black/60 backdrop-blur-sm"
          }`}
        />
      </div>

      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            key="splash"
            className="absolute inset-0 z-30 flex items-center justify-center bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex w-full max-w-lg flex-col items-center gap-5 rounded-[2rem] border border-white/10 bg-white/10 p-10 text-center shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-xl shadow-black/30">
                <img
                  src="https://cloud.sentrisit.web.id/apps/files_sharing/publicpreview/7XXEBwnLopykbbk?file=/&fileId=126&x=3360&y=2100&a=true&etag=3771faa22e8399ef621f12749dc6f043"
                  alt="Foto Kita Mulai Blur logo"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Foto Kita Mulai Blur</p>
              <h1 className="text-4xl font-semibold text-white sm:text-5xl">Seperti Hubungan Kita.. eh</h1>
              <p className="max-w-md text-sm leading-6 text-white/70">
                Website foto live dengan nuansa modern dan rasakan transisi blur saat gesture peace terbaca.
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-10">
        {donationVisible ? (
          <div className="fixed bottom-6 right-6 z-50 max-w-xs rounded-[2rem] border border-white/10 bg-black/90 p-4 shadow-2xl shadow-black/60 backdrop-blur-xl text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/50">Donasi Sukarela</p>
                <h3 className="mt-2 text-lg font-semibold">Dukung pengembangan website</h3>
              </div>
              <button
                onClick={() => setDonationVisible(false)}
                className="text-white/60 transition hover:text-white"
                aria-label="Tutup donasi"
              >
                ✕
              </button>
            </div>
            <p className="mt-4 text-sm text-white/70">
              Donasi sukarela membantu developer website ini tetap semangat T-T.
            </p>
            <a
              href="https://bagibagi.co/aldinowildhanku"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-cyan-500/15 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200 transition hover:bg-cyan-500/25"
            >
              Donasi ke sini
            </a>
          </div>
        ) : null}
        <AnimatePresence mode="wait">
          {view === "hero" ? (
            <motion.section
              key="hero"
              className="relative flex w-full max-w-4xl flex-col gap-10 rounded-[2rem] border border-white/10 bg-black/40 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -80, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="space-y-5 text-center">
                <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/70">
                  Foto Kita Mulai Blur
                </span>
                <h1 className="text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
                  Momen biasa jadi estetik ala Sal Priadi
                </h1>
                <p className="mx-auto max-w-2xl text-lg leading-8 text-white/70">
                  Website live camera menjadi blur saat gesture peace terdeteksi.
                </p>
              </div>

              <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
                <button
                  onClick={() => setView("camera")}
                  className="group relative inline-flex overflow-hidden rounded-full border border-white/20 bg-white/10 px-12 py-4 text-sm font-semibold uppercase tracking-[0.35em] text-white transition duration-300 hover:border-transparent hover:bg-white/20 hover:text-white"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-500 opacity-0 transition duration-500 group-hover:opacity-40" />
                  <span className="relative">START</span>
                </button>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 text-sm text-white/70 shadow-lg shadow-black/20">
                  <p className="uppercase tracking-[0.3em] text-white/50">Swipe up</p>
                  <p className="mt-3 text-base text-white/80">
                    Ketuk tombol START, aktifkan kamera, lalu angkat dua jari peace untuk membuat foto mulai blur otomatis.
                  </p>
                </div>
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="camera"
              className="relative flex w-full max-w-5xl flex-col gap-8 rounded-[2rem] border border-white/10 bg-black/40 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -80, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-white/50">Mode kamera</p>
                  <h2 className="mt-3 text-4xl font-semibold text-white">Aktifkan kamera untuk peace gesture</h2>
                </div>
                <button
                  onClick={() => setView("hero")}
                  className="rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm text-white transition hover:bg-white/15"
                >
                  Kembali
                </button>
              </div>

              {!cameraReady ? (
                <div className="flex justify-center">
                  <button
                    onClick={startCamera}
                    className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-8 py-4 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200 transition hover:border-cyan-300/70 hover:bg-cyan-500/20"
                  >
                    Aktifkan Kamera
                  </button>
                </div>
              ) : null}

              {cameraReady ? (
                <div className="relative flex flex-col items-center gap-4">
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={playAudio}
                      className="rounded-full border border-violet-400/40 bg-violet-500/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-violet-200 transition hover:border-violet-300/70 hover:bg-violet-500/20"
                    >
                      {audioPlaying ? "Resume Lagu" : "Play Lagu Sal Priadi"}
                    </button>
                    <button
                      onClick={() => setShowAudioPopup((prev) => !prev)}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-[0.35em] text-white/80 transition hover:border-white/20 hover:bg-white/10"
                      aria-expanded={showAudioPopup}
                    >
                      Music Control
                    </button>
                  </div>

                  {showAudioPopup ? (
                    <div className="absolute bottom-[-9.5rem] left-1/2 z-50 w-[18rem] -translate-x-1/2 rounded-[1.75rem] border border-white/10 bg-black/90 p-4 shadow-2xl shadow-black/60 backdrop-blur-xl">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-[0.35em] text-white/50">Audio Controls</span>
                        <button
                          onClick={() => setShowAudioPopup(false)}
                          className="text-white/60 transition hover:text-white"
                          aria-label="Tutup kontrol audio"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="mt-4 flex flex-col gap-3">
                        <button
                          onClick={pauseAudio}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:border-white/20 hover:bg-white/10"
                        >
                          Pause
                        </button>
                        <button
                          onClick={stopAudio}
                          className="rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-rose-200 transition hover:border-rose-300/70 hover:bg-rose-500/20"
                        >
                          Stop
                        </button>
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
                          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60">
                            <span>Volume</span>
                            <span>{volume}%</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={volume}
                            onChange={(event) => updateVolume(Number(event.target.value))}
                            className="mt-3 w-full accent-cyan-400"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111]/80 shadow-inner shadow-black/40">
                  <div className="relative h-[340px] w-full bg-[#111111]">
                    <video
                      ref={videoRef}
                      className="h-full w-full object-cover"
                      autoPlay
                      muted
                      playsInline
                    />
                    <div
                      className={`absolute inset-0 transition duration-700 ${
                        peaceDetected
                          ? "bg-white/15 backdrop-blur-3xl"
                          : "bg-transparent backdrop-blur-0"
                      }`}
                    />
                    <div className="absolute bottom-4 left-4 rounded-3xl bg-black/50 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80 backdrop-blur-md">
                      {cameraReady ? "Kamera aktif" : "Menunggu izin kamera..."}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/5 p-6 text-white/80 shadow-inner shadow-black/30">
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm uppercase tracking-[0.25em] text-white/50">Status deteksi</p>
                      <p className="mt-3 text-2xl font-semibold text-white">{status}</p>
                      {cameraError ? (
                        <p className="mt-3 rounded-3xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                          {cameraError}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-sm leading-7 text-white/70">
                      Gunakan website ini dengan langkah sederhana: START, aktifkan kamera, lalu tampilkan gesture peace sehingga foto menjadi blur otomatis.
                    </p>
                  </div>
                  <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-4 text-sm text-white/70">
                    <p className="font-semibold text-white">Tips gesture</p>
                    <ul className="mt-3 space-y-2 list-disc pl-5">
                      <li>Berikan izin kamera saat diminta.</li>
                      <li>Angkat dua jari (peace) di depan kamera.</li>
                      <li>Gunakan latar gelap atau sedikit kontras untuk hasil terbaik.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
