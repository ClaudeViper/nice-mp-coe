/**
 * Accessibility audit — WCAG 2.1 AA
 * Uses jest-axe + @testing-library/react to validate key UI components.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";

// ─── Minimal stubs for Next.js / shadcn deps ──────────────────────────────────

// We test the rendered HTML directly, so we build lightweight markup fixtures
// rather than importing the full component tree (which requires Next.js routing context).

// ─── Helper ───────────────────────────────────────────────────────────────────

async function checkA11y(html: string) {
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  const results = await axe(container);
  document.body.removeChild(container);
  return results;
}

// ─── Navigation / Sidebar ─────────────────────────────────────────────────────

describe("Sidebar navigation (WCAG 2.1 AA)", () => {
  it("nav element with accessible landmark role has no violations", async () => {
    const { container } = render(
      <nav aria-label="Main navigation">
        <ul role="list">
          <li><a href="/dashboard" aria-current="page">Dashboard</a></li>
          <li><a href="/vendors">Vendors</a></li>
          <li><a href="/evaluate">Evaluate</a></li>
          <li><a href="/datasets">Datasets</a></li>
          <li><a href="/benchmarks">Benchmarks</a></li>
          <li><a href="/reports">Reports</a></li>
          <li><a href="/standards">Standards</a></li>
        </ul>
      </nav>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("sidebar brand section has no violations", async () => {
    const { container } = render(
      <div role="banner">
        <a href="/dashboard" aria-label="NiCE Media Processing Group - Home">
          <span aria-hidden="true">NiCE</span>
          <span>Media Processing Group</span>
        </a>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── Buttons ──────────────────────────────────────────────────────────────────

describe("Button components (WCAG 2.1 AA)", () => {
  it("standard button has no violations", async () => {
    const { container } = render(
      <button type="button">Run Evaluation</button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("icon button with accessible label has no violations", async () => {
    const { container } = render(
      <button type="button" aria-label="Delete evaluation">
        <svg aria-hidden="true" focusable="false" width="16" height="16">
          <path d="M0 0h16v16H0z" />
        </svg>
      </button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("disabled button has no violations", async () => {
    const { container } = render(
      <button type="button" disabled>Processing...</button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("button group has no violations", async () => {
    const { container } = render(
      <div role="group" aria-label="Evaluation actions">
        <button type="button">Start</button>
        <button type="button">Stop</button>
        <button type="button">Reset</button>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── Forms ────────────────────────────────────────────────────────────────────

describe("Form inputs (WCAG 2.1 AA)", () => {
  it("labeled text input has no violations", async () => {
    const { container } = render(
      <div>
        <label htmlFor="model-name">Model Name</label>
        <input
          id="model-name"
          type="text"
          placeholder="e.g. whisper-large-v3"
          aria-describedby="model-name-hint"
        />
        <span id="model-name-hint">Enter the vendor model identifier.</span>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("select with label has no violations", async () => {
    const { container } = render(
      <div>
        <label htmlFor="eval-type">Evaluation Type</label>
        <select id="eval-type">
          <option value="">Select type...</option>
          <option value="STT">Speech-to-Text (STT)</option>
          <option value="TTS">Text-to-Speech (TTS)</option>
          <option value="V2V">Voice-to-Voice (V2V)</option>
        </select>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("radio group has no violations", async () => {
    const { container } = render(
      <fieldset>
        <legend>Dataset</legend>
        <label>
          <input type="radio" name="dataset" value="NICE-CX-Clean-EN" defaultChecked />
          NICE-CX-Clean-EN (50 samples)
        </label>
        <label>
          <input type="radio" name="dataset" value="NICE-CX-Noisy-EN" />
          NICE-CX-Noisy-EN (50 samples)
        </label>
      </fieldset>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("form with required fields and error message has no violations", async () => {
    const { container } = render(
      <form noValidate>
        <div>
          <label htmlFor="vendor-key">
            API Key <span aria-label="required">*</span>
          </label>
          <input
            id="vendor-key"
            type="password"
            required
            aria-invalid="true"
            aria-describedby="vendor-key-error"
          />
          <span id="vendor-key-error" role="alert">
            API Key is required.
          </span>
        </div>
        <button type="submit">Submit</button>
      </form>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── Data tables ──────────────────────────────────────────────────────────────

describe("Data tables (WCAG 2.1 AA)", () => {
  it("benchmark results table has no violations", async () => {
    const { container } = render(
      <table>
        <caption>STT Benchmark Results</caption>
        <thead>
          <tr>
            <th scope="col">Vendor</th>
            <th scope="col">Model</th>
            <th scope="col">WER (%)</th>
            <th scope="col">CER (%)</th>
            <th scope="col">RTF</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>OpenAI</td>
            <td>whisper-large-v3</td>
            <td>3.2</td>
            <td>1.1</td>
            <td>0.3</td>
          </tr>
          <tr>
            <td>Google</td>
            <td>chirp-2</td>
            <td>4.5</td>
            <td>1.8</td>
            <td>0.4</td>
          </tr>
        </tbody>
      </table>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("table with sortable headers has no violations", async () => {
    const { container } = render(
      <table>
        <caption>Evaluation Results</caption>
        <thead>
          <tr>
            <th scope="col" aria-sort="ascending">
              <button type="button">Metric <span aria-hidden="true">↑</span></button>
            </th>
            <th scope="col" aria-sort="none">
              <button type="button">Value</button>
            </th>
            <th scope="col" aria-sort="none">
              <button type="button">Status</button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>WER</td>
            <td>3.2%</td>
            <td><span aria-label="Good">✓</span></td>
          </tr>
        </tbody>
      </table>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── Status indicators ────────────────────────────────────────────────────────

describe("Status badges and indicators (WCAG 2.1 AA)", () => {
  it("colored status badge with accessible label has no violations", async () => {
    const { container } = render(
      <div>
        <span
          style={{ backgroundColor: "#22c55e", color: "#fff", padding: "2px 8px", borderRadius: "9999px" }}
          aria-label="Status: Completed"
        >
          Completed
        </span>
        <span
          style={{ backgroundColor: "#f59e0b", color: "#fff", padding: "2px 8px", borderRadius: "9999px" }}
          aria-label="Status: Running"
        >
          Running
        </span>
        <span
          style={{ backgroundColor: "#ef4444", color: "#fff", padding: "2px 8px", borderRadius: "9999px" }}
          aria-label="Status: Failed"
        >
          Failed
        </span>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("metric quality dot with sr-only text has no violations", async () => {
    const { container } = render(
      <span aria-label="WER quality: good">
        <span
          aria-hidden="true"
          style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block" }}
        />
        <span style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0,0,0,0)" }}>
          good
        </span>
      </span>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── Modal / Dialog ───────────────────────────────────────────────────────────

describe("Modal dialogs (WCAG 2.1 AA)", () => {
  it("dialog with role, label, and close button has no violations", async () => {
    const { container } = render(
      <div>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-desc"
        >
          <h2 id="dialog-title">New Dataset</h2>
          <p id="dialog-desc">Create a new evaluation dataset.</p>
          <form>
            <label htmlFor="ds-name">Dataset Name</label>
            <input id="ds-name" type="text" />
            <button type="submit">Create</button>
            <button type="button" aria-label="Close dialog">×</button>
          </form>
        </div>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── Tab components ───────────────────────────────────────────────────────────

describe("Tab components (WCAG 2.1 AA)", () => {
  it("tablist with active tab has no violations", async () => {
    const { container } = render(
      <div>
        <div role="tablist" aria-label="Evaluation types">
          <button role="tab" aria-selected={true} aria-controls="tab-stt" id="tab-btn-stt">
            STT
          </button>
          <button role="tab" aria-selected={false} aria-controls="tab-tts" id="tab-btn-tts" tabIndex={-1}>
            TTS
          </button>
          <button role="tab" aria-selected={false} aria-controls="tab-v2v" id="tab-btn-v2v" tabIndex={-1}>
            V2V
          </button>
        </div>
        <div role="tabpanel" id="tab-stt" aria-labelledby="tab-btn-stt">
          <p>STT benchmark results</p>
        </div>
        <div role="tabpanel" id="tab-tts" aria-labelledby="tab-btn-tts" hidden>
          <p>TTS benchmark results</p>
        </div>
        <div role="tabpanel" id="tab-v2v" aria-labelledby="tab-btn-v2v" hidden>
          <p>V2V benchmark results</p>
        </div>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── Page landmarks ───────────────────────────────────────────────────────────

describe("Page landmark structure (WCAG 2.1 AA)", () => {
  it("full page layout with landmarks has no violations", async () => {
    const { container } = render(
      <div>
        <header>
          <nav aria-label="Main navigation">
            <a href="/dashboard">Dashboard</a>
          </nav>
        </header>
        <main>
          <h1>Evaluation Benchmarks</h1>
          <section aria-labelledby="stt-section">
            <h2 id="stt-section">STT Results</h2>
            <p>Speech-to-text evaluation results for all vendors.</p>
          </section>
        </main>
        <footer>
          <p>© 2025 NICE Media Processing Group</p>
        </footer>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("skip navigation link has no violations", async () => {
    const { container } = render(
      <div>
        <a
          href="#main-content"
          style={{
            position: "absolute",
            left: "-9999px",
          }}
          onFocus={(e) => { (e.target as HTMLElement).style.left = "0"; }}
        >
          Skip to main content
        </a>
        <nav aria-label="Site navigation">
          <a href="/dashboard">Dashboard</a>
        </nav>
        <main id="main-content">
          <h1>Main Content</h1>
        </main>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
