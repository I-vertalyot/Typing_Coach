/* Course content: every lesson teaches keys + one English point + one tip for writing clear requests. */
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
        p: '“Ask” is one of the most useful verbs in English.',
        list: ['ask a question', 'ask for help (not “ask help”)', 'ask someone to do something: I asked my friend to check my email.']
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
        list: ['ask → asked', 'add → added', 'fail → failed', 'like → liked', 'Yesterday I asked a question.']
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
        { t: 'i am learning english make it short the tone is formal and not too long i need more time', n: 'Say which tone you want: formal or friendly.' }
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
        { t: 'please prompt help problem about but better step point brief', n: 'A “prompt” is a short request or question.' },
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
        list: ['the start of a sentence', 'the word “I”', 'names and places: Anna, Prague, London', 'languages and nationalities: English, Czech', 'days and months: Monday, May']
      },
      ai: { h: 'Punctuation helps', p: 'Claude understands text without capitals. But good punctuation makes long requests clear, for Claude and for people. It is also good practice for your English.' },
      ex: [
        { t: 'Aa Ss Dd Ff Jj Kk Ll Ee Ii Oo Tt Rr', n: 'Shift with the little finger of the other hand.' },
        { t: 'I am learning English. I write in English every day.', n: '“I” and “English” always start with a capital letter.' },
        { t: 'Hello, Tom. My name is Anna, and I live in London.' },
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

  // Words typed with one hand on QWERTY (on QWERTZ, y and z change hands; the app filters by your layout).
  TT.HAND_WORDS = ('was were we are as at be bed best bet bear beer bread break brave car card care case cast cat crew create dad data date dear draft drag draw dress east eat edge face fact fast fear feed feet few free gas gate gave get grab grace grade grass great greet race rare rate raw read rear red rest sad safe save saw scare sea seat see set sew star start state stress street sweet swear tax tea tear test text tree vase vast wage war ward wear web west wet water after address average better career dessert extract greater regard reward sweater taxes trade treat verb wax exceed effect bass beat crest dart decade degree desert drafts estate fewer gear graze grace sweat target tested vest zebra cards dates fastest gazette reserve severe trade' + ' ' +
    'you him hip hook hop hum ill inn ink join joy jump kill kiln kin lily link lion lip lump mill milk mink mom monk moon mop my no noon nook nun oil oily on onion only opinion pill pink plum plump poll polo pony pool pop pull pump puppy union yolk yummy hilly holly hymn kimono lollipop million minimum monopoly nylon phony pinky pupil ion lookup unhook polio poppy mommy hippo lumpy pulp hull hill look loop mono nil pin pun hook'
  ).split(' ').filter(Boolean);

  // The 1000 most common English words, most common first (approximate frequency order).
  TT.COMMON = (
    'the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an will ' +
    'my one all would there their what so up out if about who get which go me when make can like time no just him know take ' +
    'people into year your good some could them see other than then now look only come its over think also back after use ' +
    'two how our work first well way even new want because any these give day most us is are was were been has had did said ' +
    'very here more need many much where should through down still find long great little life hand part place week case ' +
    'point number problem fact right last few same able early young important high different small large next big thing ' +
    'those both each such while home house since school never under might again too off city around another however always ' +
    'family side water room mother area money story month lot book job word business friend father hour game line end ' +
    'member law car night name head really something nothing child children eye woman women man men world country company ' +
    'group question government system program state service student office door health person art history party result ' +
    'change morning reason research girl guy moment air teacher education foot boy age policy everything process music ' +
    'market sense nation plan college interest experience effect class control care field development role effort rate ' +
    'heart show leader light voice wife mind price report decision son view relationship town road arm difference value ' +
    'building action model season society tax director position player record paper space ground form event official matter ' +
    'center couple site project activity star table court ask tell feel become leave put mean keep let begin seem help talk ' +
    'turn start hear play run move live believe hold bring happen write provide sit stand lose pay meet include continue ' +
    'set learn lead understand watch follow stop create speak read allow add spend grow open walk win offer remember love ' +
    'consider appear buy wait serve send expect build stay fall cut reach remain suggest raise pass sell require decide ' +
    'pull return explain hope develop carry break receive agree support hit produce eat cover catch draw choose cause ' +
    'listen realize close involve increase thank own old public bad best better sure free real full special easy clear ' +
    'recent certain personal red difficult available likely short single medical current wrong private past foreign fine ' +
    'common poor natural significant similar hot central happy serious ready simple left physical general environmental ' +
    'financial blue democratic dark various entire legal religious cold final main green nice huge popular traditional ' +
    'cultural wide sometimes often away yet once perhaps already almost enough far later quite together usually probably ' +
    'actually maybe rather especially either simply soon finally quickly recently nearly certainly instead else clearly ' +
    'ever exactly before between during without within along against among across behind toward above below upon until ' +
    'anything someone anyone everyone nobody somebody everybody things today tomorrow yesterday tonight evening weekend ' +
    'minute second three four five six seven eight nine ten hundred thousand million third half parent brother sister ' +
    'daughter husband baby kid doctor worker customer manager neighbor food bread milk coffee tea fruit apple egg meat fish ' +
    'rice dinner lunch breakfast meal kitchen chair bed window wall floor garden street village bus train plane bike ticket ' +
    'station airport hotel shop store bank hospital church park library museum restaurant cafe cost bill card cash meeting ' +
    'email letter phone message computer internet website page file photo picture video song film movie news face ear nose ' +
    'mouth hair leg finger body color white black yellow brown gray orange pink weather sun rain snow wind cloud warm cool ' +
    'spring summer autumn winter sky sea river lake mountain tree flower grass animal dog cat bird horse sad angry tired ' +
    'hungry busy afraid sorry glad kind funny friendly quiet loud fast slow hard soft heavy cheap expensive rich clean ' +
    'dirty beautiful pretty ugly strong weak sick healthy answer idea example mistake method goal step test exam lesson ' +
    'course practice exercise grammar sentence language meaning please thanks hello goodbye yes okay welcome cook wash ' +
    'drive ride fly swim sing dance paint travel visit wear sleep wake rest study teach fix check try finish forget miss ' +
    'enjoy prefer wish hate worry laugh cry smile afternoon late ago admit stage quarter talent future print mouse ' +
    'character circle respect sofa ahead debate liquid holiday lay wild size tent plate square product usual text soap ' +
    'transfer corner secure winner lonely extra slice dress hardly wealth universe potato staff cup tall stomach wool ' +
    'purpose pot quote yard replace urban dozen sort sugar band recipe contact soup sign delay distance forward artist ' +
    'discover gift approach dear bell range storm sum condition island west seed truck advice beat fashion gold gain block ' +
    'perfect middle attempt depend pool lawyer lift thin quality solution cousin earn stone network sound charge average ' +
    'negative slide shine lazy skill favorite select ordinary vote useful boss dry pair fair prove front detail string near ' +
    'gas target stress feeling topic act divide upset design inside noise score beside math tip movement survey captain ' +
    'modern ice dream announce dialog fresh shift highly soccer queen raw double section fear feature wire success hall ' +
    'farm arrive gather luck pan grand rise budget onto save signal present version attention shelf strange describe split ' +
    'deal wing forest list electric pet basket reward promise pack burn motor sink trust bowl aware argue forever push ' +
    'upper inch south clothes guide traffic pen content judge fold adult level tool suit worth notice safe compare chance ' +
    'collect curious concern source rely bottom fuel normal pencil courage coast author faith thick stick knock silver roof ' +
    'series east drop except beer object guest phrase separate surface partner row image complete technology editor article ' +
    'careful confirm pants lane sheet beach possible local route piece perform pilot speed manage warn novel journey settle ' +
    'shirt industry mystery'
  ).split(' ');

  // Common English words for random drills (lowercase).
  TT.WORDS = ('the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is are was were been has had did said very here more need help write read learn word words question answer example simple short long clear idea ideas text email please thank thanks problem change start finish try ask tell show find keep let mean each many much why where still every again before between same different important right wrong easy hard next last little own part place number sentence letter page list line point step fact case kind week today tomorrow yesterday always never often sometimes usually maybe really sure great better best small big old young high low open close call send check fix explain describe compare summarize translate improve correct rewrite suggest create plan review lesson finger fingers keyboard type typing grammar meaning shorter simpler friendly formal polite context format tone level').split(' ');
})(globalThis.TT = globalThis.TT || {});
