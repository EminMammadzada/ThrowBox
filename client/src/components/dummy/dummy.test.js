import { render, screen } from "@testing-library/react";
import React from "react";
import Dummy from "./dummy";
import "@testing-library/jest-dom";

describe("<Dummy /> component", () => {
  test('renders "Hello world" as a text', () => {
    render(<Dummy />);
    const helloWorldElement = screen.getByText("Hello world", { exact: false });
    expect(helloWorldElement).toBeInTheDocument();
  });
});
