export type VerbGroup = 1 | 2 | 3;

export type ConjugationForm = {
  kanji: string;
  hiragana: string;
  romaji: string;
};

export type Verb = {
  id: string;
  group: VerbGroup;
  dictionaryForm: ConjugationForm;
  masuForm: ConjugationForm;
  teForm: ConjugationForm;
  negativeForm: ConjugationForm;
  meaning: string;
  exampleSentence?: {
    japanese: string;
    hiragana: string;
    english: string;
  };
  tags: string[];
};
