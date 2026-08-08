# Jerry Can Spirits — Cocktail Page Writing Standard

The standard every cocktail page is written and reviewed against. Binding.

`docs/VOICE.md` governs the brand voice across the whole site and takes
precedence where the two overlap; this document is the cocktail-page
specification that sits under it. `docs/GUIDE_CONTENT_TEMPLATE.md` is the
equivalent for guides.

**Write about the drink, never about the page.** This is the rule that produced
this document, and it is the one most often broken. A page that discusses its
own existence, its sources, its place in a list, or the CMS it lives in is
writing about the wrong subject. Measured across the corpus on 8 August 2026:
69 references to a "doc" (a Sanity document), 67 to "this page", 12 crediting a
competitor as the authority, and 5 to a private working list. None of those
tell a reader anything about a drink. `scripts/audit-formulaic-copy.ts` counts
them; run it after any copy pass.

---

## 0. The gold standard: Storm & Spice

**`/field-manual/cocktails/storm-and-spice/` is the reference page.** When a rule
here and that page disagree, the page wins and this document is wrong. Read it
before writing or editing any cocktail page.

Every number below was re-derived from it on 8 August 2026. The earlier
figures were guesses, and the exemplar failed four of them: a description of
182 words against a stated 100-180, an Expert Tip of 150 against a stated
50-100, and FAQ answers of 37, 48 and 38 against a stated 50-100. A standard
its own best example cannot pass is measuring the wrong thing. An audit run
against those numbers reported 348 of 349 pages failing on FAQ length alone,
which was the ruler being wrong rather than the corpus.

### What the page actually does

**No self-reference at all.** Nine hundred words without one mention of this
Manual, a page, a chair, a shelf or a slot. This is the largest single
difference between it and the weaker pages, and it is the rule in the preamble
above.

**Plain declarative sentences carrying one idea each.** "The ginger beer is the
same. The result is not." "The heat is not a problem. It is the point." The
weaker register writes literary prose *about* a drink; this writes useful prose
*for* the person making one. Where a sentence stacks three metaphors, it has
changed register.

**A whole section explaining why the drink works.** "Why Spiced Rum Works Here"
argues that the ginger picks up the clove and cinnamon from the rum, so "the
spice feels woven in rather than added on top". That is architecture, in the
sense of section 9, not another description of the recipe.

**Structure that earns the length.** Five headings, each with a separate job:
Where It Comes From, Why Spiced Rum Works Here, The Float, Ginger Beer Not
Ginger Ale, Ice.

**History hedged where it is uncertain.** "A sailor *reportedly* held up the
drink..." and "The history behind it is genuine."

**The product present because it is the drink**, not because the page is
selling. Expedition Spiced Rum is the subject of the comparison with Gosling's,
which is the honest reason to name it.

### The two registers

The corpus contains two kinds of writing. The first was written a page at a
time and mostly carries a photograph. The second was generated in bulk and
mostly does not. MEASURED 8 August 2026 across 349 cocktails: pages with an
image average 0.54 self-referential phrases and 61% carry none; pages without
average 1.51 and only 29% carry none.

That makes an image a useful **prior** and a poor filter: 37 pages with images
still self-refer, and 73 without images are already clean. Order the work by
measured self-reference, not by whether a photograph exists.

---

## 1. The overall voice

Every cocktail page should sound like it was written by **the same knowledgeable bartender who has actually made the drink**, not by an SEO writer, recipe database or AI.

The voice is:

* **Knowledgeable, not academic**
* **Confident, not arrogant**
* **Conversational, but not casual**
* **Opinionated where experience justifies it**
* **Specific rather than generic**
* **Historically informed without becoming a history essay**
* **Practical enough that someone can make the drink successfully**
* **Occasionally dry or wry, but never gimmicky**

The writing should feel like:

> "We've made this drink. We know what matters. Here's how to make it properly."

Avoid:

