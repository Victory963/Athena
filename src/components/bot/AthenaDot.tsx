"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DOT_CSS } from "./dot-css";
import { lookAt, lookLabel, type Look } from "./frame-look";

declare global {
  interface Window {
    athenaApp?: {
      close: () => void;
      listScreens?: () => Promise<{ id: string; name: string }[]>;
      chooseScreen?: (id: string) => Promise<boolean>;
    };
  }
}

type Mood = "idle" | "watching" | "thinking" | "gated" | "kill";
type Line = { id: number; from: "athena" | "you"; text: string };
type Bot = { id: string; name: string; lines: Line[]; choice: boolean };
type ScreenSource = { id: string; name: string };

const STORE = "athena-bots-v1";
const FRAME = { width: 96, height: 54 };
const CHOICES = [
  { key: "A", label: "查这台电脑", message: "查一下我的pc" },
  { key: "B", label: "共享画面", message: "__screen__" },
  { key: "C", label: "演化防守", message: "演化" },
  { key: "D", label: "先聊聊", message: "你好" },
];

function freshBot(name: string): Bot {
  return { id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`, name, lines: [], choice: true };
}

function readBots(): Bot[] | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE) || "") as Bot[];
    if (!Array.isArray(parsed) || !parsed.length) return null;
    return parsed.filter((bot) => bot && typeof bot.id === "string" && typeof bot.name === "string");
  } catch {
    return null;
  }
}

export function AthenaDot({ shell = false }: { shell?: boolean }) {
  const [bots, setBots] = useState<Bot[]>(() => [freshBot("Athena")]);
  const [activeId, setActiveId] = useState("");
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const [mood, setMood] = useState<Mood>("idle");
  const [consent, setConsent] = useState(false);
  const [menu, setMenu] = useState(false);
  const [sources, setSources] = useState<ScreenSource[] | null>(null);
  const [visible, setVisible] = useState(true);
  const [draft, setDraft] = useState("");
  const [placeholder, setPlaceholder] = useState("发消息");
  const [busy, setBusy] = useState(false);
  const [killSwitch, setKillSwitch] = useState(false);
  const [desktop, setDesktop] = useState(shell);
  const [screenOn, setScreenOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [screenNote, setScreenNote] = useState("正常");
  const [cameraNote, setCameraNote] = useState("正常");
  const bottom = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const screenVideo = useRef<HTMLVideoElement>(null);
  const cameraVideo = useRef<HTMLVideoElement>(null);
  const screenStream = useRef<MediaStream | null>(null);
  const cameraStream = useRef<MediaStream | null>(null);
  const micStream = useRef<MediaStream | null>(null);
  const micContext = useRef<AudioContext | null>(null);
  const timers = useRef<{ screen?: number; camera?: number; mic?: number }>({});
  const alerted = useRef<{ screen?: Look; camera?: Look }>({});
  const activeRef = useRef(activeId);
  activeRef.current = activeId;
  const bot = bots.find((item) => item.id === activeId) ?? bots[0];

  function say(text: string, botId = activeRef.current) {
    const line = { id: Date.now() + Math.floor(Math.random() * 1000), from: "athena" as const, text };
    setBots((current) =>
      current.map((item) => (item.id === botId ? { ...item, lines: [...item.lines, line].slice(-80), choice: false } : item)),
    );
  }

  useEffect(() => {
    const saved = readBots();
    if (saved) {
      setBots(saved);
      setActiveId(saved[0].id);
    } else {
      const starter = freshBot("Athena");
      setBots([starter]);
      setActiveId(starter.id);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORE, JSON.stringify(bots));
  }, [bots, ready]);

  useEffect(() => {
    setDesktop(shell || new URLSearchParams(window.location.search).get("shell") === "app");
  }, [shell]);

  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [bot?.lines, busy, bot?.choice]);

  useEffect(() => {
    if (!visible || killSwitch) return;
    let stop = false;
    const rank = async () => {
      const response = await fetch("/api/bot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "校准分类器", consent: false, quiet: true }),
      });
      if (!response.ok || stop) return;
    };
    const boot = window.setTimeout(() => void rank(), 800);
    const timer = window.setInterval(() => void rank(), 10 * 60 * 1000);
    return () => {
      stop = true;
      window.clearTimeout(boot);
      window.clearInterval(timer);
    };
  }, [visible, killSwitch]);

  useEffect(() => {
    return () => {
      window.clearInterval(timers.current.screen);
      window.clearInterval(timers.current.camera);
      window.clearInterval(timers.current.mic);
      screenStream.current?.getTracks().forEach((track) => track.stop());
      cameraStream.current?.getTracks().forEach((track) => track.stop());
      micStream.current?.getTracks().forEach((track) => track.stop());
      void micContext.current?.close();
    };
  }, []);

  function watch(kind: "screen" | "camera", video: HTMLVideoElement) {
    const canvas = document.createElement("canvas");
    canvas.width = FRAME.width;
    canvas.height = FRAME.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    let previous: Uint8ClampedArray | null = null;
    let last: Look | null = null;
    let streak = 0;
    const timer = window.setInterval(() => {
      if (video.readyState < 2) return;
      if (video.paused) void video.play().catch(() => undefined);
      context.drawImage(video, 0, 0, FRAME.width, FRAME.height);
      const frame = context.getImageData(0, 0, FRAME.width, FRAME.height);
      const looked = lookAt(frame.data, FRAME.width, FRAME.height, previous);
      previous = new Uint8ClampedArray(frame.data);
      if (looked.kind === last) streak += 1;
      else {
        last = looked.kind;
        streak = 1;
      }
      if (streak < 2) return;
      const label = lookLabel(looked.kind);
      if (kind === "screen") setScreenNote(label);
      else setCameraNote(label);
      const source = kind === "screen" ? "共享画面" : "摄像头";
      if ((looked.kind === "red" || looked.kind === "dark") && alerted.current[kind] !== looked.kind) {
        alerted.current[kind] = looked.kind;
        say(`${source}${label}。`);
      }
      if (looked.kind === "steady") alerted.current[kind] = undefined;
    }, 2500);
    if (kind === "screen") timers.current.screen = timer;
    else timers.current.camera = timer;
  }

  useEffect(() => {
    const video = screenVideo.current;
    const stream = screenStream.current;
    if (!screenOn || !video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
    watch("screen", video);
    return () => window.clearInterval(timers.current.screen);
  }, [screenOn]);

  useEffect(() => {
    const video = cameraVideo.current;
    const stream = cameraStream.current;
    if (!cameraOn || !video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
    watch("camera", video);
    return () => window.clearInterval(timers.current.camera);
  }, [cameraOn]);

  function stopScreen() {
    window.clearInterval(timers.current.screen);
    const tracks = screenStream.current?.getTracks() ?? [];
    for (const track of tracks) track.onended = null;
    tracks.forEach((track) => track.stop());
    screenStream.current = null;
    if (screenVideo.current) screenVideo.current.srcObject = null;
    setScreenOn(false);
    setSources(null);
    setScreenNote("正常");
  }

  function stopCamera() {
    window.clearInterval(timers.current.camera);
    const tracks = cameraStream.current?.getTracks() ?? [];
    for (const track of tracks) track.onended = null;
    tracks.forEach((track) => track.stop());
    cameraStream.current = null;
    if (cameraVideo.current) cameraVideo.current.srcObject = null;
    setCameraOn(false);
    setCameraNote("正常");
  }

  function stopMic() {
    window.clearInterval(timers.current.mic);
    micStream.current?.getTracks().forEach((track) => track.stop());
    micStream.current = null;
    void micContext.current?.close();
    micContext.current = null;
    setMicOn(false);
  }

  function arm(kind: "screen" | "camera", stream: MediaStream) {
    const opened = Date.now();
    const track = stream.getVideoTracks()[0];
    if (kind === "screen") {
      screenStream.current = stream;
      setScreenOn(true);
    } else {
      cameraStream.current = stream;
      setCameraOn(true);
    }
    if (!track) return;
    track.onended = () => {
      const fast = Date.now() - opened < 1500;
      if (kind === "screen") stopScreen();
      else stopCamera();
      const name = kind === "screen" ? "共享画面" : "摄像头";
      say(fast ? `${name}马上断了。请在系统隐私设置里允许这台应用使用它。` : `${name}已关。`);
    };
  }

  async function chooseAndShare(id?: string) {
    setMenu(false);
    setSources(null);
    try {
      const chosen = id && window.athenaApp?.chooseScreen ? window.athenaApp.chooseScreen(id) : Promise.resolve(true);
      const streamPromise = navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      await chosen;
      arm("screen", await streamPromise);
      say("共享画面已开。状态留在预览上，只有变暗或出现醒目红色才写进对话。");
    } catch {
      stopScreen();
      say("共享画面没有打开。");
    }
  }

  async function toggleScreen() {
    if (screenOn) {
      stopScreen();
      say("共享画面已关。");
      setMenu(false);
      return;
    }
    if (window.athenaApp?.listScreens) {
      try {
        setSources(await window.athenaApp.listScreens());
        setMenu(true);
        return;
      } catch {
        say("列不出可共享的画面。");
        return;
      }
    }
    await chooseAndShare();
  }

  async function toggleCamera() {
    setMenu(false);
    if (cameraOn) {
      stopCamera();
      say("摄像头已关。");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      arm("camera", stream);
      say("摄像头已开。这是这台电脑的镜头，关掉就停，画面不外传。");
    } catch {
      stopCamera();
      say("摄像头没有打开。");
    }
  }

  async function toggleMic() {
    setMenu(false);
    if (micOn) {
      stopMic();
      say("麦克风已关。");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStream.current = stream;
      const audio = new AudioContext();
      micContext.current = audio;
      const analyser = audio.createAnalyser();
      audio.createMediaStreamSource(stream).connect(analyser);
      const bins = new Uint8Array(analyser.fftSize);
      let heard = false;
      timers.current.mic = window.setInterval(() => {
        analyser.getByteTimeDomainData(bins);
        let energy = 0;
        for (const value of bins) energy += Math.abs(value - 128);
        if (!heard && energy / bins.length > 8) {
          heard = true;
          say("麦克风里有声音。声音不上传，也不转成文字。");
        }
      }, 800);
      setMicOn(true);
      say("麦克风已开。只判断有没有声音。");
    } catch {
      stopMic();
      say("麦克风没有打开。");
    }
  }

  async function onFile(file: File | undefined) {
    setMenu(false);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      say(`已收到附件 ${file.name}。文件留在原处，我不保存，也不外传。`);
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.src = url;
    try {
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = FRAME.width;
      canvas.height = FRAME.height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0, FRAME.width, FRAME.height);
      const frame = context.getImageData(0, 0, FRAME.width, FRAME.height);
      const looked = lookAt(frame.data, FRAME.width, FRAME.height, null);
      say(`看了你附上的图，看起来${lookLabel(looked.kind)}。不保存。`);
    } catch {
      say("这张图没有看成。");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function createBot() {
    const count = bots.filter((item) => item.name.startsWith("新 Bot")).length;
    const created = freshBot(count ? `新 Bot ${count + 1}` : "新 Bot");
    setBots((current) => [created, ...current]);
    setActiveId(created.id);
    setMenu(false);
    setDraft("");
    setPlaceholder("发消息");
  }

  function removeBot(id: string) {
    setBots((current) => {
      const next = current.filter((item) => item.id !== id);
      if (!next.length) {
        const starter = freshBot("Athena");
        setActiveId(starter.id);
        return [starter];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }

  function rename(name: string) {
    setBots((current) => current.map((item) => (item.id === bot?.id ? { ...item, name: name.slice(0, 24) } : item)));
  }

  async function send(text: string, quiet = false) {
    const trimmed = text.trim();
    if (!trimmed || busy || !bot) return;
    const checkup = /看这台|查一下|检查我|我的\s*pc|\bpc\b|这台电脑|我的电脑/i.test(trimmed);
    const nextConsent = consent || checkup;
    if (nextConsent && !consent) setConsent(true);
    setDraft("");
    setPlaceholder("发消息");
    setMenu(false);
    setBusy(true);
    setMood("thinking");
    const mine = { id: Date.now(), from: "you" as const, text: trimmed };
    const botId = bot.id;
    if (!quiet) {
      setBots((current) =>
        current.map((item) => (item.id === botId ? { ...item, choice: false, lines: [...item.lines, mine].slice(-80) } : item)),
      );
    } else {
      setBots((current) => current.map((item) => (item.id === botId ? { ...item, choice: false } : item)));
    }
    const response = await fetch("/api/bot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: trimmed, consent: nextConsent }),
    });
    const body = (await response.json()) as { text: string; mood: Mood; state?: { killSwitch?: boolean } };
    setMood(body.mood ?? "idle");
    if (body.state?.killSwitch != null) setKillSwitch(body.state.killSwitch);
    say(body.text, botId);
    if (checkup && screenOn && screenNote !== "正常") say(`共享画面${screenNote}。`, botId);
    if (checkup && cameraOn && cameraNote !== "正常") say(`摄像头${cameraNote}。`, botId);
    setBusy(false);
  }

  function pickChoice(message: string) {
    if (!bot) return;
    setBots((current) => current.map((item) => (item.id === bot.id ? { ...item, choice: false } : item)));
    if (message === "__screen__") {
      void toggleScreen();
      return;
    }
    void send(message);
  }

  const shown = bots.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className={`athena-frame mood-${mood}`}>
      <style dangerouslySetInnerHTML={{ __html: DOT_CSS }} />
      <aside className="athena-rail">
        <div className="athena-side-tools">
          <input className="athena-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索" />
          <button type="button" className="athena-new" onClick={createBot}>
            新建 Bot
          </button>
        </div>
        <div className="athena-bot-list">
          {shown.map((item) => (
            <div key={item.id} className={`athena-bot${item.id === bot?.id ? " is-on" : ""}`}>
              <button type="button" className="athena-bot-open" onClick={() => setActiveId(item.id)}>
                <span className="athena-avatar" aria-hidden="true">
                  <span className="athena-core" />
                </span>
                <span>
                  <b>{item.name}</b>
                  <em>{item.lines.at(-1)?.text || "你想先做哪一件？"}</em>
                </span>
              </button>
              <button type="button" className="x" aria-label={`删除 ${item.name}`} onClick={() => removeBot(item.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
      </aside>

      <section className="athena-chat">
        <header className="athena-bar">
          <span className="athena-avatar" aria-hidden="true">
            <span className="athena-core" />
          </span>
          <input className="athena-title" aria-label="Bot 名称" value={bot?.name ?? ""} onChange={(event) => rename(event.target.value)} />
        </header>

        <div className="athena-thread">
          {bot?.lines.map((line) => (
            <p key={line.id} className={`athena-bubble ${line.from === "you" ? "you" : "me"}`}>
              {line.text}
            </p>
          ))}
          {bot?.choice ? (
            <div className="athena-choices">
              <h2>你想先做哪一件？</h2>
              {CHOICES.map((choice) => (
                <button key={choice.key} type="button" onClick={() => pickChoice(choice.message)}>
                  <i>{choice.key}</i>
                  {choice.label}
                </button>
              ))}
            </div>
          ) : null}
          {busy ? <p className="athena-bubble me pending">…</p> : null}
          <div ref={bottom} />
        </div>

        <div className="athena-dock">
          <div className="athena-live" style={{ display: screenOn || cameraOn ? "flex" : "none" }}>
            <figure hidden={!screenOn}>
              <video ref={screenVideo} muted playsInline />
              <figcaption>
                <button type="button" onClick={() => void toggleScreen()}>
                  共享画面 · {screenNote} · 关闭
                </button>
              </figcaption>
            </figure>
            <figure hidden={!cameraOn}>
              <video ref={cameraVideo} muted playsInline />
              <figcaption>
                <button type="button" onClick={() => void toggleCamera()}>
                  摄像头 · {cameraNote} · 关闭
                </button>
              </figcaption>
            </figure>
          </div>

          {menu ? (
            <div className="athena-pop" role="menu">
              {sources ? (
                sources.map((source) => (
                  <button key={source.id} type="button" onClick={() => void chooseAndShare(source.id)}>
                    {source.name}
                  </button>
                ))
              ) : (
                <>
                  <button type="button" onClick={createBot}>
                    新建 Bot
                  </button>
                  <button type="button" onClick={() => fileRef.current?.click()}>
                    添加附件
                  </button>
                  <button type="button" onClick={() => { setMenu(false); setPlaceholder("描述一项防守任务"); }}>
                    教它做一项任务
                  </button>
                  <button type="button" aria-pressed={screenOn} onClick={() => void toggleScreen()}>
                    共享画面
                  </button>
                  <button type="button" aria-pressed={cameraOn} onClick={() => void toggleCamera()}>
                    摄像头
                  </button>
                  <button type="button" aria-pressed={consent} onClick={() => setConsent((value) => !value)}>
                    {consent ? "已允许看本机端口" : "允许看本机端口"}
                  </button>
                  {desktop ? null : <Link href="/os">控制面</Link>}
                </>
              )}
            </div>
          ) : null}

          <form
            className="athena-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
          >
            <button type="button" className="athena-plus" aria-label="更多" onClick={() => { setSources(null); setMenu((value) => !value); }}>
              +
            </button>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={placeholder} disabled={busy} />
            <button type="button" className="athena-mic" aria-label="麦克风" aria-pressed={micOn} onClick={() => void toggleMic()}>
              <Mic />
            </button>
            <button type="submit" className="athena-send" aria-label="发送" disabled={busy || !draft.trim()}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </form>
          <input
            ref={fileRef}
            type="file"
            hidden
            accept="image/*,.txt,.md,.log,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              void onFile(file);
            }}
          />
        </div>
      </section>
    </div>
  );
}

function Mic() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="6" y="2" width="4" height="7" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.5 8a3.5 3.5 0 0 0 7 0M8 11.5V14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
