import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

import Home from "../app/page";
import SimulationPage from "../app/simulation/page";
import VaultPage from "../app/vault/page";
import ResumePage from "../app/resume/page";
import ContactPage from "../app/contact/page";
import ProjectsPage from "../app/projects/page";
import ProjectsLayout from "../app/projects/layout";
import { Article, PROJECT_TAGS } from "../app/projects/article";
import { ExpandableProjects } from "../app/projects/expandable-projects";
import PostPage, { generateStaticParams } from "../app/projects/[slug]/page";
import { Header } from "../app/projects/[slug]/header";
import { ReportView } from "../app/projects/[slug]/view";
import RootLayout from "../app/layout";
import { allProjects } from "contentlayer/generated";
import { world } from "../app/components/3d/worldStore";

describe("Page Routes: Home Page", () => {
  it("renders hero title, navigation links, and availability badge", () => {
    render(<Home />);
    expect(screen.getByText("AVAILABLE FOR OPPORTUNITIES")).toBeInTheDocument();
    expect(screen.getByText("Lucas Wheeler")).toBeInTheDocument();
    expect(screen.getByText(/Ex-Waymo SWE Intern/i)).toBeInTheDocument();
    expect(screen.getByText("Resume")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
  });
});

describe("Page Routes: Simulation & Vault Pages", () => {
  it("renders SimulationPage with controls and HUD", () => {
    const { container } = render(<SimulationPage />);
    expect(container).toBeInTheDocument();

    // Trigger world event openProject
    act(() => {
      world.emit("openProject", {
        id: "Waymo",
        slug: "Waymo",
        title: "Waymo Data Visualizer",
        category: "Systems",
        description: "Test description",
        tech: ["C++"],
        color: "#06b6d4",
      });
    });

    // Close project modal
    const closeBtn = screen.getByLabelText(/Close dialog/i);
    fireEvent.click(closeBtn);

    // Trigger openProjectArchive
    act(() => {
      world.emit("openProjectArchive");
    });

    // Close quick menu
    const backBtn = screen.getByText(/Back to 3D World/i);
    fireEvent.click(backBtn);

    // Toggle quick menu from HUD button
    const toggleMenuBtn = screen.getByRole("button", { name: /2D Quick Menu/i });
    fireEvent.click(toggleMenuBtn);
  });

  it("renders VaultPage alias", () => {
    const { container } = render(<VaultPage />);
    expect(container).toBeInTheDocument();
  });
});

describe("Page Routes: Resume Page", () => {
  it("renders education, experience, skills, and course category filters", () => {
    const { container } = render(<ResumePage />);
    expect(screen.getByText(/Lucas Wheeler/i)).toBeInTheDocument();
    expect(screen.getByText(/University of California, Los Angeles/i)).toBeInTheDocument();
    expect(screen.getByText(/Waymo/i)).toBeInTheDocument();

    // Test print button
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    const printBtn = screen.getByRole("button", { name: /Print \/ Save PDF/i });
    fireEvent.click(printBtn);
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();

    // Test course filter buttons
    const mathBtn = screen.getByRole("button", { name: /Math & Numerical Theory/i });
    fireEvent.click(mathBtn);
    const systemsBtn = screen.getByRole("button", { name: /Systems & Architecture/i });
    fireEvent.click(systemsBtn);
    const allBtn = screen.getByRole("button", { name: /^All$/i });
    fireEvent.click(allBtn);
  });
});

describe("Page Routes: Contact Page", () => {
  it("renders contact links and copies email to clipboard", async () => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<ContactPage />);
    expect(screen.getByText(/Let's Connect/i)).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("GitHub")).toBeInTheDocument();

    const copyBtn = screen.getByRole("button", { name: /Copy:/i });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("wheeler.lucas2002@gmail.com");

    // Submit message form
    const nameInput = screen.getByPlaceholderText(/Ada Lovelace/i);
    const emailInput = screen.getByPlaceholderText(/ada@example.com/i);
    const msgInput = screen.getByPlaceholderText(/Hi Lucas/i);
    fireEvent.change(nameInput, { target: { value: "Recruiter" } });
    fireEvent.change(emailInput, { target: { value: "recruiter@example.com" } });
    fireEvent.change(msgInput, { target: { value: "Hello Lucas" } });

    const submitBtn = screen.getByRole("button", { name: /Send Message/i });
    fireEvent.click(submitBtn);

    // Send another message reset
    const sendAnotherBtn = screen.getByText(/Send another message/i);
    fireEvent.click(sendAnotherBtn);
  });
});

describe("Page Routes: Projects Directory", () => {
  it("renders ProjectsLayout with children", () => {
    const { container } = render(
      <ProjectsLayout>
        <div>Projects Layout Child</div>
      </ProjectsLayout>
    );
    expect(screen.getByText("Projects Layout Child")).toBeInTheDocument();
  });

  it("renders async ProjectsPage with featured and remaining projects", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";
    const pageJsx = await ProjectsPage();
    const { container } = render(pageJsx);
    expect(container).toBeInTheDocument();
    expect(screen.getAllByText("Projects").length).toBeGreaterThan(0);
  });

  it("renders Article with project tags and formatted date", () => {
    const sampleProject = allProjects[0] as any;
    const { rerender } = render(<Article project={sampleProject} views={42} />);
    expect(screen.getByText(sampleProject.title)).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();

    const undated = { ...sampleProject, date: undefined };
    rerender(<Article project={undated} views={0} />);
    expect(screen.getByText("SOON")).toBeInTheDocument();
  });

  it("renders ExpandableProjects with categories, search and show all toggle", () => {
    const sampleProjects = allProjects as any[];
    render(
      <ExpandableProjects
        featuredProjects={sampleProjects.slice(0, 5)}
        remainingProjects={sampleProjects.slice(5)}
        views={{ Waymo: 100, SolarSystem: 50 }}
      />
    );

    // Search filter
    const searchInput = screen.getByPlaceholderText(/Search projects or tags/i);
    fireEvent.change(searchInput, { target: { value: "Solar" } });
    expect(screen.getByText("3D Solar System")).toBeInTheDocument();
    fireEvent.change(searchInput, { target: { value: "" } });

    // Category button
    const graphicsBtn = screen.getByRole("button", { name: /3D & Graphics/i });
    fireEvent.click(graphicsBtn);

    // Reset filters
    const clearFiltersBtn = screen.getByText(/Clear filters/i);
    fireEvent.click(clearFiltersBtn);

    // Expand toggle for more projects
    const moreBtn = screen.getByRole("button", { name: /More Projects/i });
    fireEvent.click(moreBtn);
    fireEvent.click(moreBtn);
  });
});