* "This delicious cocktail is perfect for..."
* "Whether you're a seasoned mixologist or a beginner..."
* "A tantalising blend of..."
* "Indulge in..."
* "Embark on a journey..."
* "Elevate your cocktail experience..."
* Generic claims about something being "refreshing", "delightful", "decadent" or "perfect for any occasion" unless there is a specific reason to say it.
* Excessive exclamation marks.
* Forced humour.
* Bartender clichés.
* Talking down to the reader.

---

## 2. The golden rule

**Every paragraph must tell the reader something useful, interesting or specific about this particular drink.**

Do not write a paragraph simply because the template has space for one.

If two cocktails have similar histories, techniques or ingredients, the wording should still focus on what makes each drink different.

The pages should be **consistent in structure, not repetitive in content**.

---

## 3. Opening description

### Purpose

The opening description is the reader's first proper introduction to the cocktail.

It should answer:

1. What is the drink?
2. Why is it interesting?
3. What makes it distinctive?
4. What should the reader expect from it?

### Length

Approximately **150–200 words**, in two or three paragraphs. Storm & Spice is
182 across three: what the drink is and why the spice works, then the origin,
then the technique in one line.

### Rules

* Start with the cocktail itself, not a generic introduction.
* Establish its character quickly.
* Mention its history/origin briefly if it is important to understanding the drink.
* Explain unusual combinations or structures where relevant.
* Give a clear opinion when there is one worth giving.
* Introduce the reader to the main technical consideration without turning the opening into instructions.
* Do not repeat the ingredient list mechanically.

### Preferred style

"X is a classic..." is acceptable when followed immediately by something interesting.

Avoid:

> "The X cocktail is a delicious and refreshing drink made with..."

Prefer:

> "The X is an unusual member of the classic cocktail repertoire..."

### Important

The opening should make the reader want to **make the drink**, not merely know what ingredients it contains.

---

## 4. Ingredients

Ingredient entries should be **practical and specific**.

Every ingredient should have:

* Ingredient name
* Quantity
* A short note explaining something that actually matters

### Ingredient notes should answer questions such as:

* What type/quality should I use?
* Why does this ingredient matter?
* What substitution would materially change the drink?
* Is freshness important?
* Is there a storage consideration?
* Is there a particular brand/style that works particularly well?
* What mistake do people commonly make with this ingredient?

### Rules

**Never write an ingredient note just to fill space.**

Bad:

> "Fresh lime juice adds a delicious citrus flavour to the cocktail."

Better:

> "Squeeze immediately before use. Lime juice loses brightness quickly and the difference is noticeable in a drink this simple."

### Brand recommendations

Brand recommendations are allowed when they are genuinely useful.

They should explain **why** the product works.

Do not turn ingredient notes into advertising copy.

---

## 5. Instructions

Instructions should be written for someone who wants to make the drink correctly on their first attempt.

### Rules

* Number every step.
* One meaningful action per step.
* Use precise quantities and timings where they matter.
* State preparation steps that materially affect the result.
* Mention chilling, dilution, temperature and straining where relevant.
* Do not explain obvious actions unnecessarily.
* Do not use flowery language.

### Always favour:

> "Shake hard for 12–15 seconds."

over:

> "Give the cocktail a vigorous shake to beautifully combine all the ingredients."

### Technical precision matters

Where a technique materially affects the drink, specify it:

* Shake duration
* Stir duration
* Double strain
* Type of ice
* Glass temperature
* Whether ice should be added before or after another ingredient
* Whether garnish should be expressed, slapped, twisted, etc.

---

## 6. Expert Tip

The Expert Tip is **not a summary of the recipe**.

It should contain one genuinely useful piece of experience.

Think:

> "What would an experienced bartender tell someone after watching them make this?"

Good subjects include:

* The ingredient most likely to ruin the drink
* A common mistake
* A useful substitution
* A specific technique
* Balance
* Temperature
* Dilution
* Ingredient quality
* How to adjust the drink without destroying its character

### Length

**100–160 words, in two or three short paragraphs, one insight each.** Storm &
Spice runs 150 across three: pour the ginger beer first and float the rum, watch
it settle before stirring, and use the fiercest ginger beer you can find because
a timid one makes a timid drink.

