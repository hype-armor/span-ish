# Learning design

Why the app drills the way it does, what evidence that rests on, and where it
knowingly departs from the evidence.

This exists so that changes to the drill mechanics get argued against something
other than intuition. If you are adding content, the checklist at the bottom is
the part you need. If you are changing the scheduler or a card format, read the
principle it touches first — several of the current choices are deliberate, and
one or two are known compromises rather than conclusions.

Numbers below come from `npm run stats`, which reads the real decks. Re-run it
rather than trusting the snapshot; it moves whenever content is added.

```
total cards            398
  typed production     209 (53%)
  multiple choice      189 (47%)
    of those, binary   106 (56% of choice cards)
  practised in context 107 (27%)
  listening             30 (8%)
```
*(snapshot: August 2026)*

---

## The principles the app is built on

### 1. Every item is a retrieval attempt, never a re-read

The testing effect is the best-replicated finding in this literature: being
asked to produce an answer beats re-studying the same material, and the gap
widens as the delay grows (Roediger & Karpicke, 2006).

**In the app:** every card is a retrieval event. The codex exists to be read
once; nothing in the scheduler ever re-presents material for study.
`src/components/Mission.jsx` has no "show me this again" path — only answer,
feedback, advance. That holds in every mission mode: a timer running out is a
failed attempt, and a failed attempt still gets its answer and its reason.

**Do not** add a card format that shows the answer before asking for it.

### 2. Items are scheduled individually, by decay, and the schedule is measured

Distributed practice beats massed practice across 839 assessments in 317
experiments (Cepeda, Pashler, Vul, Wixted & Rohrer, 2006). The interval that
maximises retention grows with the delay you are aiming at.

**In the app:** `src/lib/srs.js` keeps per-item `ease`, `interval` and `due`.
A round is drawn by weighted sampling on how overdue each item is, with 40% of
each round reserved for unseen material so a backlog cannot crowd out new
content.

Because the right intervals cannot be read off the literature, the app also
records how each one performs: `tallyReview` files every answer into a band by
the interval that preceded it, and the Lab reports success rate per band.
Bands rather than a log of every review — bounded, aggregatable, and it survives
export and merge. Merging takes the larger side per band rather than the sum, so
that merging the same export twice stays a no-op.

### 3. The Arena interleaves, and distractors are always real

Interleaved practice beats blocked practice (Rohrer & Taylor, 2007). The
mechanism matters for how we build cards: Birnbaum, Kornell, E. Bjork & R. Bjork
(2013) found interleaving helped inductive learning while **temporal spacing
alone did not**, because interleaving is what puts confusable categories next
to each other. The benefit comes from discrimination, not from variety.

**In the app:** the Arena mixes all ten modules, and every wrong answer is
a genuine competing form — `viene`/`venga`, `visité`/`visitaba`,
`tuviera`/`tendría`, `el`/`la`. The `conf` field in `content/tenses.js` and
`content/connectors.js` lets an author name the specific confusion a card should
train against, instead of leaving the distractor to chance.

**This is the app's strongest alignment with the evidence, and the easiest to
break.** A card whose wrong answers can be eliminated on sight trains nothing.
The content linter enforces the weak version of this (options must differ, the
answer must be among them); the strong version — that a distractor is genuinely
confusable — is a judgement call for whoever writes the card.

### 4. A failed attempt, then immediate feedback

Kornell, Hays & Bjork (2009) found that failing a test and then being shown the
answer beat simply being shown the answer. The benefit appeared with
**immediate** feedback and did not appear with delayed feedback.

**In the app:** the "I don't know" button forces a commitment before the reveal,
and every card carries a `why` shown the instant the answer is submitted. The
error is the mechanism, not a waste — which is also why a miss is never hidden
or skipped past.

**Do not** move feedback behind an extra tap, or batch it to the end of a round.
That is the condition under which the effect disappears.

An explanation that uses a word you do not know explains nothing, so the grammar
terms in it are clickable: `content/glossary.js` defines them and a definition
opens in place. It is deliberately a modal rather than a link away — leaving the
drill to look something up is how a session ends.

### 5. Production over recognition, where production is possible

Kang, McDermott & Roediger (2007) found short-answer testing produced better
retention three days later than multiple choice, and that feedback helped the
short-answer condition more. Multiple choice still beats no testing at all — it
is the weaker tool, not a useless one.

**In the app:** slightly over half the cards are typed (`npm run stats` for the
current split). Answers are graded loosely — accents forgiven — except dictation,
where `strict` keeps the ñ required.

