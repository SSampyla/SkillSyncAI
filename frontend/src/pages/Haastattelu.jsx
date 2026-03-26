import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// AI-haastattelusivu: Käyttäjä vastaa AI:n esittämiin kysymyksiin, saa välitöntä palautetta ja lopuksi kokonaisarvion.
export default function Interview() {
    const location = useLocation();
    const navigate = useNavigate();
    const jobText = location.state?.jobText || "";

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [interviewId, setInterviewId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [evaluation, setEvaluation] = useState(null);
    const [error, setError] = useState(null);

    const chatRef = useRef(null);

   
    useEffect(() => {
        chatRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    useEffect(() => {
        startInterview();
    }, []);

    async function startInterview() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/interview/practice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobText,
                    language: "Finnish"
                })
            });

            if (!res.ok) throw new Error("API error");

            const data = await res.json();

            setMessages([
                { role: "assistant", content: data.nextQuestion }
            ]);

            setInterviewId(data.interviewId);

        } catch (err) {
            console.error(err);
            setError("Haastattelun aloitus epäonnistui");
        } finally {
            setLoading(false);
        }
    }

    // 🔹 Lähetä vastaus
    async function sendAnswer() {
        if (!input.trim() || loading) return;

        const userMessage = input;

        setMessages((prev) => [
            ...prev,
            { role: "user", content: userMessage },
        ]);

        setInput("");
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/interview/practice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    interviewId,
                    userMessage,
                    jobText,
                    language: "Finnish",
                }),
            });

            if (!res.ok) throw new Error("API error");

            const data = await res.json();

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.nextQuestion },
            ]);

            setEvaluation(data.answerEvaluation);
            setInterviewId(data.interviewId);

        } catch (err) {
            console.error(err);
            setError("Vastauksen lähetys epäonnistui");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: "100vh",
            background: "var(--surface-page-a)",
            padding: "20px",
            display: "flex",
            justifyContent: "center"
        }}>
            <div style={{
                width: "100%",
                maxWidth: "800px",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
            }}>

                {/* HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h1 style={{ color: "var(--text-primary)" }}>🎤 AI Haastattelu</h1>

                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            padding: "8px 14px",
                            borderRadius: "8px",
                            border: "1px solid var(--border-soft-72)",
                            background: "var(--surface-glass)",
                            color: "var(--text-primary)",
                            cursor: "pointer"
                        }}
                    >
                        ← Takaisin
                    </button>
                </div>

                {/* ERROR */}
                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        padding: "10px",
                        borderRadius: "8px",
                        color: "#ef4444"
                    }}>
                        {error}
                    </div>
                )}

                {/* CHAT */}
                <div style={{
                    background: "rgba(255,255,255,0.05)",
                    padding: "20px",
                    borderRadius: "12px",
                    minHeight: "400px",
                    maxHeight: "500px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                }}>
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            style={{
                                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                                background: msg.role === "user"
                                    ? "var(--color-primary)"
                                    : "rgba(255,255,255,0.1)",
                                padding: "10px 14px",
                                borderRadius: "10px",
                                maxWidth: "70%",
                                color: "var(--text-primary)"
                            }}
                        >
                            {msg.content}
                        </div>
                    ))}

                    {loading && (
                        <div style={{
                            display: "flex",
                            gap: "6px",
                            alignItems: "center",
                            padding: "10px 14px",
                            background: "rgba(255,255,255,0.1)",
                            borderRadius: "10px",
                            width: "fit-content"
                        }}>
                            <span className="dot" />
                            <span className="dot" />
                            <span className="dot" />
                        </div>
                    )}

                    <div ref={chatRef} />
                </div>

                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendAnswer();
                        }
                    }}
                    placeholder="Kirjoita vastauksesi..."
                    style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-soft-72)",
                        background: "var(--surface-input)",
                        color: "var(--text-primary)"
                    }}
                />

                    <button
                        onClick={sendAnswer}
                        disabled={loading}
                        style={{
                            padding: "12px 20px",
                            background: loading ? "var(--border-soft-72)" : "var(--color-primary)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: loading ? "not-allowed" : "pointer"
                        }}
                    >
                        Lähetä
                    </button>
                </div>

           
                {evaluation && (
                    <div style={{
                        background: "rgba(255,255,255,0.05)",
                        padding: "16px",
                        borderRadius: "10px",
                        color: "var(--text-primary)"
                    }}>
                        <h3 style={{ margin: 0 }}>Arvio</h3>
                        <p>Selkeys: {evaluation.clarity}</p>
                        <p>Tekninen osaaminen: {evaluation.technicalDepth}</p>
                        <p>Kommunikointi: {evaluation.communication}</p>
                    </div>
                )}

            </div>      
    );
}