describe("Page Routes: Project Slug Detail", () => {
  it("returns static params from generateStaticParams", async () => {
    const params = await generateStaticParams();
    expect(params.length).toBeGreaterThan(0);
    expect(params[0].slug).toBeDefined();
  });

  it("renders PostPage for existing project slug", async () => {
    const pageJsx = await PostPage({ params: { slug: "Waymo" } });
    render(pageJsx);
    expect(screen.getByText("Waymo Data Visualizer")).toBeInTheDocument();
  });

  it("calls notFound for nonexistent slug in PostPage", async () => {
    await expect(PostPage({ params: { slug: "nonexistent-project-xyz" } })).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("renders Header for project detail with back link and external links", () => {
    const sampleProject = allProjects[0] as any;
    render(<Header project={sampleProject} views={123} />);
    expect(screen.getByText(sampleProject.title)).toBeInTheDocument();
    expect(screen.getByText("123")).toBeInTheDocument();
    expect(screen.getByText("GitHub Repository")).toBeInTheDocument();
  });

  it("renders ReportView and triggers analytics fetch", () => {
    render(<ReportView slug="Waymo" />);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/incr",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("Page Routes: RootLayout", () => {
  it("renders RootLayout with child content", () => {
    const { container } = render(
      <RootLayout>
        <div>Root Layout Content</div>
      </RootLayout>
    );
    expect(screen.getByText("Root Layout Content")).toBeInTheDocument();
  });
});