### 6. Practise in the shape you will use it

Verbs are drilled inside sentences with a blank rather than as bare paradigms,
so the retrieval cue resembles the situation the knowledge is for.

**In the app:** roughly a quarter of cards are a blank inside a sentence
(`npm run stats`). Every such card carries a translation, and the explanation
shows the completed sentence.

### 7. Rules first, then application

Los Cimientos drills the rules themselves; every other region drills applying
them. This split exists because the app previously asked learners to recall a
rule and apply it in a single step, which loads two things at once. It is also
why it is the region the map opens with: everything downstream is cheaper once
the rule itself is free.

### 7a. A rule is only learned if it reaches a word you have not met

Principle 7 splits knowing a rule from applying it. This one is about the gap
underneath both: a card drilled to mastery proves the *card* is known, and says
nothing about whether the rule generalises.

Every card in this app is drawn from a frozen authored pool, and every number it
reports — XP, `masteryPoints`, region fill, the interval bands and their 85–90%
target — is computed on cards already seen. That makes memorisation and
induction indistinguishable from inside: a learner who has learned four hundred
pairs and one who has learned the rules produce identical readings. The stable
id rule, which exists for good scheduling reasons, is exactly the condition that
makes item-level memorisation both most likely and least detectable.

Birnbaum, Kornell, Bjork & Bjork (2013) is cited under principle 3 for
interleaving, but its subject is *inductive* learning — the ability to classify
new instances, not to recall studied ones. The measure it implies is one this
app did not have.

**In the app:** occasional held-out items, drawn by rule from words never shown
as cards. `src/lib/probe.js`. They are answered and explained like any other
card and then discarded, and El Laboratorio reports drilled accuracy beside
never-seen accuracy.

Four properties make a probe a measurement rather than more cards, and all four
are load-bearing:

- **It never becomes a scheduled item.** Probing spends the item — a held-out
  set that entered the schedule would be a memorised set within three sessions,
  which is the disease.
- **It pays nothing.** No XP, goal, streak, mastery or region fill, and not the
  combo either. See below.
- **It is never repeated.** One cursor per family doubles as the denominator, so
  the two cannot disagree.
- **It says so on the card.** This costs a little validity and buys honesty; in
  an app whose Lab is the place nothing is dressed up, hiding it would be out of
  character.

**Do not** report a single derived "generalisation score". It would be
currency-shaped, it would hide the sample size, and the contrast is confounded
anyway: scheduled items are asked at the edge of forgetting, held-out ones are
always at first sight. Two columns and a caveat, read the way the interval bands
are read.

**Do not** grade a held-out item against a generator. The suffix converter is a
heuristic that omits written accents by design and has real gaps; it is used
here as an oracle in CI — every taught and held-out pair must agree with what it
derives — and never as a source of answers. That gate rejected 20 of 150
candidate pairs, in every case because the word needed Spanish orthography on
top of the ending swap, which is not what the probe is asking about.

### 8. Reading and answering are different activities, and live apart

The reference material used to sit above each drill, which meant it was always
in the way and never actually studied. It is now a codex you open on purpose.
Nothing was dropped in the move — every table, every paragraph — but nothing is
passively scrolled past on the way to a card either.

A region's codex is several chapters rather than one page, and the chapters
break where the argument breaks — not where the screen runs out. A chapter is
one idea with a title that covers all of it: the rule about the preterite's
two wrinkles sits with the strong preterite table it is about, and the four
verbs that change meaning rather than tense are their own chapter instead of a
sentence tacked onto the end of another. The chapter names are visible along
the bottom, so the structure of a region can be read without stepping through
it. A chapter that is one paragraph long is not a mistake; it means the
argument turned there.

The two halves are also built differently, and deliberately. A codex chapter
scrolls, because it is a document. A card does not: everything the question
needs is on screen at once. Asking someone to go looking for the rest of a
question *during* a retrieval attempt adds load that has nothing to do with the
material, and the retrieval is the part with the evidence behind it.

---

## The game layer

Added after the principles above, and constrained by them. The app is now a
map of eleven regions with missions, XP, a streak, levels, quests and badges —
"extreme gamification" was the brief — so this section exists to say what each
mechanic is attached to and why it cannot drift.

