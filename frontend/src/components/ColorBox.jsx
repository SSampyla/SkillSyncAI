export default function ColorBox({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
      <div
        style={{
          width: "120px",
          height: "120px",
          background: color,
        }}
      />
      <span style={{ fontSize: "18px" }}>{label}</span>
    </div>
  );
}