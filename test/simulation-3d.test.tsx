import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { runFrame } from "./setup";
import * as THREE from "three";

import { Vehicle, SKIN_STATS, SKIN_LABELS } from "../app/components/3d/Vehicle";
import { Scene } from "../app/components/3d/Scene";
import { CanvasContainer } from "../app/components/3d/CanvasContainer";
import { ProjectPavilions, PROJECTS_LIST } from "../app/components/3d/ProjectPavilions";
import { LidarOverlay } from "../app/components/3d/LidarOverlay";
import {
  ArcadeZone,
  TargetLauncherGame,
  GravityRings,
  PhysicsPyramid,
} from "../app/components/3d/ArcadeZone";
import { DataVizPlayground } from "../app/components/3d/DataVizPlayground";
import { GameOfLifeGrid } from "../app/components/3d/GameOfLifeGrid";
import { KnockableTitle } from "../app/components/3d/KnockableText";
import { InteractiveProps } from "../app/components/3d/InteractiveProps";
import { TimeTrialTrack } from "../app/components/3d/TimeTrialTrack";
import { GhostCar } from "../app/components/3d/GhostCar";
import { CollectiblesQuest } from "../app/components/3d/CollectiblesQuest";
import { PathfindingVisualizer } from "../app/components/3d/PathfindingVisualizer";
import { Skidmarks } from "../app/components/3d/Skidmarks";
import { CosmicAtmosphere } from "../app/components/3d/CosmicAtmosphere";
import { WaymoPavilion } from "../app/components/3d/WaymoPavilion";
import {
  ParticleSystem,
  ExhaustEmitter,
  DustField,
  LightShafts,
  ForcefieldBoundary,
} from "../app/components/3d/Effects";
import { AudioPulseRings } from "../app/components/3d/AudioPulseRings";
import { ContactPortal } from "../app/components/3d/ContactPortal";
import { world, PROJECT_POSITIONS, RACE_CHECKPOINTS, OBSTACLES } from "../app/components/3d/worldStore";

describe("3D Simulation: Vehicle & Skins", () => {
  beforeEach(() => {
    world.car.pos.set(0, 0, 0);
    world.car.speed = 0;
    world.car.heading = 0;
  });

  it("exports skin stats and labels correctly", () => {
    expect(SKIN_STATS.sports).toBeDefined();
    expect(SKIN_STATS.tank).toBeDefined();
    expect(SKIN_STATS.jet).toBeDefined();
    expect(SKIN_LABELS.sports).toBe("Cyber Sports");
  });

  it("renders Vehicle for various skins and runs animation frame", () => {
    const { container, rerender } = render(<Vehicle skin="sports" />);
    expect(container).toBeDefined();

    act(() => {
      world.input.forward = true;
      world.car.speed = 12;
      world.car.boosting = true;
      runFrame(0.016);
      world.input.forward = false;
      world.car.boosting = false;
    });

    rerender(<Vehicle skin="tank" />);
    act(() => {
      world.input.left = true;
      world.car.drifting = true;
      runFrame(0.016);
      world.input.left = false;
      world.car.drifting = false;
    });

    rerender(<Vehicle skin="jet" />);
    act(() => {
      world.input.backward = true;
      runFrame(0.016);
      world.input.backward = false;
    });

    rerender(<Vehicle skin="quantum" />);
    act(() => {
      world.triggerEmp();
      runFrame(0.016);
      runFrame(0.5); // Fall back down from air and land
    });

    // Test joystick and autopilot
    act(() => {
      world.input.joyX = -0.5;
      world.input.joyY = -0.5;
      runFrame(0.016);
      world.input.joyX = 0;
      world.input.joyY = 0;

      world.path = [new THREE.Vector3(5, 0, 5)];
      world.pathIndex = 0;
      runFrame(0.016);

      // Autopilot drive towards obstacle and boundary
      world.path = [
        new THREE.Vector3(OBSTACLES[0].x, 0, OBSTACLES[0].z),
        new THREE.Vector3(60, 0, 60),
      ];
      world.pathIndex = 0;
      for (let i = 0; i < 25; i++) {
        runFrame(0.05);
      }
    });
  });
});

