/**
 * FEATURE CAROUSEL - components/FeatureCarousel.js
 * Horizontal swipe carousel for Home page features
 * Supports touch gestures, dots navigation, and smooth transitions
 * UPDATED: Shows peek of adjacent slides for better UX
 */
"use client";
import { useState, useRef, useEffect, Children, cloneElement } from "react";
import { useTheme } from "../lib/ThemeContext";

// Slide takes 65% of container width, showing peek on each side
const SLIDE_WIDTH_PERCENT = 65;
const SLIDE_GAP = 12;

export default function FeatureCarousel({
  children,
  initialSlide = 0,
  onSlideChange,
  showDots = true,
  showHint = true,
  storageKey = "amiya-carousel-slide"
}) {
  const { tokens } = useTheme();
  const [activeSlide, setActiveSlide] = useState(initialSlide);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const [prevTranslate, setPrevTranslate] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const animationRef = useRef(null);

  // Filter out null/undefined children
  const slides = Children.toArray(children).filter(Boolean);
  const slideCount = slides.length;

  // Get container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (wrapperRef.current) {
        setContainerWidth(wrapperRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Calculate actual slide width in pixels
  const slideWidth = containerWidth * (SLIDE_WIDTH_PERCENT / 100);
  const peekWidth = (containerWidth - slideWidth) / 2;

  // Load saved slide position
  useEffect(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const savedSlide = parseInt(saved, 10);
        if (savedSlide >= 0 && savedSlide < slideCount) {
          setActiveSlide(savedSlide);
          setHasInteracted(true);
        }
      }
    }
  }, [storageKey, slideCount]);

  // Save slide position
  useEffect(() => {
    if (typeof window !== "undefined" && storageKey && hasInteracted) {
      localStorage.setItem(storageKey, activeSlide.toString());
    }
  }, [activeSlide, storageKey, hasInteracted]);

  // Notify parent of slide changes
  useEffect(() => {
    if (onSlideChange) {
      onSlideChange(activeSlide);
    }
  }, [activeSlide, onSlideChange]);

  const getPositionX = (event) => {
    return event.type.includes("mouse")
      ? event.pageX
      : event.touches[0].clientX;
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(getPositionX(e));
    animationRef.current = requestAnimationFrame(animation);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    const currentPosition = getPositionX(e);
    const diff = currentPosition - startX;
    setCurrentTranslate(prevTranslate + diff);
  };

  const handleTouchEnd = () => {
    cancelAnimationFrame(animationRef.current);
    setIsDragging(false);

    const movedBy = currentTranslate - prevTranslate;
    const threshold = 50; // Minimum swipe distance

    // Determine direction
    if (movedBy < -threshold && activeSlide < slideCount - 1) {
      // Swiped left - go to next slide
      setActiveSlide(prev => prev + 1);
      setHasInteracted(true);
    } else if (movedBy > threshold && activeSlide > 0) {
      // Swiped right - go to previous slide
      setActiveSlide(prev => prev - 1);
      setHasInteracted(true);
    }

    // Reset translate values
    setCurrentTranslate(0);
    setPrevTranslate(0);
  };

  const animation = () => {
    if (isDragging) {
      animationRef.current = requestAnimationFrame(animation);
    }
  };

  const goToSlide = (index) => {
    if (index >= 0 && index < slideCount) {
      setActiveSlide(index);
      setHasInteracted(true);
    }
  };

  // Calculate transform - center active slide with peek on sides
  const getTransformValue = () => {
    // Before we have measurements, use percentage-based centering
    if (!containerWidth || !slideWidth) {
      const peekPercent = (100 - SLIDE_WIDTH_PERCENT) / 2;
      return `translateX(${peekPercent}%)`;
    }

    // Each slide step = slide width + gap
    const slideStep = slideWidth + SLIDE_GAP;
    // Start offset to center first slide (show peek on left would be negative, so we start at peek position)
    const startOffset = peekWidth;
    // Move by slide step for each active slide
    const baseTranslate = startOffset - (activeSlide * slideStep);

    if (isDragging) {
      const dragOffset = currentTranslate - prevTranslate;
      return `translateX(${baseTranslate + dragOffset}px)`;
    }
    return `translateX(${baseTranslate}px)`;
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        touchAction: "pan-y",
      }}
    >
      {/* Slides Container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={() => isDragging && handleTouchEnd()}
        style={{
          display: "flex",
          gap: `${SLIDE_GAP}px`,
          transition: isDragging ? "none" : "transform 300ms ease-out",
          transform: getTransformValue(),
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        {slides.map((child, index) => {
          const isActive = index === activeSlide;
          return (
            <div
              key={index}
              style={{
                minWidth: slideWidth > 0 ? `${slideWidth}px` : `${SLIDE_WIDTH_PERCENT}%`,
                width: slideWidth > 0 ? `${slideWidth}px` : `${SLIDE_WIDTH_PERCENT}%`,
                flexShrink: 0,
                // Active: full opacity, raised. Inactive: dimmed, smaller
                opacity: isActive ? 1 : 0.55,
                transform: isActive
                  ? "scale(1) translateY(0)"
                  : "scale(0.9) translateY(12px)",
                filter: isActive ? "none" : "blur(0.5px)",
                transition: "all 300ms ease-out",
                background: tokens.colors.bg.elevated,
                borderRadius: tokens.radii.xl,
                boxShadow: isActive
                  ? `0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)`
                  : tokens.shadows.soft,
                overflow: "hidden",
                // Pointer events only on active slide
                pointerEvents: isActive ? "auto" : "none",
              }}
            >
              {cloneElement(child, { isActive })}
            </div>
          );
        })}
      </div>

      {/* Dots Navigation - Modern pill style */}
      {showDots && slideCount > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "6px",
          padding: "20px 0",
        }}>
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              style={{
                width: index === activeSlide ? "24px" : "8px",
                height: "8px",
                borderRadius: "4px",
                border: "none",
                padding: 0,
                background: index === activeSlide
                  ? tokens.colors.aurora.lavender
                  : tokens.colors.text.muted,
                cursor: "pointer",
                transition: "all 300ms ease",
                opacity: index === activeSlide ? 1 : 0.3,
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Swipe Hint (only on first visit) */}
      {showHint && !hasInteracted && slideCount > 1 && (
        <p style={{
          ...tokens.typography.small,
          textAlign: "center",
          color: tokens.colors.text.muted,
          margin: "0 0 16px 0",
          animation: "fadeInOut 2s ease-in-out infinite",
        }}>
          Swipe fur mehr
        </p>
      )}

      <style jsx global>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
