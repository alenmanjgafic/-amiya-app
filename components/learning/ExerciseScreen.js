/**
 * EXERCISE SCREEN - Routes to appropriate exercise component
 */
"use client";

import SingleSelect from "./exercises/SingleSelect";
import MultiSelect from "./exercises/MultiSelect";
import FreeText from "./exercises/FreeText";
import Reflection from "./exercises/Reflection";
import Summary from "./exercises/Summary";
import ChallengeOffer from "./exercises/ChallengeOffer";
import Completion from "./exercises/Completion";

export default function ExerciseScreen({
  screen,
  savedResponse,
  allResponses = {},
  allBiteResponses = {},
  onResponse,
  onContinue,
  onComplete,
  onAcceptChallenge,
}) {
  const { exerciseType } = screen;

  const commonProps = {
    exercise: screen,
    savedResponse,
    onResponse,
    onContinue,
  };

  switch (exerciseType) {
    case "single_select":
      return <SingleSelect {...commonProps} />;

    case "multi_select":
      return <MultiSelect {...commonProps} />;

    case "free_text":
      return <FreeText {...commonProps} />;

    case "reflection":
      return (
        <Reflection
          exercise={screen}
          allResponses={allResponses}
          onContinue={onContinue}
        />
      );

    case "summary":
      return (
        <Summary
          exercise={screen}
          allResponses={allResponses}
          allBiteResponses={allBiteResponses}
          onContinue={onContinue}
        />
      );

    case "challenge_offer":
      return (
        <ChallengeOffer
          exercise={screen}
          onAcceptChallenge={onAcceptChallenge}
          onContinue={onContinue}
        />
      );

    case "completion":
      return (
        <Completion
          exercise={screen}
          onComplete={onComplete}
        />
      );

    default:
      console.warn(`Unknown exercise type: ${exerciseType}`);
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <p>Unbekannter Übungstyp: {exerciseType}</p>
          <button onClick={onContinue}>Weiter</button>
        </div>
      );
  }
}
