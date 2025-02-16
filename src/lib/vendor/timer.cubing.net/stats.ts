import type { ExperimentalMillisecondTimestamp } from "cubing/twisty";
import type { ResultForTimedAttempt } from "../../elements/SharedState";

type TimeParts = {
  secFirst: string;
  secRest: string;
  decimals: string;
};

function timeParts(time: ExperimentalMillisecondTimestamp): TimeParts {
  // Each entry is [minimum number of digits if not first, separator before, value]
  const hours = Math.floor(time / (60 * 60 * 1000));
  const minutes = Math.floor(time / (60 * 1000)) % 60;
  const seconds = Math.floor(time / 1000) % 60;

  function pad(number: number, numDigitsAfterPadding: number) {
    let output = `${number}`;
    while (output.length < numDigitsAfterPadding) {
      output = `0${output}`;
    }
    return output;
  }

  let secFirstString = "";
  let secRestString: string | undefined;
  if (hours > 0) {
    secRestString = `${hours}:${pad(minutes, 2)}:${pad(seconds, 2)}`;
  } else if (minutes > 0) {
    secRestString = `${minutes}:${pad(seconds, 2)}`;
  } else {
    secRestString = `${seconds}`;
    if (secRestString[0] === "1") {
      secFirstString = "1";
      secRestString = secRestString.substr(1);
    }
  }

  const centiseconds = Math.floor((time % 1000) / 10);

  return {
    secFirst: secFirstString,
    secRest: secRestString,
    decimals: `${pad(centiseconds, 2)}`,
  };
}

export function formatResultForTimedAttempt(
  result: ResultForTimedAttempt,
): string {
  if (typeof result === "string") {
    return result;
  }

  const parts = timeParts(result);
  return `${parts.secFirst + parts.secRest}.${parts.decimals}`;
}
