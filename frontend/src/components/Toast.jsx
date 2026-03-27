
export default function Toast({ message, type = "info", onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "12px 16px",
        borderRadius: "8px",
        backgroundColor:
          type === "success"
            ? "var(--color-success)"
            : type === "error"
            ? "var(--color-error, #dc3545)"
            : "var(--color-primary)",
        color: "white",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        fontSize: "14px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "10px",
        animation: "fadeIn 0.2s ease"
      }}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: "white",
          cursor: "pointer",
          fontSize: "16px"
        }}
      >
        ✕
      </button>
    </div>
  );
}