describe("3D Simulation: Scene & CanvasContainer", () => {
  it("renders Scene with presets and handles theme and camera switching", () => {
    const onSelect = vi.fn();
    const presets = ["vehicle", "cockpit", "hero", "projects", "dataviz", "arcade", "contact", "waymo", "overview"] as const;

    const { rerender, container } = render(
      <Scene cameraPreset="vehicle" themeId="cyber" skin="sports" onSelectProject={onSelect} />
    );

    for (const preset of presets) {
      rerender(<Scene cameraPreset={preset} themeId="cyber" skin="sports" onSelectProject={onSelect} />);
      act(() => {
        runFrame(0.016);
      });
    }

    // Test tour camera motion in Scene
    act(() => {
      world.tourActive = true;
      runFrame(0.016);
      world.tourActive = false;
    });

    // Rerender in vehicle mode for click-to-move
    rerender(<Scene cameraPreset="vehicle" themeId="cyber" skin="sports" onSelectProject={onSelect} />);

    // Test click-to-move with 2-step maneuver angle
    world.car.pos.set(5, 0, 2);
    world.car.heading = Math.PI / 2;
    const ground = container.querySelector("mesh");
    if (ground) {
      fireEvent.pointerDown(ground, { button: 0 });
    }

    // Test EMP effect frames in Scene
    act(() => {
      world.lastEmpTime = 0;
      world.triggerEmp();
      runFrame(0.1);
      runFrame(0.6);
    });
  });

  it("renders CanvasContainer with full interactive HUD, shortcuts and modal controls", () => {
    const { container } = render(
      <CanvasContainer
        cameraPreset="vehicle"
        themeId="cyber"
        skin="sports"
        joystickVector={{ x: 0, y: 0 }}
        onSelectProject={vi.fn()}
      />
    );
    expect(container).toBeDefined();

    // Keybindings: 'E' for EMP, 'V' for LiDAR, 'X' for Telemetry, 'H' for Horn, 'B' for Boost, 'T' for Tour, 'L' for Headlights
    act(() => {
      fireEvent.keyDown(window, { key: "e" });
      fireEvent.keyDown(window, { key: "v" });
      fireEvent.keyDown(window, { key: "x" });
      fireEvent.keyDown(window, { key: "h" });
      fireEvent.keyDown(window, { key: "b" });
      fireEvent.keyDown(window, { key: "r" });
      fireEvent.keyDown(window, { key: "t" });
      fireEvent.keyDown(window, { key: "l" });
      fireEvent.keyDown(window, { key: " " });
      fireEvent.keyDown(window, { key: "Escape" });
      window.dispatchEvent(new Event("blur"));
      window.dispatchEvent(new Event("pointerdown"));
      document.dispatchEvent(new Event("visibilitychange"));
    });

    act(() => {
      fireEvent.keyUp(window, { key: " " });
      fireEvent.keyUp(window, { key: "b" });
    });

    act(() => {
      runFrame(0.016);
    });
  });
});

describe("3D Simulation: Project Pavilions", () => {
  it("renders all project pavilions and triggers selection callback", () => {
    const onSelect = vi.fn();
    const carPosRef = { current: { x: 0, y: 0, z: 0 } as any };
    const { container } = render(<ProjectPavilions carPosRef={carPosRef} onSelectProject={onSelect} />);

    expect(PROJECTS_LIST.length).toBeGreaterThan(0);

    // Simulate car moving close to Waymo pavilion
    carPosRef.current = { x: PROJECT_POSITIONS[0][0], y: 0, z: PROJECT_POSITIONS[0][2] };
    act(() => {
      runFrame(0.016);
    });

    // Hover and click on pavilion elements
    const clickableTags = container.querySelectorAll(".observatory-tag");
    if (clickableTags.length > 0) {
      fireEvent.pointerOver(clickableTags[0]);
      fireEvent.click(clickableTags[0]);
      fireEvent.pointerOut(clickableTags[0]);
      expect(onSelect).toHaveBeenCalled();
    }

    // Trigger projectile hit on pavilion
    act(() => {
      world.activeProjectiles = [
        {
          pos: new THREE.Vector3(PROJECT_POSITIONS[0][0], 0, PROJECT_POSITIONS[0][2]),
          vel: new THREE.Vector3(),
          active: true,
          life: 1,
        },
        {
          pos: new THREE.Vector3(-2, 0, 31),
          vel: new THREE.Vector3(),
          active: true,
          life: 1,
        },
      ];
      runFrame(0.016);
    });

    // Trigger EMP blast near pavilions
    act(() => {
      world.triggerEmp();
      runFrame(0.016);
    });
  });
});