### Rule

**One strong insight is better than three mediocre tips.** Three genuine ones,
each given its own paragraph and its own reason, is better still. What is
forbidden is padding to reach three.

---

## 7. Flavour Profile

Use a small number of meaningful descriptors.

Normally:

**4–6 descriptors**

Descriptors should describe the actual drink rather than generic marketing language.

Good:

* Smoky
* Cherry
* Citrus
* Herbal
* Bitter
* Dry
* Rich
* Spiced
* Aromatic

Avoid vague words such as:

* Delicious
* Amazing
* Refreshing
* Enjoyable
* Perfect

---

## 8. The Long Description / "The Origin"

The long-form content is where the page earns its authority.

It should **expand the reader's understanding of the cocktail**, rather than simply making the opening description longer.

Use logical subheadings.

Potential sections include:

* The Origin
* The History
* The Structure
* The Spirit Question
* Why It Works
* The Name
* How to Serve It
* The Modern Version
* The Technique
* The Ingredients

Do not force every cocktail into the same headings.

### Core rule

**Use the sections that genuinely explain this cocktail.**

A historical cocktail may need:

> The Origin
> The Name
> The Structure
> How to Serve It

A modern cocktail may instead need:

> The Inspiration
> Why It Works
> The Spirit
> Building the Drink

### Historical accuracy

Do not present uncertain history as fact.

Use language such as:

* "It is generally attributed to..."
* "The earliest known reference..."
* "The exact origin is unclear..."
* "What is established is..."
* "The drink appears in..."

Do not invent certainty to make the prose sound authoritative.

The Blood & Sand page demonstrates this particularly well by separating what is established from what is uncertain.

### Length

Typically **450–650 words across four or five headed sections**, depending on
how much there genuinely is to say. Storm & Spice is 547 across five.

The sectioning matters more than the total. Five headings each doing a
different job is the shape; one long unheaded essay of the same length is not.

A famous cocktail with a complicated history can justify more.

A simple modern cocktail should not be padded to hit a word count.

---

## 9. Explain WHY the drink works

This is one of the most important principles for Jerry Can Spirits cocktail pages.

Where possible, explain the relationship between the ingredients.

Don't just say:

> "The cocktail contains whisky, vermouth and cherry liqueur."

Explain:

> "The whisky provides the structure, while the vermouth adds body and wine character. The cherry liqueur pushes the drink towards sweetness, leaving the citrus to provide the acidity that stops it becoming heavy."

The reader should come away understanding **the architecture of the drink**.

The Blood & Sand's "The Structure" section is a good model: it explains what each component contributes rather than simply describing the recipe again.

---

## 10. Spirit section

The spirit section connects the cocktail to the wider Jerry Can Spirits Field Manual.

It should:

* Identify the base spirit.
* Give a concise explanation of that spirit.
* Explain what style works best in the cocktail where relevant.
* Link to the relevant spirit/ingredient guide.

### Do not make every cocktail page sell the spirit.

The purpose is **education and navigation**, not advertising.

If Jerry Can Spirits has a relevant product, it can be mentioned naturally where appropriate, but the cocktail should remain credible if the reader never buys anything from us.

---

## 11. FAQ

Every cocktail should have **3–4 genuinely useful questions**.

Do not manufacture questions purely for SEO.

### Questions should usually cover:

* What is this cocktail?
* Where did it come from?
* What spirit/ingredient should I use?
* How strong is it?
* Can I substitute X?
* Why is it called X?
* Is there a recognised variation?
* Can I make it ahead?
* What glass should I use?

### Rules

Questions must be specific to the cocktail.

Avoid generic FAQ questions appearing unchanged on every page.

For example, do not automatically use:

> What is a Blood & Sand?
> Where did it originate?
> What ingredients are in it?

for every cocktail with only the names changed.

The questions should reflect what is actually interesting or commonly misunderstood about that particular drink.

