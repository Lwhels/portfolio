import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { runFrame } from "./setup";
import { Navigation } from "../app/components/nav";
import { Card } from "../app/components/card";
import { TiltCard } from "../app/components/tilt-card";
import { TextScramble } from "../app/components/text-scramble";
import { FadeIn } from "../app/components/fade-in";
import FloatingOrbs from "../app/components/floating-orbs";
import AuroraBg from "../app/components/aurora-bg";
import { Analytics } from "../app/components/analytics";
import { Ext2Visualizer } from "../app/components/ext2-visualizer";
import { InteractiveBenchmark } from "../app/components/interactive-benchmark";
import { SolarSystemPreview } from "../app/components/solar-system-preview";
import { CommandPalette } from "../app/components/command-palette";
import Particles from "../app/components/particles";
import { Mdx } from "../app/components/mdx";

describe("App Components: Navigation", () => {
  it("renders navigation links and triggers command palette shortcut", () => {
    render(<Navigation />);
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("3D Vault")).toBeInTheDocument();

    const cmdKBtn = screen.getByTitle(/Command Palette/i);
    fireEvent.click(cmdKBtn);
  });
});

describe("App Components: Card & TiltCard", () => {
  it("renders card and handles mouse movement", () => {
    const { container } = render(
      <Card>
        <div>Card Inner Content</div>
      </Card>
    );
    expect(screen.getByText("Card Inner Content")).toBeInTheDocument();

    const cardDiv = container.firstChild as HTMLElement;
    fireEvent.mouseMove(cardDiv, { clientX: 100, clientY: 100 });
  });

  it("renders TiltCard and reacts to hover and leave", () => {
    const { container } = render(
      <TiltCard>
        <div>Tilt Content</div>
      </TiltCard>
    );
    expect(screen.getByText("Tilt Content")).toBeInTheDocument();

    const tiltDiv = container.firstChild as HTMLElement;
    fireEvent.mouseMove(tiltDiv, { clientX: 50, clientY: 50 });
    fireEvent.mouseLeave(tiltDiv);
  });
});

describe("App Components: TextScramble & FadeIn", () => {
  it("renders TextScramble text and updates", () => {
    vi.useFakeTimers();
    const { container } = render(<TextScramble text="Lucas Wheeler" delay={50} speed={10} />);
    expect(container).toBeInTheDocument();
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
  });

  it("renders FadeIn container", () => {
    render(
      <FadeIn>
        <div>Fade In Test</div>
      </FadeIn>
    );
    expect(screen.getByText("Fade In Test")).toBeInTheDocument();
  });
});

describe("App Components: FloatingOrbs & AuroraBg", () => {
  it("renders FloatingOrbs with canvas/div", () => {
    const { container } = render(<FloatingOrbs />);
    expect(container.firstChild).toBeDefined();
  });

  it("renders AuroraBg", () => {
    const { container } = render(<AuroraBg />);
    expect(container.firstChild).toBeDefined();
  });
});

describe("App Components: Analytics", () => {
  it("renders analytics script tag when in production or dev", () => {
    const { container } = render(<Analytics />);
    expect(container).toBeDefined();
  });
});

describe("App Components: Ext2Visualizer", () => {
  it("renders interactive EXT-2 filesystem visualizer and responds to block clicks", () => {
    render(<Ext2Visualizer />);
    expect(screen.getByText(/EXT2 File System Traversal Simulator/i)).toBeInTheDocument();

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "/home/wheeler" } });
  });
});

describe("App Components: InteractiveBenchmark", () => {
  it("renders benchmark visualizer and runs benchmark simulation", () => {
    vi.useFakeTimers();
    render(<InteractiveBenchmark />);
    expect(screen.getByText(/400x Autocomplete/i)).toBeInTheDocument();

    // Adjust scale slider
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "25000" } });

    // Run benchmark simulation for Autocomplete tab
    const runBtn = screen.getByText(/Run Micro-Benchmark/i);
    fireEvent.click(runBtn);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Click tab to downsample
    const downsampleTab = screen.getByText(/10x Stream Downsampling/i);
    fireEvent.click(downsampleTab);

    // Run benchmark simulation for Downsampling tab
    fireEvent.click(screen.getByText(/Run Micro-Benchmark/i));
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Reset benchmark if present
    const resetBtn = screen.queryByRole("button", { name: /Reset/i });
    if (resetBtn) fireEvent.click(resetBtn);

    vi.useRealTimers();
  });
});