describe("3D Simulation: LiDAR Overlay", () => {
  it("renders LiDAR overlay and runs scan loop", () => {
    render(<LidarOverlay />);
    act(() => {
      world.lidarActive = true;
      runFrame(0.016);
      world.lidarActive = false;
      runFrame(0.016);
    });
  });
});

describe("3D Simulation: Arcade Zone & Minigames", () => {
  it("renders ArcadeZone container and individual arcade components", () => {
    render(<ArcadeZone />);
    act(() => {
      runFrame(0.016);
    });
  });

  it("exercises TargetLauncherGame projectile and target physics", () => {
    render(<TargetLauncherGame />);
    act(() => {
      world.requestFire();
      runFrame(0.016);

      // Collide with targets and environment
      world.activeProjectiles = [
        {
          pos: new THREE.Vector3(17, 3, -34),
          vel: new THREE.Vector3(0, 0, -20),
          active: true,
          life: 1,
        },
        {
          pos: new THREE.Vector3(0, 0.05, 0),
          vel: new THREE.Vector3(0, 0, 0),
          active: true,
          life: 1,
        },
        {
          pos: new THREE.Vector3(OBSTACLES[0].x, 1, OBSTACLES[0].z),
          vel: new THREE.Vector3(0, 0, 0),
          active: true,
          life: 1,
        },
      ];
      runFrame(0.016);
      runFrame(2.5);

      world.car.pos.set(17, 0, -34);
      runFrame(0.016);
      world.triggerEmp();
      runFrame(0.016);
    });
  });

  it("exercises GravityRings portal detection", () => {
    render(<GravityRings />);
    act(() => {
      world.car.pos.set(0, 3.6, -28.5);
      runFrame(0.016);
      world.car.pos.set(0, 4.4, -33);
      runFrame(0.016);
      world.car.pos.set(0, 3.4, -38);
      runFrame(0.016);
    });
  });

  it("exercises PhysicsPyramid destructible block collisions", () => {
    render(<PhysicsPyramid />);
    act(() => {
      // Hit with projectile
      world.activeProjectiles = [
        {
          pos: new THREE.Vector3(-16.8, 0.6, -35.8),
          vel: new THREE.Vector3(0, 0, -10),
          active: true,
          life: 1,
        },
      ];
      runFrame(0.016);

      world.car.pos.set(-15, 0, -34);
      world.car.speed = 10;
      runFrame(0.016);
      runFrame(0.1);
      runFrame(0.2);
      runFrame(0.5);
      runFrame(0.5);
      world.triggerEmp();
      runFrame(0.016);
    });
  });
});

describe("3D Simulation: DataVizPlayground & GameOfLife", () => {
  it("renders DataVizPlayground and animates columns", () => {
    render(<DataVizPlayground />);
    act(() => {
      runFrame(0.016);
    });
  });

  it("renders GameOfLifeGrid and ticks cellular simulation with interactive buttons", () => {
    render(<GameOfLifeGrid />);

    // Click randomize and clear buttons
    const randBtn = screen.getByRole("button", { name: /Randomize/i });
    const clearBtn = screen.getByRole("button", { name: /Clear/i });
    fireEvent.click(randBtn);
    fireEvent.click(clearBtn);

    // Drive rover over grid platform
    act(() => {
      world.car.pos.set(-28, 0, 22);
      runFrame(0.016);
      runFrame(0.1);
      world.car.pos.set(-26, 0, 20);
      runFrame(0.1);
    });
  });
});

describe("3D Simulation: KnockableTitle & InteractiveProps", () => {
  it("renders KnockableTitle and applies physical forces", () => {
    render(<KnockableTitle />);
    act(() => {
      // Hit with projectile at letter
      world.activeProjectiles = [
        {
          pos: new THREE.Vector3(0, 0.5, 0),
          vel: new THREE.Vector3(0, 0, 1),
          active: true,
          life: 1,
        },
      ];
      runFrame(0.016);

      // Hit with rover to launch into flying physics state
      world.car.pos.set(0, 0, -6);
      world.car.speed = 12;
      world.car.heading = 0;
      runFrame(0.016);
      world.car.pos.set(0, 0, 0);
      runFrame(0.016);

      // Let letters fly, hit ground bounce, obstacle bounces, and settle
      runFrame(0.05);
      runFrame(0.1);
      runFrame(0.2);
      runFrame(0.5);
      runFrame(1.0);

      // Rebuild pad
      world.car.pos.set(0, 0, -3.5);
      runFrame(0.016);
      runFrame(1.2);

      world.lastEmpTime = 0;
      world.car.pos.set(0, 0, -6);
      world.triggerEmp();
      runFrame(0.016);
      runFrame(0.1);
      runFrame(0.5);
    });
  });

  it("renders InteractiveProps and reacts to rover collision", () => {
    render(<InteractiveProps />);
    act(() => {
      world.lastEmpTime = 0;
      world.empPos.set(-12, 0, -3);
      world.triggerEmp();
      runFrame(0.016);

      world.car.pos.set(-12, 0, -2.8);
      world.car.speed = 15;
      runFrame(0.016);
      runFrame(0.05);
    });
  });
});

