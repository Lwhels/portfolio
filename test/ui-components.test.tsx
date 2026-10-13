import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TelemetryDrawer } from "../app/components/ui/TelemetryDrawer";
import { MinimapRadar } from "../app/components/ui/MinimapRadar";
import { ProjectModal } from "../app/components/ui/ProjectModal";
import { QuickMenuView } from "../app/components/ui/QuickMenuView";
import { ControlsOverlay } from "../app/components/ui/ControlsOverlay";
import { world } from "../app/components/3d/worldStore";
import { soundFx } from "../app/components/3d/SoundController";

describe("UI Components: TelemetryDrawer", () => {
  beforeEach(() => {
    world.telemetryOpen = true;
  });

  it("renders when telemetry is open and displays telemetry metrics", () => {
    render(<TelemetryDrawer />);
    expect(screen.getByText(/Waymo Telemetry Hub/i)).toBeInTheDocument();
    expect(screen.getByText(/VELOCITY/i)).toBeInTheDocument();
    expect(screen.getByText(/G-G FRICTION CIRCLE/i)).toBeInTheDocument();
  });

  it("exercises interval update loop and canvas sparkline rendering", () => {
    vi.useFakeTimers();
    render(<TelemetryDrawer />);

    act(() => {
      world.car.speed = 18;
      world.input.left = true;
      vi.advanceTimersByTime(120);
      world.car.speed = 8;
      world.input.left = false;
      world.input.right = true;
      vi.advanceTimersByTime(120);
    });

    vi.useRealTimers();
  });

  it("closes when close button is clicked", () => {
    render(<TelemetryDrawer />);
    const closeBtn = screen.getAllByRole("button")[0];
    fireEvent.click(closeBtn);
    expect(world.telemetryOpen).toBe(false);
  });
});