The evidence is genuinely mixed and the design follows the caveats more closely
than the headline. Meta-analyses find gamification helps: Zeng et al. (2024)
report a moderate effect on academic performance, and Kim & Castelli (2021)
find small-to-moderate effects that differ by outcome type. But the same
literature reports high heterogeneity, novelty effects, and heavy dependence on
design — the effect belongs to particular mechanics, not to "gamification".
Against that, Deci, Koestner & Ryan (1999) is the reason to be careful: tangible
rewards contingent on doing a task reliably undermine intrinsic motivation for
it. A reward layer bolted onto something a learner already wants to do can make
them want it less.

### The rule everything follows

**Every reward is a readout of the review schedule, not a currency of its own.**
There is no number in the app that can be moved by doing something other than
the work the scheduler asked for. Concretely:

| Mechanic | What it is actually measuring |
| --- | --- |
| XP | Retrievals of items that were **due** (or never met). Reviewing early pays `XP_EARLY`, a fifth of the rate. |
| Cram detector | A run under 25% scheduled material pays a quarter, and the results screen says why. |
| Combo | Consecutive correct answers *within* a mission. Never persisted. |
| Daily goal | Scheduled items answered right — not minutes, not cards seen, not sessions opened. |
| Streak | Days the goal was met. |
| Level | `masteryPoints`: every item weighted by its interval band. Only lengthening intervals move it. |
| Region fill | The share of that region's items at `solid` or better. |
| Boss | Drawn from your own highest-lapse, lowest-ease items. |

Held-out probes are the one card type that pays into none of these rows, and
that is consistency rather than an exception: the rule is that a number moves
only for work the scheduler asked for, and a probe is by definition not that.
It buys the one thing the game layer cannot otherwise offer — a reading that its
own scoring cannot reach.

The point of the table is that none of these rows can be gamed by grinding easy
material, because none of them counts easy material. `tools/test-lib.js` asserts
this directly — "replaying easy material earns a fraction of doing the work",
"answering the same three cards forever cannot raise the level".

### The streak, specifically

Streaks are the mechanic with the clearest retention evidence and the clearest
failure mode. The reported behaviour is that learners protect the streak by
speed-running whatever is cheapest, which triggers the retention machinery
without the learning. The counter here is that **the streak cannot be claimed
by opening the app**: it advances only when the day's goal of scheduled items
is cleared. Doing the easy thing does not defend it.

The other adjustment is a banked grace day, refilled every seventh day, so one
missed day costs a resource rather than the streak. A streak that shatters on
the first bad day stops being worth protecting, and the loss-aversion pull that
makes it work at all depends on it being worth protecting.

### Difficulty, and where the pressure is allowed

Region unlocks are deliberately a low bar — two cleared missions, not mastery —
because the aim is to stay just past current skill (the "zones of proximal
flow" framing: challenge tuned to skill, with the scheduler dragging older
material forward into everything downstream anyway). Gating on mastery would be
truer to the material and would leave a learner staring at one region for a
fortnight.

Within a region the four missions escalate, and **a clock only ever runs on
cards you answer by choosing** (`TIMED_MODES`). Putting a timer on a typed
retrieval trades the retrieval — the thing with the evidence behind it — for
drama. Recon, the first mission in every region, has no clock and no penalty at
all, because meeting new material under pressure is a bad trade.

### Deliberately not built

- **Leaderboards.** No server, and single-player besides — but also the element
  most implicated in demotivating learners who are not near the top.
- **Purchasable streak repair, lives, or any resource bought with XP.** Every
  one of them makes the reward a currency, which is the thing the design is
  organised to avoid.
- **Rewards for time spent or sessions opened.** Both are measures of
  attendance.
- **Any card format that shows the answer before asking for it**, however good
  it would look. See principle 1.

### The part that is a judgement call

Whether any of this helps is not something the app can tell you, and the
novelty effect means the first few weeks would flatter it even if it did not.
The Lab is the counterweight: it reports success rate per interval band in
plain numbers, with no game layer on top, and that is the thing to read if the
question is whether the app is working.

---

## Known divergences

### The first interval — set deliberately, still provisional

Cepeda, Vul, Rohrer, Wixted & Pashler (2008) mapped the optimal gap against the
retention interval: about **20% of the target delay** when that delay is a few
weeks, falling to about **5% at one year**. The ratio declines; it is not a
constant.

Separately, Karpicke & Roediger (2007) found expanding schedules beat
equal-interval ones on an immediate test but *lost* to them two days later, and
concluded that **the placement of the first retrieval attempt mattered more than
the relative spacing of later ones**.

