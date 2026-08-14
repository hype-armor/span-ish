import React from "../react.js";
import { Pages } from "../components/Pages.jsx";
import { Diagnostics } from "../components/Diagnostics.jsx";
import { ProgressPanel } from "../components/ProgressPanel.jsx";

/* The honest numbers, and the switches.
 *
 * Everything else in the app is dressed up. This is not, and that is on
 * purpose: a game layer needs somewhere its own scoring cannot reach, where
 * the schedule reports how it is actually doing and the whole history can be
 * carried off the device. */
export function LabScreen({ progress, persist, theme, onTheme, settings, onSettings }) {
  const toggle = (key) => onSettings({ [key]: !settings[key] });

  return (
    <div className="screen lab-screen">
      <header className="screen-top">
        <div className="screen-title wide">
          <span className="screen-eyebrow">El Laboratorio</span>
          <h2>The numbers behind it</h2>
        </div>
      </header>

      <div className="screen-body">
        <Pages label="the lab" grow>
          <Diagnostics progress={progress} />

          <div className="panel" data-break="">
            <div className="card-k">How it feels</div>
            <div className="card-v">
              Motion, sound and haptics are the parts that are decoration. None of them changes what
              is asked of you or how anything is scheduled, so turning all three off costs nothing
              but the fireworks.
            </div>
            <div className="switches">
              <button className="switch" data-on={settings.motion === "full"}
                onClick={() => onSettings({ motion: settings.motion === "full" ? "reduced" : "full" })}>
                <span>Motion</span><i />
              </button>
              <button className="switch" data-on={settings.sound} onClick={() => toggle("sound")}>
                <span>Sound</span><i />
              </button>
              <button className="switch" data-on={settings.haptics} onClick={() => toggle("haptics")}>
                <span>Haptics</span><i />
              </button>
              <button className="switch" data-on={theme === "dark"} onClick={onTheme}>
                <span>Dark</span><i />
              </button>
            </div>
          </div>

          <ProgressPanel progress={progress} persist={persist} />

          <p className="foot" data-break="">
            Progress is stored in this browser on this device — export it before you switch devices.
            Typed answers forgive accents (nacion counts for nación), but dictation requires the ñ,
            since spelling is the whole point there. Audio asks your browser for a Mexican voice first.
          </p>
        </Pages>
      </div>
    </div>
  );
}
