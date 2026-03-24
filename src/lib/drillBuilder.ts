import type { Verb } from '../types/verb';
import type { DrillConfig, DrillQuestion, DrillExerciseType } from '../types/drill';
import { VERB_MAP } from '../data/verbs';

// ── Shuffle utility ───────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── MC option generation ──────────────────────────────────────────────────────

/**
 * Generates exactly 4 MC options (1 correct + 3 distractors from same pack).
 * Distractors are drawn from allPackVerbs, excluding the target verb.
 */
export function generateMCOptions(
  verb: Verb,
  optionType: 'meaning' | 'masu' | 'te' | 'negative',
  allPackVerbs: Verb[]
): string[] {
  const getStr = (v: Verb): string => {
    switch (optionType) {
      case 'meaning':  return v.meaning;
      case 'masu':     return v.masuForm.hiragana;
      case 'te':       return v.teForm.hiragana;
      case 'negative': return v.negativeForm.hiragana;
    }
  };

  const correctAnswer = getStr(verb);
  const pool = allPackVerbs.filter(v => v.id !== verb.id && getStr(v) !== correctAnswer);
  const distractors = shuffle(pool).slice(0, 3).map(getStr);

  // Pad if somehow not enough verbs (safety net only — all packs have 10+)
  while (distractors.length < 3) {
    distractors.push('—');
  }

  return shuffle([correctAnswer, ...distractors]);
}

// ── Question factories ────────────────────────────────────────────────────────

function makeTyped(verb: Verb, exerciseType: DrillExerciseType): DrillQuestion {
  let correctAnswer: string;
  switch (exerciseType) {
    case 'type-dict-to-masu': correctAnswer = verb.masuForm.hiragana; break;
    case 'type-masu-to-dict': correctAnswer = verb.dictionaryForm.hiragana; break;
    case 'type-dict-to-te':   correctAnswer = verb.teForm.hiragana; break;
    case 'type-dict-to-neg':  correctAnswer = verb.negativeForm.hiragana; break;
    default:                  correctAnswer = verb.masuForm.hiragana;
  }
  return { verb, exerciseType, correctAnswer, startTime: Date.now() };
}

function makeMcMeaning(verb: Verb, allPackVerbs: Verb[]): DrillQuestion {
  const options = generateMCOptions(verb, 'meaning', allPackVerbs);
  return {
    verb,
    exerciseType: 'mc-meaning',
    correctAnswer: verb.meaning,
    startTime: Date.now(),
    mcOptions: options,
    mcOptionType: 'meaning',
  };
}

function makeMcForm(
  verb: Verb,
  form: 'masu' | 'te' | 'negative',
  allPackVerbs: Verb[]
): DrillQuestion {
  const correctAnswer =
    form === 'masu'     ? verb.masuForm.hiragana :
    form === 'te'       ? verb.teForm.hiragana :
    /* negative */        verb.negativeForm.hiragana;

  const options = generateMCOptions(verb, form, allPackVerbs);
  return {
    verb,
    exerciseType: 'mc-form',
    correctAnswer,
    startTime: Date.now(),
    mcOptions: options,
    mcOptionType: 'form',
  };
}

function makeSentenceFill(
  verb: Verb,
  form: 'masu' | 'te' | 'negative',
  allPackVerbs: Verb[]
): DrillQuestion {
  const correctAnswer =
    form === 'masu'     ? verb.masuForm.hiragana :
    form === 'te'       ? verb.teForm.hiragana :
    /* negative */        verb.negativeForm.hiragana;

  if (verb.exampleSentence) {
    const formKanji =
      form === 'masu'     ? verb.masuForm.kanji :
      form === 'te'       ? verb.teForm.kanji :
      /* negative */        verb.negativeForm.kanji;

    // Try to replace the form's kanji in the sentence to create a blank
    const template = verb.exampleSentence.japanese.replace(formKanji, '___');
    if (template.includes('___')) {
      const options = generateMCOptions(verb, form, allPackVerbs);
      return {
        verb,
        exerciseType: 'mc-sentence-fill',
        correctAnswer,
        startTime: Date.now(),
        mcOptions: options,
        mcOptionType: 'form',
        sentenceTemplate: template,
        sentenceHiragana: verb.exampleSentence.hiragana,
        sentenceEnglish: verb.exampleSentence.english,
      };
    }
  }

  // Fallback: regular MC form question when no sentence available
  return makeMcForm(verb, form, allPackVerbs);
}

