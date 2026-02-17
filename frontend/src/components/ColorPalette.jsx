import ColorBox from "./ColorBox";

export default function ColorPalette() {
  return (
    <section
      style={{
        display: "flex",
        justifyContent: "space-around",
        marginTop: "80px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        <ColorBox color="#283DA8" label="#283DA8" />
        <ColorBox color="#FFCD06" label="#FFCD06" />
        <ColorBox color="#34C759" label="#34C759" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        <ColorBox color="#F375C5" label="#F375C5" />
        <ColorBox color="#D9D9D9" label="#D9D9D9" />
        <ColorBox color="#00C3D0" label="#00C3D0" />
      </div>
    </section>
  );
}