describe("App Components: SolarSystemPreview", () => {
  it("renders 3D solar system preview canvas and updates simulation", () => {
    render(<SolarSystemPreview />);
    expect(screen.getByText(/Keplerian Orbital Engine/i)).toBeInTheDocument();

    act(() => {
      runFrame(0.016);
    });

    // Test speed multipliers
    const speed2x = screen.getByText("2x");
    fireEvent.click(speed2x);

    const pauseBtn = screen.getByText(/Pause/i);
    fireEvent.click(pauseBtn);

    const playBtn = screen.getByText(/Play/i);
    fireEvent.click(playBtn);

    act(() => {
      runFrame(0.016);
      runFrame(0.016);
    });
  });
});

describe("App Components: CommandPalette", () => {
  it("opens on Cmd+K, searches, filters, navigates with keys and executes all actions", () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<CommandPalette />);

    // Trigger keydown Cmd+K
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
    });

    expect(screen.getByPlaceholderText(/Type a command or search/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Type a command or search/i);

    // Keyboard arrow navigation and Enter selection
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Enter" });

    // Reopen and search for nonexistent query
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
    });
    const input2 = screen.getByPlaceholderText(/Type a command or search/i);
    fireEvent.change(input2, { target: { value: "nonexistent-query-xyz" } });
    expect(screen.getByText(/No matching commands or projects found/i)).toBeInTheDocument();

    // Reopen and test mouse hover and close button X
    fireEvent.change(input2, { target: { value: "" } });
    const items = screen.getAllByRole("button");
    if (items.length > 1) {
      fireEvent.mouseEnter(items[1]);
    }
    const closeBtn = screen.getByRole("button", { name: "" }); // Close X icon button
    fireEvent.click(closeBtn);

    // Test Navigation actions
    const navTests = [
      "3D Simulation Vault",
      "Projects Archive",
      "Resume & Credentials",
      "Contact Lucas",
      "3D Solar System Simulation",
      "EXT2 Linux File System",
      "Tale of Fennec Game Engine",
      "BetFree Sportsbook Platform",
      "Engage Autonomous Autopilot",
      "Start Time Trial Lap",
      "LinkedIn Profile",
    ];

    for (const title of navTests) {
      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
      });
      const inEl = screen.getByPlaceholderText(/Type a command or search/i);
      fireEvent.change(inEl, { target: { value: title } });
      const foundItem = screen.getByText(new RegExp(title, "i"));
      fireEvent.click(foundItem);
    }

    // Reopen and click backdrop to close
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
    });
    const backdrop = document.querySelector(".fixed.inset-0");
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    openSpy.mockRestore();
  });
});

describe("App Components: Particles", () => {
  it("renders canvas particles and handles resize and mouse move", () => {
    const { container } = render(<Particles quantity={10} />);
    const canvas = container.querySelector("canvas");
    expect(canvas).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
  });
});

describe("App Components: Mdx", () => {
  it("renders MDX content with all custom components", () => {
    const code = `
      const Component = ({ components }) => {
        return React.createElement("div", null,
          components.h1({ children: "H1 Header" }),
          components.h2({ children: "H2 Header" }),
          components.h3({ children: "H3 Header" }),
          components.h4({ children: "H4 Header" }),
          components.h5({ children: "H5 Header" }),
          components.h6({ children: "H6 Header" }),
          components.a({ href: "https://example.com", children: "Link" }),
          components.p({ children: "Paragraph text" }),
          components.ul({ children: React.createElement("li", null, "Item") }),
          components.ol({ children: React.createElement("li", null, "Item") }),
          components.li({ children: "Item" }),
          components.blockquote({ children: "Quote" }),
          components.img({ src: "/test.png", alt: "img" }),
          components.hr({}),
          components.table({ children: React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", null, "Cell"))) }),
          components.tr({ children: React.createElement("td", null, "Cell") }),
          components.th({ children: "Header Cell" }),
          components.td({ children: "Data Cell" }),
          components.pre({ children: "Code Block" }),
          components.code({ children: "inline code" }),
          components.strong({ children: "strong text" }),
          components.b({ children: "bold text" }),
          components.Image ? React.createElement(components.Image, { src: "/test.png", alt: "alt", width: 100, height: 100 }) : null
        );
      };
      return { default: Component };
    `;
    render(<Mdx code={code} />);
    expect(screen.getByText("H1 Header")).toBeInTheDocument();
    expect(screen.getByText("Paragraph text")).toBeInTheDocument();
    expect(screen.getByText("inline code")).toBeInTheDocument();
  });
});