**Current values** (`src/lib/srs.js`): first interval **3 days**, second **8
days**, then `interval × ease` with ease starting at 2.4 (range 1.3–2.9, +0.06
per hit, −0.22 per miss).

These were 1 and 3 days. They were raised for a learner studying roughly three
times a week: at that rhythm a 1-day interval collapses to whenever the next
session happens anyway, so it was doing even less than it looked. 3 days lands on
the following session and 8 on the third or fourth.

They remain **shorter than the ridgeline suggests** — against a six-month target
it would put the first gap nearer two weeks. That is deliberate. Cepeda's items
were learned to criterion before the gap started; these are seen once, and a
fortnight on a once-seen card risks forgetting it completely rather than
recalling it with effort. The current values are a step toward the evidence, not
an arrival at it.

The ease machinery is inherited SM-2 shape and carries more apparent precision
than the evidence supports. It is not harmful, and it is not the thing to tune
next — the first interval is.

**Do not tune these from the literature alone.** The right values depend on the
retention target, which is still unstated. See Open questions.

### The in-session retry — removed

A missed card used to be appended to the same round. That is massed practice: the
second attempt is answered out of short-term memory, so it mostly inflates the
sense of knowing. The value of a miss is taken at the moment of feedback
(Kornell, Hays & Bjork, 2009), and a miss already sets `due = now`, so the card
returns in the next session regardless — the repeat was close to redundant.

**Status:** removed. A mission now ends with a miss unresolved, which feels
worse and is meant to. Mission size is the lever that was moved instead: a run
is 6–14 cards rather than 10–14, so a bad one is over sooner and the next one
starts from zero.

### Half the cards are recognition

Just under half the cards are multiple choice. This is defensible where the
construct genuinely is a two-way discrimination — `el`/`la`, subjunctive/indicative, preterite/imperfect —
and a majority of the choice cards are exactly that. It is weaker for cards where
typing was available, such as the verb-paradigm cards on the Rules deck
("Which endings?").

**Status:** partly principled, partly convenience.

An earlier draft of this document recommended converting the paradigm cards to
typed. **That recommendation was wrong and has been withdrawn.** The answers are
strings like `-o, -as, -a, -amos, -an`, and the normaliser in `src/lib/text.js`
strips commas but not hyphens — so a learner who knows the paradigm and types
`o as a amos an` is marked wrong. That is a false negative on an easy card, which
is worse than the recognition format it was meant to replace.

The version worth doing instead is to **add** single-form typed cards — "nosotros
preterite of hablar" → `hablamos` — which buys the production benefit without the
punctuation trap. Not yet implemented.

### Nothing above a single blank

No card asks for a whole sentence. The gap between recognising `tuviera` and
constructing a sentence around it is real, and the app currently does not cross
it.

### Listening is thin, but no longer word-only

8% of cards. `content/sound.js` holds 16 single words; `content/listening.js`
adds 14 sentences, each chosen to carry a feature El Oído teaches — silent
h, the j rasp, ll, ñ, trilled rr, x — inside ordinary speech rather than a
demonstration.

Both are graded with `strict`, which in this app means accents forgiven and ñ
required. Demanding every accent on a whole sentence would turn a listening
exercise into a spelling test.

**Still thin.** Fourteen sentences is a start on connected speech, not coverage
of it.

### This is not a vocabulary programme

Roughly 19 mexicanismos and 16 connectors are taught explicitly. Conversational
coverage needs thousands of word families. The app's answer to vocabulary is the
suffix transformer — cognate rules that unlock words already known in English —
rather than word lists, and that is a deliberate choice. It should not be
mistaken for coverage.

---

## Open questions

The first of these is now measured rather than guessed at. **Lab → How the
schedule is doing** files every answer under the interval that preceded it, so
success rate can be read against gap length instead of against impressions.
Read a row only once it has twenty or so answers behind it (`MIN_REVIEWS_TO_READ`).

Roughly 85–90% held at a given interval is the target. Materially above that and
the gap is shorter than it needs to be — you are paying in reviews for retention
you already had. Materially below and the material is decaying before it comes
back.

1. **Are 3 and 8 days right?** Read the `1–3 days` and `4–9 days` rows. If both
   sit well above 90%, lengthen `FIRST_INTERVAL` and `SECOND_INTERVAL`. If
   `4–9 days` falls away while `1–3 days` holds, the second interval is reaching
   too far. Change one at a time, and give it a few weeks — that is roughly how
   long it takes for a band to gather enough answers to mean anything.
