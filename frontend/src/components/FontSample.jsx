export default function FontSample({ fontFamily, name }) {
  return (
    <div className="font-sample" style={{ fontFamily }}>
      <h2>{name} 40 pt</h2>
      <p className="size-24">{name} 24 pt</p>
      <p className="size-16">{name} 16 pt</p>
      <p>AOÄÖ aoäö</p>
      <p>123456789809</p>
    </div>
  );
}