Answers should generally be **35–60 words**. Storm & Spice runs 37, 48 and 38.
An FAQ answer is the short version on purpose: the long-form section is where
the argument goes, and a 90-word answer is usually the long description
repeating itself, which section 16 forbids.

---

## 12. Technique guides

Only link to techniques that are actually relevant to making the drink.

Examples:

* How to Shake a Cocktail Like a Pro
* How to Stir a Cocktail
* How to Double Strain
* How to Express a Citrus Peel
* How to Make Clear Ice

### Rule

**Don't link a technique guide simply because it exists.**

If the technique is incidental, the recipe instructions are enough.

If technique is important to the outcome, link it.

The Blood & Sand appropriately links to the shaking guide because shaking is central to the preparation.

---

## 13. You Might Also Like

The related cocktails should have a reason for being related.

Prioritise:

1. Same base spirit
2. Similar flavour profile
3. Similar construction/technique
4. Similar historical period or cocktail family
5. Similar drinking experience

Do not simply recommend random popular cocktails.

### The three recommendations should ideally offer variety

For example:

**Similar structure**
A cocktail with a related construction.

**Similar spirit**
Another drink built around the same base.

**Similar experience**
A cocktail with a comparable flavour or drinking style.

The accompanying description should explain **why it is relevant**, not merely repeat the cocktail's ingredients.

---

## 14. Internal links

Internal links should feel natural and useful.

Prioritise links to:

* Base spirit
* Ingredient guides
* Equipment guides
* Technique guides
* Related cocktails
* Cocktail families/styles

Use descriptive anchor text.

Prefer:

> Scotch whisky

over:

> Click here

Do not overload paragraphs with links.

---

## 15. SEO rules

SEO should support the writing, never dictate it.

The primary cocktail name should naturally appear in:

* Page title
* Opening description
* One or more relevant headings
* FAQ
* Long-form content
* Internal links where natural

Do **not** repeatedly insert the cocktail name simply to hit a keyword density.

Write for a person first.

---

## 16. Repetition rules

The same fact should normally only be explained in depth once.

For example, if the opening explains that a cocktail uses equal parts, the long-form section can explore **why equal parts matter** rather than simply saying again that it uses equal parts.

Likewise:

* Ingredients = what to use and what matters
* Instructions = how to make it
* Expert Tip = the one thing an experienced bartender knows
* Long description = why the drink exists and why it works
* FAQ = answer the questions a reader is likely to have
* Related cocktails = where to go next

Every section should have a different job.

---

## 17. Things we NEVER do

Never:

* Invent a cocktail history.
* Present disputed facts as certain.
* Invent an origin story.
* Claim something is "the original" without evidence.
* Claim a cocktail is "the best" without qualification.
* Use fake bartender authority.
* Pad content to reach a word count.
* Repeat the recipe in prose.
* Repeat the same history in three different sections.
* Use generic AI-style cocktail language.
* Stuff keywords into unnatural sentences.
* Recommend ingredients without explaining why.
* Recommend related cocktails without a meaningful connection.
* Turn every cocktail into a sales pitch for Jerry Can Spirits.

---

## 18. The Jerry Can test

Before publishing, ask:

### Could this page belong to any cocktail website?

If yes, make it more specific.

### Does it tell me something I didn't know?

If no, improve the long-form content.

### Could someone actually make the drink correctly from this page?

If no, improve the instructions.

### Does the Expert Tip contain genuine expertise?

If no, rewrite it.

### Are the related cocktails actually related?

If no, replace them.

### Have we repeated ourselves?

If yes, remove the repetition.

### Does it sound like Jerry Can Spirits?

If it sounds like a generic recipe site, rewrite it.

---

## 19. The simplest rule of all

**Consistent structure. Individual personality.**

Every cocktail page should follow the same information architecture so the website feels coherent.

But the writing should never feel like:

> [Cocktail Name] is a [adjective] cocktail made with [ingredient], [ingredient] and [ingredient]. It originated in [place] and is known for its [adjective] flavour.

The reader should be able to recognise a Jerry Can Spirits cocktail page immediately — while every cocktail still has its own story, personality and reason for existing.