describe("UI Components: MinimapRadar", () => {
  it("renders minimap radar with zoom, legend controls and zone clicks", () => {
    vi.useFakeTimers();
    const { container } = render(<MinimapRadar />);
    expect(screen.getByText(/RADAR/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Toggle zoom
    const zoomBtn = screen.getByTitle(/Expand Radar/i);
    fireEvent.click(zoomBtn);
    expect(screen.getByTitle(/Minimize Radar/i)).toBeInTheDocument();
    fireEvent.click(screen.getByTitle(/Minimize Radar/i));

    // Click zone blip for autopilot routing
    const zoneBlips = container.querySelectorAll("g.cursor-pointer");
    if (zoneBlips.length > 0) {
      fireEvent.click(zoneBlips[0]);
    }

    vi.useRealTimers();
  });
});

describe("UI Components: ProjectModal", () => {
  const mockProject = {
    id: "Waymo",
    slug: "Waymo",
    title: "Waymo Data Visualizer",
    category: "Systems & Telemetry",
    description: "High-performance telemetry tool",
    tech: ["C++", "Three.js", "D3.js"],
    repository: "lwhels/waymo",
    url: "https://waymo.com",
    color: "#06b6d4",
  };

  it("renders project details when project is selected and handles interactions", () => {
    const handleClose = vi.fn();
    const { container } = render(<ProjectModal project={mockProject} onClose={handleClose} />);
    expect(screen.getByText("Waymo Data Visualizer")).toBeInTheDocument();
    expect(screen.getByText("Systems & Telemetry")).toBeInTheDocument();
    expect(screen.getByText("C++")).toBeInTheDocument();

    // Trigger image error
    const img = screen.getByRole("img");
    fireEvent.error(img);

    // Click case study page link
    const caseStudyLink = screen.getByText(/Read Full Case Study Page/i);
    fireEvent.click(caseStudyLink);

    // Click repo and live site links
    const gitLink = screen.getByTitle(/GitHub Repository/i);
    fireEvent.click(gitLink);
    const liveLink = screen.getByTitle(/Live Website/i);
    fireEvent.click(liveLink);

    // Stop propagation on modal body
    const modalBody = container.querySelector(".bg-gray-950\\/95");
    if (modalBody) fireEvent.click(modalBody);

    // Close button
    const closeBtn = screen.getByLabelText(/Close dialog/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();

    // Backdrop click
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it("handles keydown Escape to close", () => {
    const handleClose = vi.fn();
    render(<ProjectModal project={mockProject} onClose={handleClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalled();
  });

  it("returns null when project is null", () => {
    const { container } = render(<ProjectModal project={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("UI Components: QuickMenuView", () => {
  it("renders tabs and allows switching sections", () => {
    const setCamera = vi.fn();
    const setTheme = vi.fn();
    const setSkin = vi.fn();
    const onClose = vi.fn();

    render(
      <QuickMenuView
        isOpen={true}
        onClose={onClose}
        cameraPreset="vehicle"
        setCameraPreset={setCamera}
        themeId="cyber"
        setThemeId={setTheme}
        skin="sports"
        setSkin={setSkin}
      />
    );

    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("About & Math")).toBeInTheDocument();

    // Switch to About & Math tab
    const aboutTab = screen.getByText("About & Math");
    fireEvent.click(aboutTab);

    // Switch to Contact tab
    const contactTab = screen.getByText("Contact");
    fireEvent.click(contactTab);

    // Click back to 3D World
    const backBtn = screen.getByText(/Back to 3D World/i);
    fireEvent.click(backBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("selects a project and toggles archive in QuickMenuView", () => {
    const onSelect = vi.fn();
    const { container } = render(
      <QuickMenuView
        isOpen={true}
        onClose={vi.fn()}
        onSelectProject={onSelect}
      />
    );

    expect(screen.getByText("Waymo Data Visualizer")).toBeInTheDocument();

    // Click project
    const waymoCard = screen.getByText("Waymo Data Visualizer");
    fireEvent.click(waymoCard);
    expect(onSelect).toHaveBeenCalled();

    // Toggle more projects
    const toggleArchiveBtn = screen.getByRole("button", { name: /More Projects Archive/i });
    fireEvent.click(toggleArchiveBtn);

    // Click extra project in archive
    const extraCard = screen.getByText(/LA Hacks Project/i);
    fireEvent.click(extraCard);
    expect(onSelect).toHaveBeenCalledTimes(2);

    // Click case study icon inside archive card
    const caseLinks = screen.getAllByTitle(/Read Case Study Page/i);
    if (caseLinks[0]) {
      fireEvent.click(caseLinks[0]);
    }

    // Trigger image error on archive image
    const imgs = container.querySelectorAll("img");
    if (imgs.length > 0) {
      fireEvent.error(imgs[0]);
    }
  });
});

describe("UI Components: ControlsOverlay", () => {
  it("renders the complete HUD overlay with action buttons", () => {
    const setCamera = vi.fn();
    const setTheme = vi.fn();
    const setSkin = vi.fn();
    const toggleMenu = vi.fn();
    const setJoy = vi.fn();

    render(
      <ControlsOverlay
        cameraPreset="vehicle"
        setCameraPreset={setCamera}
        themeId="cyber"
        setThemeId={setTheme}
        skin="sports"
        setSkin={setSkin}
        onToggleQuickMenu={toggleMenu}
        isQuickMenuOpen={false}
        setJoystickVector={setJoy}
      />
    );

    expect(screen.getByText(/HERO HUB/i)).toBeInTheDocument();

    // Trigger EMP blast
    const empBtn = screen.getByTitle(/Deploy EMP Shockwave Blast/i);
    fireEvent.click(empBtn);

    // Toggle LiDAR
    const lidarBtn = screen.getByTitle(/Toggle 360° LiDAR/i);
    fireEvent.click(lidarBtn);

    // Toggle Telemetry
    const telemetryBtn = screen.getByTitle(/Toggle Waymo Telemetry Hub/i);
    fireEvent.click(telemetryBtn);

    // Shoot blaster
    const shootBtn = screen.getByTitle(/Shoot Data Sphere/i);
    fireEvent.click(shootBtn);

    // Honk horn
    const honkBtn = screen.getByTitle(/Honk Horn/i);
    fireEvent.click(honkBtn);

    // Toggle Headlights
    const lightBtn = screen.getByTitle(/Toggle Headlights/i);
    fireEvent.click(lightBtn);

    // Rebuild title
    const rebuildBtn = screen.getByTitle(/Rebuild Title/i);
    fireEvent.click(rebuildBtn);

    // Cycle skin
    const skinBtn = screen.getByTitle(/Change Vehicle Skin/i);
    fireEvent.click(skinBtn);
    expect(setSkin).toHaveBeenCalled();

    // Toggle autopilot
    const botBtn = screen.getByTitle(/Toggle Autonomous Waypoint Autopilot/i);
    fireEvent.click(botBtn);

    // Switch theme
    const themeBtn = screen.getByTitle(/Switch Visual Theme/i);
    fireEvent.click(themeBtn);

    // BGM Ambient Radio toggle
    const radioBtn = screen.getByTitle(/Toggle Procedural Synth BGM/i);
    fireEvent.click(radioBtn);

    // Tour button
    const tourBtn = screen.getByTitle(/Start Guided Autopilot Tour/i);
    fireEvent.click(tourBtn);

    // Math Theory Drawer Toggle
    const mathBtn = screen.getByTitle(/Math Surface Lab Sliders/i);
    fireEvent.click(mathBtn);

    // Verify and adjust math sliders
    const rangeSliders = screen.getAllByRole("slider");
    expect(rangeSliders.length).toBe(3);
    fireEvent.change(rangeSliders[0], { target: { value: "1.5" } });
    fireEvent.change(rangeSliders[1], { target: { value: "1.2" } });
    fireEvent.change(rangeSliders[2], { target: { value: "0.8" } });

    // Performance Panel Toggle
    const perfBtn = screen.getByTitle(/Toggle WebGL Telemetry Stats/i);
    fireEvent.click(perfBtn);

    // Snapshot Photo mode
    const snapBtn = screen.getByTitle(/Capture High-Res Snapshot/i);
    fireEvent.click(snapBtn);

    // Click all camera preset buttons
    const cameraNames = ["Rover", "Cockpit FPV", "Title", "Waymo", "Projects", "Data Viz", "Arcade", "Contact"];
    cameraNames.forEach((label) => {
      const btn = screen.getByRole("button", { name: new RegExp(`^${label}$`, "i") });
      fireEvent.click(btn);
    });
    expect(setCamera).toHaveBeenCalled();
  });

  it("handles active tour navigation controls", () => {
    render(
      <ControlsOverlay
        cameraPreset="vehicle"
        setCameraPreset={vi.fn()}
        themeId="cyber"
        setThemeId={vi.fn()}
        skin="sports"
        setSkin={vi.fn()}
        onToggleQuickMenu={vi.fn()}
        isQuickMenuOpen={false}
        setJoystickVector={vi.fn()}
      />
    );

    act(() => {
      world.startTour();
    });

    const prevBtn = screen.getByRole("button", { name: /Prev/i });
    const nextBtn = screen.getByRole("button", { name: /Next/i });
    const stopBtn = screen.getByRole("button", { name: /Take the Wheel/i });

    fireEvent.click(nextBtn);
    fireEvent.click(prevBtn);
    fireEvent.click(stopBtn);
  });

  it("renders time trial race HUD and updates checkpoints", () => {
    localStorage.setItem("rover_best_lap", "24.50");
    render(
      <ControlsOverlay
        cameraPreset="vehicle"
        setCameraPreset={vi.fn()}
        themeId="cyber"
        setThemeId={vi.fn()}
        skin="sports"
        setSkin={vi.fn()}
        onToggleQuickMenu={vi.fn()}
        isQuickMenuOpen={false}
        setJoystickVector={vi.fn()}
      />
    );

    act(() => {
      world.startRace();
    });

    expect(screen.getByText(/TIME TRIAL LAP/i)).toBeInTheDocument();
    expect(screen.getByText(/Personal Best: 24.50s/i)).toBeInTheDocument();

    act(() => {
      world.passCheckpoint(1);
    });

    act(() => {
      world.raceActive = false;
      world.emit("race", { active: false, checkpoint: 0 });
    });
  });

  it("handles mobile touch joystick input events", () => {
    const origOntouchstart = (window as any).ontouchstart;
    (window as any).ontouchstart = () => {};

    const setJoy = vi.fn();
    const { container } = render(
      <ControlsOverlay
        cameraPreset="vehicle"
        setCameraPreset={vi.fn()}
        themeId="cyber"
        setThemeId={vi.fn()}
        skin="sports"
        setSkin={vi.fn()}
        onToggleQuickMenu={vi.fn()}
        isQuickMenuOpen={false}
        setJoystickVector={setJoy}
      />
    );

    const joystick = container.querySelector(".w-28.h-28");
    expect(joystick).toBeInTheDocument();

    if (joystick) {
      fireEvent.touchStart(joystick, {
        touches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchMove(joystick, {
        touches: [{ clientX: 120, clientY: 130 }],
      });
      expect(setJoy).toHaveBeenCalled();

      fireEvent.touchEnd(joystick);
      expect(setJoy).toHaveBeenLastCalledWith({ x: 0, y: 0 });
    }

    if (origOntouchstart === undefined) {
      delete (window as any).ontouchstart;
    } else {
      (window as any).ontouchstart = origOntouchstart;
    }
  });
});


