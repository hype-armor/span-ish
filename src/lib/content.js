/* The decks live in content/*.js, which index.html loads as plain scripts
   before this bundle. They land on window.MX; this module is the single
   place that reads it, so nothing else has to know that. */
const MX = window.MX || {};

export const suffixes = MX.suffixes;
export const converterExamples = MX.converterExamples;

export const vowels = MX.vowels;
export const consonants = MX.consonants;
export const xSounds = MX.xSounds;
export const stressRules = MX.stressRules;
export const dictation = MX.dictation;

export const irregularVerbs = MX.irregularVerbs;
export const verbSentences = MX.verbSentences;

export const periphrasis = MX.periphrasis;

export const subjunctiveTriggers = MX.subjunctiveTriggers;
export const subjunctiveSentences = MX.subjunctiveSentences;

export const genderEndings = MX.genderEndings;
export const genderNouns = MX.genderNouns;
export const genderExceptionTable = MX.genderExceptionTable;

export const mexicanismos = MX.mexicanismos;
export const diminutives = MX.diminutives;

export const connectors = MX.connectors;

export const ruleGenderExceptions = MX.ruleGenderExceptions;
export const ruleVerbForms = MX.ruleVerbForms;
export const ruleVerbEndings = MX.ruleVerbEndings;
export const ruleFacts = MX.ruleFacts;
export const ruleSubjunctive = MX.ruleSubjunctive;
export const ruleSubjunctiveForms = MX.ruleSubjunctiveForms;
export const ruleAccents = MX.ruleAccents;
