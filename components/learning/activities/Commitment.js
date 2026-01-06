/**
 * COMMITMENT - components/learning/activities/Commitment.js
 * Creates an Agreement from selected rules/commitments
 * Used for Chapter 7: Ground Rules
 */
"use client";

import { useState } from "react";
import { useTheme } from "../../../lib/ThemeContext";
import { useAuth } from "../../../lib/AuthContext";
import { CheckCircle, Handshake, ArrowRight, AlertCircle, Calendar } from "lucide-react";

export default function Commitment({
  chapterId,
  options = [],
  minSelections = 2,
  maxSelections = 3,
  title = "Wähle deine Vereinbarungen",
  subtitle = "",
  agreementConfig = {},
  onComplete,
}) {
  const { tokens } = useTheme();
  const { user, profile } = useAuth();

  const [selected, setSelected] = useState([]);
  const [customText, setCustomText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [createdAgreement, setCreatedAgreement] = useState(null);

  const canSubmit = selected.length >= minSelections && selected.length <= maxSelections;

  const handleToggle = (optionId) => {
    if (selected.includes(optionId)) {
      setSelected(selected.filter((id) => id !== optionId));
    } else if (selected.length < maxSelections) {
      setSelected([...selected, optionId]);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    // Check if user has a partner
    if (!profile?.couple_id) {
      setError("Du brauchst einen verbundenen Partner für Vereinbarungen.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Build agreement from selections
      const selectedOptions = options.filter((opt) => selected.includes(opt.id));
      const descriptions = selectedOptions.map((opt) => `• ${opt.label}`).join("\n");

      const agreementTitle = agreementConfig.title || "Unsere Konflikt-Spielregeln";
      const agreementDescription = customText
        ? `${descriptions}\n\nEigene Ergänzung:\n${customText}`
        : descriptions;

      const response = await fetch("/api/agreements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coupleId: profile.couple_id,
          userId: user.id,
          title: agreementTitle,
          description: agreementDescription,
          underlyingNeed: agreementConfig.underlyingNeed || "Konstruktive Konfliktlösung",
          type: "commitment",
          checkInFrequencyDays: agreementConfig.checkInDays || 14,
          themes: ["conflict", "communication", "learning"],
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setCreatedAgreement(data.agreement);
      setIsComplete(true);
    } catch (err) {
      console.error("Commitment error:", err);
      setError(err.message || "Konnte Vereinbarung nicht speichern");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete({
        agreementId: createdAgreement?.id,
        selectedOptions: selected,
        customText,
      });
    }
  };

  // Success screen
  if (isComplete && createdAgreement) {
    const checkInDate = new Date(createdAgreement.next_check_in_at);
    const formattedDate = checkInDate.toLocaleDateString("de-DE", {
      day: "numeric",
      month: "long",
    });

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          padding: "24px",
          textAlign: "center",
        }}
      >
        {/* Success Icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${tokens.colors.aurora.mint}20 0%, ${tokens.colors.aurora.lavender}20 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <Handshake size={40} color={tokens.colors.aurora.mint} />
        </div>

        <h2
          style={{
            ...tokens.typography.h2,
            margin: "0 0 8px 0",
          }}
        >
          Vereinbarung erstellt!
        </h2>

        <p
          style={{
            ...tokens.typography.body,
            color: tokens.colors.text.secondary,
            margin: "0 0 24px 0",
            maxWidth: "300px",
          }}
        >
          Eure neuen Konflikt-Spielregeln wurden gespeichert
        </p>

        {/* Check-in reminder */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 20px",
            background: tokens.colors.bg.surface,
            borderRadius: "12px",
            marginBottom: "32px",
          }}
        >
          <Calendar size={20} color={tokens.colors.aurora.lavender} />
          <div style={{ textAlign: "left" }}>
            <p
              style={{
                fontSize: "13px",
                color: tokens.colors.text.muted,
                margin: 0,
              }}
            >
              Nächster Check-in
            </p>
            <p
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: tokens.colors.text.primary,
                margin: 0,
              }}
            >
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Status info */}
        {createdAgreement.status === "pending_approval" && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "14px",
              background: `${tokens.colors.aurora.lavender}10`,
              borderRadius: "12px",
              marginBottom: "24px",
              maxWidth: "320px",
            }}
          >
            <AlertCircle size={18} color={tokens.colors.aurora.lavender} style={{ flexShrink: 0, marginTop: "2px" }} />
            <p
              style={{
                fontSize: "13px",
                color: tokens.colors.text.secondary,
                margin: 0,
                lineHeight: "1.5",
                textAlign: "left",
              }}
            >
              Dein Partner muss die Vereinbarung noch bestätigen. Er/sie sieht sie unter "Wir".
            </p>
          </div>
        )}

        <button
          onClick={handleComplete}
          style={{
            padding: "16px 32px",
            background: `linear-gradient(135deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`,
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          Fertig
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        padding: "20px",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            ...tokens.typography.h2,
            margin: "0 0 8px 0",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              ...tokens.typography.body,
              color: tokens.colors.text.muted,
              margin: 0,
            }}
          >
            {subtitle}
          </p>
        )}
        <p
          style={{
            fontSize: "13px",
            color: tokens.colors.text.muted,
            margin: "12px 0 0 0",
          }}
        >
          Wähle {minSelections}-{maxSelections} Regeln
        </p>
      </div>

      {/* Options */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {options.map((option) => {
          const isSelected = selected.includes(option.id);
          const isDisabled = !isSelected && selected.length >= maxSelections;

          return (
            <button
              key={option.id}
              onClick={() => handleToggle(option.id)}
              disabled={isDisabled}
              style={{
                padding: "16px",
                background: isSelected
                  ? `linear-gradient(135deg, ${tokens.colors.aurora.lavender}15 0%, ${tokens.colors.aurora.rose}10 100%)`
                  : tokens.colors.bg.surface,
                border: isSelected
                  ? `2px solid ${tokens.colors.aurora.lavender}`
                  : `1px solid ${tokens.colors.bg.elevated}`,
                borderRadius: "12px",
                cursor: isDisabled ? "not-allowed" : "pointer",
                textAlign: "left",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                opacity: isDisabled ? 0.5 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {/* Checkbox */}
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "6px",
                  border: isSelected ? "none" : `2px solid ${tokens.colors.text.muted}40`,
                  background: isSelected ? tokens.colors.aurora.lavender : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              >
                {isSelected && <CheckCircle size={16} color="#fff" />}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: tokens.colors.text.primary,
                    margin: "0 0 4px 0",
                  }}
                >
                  {option.label}
                </p>
                {option.description && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: tokens.colors.text.muted,
                      margin: 0,
                      lineHeight: "1.4",
                    }}
                  >
                    {option.description}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom addition */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: "600",
            color: tokens.colors.text.muted,
            marginBottom: "8px",
          }}
        >
          Eigene Ergänzung (optional)
        </label>
        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Füge eine eigene Regel hinzu..."
          rows={3}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: tokens.colors.bg.surface,
            border: `1px solid ${tokens.colors.bg.elevated}`,
            borderRadius: "12px",
            color: tokens.colors.text.primary,
            fontSize: "15px",
            resize: "none",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Selection count */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            color: canSubmit ? tokens.colors.aurora.mint : tokens.colors.text.muted,
            fontWeight: canSubmit ? "600" : "400",
          }}
        >
          {selected.length} von {minSelections}-{maxSelections} gewählt
        </span>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: `${tokens.colors.aurora.rose}10`,
            borderRadius: "10px",
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: tokens.colors.aurora.rose,
              margin: 0,
            }}
          >
            {error}
          </p>
        </div>
      )}

      {/* Submit */}
      <div style={{ marginTop: "auto" }}>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          style={{
            width: "100%",
            padding: "16px",
            background: canSubmit
              ? `linear-gradient(135deg, ${tokens.colors.aurora.lavender} 0%, ${tokens.colors.aurora.rose} 100%)`
              : tokens.colors.bg.surface,
            border: "none",
            borderRadius: "12px",
            color: canSubmit ? "#fff" : tokens.colors.text.muted,
            fontSize: "16px",
            fontWeight: "600",
            cursor: canSubmit ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {isSubmitting ? (
            <>
              <div style={tokens.loaders?.spinner?.(18) || { width: 18, height: 18 }} />
              Speichern...
            </>
          ) : (
            <>
              <Handshake size={20} />
              Als Vereinbarung speichern
            </>
          )}
        </button>

        <p
          style={{
            fontSize: "12px",
            color: tokens.colors.text.muted,
            margin: "12px 0 0 0",
            textAlign: "center",
          }}
        >
          Check-in in 14 Tagen
        </p>
      </div>
    </div>
  );
}
