import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useInterviewPractice } from "../hooks/useInterviewPractice";

// AI-haastattelusivu: Käyttäjä vastaa AI:n esittämiin kysymyksiin, saa välitöntä palautetta ja lopuksi kokonaisarvion.
export default function Interview() {
    const location = useLocation();
    const navigate = useNavigate();
    const hasStarted = useRef(false);

    const jobTextFromState = location.state?.jobText || null;
    const jobId = location.state?.jobId || null;

    const [input, setInput] = useState("");
    const chatRef = useRef(null);

    // useInterviewPractice hookki
    const {
        messages,
        loading,
        interviewId,
        error,
        answerEvaluation,
        startInterview,
        sendMessage,
        resetInterview
    } = useInterviewPractice(jobId, [], jobTextFromState);

    useEffect(() => {
        chatRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        // Aloita vain jos ei ole vielä aloitettu ja tarvittavat tiedot löytyvät
        if (jobTextFromState && !loading && !hasStarted.current) {
            hasStarted.current = true;
            startInterview("Finnish");
        }
        return () => {
            if (hasStarted.current) resetInterview();
        };
    }, [jobTextFromState, startInterview, resetInterview]);

    const handleSend = async () => {
        // Lisätty tarkistus: jos interviewId puuttuu, ei voida lähettää
        if (!input.trim() || loading || !interviewId) return;

        const textToSend = input;
        setInput(""); 

        try {
            await sendMessage(textToSend);
        } catch (err) {
            console.error("Lähetys epäonnistui:", err);
            setInput(textToSend); // Palautetaan teksti jos virhe
        }
    };


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

                {/* CHAT CONTAINER */}
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
                                color: "var(--text-primary)",
                                whiteSpace: "pre-wrap"
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

                {/* INPUT AREA */}
                <div style={{ display: "flex", gap: "8px" }}>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={interviewId ? "Kirjoita vastauksesi..." : "Valmistellaan haastattelua..."}
                        disabled={loading || !interviewId}
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
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        style={{
                            padding: "12px 20px",
                            background: (loading || !input.trim()) ? "var(--border-soft-72)" : "var(--color-primary)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: (loading || !input.trim()) ? "not-allowed" : "pointer",
                            transition: "background 0.2s"
                        }}
                    >
                        {loading ? "Lähetetään..." : "Lähetä"}
                    </button>
                </div>

                {/* EVALUATION PANEL */}
                {answerEvaluation && (
                    <div style={{
                        background: "var(--surface-glass)",
                        border: "1px solid var(--border-soft-72)",
                        padding: "16px",
                        borderRadius: "10px",
                        color: "var(--text-primary)",
                        marginTop: "8px"
                    }}>
                        <h3 style={{ margin: "0 0 10px 0", fontSize: "1.1rem" }}>Viimeisin palaute</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                            <div>
                                <small style={{ opacity: 0.7 }}>Selkeys</small>
                                <div>{answerEvaluation.clarity}</div>
                            </div>
                            <div>
                                <small style={{ opacity: 0.7 }}>Tekninen syvyys</small>
                                <div>{answerEvaluation.technicalDepth}</div>
                            </div>
                            <div>
                                <small style={{ opacity: 0.7 }}>Kommunikaatio</small>
                                <div>{answerEvaluation.communication}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}