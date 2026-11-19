/* Course content: every lesson teaches keys + one English point + one tip for writing to Claude. */
(function (TT) {
  'use strict';

  // newChars = characters this lesson adds (used to check drills only use learned keys).
  TT.COURSE = [
    // ───────────── Part 1 · Keyboard basics ─────────────
    {
      id: 'home-row', part: 1, title: 'Home row', newChars: 'asdfjkl', show: ['A', 'S', 'D', 'F', 'J', 'K', 'L'], wpm: 10,
      intro: 'Put your left fingers on A S D F and your right fingers on J K L and the key after L. Feel the small bumps on F and J: your index fingers always come back there. Press the space bar with your thumb. Try not to look at your hands. Look at the screen.',
      en: {
        h: 'The verb “ask”',
        p: '“Ask” is the most useful verb when you talk to Claude.',
        list: ['ask a question', 'ask for help (not “ask help”)', 'ask someone to do something: I asked Claude to check my email.']
      },
      ai: { h: 'Just ask', p: 'You don’t need perfect English to use Claude. It understands mistakes. But a clear request gets a better answer. In this course you learn to write clear requests, one small step at a time.' },
      ex: [
        { t: 'fff jjj fff jjj fj fj jf jf fjf jfj ff jj fj', n: 'Index fingers on F and J. Thumb on the space bar.' },
        { t: 'ddd kkk ddd kkk dk kd fd jk df kj dkd kdk', n: 'Middle fingers: D and K.' },
        { t: 'sss lll aaa sl ls as la sal las all ask', n: 'Ring fingers: S and L. Left little finger: A.' },
        { t: 'as ask add all dad lad sad fall salad flask', n: 'Real words. You can already type them!' },
        { t: 'ask dad ask all a sad lad all fall add a salad ask a lad', n: '“Ask” is the key word of this course.' }
      ]
    },
    {
      id: 'e-i', part: 1, title: 'E and I', newChars: 'ei', show: ['E', 'I'], wpm: 12,
      intro: 'Your middle fingers reach up to E and I. After each key, go back to D and K.',
      en: {
        h: 'Past tense with -ed',
        p: 'Many verbs make the past tense with -ed:',
        list: ['ask → asked', 'add → added', 'fail → failed', 'like → liked', 'Yesterday I asked Claude a question.']
      },
      ai: { h: 'Share your idea first', p: 'Start with your idea: “I have an idea for a small website.” When Claude knows the idea, it can help you plan the next steps.' },
      ex: [
        { t: 'eee iii ded kik de ki ed ik eid ide', n: 'Middle fingers reach up, then come back home.' },
        { t: 'idea ideas said side like file slide skill field ideal' },
        { t: 'asked added failed filled liked aided sailed sealed', n: 'Past tense: verb + -ed.' },
        { t: 'i asked a lad i added a slide i like ideas a skill is ideal add a file', n: 'Small letters for now. The capital I comes in lesson 11.' }
      ]
    },
    {
      id: 'r-u', part: 1, title: 'R and U', newChars: 'ru', show: ['R', 'U'], wpm: 12,
      intro: 'Your index fingers reach up to R and U. Keep your other fingers on the home row.',
      en: {
        h: '“Read”: one spelling, two sounds',
        p: '“Read” has the same spelling in the present and the past, but not the same sound.',
        list: ['Now: I read (say “reed”) every day.', 'Yesterday: I read (say “red”) a book.']
      },
      ai: { h: 'Give rules', p: 'Claude follows your rules. Try: “Use simple words.” “Keep it short.” “Don’t change my meaning.” Clear rules give you the answer you want.' },
      ex: [
        { t: 'rrr uuu frf juj ru ur fur sure rule' },
        { t: 'read rule user sure issue real fair dear area ruler' },
        { t: 'rules users reads issues areas raised' },
        { t: 'a user reads a rule i asked if a deal is fair a real issue is rare sure i read all files' }
      ]
    },
    {
      id: 't-o', part: 1, title: 'T and O', newChars: 'to', show: ['T', 'O'], wpm: 14,
      intro: 'T is next to R: your left index finger reaches up and a little to the right. O is above L: use your right ring finger.',
      en: {
        h: 'to, too, two',
        p: 'These three words sound the same:',
        list: ['to: I want to learn. I go to work.', 'too: It is too long. Me too!', 'two: two ideas (the number 2)']
      },
      ai: { h: 'Name the task', p: 'Start with a task word: “Edit this text.” “List five ideas.” “Sort these words.” Then Claude knows at once what you want.' },
      ex: [
        { t: 'ttt ooo ftf lol tot oto to too it at' },
        { t: 'to it at too list task test edit title sort', n: 'Task words: list, edit, test, sort.' },
        { t: 'editor result tutor folder store start told total also' },
        { t: 'i asked a tutor to edit a list store old files to a folder a task list is a tool to start', n: '“to” + verb: to edit, to start.' }
      ]
    },
    {
      id: 'g-h', part: 1, title: 'G and H', newChars: 'gh', show: ['G', 'H'], wpm: 14,
      intro: 'G and H are in the middle of the home row. Your index fingers move to the side, then come back to F and J.',
      en: {
        h: 'there, their, they’re',
        p: 'Three words, one sound:',
        list: ['there: a place, or “something exists”: There is a problem.', 'their: it belongs to them: Their app is great.', 'they’re: they are: They’re happy.']
      },
      ai: { h: 'Say your goal', p: 'Tell Claude what you want to achieve: “My goal is to pass an English exam in June.” When Claude knows the goal, it can suggest better ways to get there.' },
      ex: [
        { t: 'ggg hhh fgf jhj gh hg the this that her' },
        { t: 'the this that there their other short great goal guide', n: '“the” is the most common word in English.' },
        { t: 'high right light though through thought eight height', n: 'In these words, “gh” is silent.' },
        { t: 'the goal is to get a short list ask if this is right tell the tutor three goals she had a great idea' }
      ]
    },
    {
      id: 'n-m', part: 1, title: 'N and M', newChars: 'nm', show: ['N', 'M'], wpm: 15,
      intro: 'Your right index finger reaches down to N and M. Keep your hand still and move only the finger.',
      en: {
        h: '“a” or “an”?',
        p: 'Use “a” before a consonant sound and “an” before a vowel sound. Listen to the sound, not the letter.',
        list: ['a list, a goal, a user (“user” starts with a “you” sound)', 'an idea, an email, an hour (the h is silent)']
      },
      ai: { h: 'Tell Claude your level', p: 'Write: “I am learning English. Please use simple words.” Claude will change its answers to fit your level.' },
      ex: [
        { t: 'nnn mmm jnj jmj an in on am me no' },
        { t: 'and not need make more name mean time tone format' },
        { t: 'learn english mention moment meaning mistake information' },
        { t: 'i am learning english make it short the tone is formal and not too long i need more time', n: 'Tell Claude the tone you want: formal or friendly.' }
      ]
    },
    {
      id: 'c-v', part: 1, title: 'C and V', newChars: 'cv', show: ['C', 'V'], wpm: 16,
      intro: 'Your left hand reaches down: C with the middle finger, V with the index finger.',
      en: {
        h: '“advice” or “advise”?',
        p: '“Advice” is a noun. “Advise” is a verb.',
        list: ['Can you give me some advice? (not “an advice” or “advices”)', 'I advise you to start slowly.']
      },
      ai: { h: 'Ask for corrections', p: 'Write: “Check the grammar and correct the mistakes.” Then add: “Explain each correction.” Now you learn from your mistakes, and you don’t only fix them.' },
      ex: [
        { t: 'ccc vvv dcd fvf cv vc can have voice' },
        { t: 'can could clear check correct voice give have advice concise' },
        { t: 'conversation communicate active receive avoid discover level cover', n: '“communicate” has two m’s.' },
        { t: 'check the grammar and correct the mistakes give me clear advice i have a choice avoid long sentences' }
      ]
    },
    {
      id: 'w-y', part: 1, title: 'W and Y', newChars: 'wy', show: ['W', 'Y'], wpm: 16,
      intro: 'W is above S: use your left ring finger. Y is in a different place on different keyboards. On QWERTZ keyboards (Czech, German) it is at the bottom left. The keyboard below shows yours.',
      en: {
        h: 'Question words',
        p: 'Start questions with these words:',
        list: ['who: a person', 'what: a thing', 'where: a place', 'when: a time', 'why: a reason', 'which: a choice', 'how: a way to do something']
      },
      ai: { h: 'Ask “why?”', p: 'When Claude corrects your English, ask: “Why is this wrong?” When you know the rule, you remember it.' },
      ex: [
        { t: 'www yyy sws jyj we you why way yes' },
        { t: 'you your why what when where which who write word' },
        { t: 'way always every easy really today story style answer follow', n: '“write” has a silent w.' },
        { t: 'write it in a few words why is this the right way what do you need you can always ask why' }
      ]
    },
    {
      id: 'p-b', part: 1, title: 'P and B', newChars: 'pb', show: ['P', 'B'], wpm: 17,
      intro: 'P is above the key after L: use your right little finger. B is at the bottom, next to V: use your left index finger.',
      en: {
        h: '“please”',
        p: '“Please” makes a request polite. Use it once, at the start or at the end:',
        list: ['Please check my email.', 'Could you check my email, please?']
      },
      ai: { h: 'Step by step', p: 'Break a big task into small steps: “First... then... finally...” Or simply ask: “Explain it step by step.”' },
      ex: [
        { t: 'ppp bbb lpl fbf up be pub bit top' },
        { t: 'please prompt help problem about but better step point brief', n: 'A “prompt” is the message you write to Claude.' },
        { t: 'simple paragraph bullet number subject possible improve public' },
        { t: 'please help me plan my week write a brief summary in bullet points break the problem into small steps' }
      ]
    },
    {
      id: 'q-x-z', part: 1, title: 'Q, X and Z', newChars: 'qxz', show: ['Q', 'X', 'Z'], wpm: 18,
      intro: 'Q: left little finger, up. X: left ring finger, down. Z is in a different place on different keyboards. The keyboard below shows where it is on yours. Now you know every letter!',
      en: {
        h: '“explain it to me”',
        p: 'After “explain”, put “to” before the person:',
        list: ['Can you explain this to me? (not “explain me”)', 'Please explain the rule to my friend.']
      },
      ai: { h: 'Ask for an example', p: 'Write: “Give me an example.” One good example often explains more than a long answer.' },
      ex: [
        { t: 'qqq xxx zzz aqa sxs aza quiz zoo box' },
        { t: 'question quick quite text next example explain fix size zero', n: '“quite” = fairly. “quiet” = with no noise.' },
        { t: 'exactly extra expert organize summarize prioritize quality request' },
        { t: 'explain this in simple english give me an example fix my text and summarize the next part' }
      ]
    },
    {
      id: 'capitals', part: 1, title: 'Capitals, comma and period', newChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ,.', show: ['Shift', ',', '.'], wpm: 18,
      intro: 'For a capital letter, hold Shift with the little finger of the other hand. Capital F: right Shift. Capital J: left Shift. The comma is under K and the period is under L.',
      en: {
        h: 'Capital letters',
        p: 'Use a capital letter for:',
        list: ['the start of a sentence', 'the word “I”', 'names and places: Claude, Anna, London', 'languages and nationalities: English, Czech', 'days and months: Monday, May']
      },
      ai: { h: 'Punctuation helps', p: 'Claude understands text without capitals. But good punctuation makes long requests clear, for Claude and for people. It is also good practice for your English.' },
      ex: [
        { t: 'Aa Ss Dd Ff Jj Kk Ll Ee Ii Oo Tt Rr', n: 'Shift with the little finger of the other hand.' },
        { t: 'I am learning English. I write to Claude every day.', n: '“I” and “English” always start with a capital letter.' },
        { t: 'Hello, Claude. My name is Anna, and I live in London.' },
        { t: 'Please check my text, explain the mistakes, and write a better version.', n: 'Commas separate items in a list.' }
      ]
    },
    {
      id: 'punctuation', part: 1, title: 'Question marks and quotes', newChars: '?!\'":-', show: ['?', '!', '\'', '"', ':', '-'], wpm: 18,
      intro: 'You need Shift for many of these marks, and they are in different places on different keyboards. Look at the keyboard below: it shows the keys for your layout.',
      en: {
        h: 'Short forms',
        p: 'In friendly writing, we often join two words:',
        list: ['I’m = I am', 'don’t = do not', 'can’t = cannot', 'it’s = it is (but “its” means “belonging to it”: the app and its lessons)']
      },
      ai: { h: 'Show exactly which text', p: 'Use a colon and quotes to show Claude your text: Correct this sentence: "She don\'t like coffee."' },
      ex: [
        { t: 'Why? Yes! It\'s OK. Don\'t stop. I\'m here.' },
        { t: 'Can you check this email? I\'m not sure it\'s correct.', n: 'A question ends with a question mark.' },
        { t: 'Fix the grammar in this sentence: "She don\'t like coffee."', n: 'The quote has a mistake on purpose. Correct: “She doesn’t like coffee.”' },
        { t: 'It\'s a well-known rule: use "an" before a vowel sound!', n: 'A hyphen joins words: well-known, easy-to-read.' }
      ]
    },
    {
      id: 'numbers', part: 1, title: 'Numbers', newChars: '0123456789', show: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], wpm: 18,
      intro: 'Numbers are on the top row. Each finger reaches up from its home key. On Czech keyboards, hold Shift to type a number.',
      en: {
        h: 'Words or digits?',
        p: 'In formal writing, small numbers are often words: three ideas, two days. Big numbers, dates and times use digits: 25 people, May 12, 9:30.',
        list: []
      },
      ai: { h: 'Use numbers to set limits', p: 'Numbers make a request exact: “Give me 3 ideas.” “Keep it under 100 words.” Claude can follow limits like these.' },
      ex: [
        { t: '1 2 3 4 5 6 7 8 9 0 10 25 50 100 2026' },
        { t: 'Give me 3 ideas in under 50 words.' },
        { t: 'Summarize this 2-page report in 5 bullet points.' },
        { t: 'The meeting is at 9:30 on May 12. Write a reminder for 15 people.' }
      ]
    },

    // ───────────── Part 2 · Writing with Claude ─────────────
    {
      id: 'clear-verb', part: 2, title: 'Start with a clear verb', wpm: 22,
      en: {
        h: 'Instructions',
        p: 'An instruction starts with the base form of a verb: Write, Explain, Summarize, Translate, Compare, Check, List. There is no subject and no “to”.',
        list: ['Write an email to my teacher. (not “To write an email”)']
      },
      ai: { h: 'Put the action first', p: 'When the first word is the action, Claude knows the job at once. Then add the details.' },
      ba: [{ b: 'email for teacher i was not in class', a: 'Write a short email to my teacher. Explain that I missed the class because I was sick.' }],
      ex: [
        { t: 'Write a short email to my teacher. Explain why I missed the class.', n: 'Verb + what + who it is for.' },
        { t: 'Summarize this article in three sentences.' },
        { t: 'Compare these two phones and tell me which one is better for photos.' },
        { t: 'Suggest five names for my small coffee shop.' }
      ]
    },
    {
      id: 'polite', part: 2, title: 'Polite and clear', wpm: 22,
      en: {
        h: 'Polite requests',
        p: 'Could you...? Can you...? Would you...? I’d like... After could, can and would, use the base verb.',
        list: ['Could you help me? (not “Could you to help me” or “Could you helping me”)', 'I’d like = I would like']
      },
      ai: { h: 'Clear is better than long', p: 'Being polite is nice, but being clear matters most. One clear sentence is better than three polite, unclear ones.' },
      ba: [{ b: 'Hello, maybe if you have time you could look at something, it is about my letter maybe', a: 'Could you check my cover letter and suggest three improvements?' }],
      ex: [
        { t: 'Could you help me write a cover letter for a job in marketing?' },
        { t: 'I\'d like to improve this paragraph. Can you make it sound more natural?' },
        { t: 'Would you explain the difference between "make" and "do", please?' },
        { t: 'Thank you! That\'s very helpful. Could you give me two more examples?' }
      ]
    },
    {
      id: 'context', part: 2, title: 'Give context', wpm: 22,
      en: {
        h: 'because, so, who',
        p: 'Give a reason with “because”. Give a result or purpose with “so”. Describe a person with “who”.',
        list: ['I need it today because I have an exam tomorrow.', 'I’m a beginner, so please use simple words.', 'This email is for my boss, who likes short messages.']
      },
      ai: { h: 'Claude only knows what you tell it', p: 'Say who it is for, why you need it, and what you already know. Context changes the answer a lot.' },
      ba: [{ b: 'explain pivot tables', a: 'I already know the basics of Excel. Explain pivot tables with one simple example, because I need them at work tomorrow.' }],
      ex: [
        { t: 'I\'m a beginner, so please explain it in simple words.' },
        { t: 'This email is for my boss, who prefers short messages.' },
        { t: 'I need it for a job interview tomorrow, so I want to sound confident.' },
        { t: 'I already know the basics of Excel. I want to learn pivot tables.' }
      ]
    },
    {
      id: 'format', part: 2, title: 'Choose the format', wpm: 23,
      en: {
        h: 'Plurals after numbers',
        p: 'After a number bigger than one, the noun is plural.',
        list: ['three bullet points, two paragraphs, five examples', 'Useful phrases: in a table, no more than 100 words, at the end']
      },
      ai: { h: 'Describe the shape of the answer', p: 'Say the length, the format (a list, a table, an email) and the tone (formal or friendly).' },
      ba: [{ b: 'tell me about healthy breakfasts', a: 'List 5 healthy breakfast ideas in a table with two columns: food and why it is healthy. Keep it under 100 words.' }],
      ex: [
        { t: 'Answer in three bullet points, no more than 15 words each.' },
        { t: 'Put the results in a table with two columns: word and meaning.' },
        { t: 'Keep the tone friendly but professional.' },
        { t: 'Write one paragraph, then add a short summary at the end.' }
      ]
    },
    {
      id: 'example', part: 2, title: 'Show an example', wpm: 23,
      en: {
        h: 'for example, such as, like',
        p: 'Use these words to give examples:',
        list: ['Use short words, such as “big” and “fast”.', 'For example, “huge” is stronger than “very big”.', 'Write it like this: “Fresh bread. Baked every morning.”']
      },
      ai: { h: 'Show, don’t only tell', p: 'An example is the fastest way to show what you want. Paste one sample of the style you like.' },
      ba: [{ b: 'write descriptions for my products', a: 'Write descriptions for my 5 products in this style: "Soft cotton T-shirt. Fits well. Easy to wash."' }],
      ex: [
        { t: 'Write five product descriptions like this: "Soft cotton T-shirt. Easy to wash."' },
        { t: 'Give me words similar to "happy", such as "glad" and "cheerful".' },
        { t: 'Here is an example of my style: short sentences, simple words, no jokes.' },
        { t: 'For example, instead of "very big", use a stronger word like "huge".' }
      ]
    },
    {
      id: 'questions', part: 2, title: 'Ask good questions', wpm: 23,
      en: {
        h: 'Word order in questions',
        p: 'Question word + do/does/is + subject + verb.',
        list: ['How do I reset my password?', 'What does this word mean? (not “What this word means?”)']
      },
      ai: { h: 'Be specific', p: 'Ask a specific question and add details. “How do I...?” with details gets a better answer than “help with my problem”.' },
      ba: [{ b: 'bread problem', a: 'Why doesn\'t my bread rise? I use fresh yeast and warm water, and I wait 2 hours.' }],
      ex: [
        { t: 'How do I change the language on my phone?' },
        { t: 'What does the phrase "break the ice" mean?' },
        { t: 'Why doesn\'t my bread rise? I use fresh yeast and warm water.' },
        { t: 'Which is correct: "on the weekend" or "at the weekend"?', n: 'Answer: both! “On the weekend” is American English. “At the weekend” is British English.' }
      ]
    },
    {
      id: 'problem', part: 2, title: 'Describe a problem', wpm: 24,
      en: {
        h: 'The past simple',
        p: 'Use the past simple for what happened: I tried..., but it didn’t work. Many common verbs are irregular:',
        list: ['go → went, see → saw, get → got, make → made', 'I tried to log in, but the page didn’t open.']
      },
      ai: { h: 'Three parts of a problem', p: 'Say what you wanted, what you did, and what happened instead. Copy any error message exactly.' },
      ba: [{ b: 'printer not work help', a: 'I wanted to print a PDF, but the printer showed the error "Paper jam". I removed the paper and restarted it, but the error is still there.' }],
      ex: [
        { t: 'I wanted to print a PDF, but the printer showed an error.' },
        { t: 'I tried to restart the computer, but nothing changed.' },
        { t: 'Here is the exact error message: "File not found."' },
        { t: 'I expected the page to open. Instead, the screen went white.' }
      ]
    },
    {
      id: 'articles', part: 2, title: 'a, an and the', wpm: 24,
      en: {
        h: 'Articles',
        p: 'Many languages, like Czech or Polish, have no articles, so this takes practice.',
        list: ['a/an: the first time, or any one: I have an idea.', 'the: the reader knows which one: The idea is simple.', 'no article: things in general: Apps are useful. Information is important.']
      },
      ai: { h: 'Small words, exact meaning', p: '“Fix the bug” means one bug that you both know. “Fix a bug” means any bug. Articles help Claude understand exactly what you mean.' },
      ba: [{ b: 'I need new laptop. Old one is slow.', a: 'I need a new laptop. The old one is too slow.' }],
      ex: [
        { t: 'I have an idea for an app. The app helps people learn to type.', n: 'First “an app”, then “the app”.' },
        { t: 'Can you read the text below and find the main idea?' },
        { t: 'She is an engineer at a big company in the city center.' },
        { t: 'I need a new laptop. The old one is too slow.' }
      ]
    },
    {
      id: 'linking', part: 2, title: 'Link your ideas', wpm: 24,
      en: {
        h: 'Linking words',
        p: 'Order steps with first, then, finally. Add an idea with also. Show a contrast with but or however. Show a result with so.',
        list: ['I like it. However, it is too expensive.']
      },
      ai: { h: 'Give your request an order', p: 'First the background, then the task, finally the format. Claude reads the request in that order too.' },
      ba: [{ b: 'too long answer make shorter keep meaning', a: 'The answer was helpful, but it was too long, so please make it shorter. Also, keep my original meaning.' }],
      ex: [
        { t: 'First, read my text. Then, list the mistakes. Finally, write a corrected version.' },
        { t: 'I like the first idea. However, it is too expensive.' },
        { t: 'The answer was helpful, but it was too long, so please make it shorter.' },
        { t: 'Also, please keep my original meaning.' }
      ]
    },
    {
      id: 'refine', part: 2, title: 'Improve the answer', wpm: 25,
      en: {
        h: 'Comparatives',
        p: 'Short adjectives take -er: short → shorter, simple → simpler, clear → clearer. Long adjectives take more or less:',
        list: ['more formal, more natural', 'less technical']
      },
      ai: { h: 'The first answer is a draft', p: 'Ask for changes: “Make it shorter.” “More formal, please.” “Try again with a friendly tone.” A chat with Claude is a conversation.' },
      ba: [{ b: 'no not good', a: 'This is too formal. Make it friendlier and shorter, but keep the first sentence.' }],
      ex: [
        { t: 'Make it shorter and simpler, please.' },
        { t: 'This is good, but can you make it more formal?' },
        { t: 'Use less technical language. My readers are not experts.' },
        { t: 'Keep the second paragraph, but rewrite the first one.' }
      ]
    },
    {
      id: 'mistakes', part: 2, title: 'Common mistakes', wpm: 25,
      en: {
        h: 'Wrong → right',
        p: 'Learners of English often make these mistakes:',
        list: ['I am agree → I agree', 'explain me → explain to me', 'informations, advices → information, advice', 'discuss about the plan → discuss the plan', 'make a photo → take a photo', 'depend of → depend on']
      },
      ai: { h: 'Find your weak points', p: 'Ask Claude: “Which mistakes do I repeat? Give me a short rule for each one.” It is a fast way to find what to practice.' },
      ex: [
        { t: 'I agree with you. Could you explain it to me again?' },
        { t: 'Thank you for the information and the useful advice.' },
        { t: 'Let\'s discuss the plan tomorrow. It depends on the weather.' },
        { t: 'Can you take a photo of the document and send it to me?' }
      ]
    },
    {
      id: 'real-request', part: 2, title: 'Improve a real request', wpm: 25,
      en: {
        h: 'The request that created this app',
        p: 'Claude understood it perfectly. Here is how to make it sound more natural:',
        list: []
      },
      ai: { h: 'Clear requests get better apps', p: 'Say the goal, list the features one by one, and use full sentences. You did most of this already!' },
      ba: [
        { b: 'Create app for learn keyboard layout', a: 'Create an app for learning the keyboard layout.', why: '“an app” needs an article. Use “for learning” or “to learn”, not “for learn”.' },
        { b: 'I want to learn to write with keyboard with my all 10 fingers', a: 'I want to learn to type with all ten fingers.', why: 'We “type” on a keyboard. Say “all ten fingers” (or “all my fingers”), not “my all”.' },
        { b: 'Create lessons to learn 2 things at the same moment', a: 'Create lessons that teach two things at the same time.', why: 'The fixed phrase is “at the same time”.' },
        { b: 'I want to better comunicate with you, and to learn my english writings skills', a: 'I want to communicate better with you and improve my English writing skills.', why: '“communicate” has two m’s. “English” takes a capital letter. Say “writing skills” and “improve” your skills.' },
        { b: 'Make option to save progress', a: 'Add an option to save my progress.', why: '“an option” needs an article, and “add” fits better than “make” here.' }
      ],
      ex: [
        { t: 'Create an app for learning the keyboard layout.' },
        { t: 'I want to learn to type with all ten fingers.' },
        { t: 'Please add an option to practice with my own texts.', n: 'American English: practice (verb and noun). British English: practise (verb).' },
        { t: 'Create lessons that teach two things at the same time.' },
        { t: 'I want to communicate better with you and improve my English writing skills.' },
        { t: 'Add an option to save my progress and sync it between devices.' }
      ]
    },
    {
      id: 'your-request', part: 2, title: 'Write your own request', wpm: 25, coach: true,
      en: {
        h: 'Use everything you learned',
        p: 'Write a real request about something you need this week. Then check it:',
        list: ['Does it start with a clear verb?', 'Did you give context: who, why, what you know?', 'Did you choose a format and a length?', 'Articles, capital letters, punctuation?']
      },
      ai: { h: 'Get feedback, then type the better version', p: 'Claude checks your English and the clarity of your request. Then you type the corrected version. You practice typing, English and prompting in one exercise.' },
      ex: []
    }
  ];

  // Built-in texts for the Practice page.
  TT.STARTERS = [
    {
      id: 'starter-prompts', title: 'Prompt starters',
      body: 'Could you help me write an email to my landlord? Please explain this rule in simple English. Give me three examples of how to use this word. Make it shorter and simpler. What is the difference between these two words? Check my grammar and explain the mistakes. Rewrite this in a friendly tone. Summarize this text in five bullet points. I\'m a beginner, so please use simple words. Ask me questions before you start.'
    },
    {
      id: 'starter-email', title: 'Email phrases',
      body: 'Thank you for your quick reply. I\'m writing to ask about the meeting on Friday. Could you please send me the documents? I\'m sorry for the late answer. Please find the report attached. Let me know if you have any questions. I look forward to hearing from you. Best regards, Anna'
    },
    {
      id: 'starter-feedback', title: 'Asking for changes',
      body: 'This is good, but it is a little too long. Can you make the second paragraph clearer? Please keep my original meaning. Use a more formal tone for my manager. Try again, but this time without bullet points. Add one example to each point. Explain why you changed this sentence. That is perfect, thank you!'
    },
    {
      id: 'starter-pangrams', title: 'Every letter (pangrams)',
      body: 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump! Sphinx of black quartz, judge my vow. The five boxing wizards jump quickly.'
    }
  ];

  // Common English words for random drills (lowercase).
  TT.WORDS = ('the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is are was were been has had did said very here more need help write read learn word words question answer example simple short long clear idea ideas text email please thank thanks problem change start finish try ask tell show find keep let mean each many much why where still every again before between same different important right wrong easy hard next last little own part place number sentence letter page list line point step fact case kind week today tomorrow yesterday always never often sometimes usually maybe really sure great better best small big old young high low open close call send check fix explain describe compare summarize translate improve correct rewrite suggest create plan review lesson finger fingers keyboard type typing grammar meaning shorter simpler friendly formal polite context format tone level').split(' ');
})(globalThis.TT = globalThis.TT || {});
