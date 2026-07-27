import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../i18n.js", () => ({ T: (es) => es, PICK: (o) => (o == null ? "" : o.es ?? "") }));
vi.mock("./SecIcon.jsx", () => ({ default: () => <span data-testid="secicon" /> }));
vi.mock("./support.jsx", () => ({
  LibraryButton: () => <button>Biblioteca</button>,
  ConsultarDudasButton: () => <button>Consultar dudas</button>,
  ConsultarIAButton: () => <button>Consultar IA</button>,
  SoporteFloat: () => <div data-testid="soporte" />,
}));
vi.mock("../data/course.js", () => ({
  SEC_META: {
    bautismo: { es: "Bautismo", videos: [
      { id: "v1", es: "Video 1", dur: "30 min" },
      { id: "v2", es: "Video 2", dur: "30 min" },
    ] },
  },
  videoState: (secId, vid, prog) => {
    const p = prog?.[secId]?.[vid.id];
    if (p?.passed) return "passed";
    if (p?.visto) return "watched";
    return vid.id === "v1" ? "available" : "locked";
  },
}));

import CourseSectionView from "./CourseSectionView.jsx";

const base = {
  secId: "bautismo", progress: {},
  onVideoAction: vi.fn(), onEvalAction: vi.fn(),
  onBack: vi.fn(), onDash: vi.fn(),
};

describe("CourseSectionView", () => {
  it("sección inexistente → null", () => {
    const { container } = render(<CourseSectionView {...base} secId="noexiste" />);
    expect(container.firstChild).toBeNull();
  });

  it("lista los videos de la sección y el progreso", () => {
    render(<CourseSectionView {...base} />);
    expect(screen.getByText(/1\. Video 1/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Video 2/)).toBeInTheDocument();
    expect(screen.getByText("0/2 completados")).toBeInTheDocument();
  });

  it("el primer video muestra 'Ver video' y dispara onVideoAction", async () => {
    const user = userEvent.setup();
    const onVideoAction = vi.fn();
    render(<CourseSectionView {...base} onVideoAction={onVideoAction} />);
    await user.click(screen.getByRole("button", { name: /Ver video/i }));
    expect(onVideoAction).toHaveBeenCalledWith("bautismo", expect.objectContaining({ id: "v1" }));
  });

  it("video 'watched' ofrece la Evaluación", async () => {
    const user = userEvent.setup();
    const onEvalAction = vi.fn();
    const progress = { bautismo: { v1: { visto: true } } };
    render(<CourseSectionView {...base} progress={progress} onEvalAction={onEvalAction} />);
    await user.click(screen.getByRole("button", { name: /Evaluación/i }));
    expect(onEvalAction).toHaveBeenCalledWith("bautismo", expect.objectContaining({ id: "v1" }));
  });

  it("botón Volver oculto si canBack=false", () => {
    render(<CourseSectionView {...base} canBack={false} />);
    expect(screen.queryByRole("button", { name: /Volver/i })).toBeNull();
  });
});