2. **Is 40% new material per round right?** (`buildRound` in `src/lib/srs.js`.)
   Too high and the backlog never clears; too low and new content stalls.
3. **Did removing the retry hurt motivation?** The evidence says the repeat was
   not teaching much. Whether missions now end too bleakly is a question only
   use can answer — and one the game layer was partly built to answer, since a
   run that ends badly still pays out mastery and still moves the day's goal.
6. **Is the game layer helping or just present?** The honest answer is that we
   cannot tell from inside the app. What *can* be watched is whether the
   interval bands get worse after it landed: if success rates fall while
   sessions get more frequent, the mechanics are buying attendance at the cost
   of attention, which is the failure mode the design is most exposed to.
4. **Are the loose-grading rules too forgiving?** Accents are forgiven outside
   dictation. That is a deliberate trade of orthographic precision for flow.
5. **Which cards are badly written?** The same panel lists items missed three
   times or more. A card that keeps coming back is more often ambiguous, or has
   a wrong answer that is actually defensible, than genuinely hard. Treat it as
   a list of content to review.

---

## Checklist for new content

- [ ] **Are the wrong answers genuinely confusable?** A distractor that can be
      ruled out on sight makes the card free. Prefer another real form of the
      same verb, or name the confusion in `conf`.
- [ ] **Could this be typed instead of chosen?** Default to typed unless the
      construct really is a binary choice.
- [ ] **Does the card carry a `why`?** Feedback is what converts a miss into
      learning, and it has to be there the moment the answer is submitted.
- [ ] **Is it practised in the shape it will be used?** A blank in a sentence
      beats an isolated form, where a sentence makes sense.
- [ ] **Is the id stable?** Review history is keyed on it. Changing the field an
      id derives from retires the card and starts its history over.
- [ ] **Run `npm run check` and `npm run stats`.** The linter catches structural
      mistakes; the stats show whether the recognition/production balance moved.

---

## References

- Birnbaum, M. S., Kornell, N., Bjork, E. L., & Bjork, R. A. (2013). Why
  interleaving enhances inductive learning: The roles of discrimination and
  retrieval. *Memory & Cognition*, 41, 392–402.
- Deci, E. L., Koestner, R., & Ryan, R. M. (1999). A meta-analytic review of
  experiments examining the effects of extrinsic rewards on intrinsic
  motivation. *Psychological Bulletin*, 125, 627–668.
- Kim, J., & Castelli, D. M. (2021). Effects of gamification on behavioral
  change in education: A meta-analysis. *International Journal of Environmental
  Research and Public Health*, 18, 3550.
- Nicholson, S. (2015). A RECIPE for meaningful gamification. In *Gamification
  in Education and Business*, 1–20.
- Zeng, J., Sun, D., Looi, C.-K., & Fan, A. C. W. (2024). Exploring the impact
  of gamification on students' academic performance: A comprehensive
  meta-analysis of studies from 2008 to 2023. *British Journal of Educational
  Technology*, 55, 2478–2502.
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006).
  Distributed practice in verbal recall tasks: A review and quantitative
  synthesis. *Psychological Bulletin*, 132, 354–380.
- Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., & Pashler, H. (2008).
  Spacing effects in learning: A temporal ridgeline of optimal retention.
  *Psychological Science*, 19, 1095–1102.
- Kang, S. H. K., McDermott, K. B., & Roediger, H. L. (2007). Test format and
  corrective feedback modify the effect of testing on long-term retention.
  *European Journal of Cognitive Psychology*, 19, 528–558.
- Karpicke, J. D., & Roediger, H. L. (2007). Expanding retrieval practice
  promotes short-term retention, but equally spaced retrieval enhances long-term
  retention. *Journal of Experimental Psychology: Learning, Memory, and
  Cognition*, 33, 704–719.
- Kornell, N., Hays, M. J., & Bjork, R. A. (2009). Unsuccessful retrieval
  attempts enhance subsequent learning. *Journal of Experimental Psychology:
  Learning, Memory, and Cognition*, 35, 989–998.
- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking
  memory tests improves long-term retention. *Psychological Science*, 17,
  249–255.
- Rohrer, D., & Taylor, K. (2007). The shuffling of mathematics problems improves
  learning. *Instructional Science*, 35, 481–498.

Findings are summarised from these sources; the applications to this app are our
own and are not claims the authors made. Where a recommendation here rests on
judgement rather than a result — the retry loop, the new-material ratio — it is
marked as such.