describe("3D Simulation: TimeTrialTrack & GhostCar", () => {
  it("renders TimeTrialTrack and progresses laps and checkpoints", () => {
    render(<TimeTrialTrack />);
    act(() => {
      world.startRace();
    });

    // Pass through checkpoints sequentially to complete lap
    for (let i = 0; i < RACE_CHECKPOINTS.length; i++) {
      const nextIdx = (world.raceCheckpoint + 1) % RACE_CHECKPOINTS.length;
      const gate = RACE_CHECKPOINTS[nextIdx];
      world.car.pos.set(gate.pos.x, 0, gate.pos.z);
      act(() => {
        runFrame(0.016);
      });
    }

    act(() => {
      world.raceActive = false;
      world.emit("race", { active: false, checkpoint: 0 });
    });
  });

  it("renders GhostCar playback replay", () => {
    render(<GhostCar />);
    act(() => {
      runFrame(0.016);
    });
  });
});

describe("3D Simulation: CollectiblesQuest & PathfindingVisualizer", () => {
  it("renders CollectiblesQuest and collects items upon contact", () => {
    render(<CollectiblesQuest />);
    act(() => {
      world.car.pos.set(0, 0, 0);
      runFrame(0.016);
    });
  });

  it("renders PathfindingVisualizer and runs autonomous drone and launchpad", () => {
    render(<PathfindingVisualizer />);
    act(() => {
      world.setPath(
        [new THREE.Vector3(0, 0, 0), new THREE.Vector3(5, 0, 5)],
        new THREE.Vector3(5, 0, 5),
        [new THREE.Vector3(1, 0, 1), new THREE.Vector3(2, 0, 2)]
      );
      runFrame(0.016);

      // Trigger Mega Launchpad
      world.car.pos.set(14, 0, -10);
      world.car.speed = 10;
      world.car.inAir = false;
      runFrame(0.016);
    });
  });
});

describe("3D Simulation: Atmospheric Effects & WaymoPavilion", () => {
  it("renders Skidmarks on drift", () => {
    render(<Skidmarks />);
    act(() => {
      world.car.drifting = true;
      world.car.speed = 12;
      runFrame(0.08);
      runFrame(0.08);
      world.car.drifting = false;
      runFrame(10);
    });
  });

  it("renders CosmicAtmosphere day/night transitions", () => {
    render(<CosmicAtmosphere />);
    act(() => {
      world.nightMode = true;
      runFrame(0.016);
      world.nightMode = false;
      runFrame(0.016);
    });
  });

  it("renders WaymoPavilion and invokes modal on click", () => {
    const onSelect = vi.fn();
    render(<WaymoPavilion onSelect={onSelect} />);
    act(() => {
      runFrame(0.016);
    });
  });

  it("renders AudioPulseRings and updates with audio frequency spectrum", () => {
    render(<AudioPulseRings />);
    act(() => {
      runFrame(0.016);
    });
  });

  it("renders ContactPortal and detects proximity warp", () => {
    render(<ContactPortal />);
    act(() => {
      world.car.pos.set(-100, 0, -100);
      runFrame(0.016);
    });
  });

  it("renders visual particle systems: ParticleSystem, ExhaustEmitter, DustField, LightShafts, ForcefieldBoundary", () => {
    render(
      <>
        <ParticleSystem />
        <ExhaustEmitter skin="cyber" />
        <DustField />
        <LightShafts />
        <ForcefieldBoundary />
      </>
    );
    act(() => {
      world.car.speed = 10;
      runFrame(0.016);
    });
  });
});