// ── Drill builders per form stage ─────────────────────────────────────────────

function buildMasuDrill(
  verbs: Verb[],
  isFirstIntro: boolean,
  allPackVerbs: Verb[]
): DrillQuestion[] {
  const questions: DrillQuestion[] = [];

  for (const verb of verbs) {
    if (isFirstIntro) {
      // 4 questions per verb for first introduction
      questions.push(makeMcMeaning(verb, allPackVerbs));
      questions.push(makeTyped(verb, 'type-dict-to-masu'));
      questions.push(makeMcForm(verb, 'masu', allPackVerbs));
      questions.push(makeSentenceFill(verb, 'masu', allPackVerbs));
    } else {
      // Review drill: 3 questions per verb
      questions.push(makeTyped(verb, 'type-dict-to-masu'));
      questions.push(makeSentenceFill(verb, 'masu', allPackVerbs));
      questions.push(makeTyped(verb, 'type-masu-to-dict'));
    }
  }

  return questions;
}

function buildTeDrill(
  verbs: Verb[],
  isFirstIntro: boolean,
  allPackVerbs: Verb[]
): DrillQuestion[] {
  const questions: DrillQuestion[] = [];

  for (const verb of verbs) {
    questions.push(makeTyped(verb, 'type-dict-to-te'));
    questions.push(makeMcForm(verb, 'te', allPackVerbs));
    questions.push(makeSentenceFill(verb, 'te', allPackVerbs));
    void isFirstIntro; // same sequence regardless — intro handled by DrillIntroduction screen
  }

  // Append 1 ます review question for the last verb (spaced recall)
  const reviewVerb = verbs[verbs.length - 1];
  if (reviewVerb) {
    questions.push(makeTyped(reviewVerb, 'type-dict-to-masu'));
  }

  return questions;
}

function buildNegativeDrill(
  verbs: Verb[],
  isFirstIntro: boolean,
  allPackVerbs: Verb[]
): DrillQuestion[] {
  const questions: DrillQuestion[] = [];

  for (const verb of verbs) {
    questions.push(makeTyped(verb, 'type-dict-to-neg'));
    questions.push(makeMcForm(verb, 'negative', allPackVerbs));
    questions.push(makeSentenceFill(verb, 'negative', allPackVerbs));
    void isFirstIntro;
  }

  // Append 1 ます review question for the last verb
  const reviewVerb = verbs[verbs.length - 1];
  if (reviewVerb) {
    questions.push(makeTyped(reviewVerb, 'type-dict-to-masu'));
  }

  return questions;
}

function buildRecallDrill(verbs: Verb[], allPackVerbs: Verb[]): DrillQuestion[] {
  const questions: DrillQuestion[] = [];
  for (const verb of verbs) {
    questions.push(makeMcMeaning(verb, allPackVerbs));
    questions.push(makeMcForm(verb, 'masu', allPackVerbs));
    questions.push(makeTyped(verb, 'type-dict-to-masu'));
  }
  return questions;
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Builds the full ordered question sequence for a drill.
 * @param config      The drill configuration from getNextDrill()
 * @param allPackVerbs All verbs in the pack (for MC distractor generation)
 */
export function buildDrillQuestions(
  config: DrillConfig,
  allPackVerbs: Verb[]
): DrillQuestion[] {
  const { verbIds, formStage, isFirstIntroduction } = config;
  const verbs = verbIds.map(id => VERB_MAP.get(id)).filter(Boolean) as Verb[];

  if (verbs.length === 0) return [];

  switch (formStage) {
    case 'masu':     return buildMasuDrill(verbs, isFirstIntroduction, allPackVerbs);
    case 'te':       return buildTeDrill(verbs, isFirstIntroduction, allPackVerbs);
    case 'negative': return buildNegativeDrill(verbs, isFirstIntroduction, allPackVerbs);
    case 'recall':   return buildRecallDrill(verbs, allPackVerbs);
    default:         return buildMasuDrill(verbs, isFirstIntroduction, allPackVerbs);
  }
}
