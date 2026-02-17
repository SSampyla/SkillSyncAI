import Navbar from "../components/Navbar";
import ColorPalette from "../components/ColorPalette";

export default function Home() {
  return (
    <>
      <Navbar />
      <hr style={{ margin: "0 40px" }} />
      <ColorPalette />
    </>
  );
}