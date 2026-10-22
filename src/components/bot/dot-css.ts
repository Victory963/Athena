/** Inlined so the chat still paints when the Next dev CSS chunk 404s. */
export const DOT_CSS = `
html:has(.athena-frame),
body:has(.athena-frame) {
  margin: 0;
  height: 100%;
  background: #f3f2ef;
  color: #1c1b19;
}
.athena-frame {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px 1fr;
  background: #f3f2ef;
  color: #1c1b19;
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}
.athena-rail {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 12px;
  border-right: 1px solid #e6e4df;
  background: #f6f5f2;
}
.athena-side-tools { display: flex; gap: 8px; }
.athena-search, .athena-new {
  border: 0;
  border-radius: 10px;
  font: inherit;
  font-size: 13px;
}
.athena-search { flex: 1; min-width: 0; background: #fff; padding: 8px 10px; }
.athena-new {
  background: #1c1b19;
  color: #fff;
  padding: 8px 10px;
  cursor: pointer;
  white-space: nowrap;
}
.athena-bot-list { display: flex; flex-direction: column; gap: 4px; overflow: auto; }
.athena-bot {
  width: 100%;
  display: flex;
  gap: 4px;
  align-items: center;
  border-radius: 12px;
  padding: 4px;
}
.athena-bot.is-on { background: #eceae4; }
.athena-bot-open {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 8px;
  align-items: center;
  border: 0;
  background: transparent;
  color: inherit;
  border-radius: 10px;
  padding: 6px;
  cursor: pointer;
  text-align: left;
  font: inherit;
}
.athena-bot b { display: block; font-size: 14px; font-weight: 600; }
.athena-bot em {
  display: block;
  color: #8a8478;
  font-style: normal;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.athena-bot .x {
  border: 0;
  background: transparent;
  color: #a39e96;
  cursor: pointer;
  font-size: 14px;
}
.athena-title {
  border: 0;
  background: transparent;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  width: min(280px, 46vw);
  color: inherit;
}
.athena-choices {
  align-self: flex-start;
  width: min(460px, 92%);
  background: #fff;
  border: 1px solid #e7e4de;
  border-radius: 16px;
  padding: 8px;
  display: grid;
}
.athena-choices h2 { margin: 8px 10px 4px; font-size: 15px; font-weight: 600; }
.athena-choices button {
  display: flex;
  gap: 10px;
  align-items: center;
  border: 0;
  background: transparent;
  border-radius: 10px;
  padding: 10px;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  color: inherit;
}
.athena-choices button:hover { background: #f6f5f2; }
.athena-choices i {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid #e4e1da;
  display: grid;
  place-items: center;
  font-style: normal;
  font-size: 12px;
  color: #6f6a62;
}
.athena-chat {
  min-width: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f7f7f5;
}
.athena-bar {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  position: relative;
  -webkit-app-region: drag;
}
.athena-bar h1, .athena-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.athena-hide {
  position: absolute;
  right: 14px;
  top: 12px;
  border: 0;
  background: transparent;
  color: #6f6a62;
  font-size: 12px;
  cursor: pointer;
  -webkit-app-region: no-drag;
}
.athena-avatar {
  width: 28px;
  height: 28px;
  border: 0;
  padding: 0;
  border-radius: 50%;
  background: transparent;
  display: grid;
  place-items: center;
  cursor: pointer;
  -webkit-app-region: no-drag;
}
.athena-core {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: block;
  background: radial-gradient(circle at 38% 32%, #ffffff 0%, #e7e1d6 42%, #8d877c 100%);
}
.mood-watching .athena-core { background: radial-gradient(circle at 38% 32%, #f4fff4 0%, #8fb58c 55%, #2f4a36 100%); }
.mood-gated .athena-core { background: radial-gradient(circle at 38% 32%, #fff8e8 0%, #e0b15a 55%, #6a4a1e 100%); }
.mood-kill .athena-core { background: radial-gradient(circle at 38% 32%, #ffe8e4 0%, #d26a5c 55%, #6e2e28 100%); }
.mood-thinking .athena-core { animation: athena-pulse 1.4s ease-in-out infinite; }
@keyframes athena-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.86); }
}
.athena-thread {
  flex: 1;
  overflow: auto;
  padding: 12px 8vw 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.athena-bubble {
  max-width: min(560px, 86%);
  margin: 0;
  padding: 12px 14px;
  line-height: 1.5;
  font-size: 15px;
  white-space: pre-wrap;
}
.athena-bubble.me {
  align-self: flex-start;
  background: #fff;
  border: 1px solid #e7e4de;
  border-radius: 16px;
}
.athena-bubble.you {
  align-self: flex-end;
  background: #eceae4;
  border-radius: 16px;
}
.athena-bubble.pending { color: #8a8478; }
.athena-board {
  align-self: flex-start;
  width: min(520px, 100%);
  margin: 0;
  padding: 16px 18px 8px;
  background: #fff;
  border: 1px solid #e7e4de;
  border-radius: 16px;
}
.athena-board h2 {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}
.athena-board ol {
  list-style: none;
  margin: 0;
  padding: 0;
}
.athena-board li {
  display: grid;
  grid-template-columns: 148px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 10px 0;
  border-top: 1px solid #f0eee9;
  font-size: 14px;
  line-height: 1.45;
}
.athena-board b { font-weight: 600; }
.athena-board em {
  font-style: normal;
  color: #5f5a53;
  text-align: right;
  overflow-wrap: anywhere;
}
.athena-dock { position: relative; padding: 0 8vw 22px; }
.athena-live { display: flex; gap: 8px; margin: 0 0 8px; }
.athena-live figure { margin: 0; }
.athena-live video {
  width: 168px;
  height: 96px;
  object-fit: cover;
  border-radius: 12px;
  background: #1c1b19;
  display: block;
}
.athena-live figcaption {
  margin-top: 4px;
  font-size: 12px;
  color: #6f6a62;
}
.athena-live button {
  border: 0;
  background: transparent;
  color: #6f6a62;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}
.athena-pop {
  position: absolute;
  left: 0;
  bottom: calc(100% - 14px);
  z-index: 2;
  min-width: 232px;
  max-height: 280px;
  overflow: auto;
  background: #fff;
  border: 1px solid #eceae4;
  border-radius: 16px;
  box-shadow: 0 16px 40px rgba(28, 27, 25, 0.08);
  padding: 6px;
  display: grid;
}
.athena-pop button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: 0;
  background: transparent;
  color: #1c1b19;
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}
.athena-pop a {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: #6f6a62;
  font-size: 14px;
  text-decoration: none;
}
.athena-pop a:hover { background: #f6f5f2; }
.athena-pop button[aria-pressed="true"] { color: #9a3412; }
.athena-pop svg { flex: none; }
.athena-composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: #fff;
  border: 1px solid #e4e1da;
  border-radius: 22px;
  padding: 8px;
  box-shadow: 0 8px 28px rgba(28, 27, 25, 0.04);
}
.athena-composer input {
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  color: #1c1b19;
  font: inherit;
  font-size: 15px;
  padding: 8px 4px;
  min-width: 0;
}
.athena-plus, .athena-mic, .athena-send {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 0;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex: none;
}
.athena-plus, .athena-mic { background: transparent; color: #6f6a62; }
.athena-mic[aria-pressed="true"] { color: #9a3412; }
.athena-send { background: #e11d2e; color: #fff; }
.athena-send:disabled { opacity: 0.35; cursor: default; }
.athena-composer input:disabled { opacity: 0.45; }
@media (max-width: 800px) {
  .athena-frame { grid-template-columns: 1fr; }
  .athena-rail { min-height: 0; max-height: 220px; }
  .athena-thread, .athena-dock { padding-left: 16px; padding-right: 16px; }
}
`;
