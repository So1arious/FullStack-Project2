'use strict';
const bank=window.Algebra_BANK||{};
const $=id=>document.getElementById(id);
const names=Object.keys(bank);
// Each generation creates fresh numerical variations, with answers computed
// from the same parameters. The original exercises remain in the bank.
function numericalVariants(topic)
{
    const variants = [];
    const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
    for (let i = 0; i < 25; i++) {
        const a = rand(2, 12), b = rand(1, 9), c = rand(1, 8);
        if (topic === 'Linear Equations')
        {
            variants.push({topic, type:'Generated two-step linear equation',
                q:`Solve for a: ${a}a + ${b} = ${a*c+b}`,
                a:`a = ${c}`});
            variants.push({topic, type:'Generated distributive equation',
                q:`Solve for a: ${a}(a + ${b}) = ${a*(c+b)}`,
                a:`a = ${c}`});
        }
        else if (topic === 'Quadratic Equations')
        {
            variants.push({topic, type:'Generated quadratic equation',
                q:`Solve for a: a² - ${b+c}a + ${b*c} = 0`,
                a:b===c
                    ?`a = ${b}`
                    :`a = ${Math.min(b,c)}, ${Math.max(b,c)}`});
        }
        else if (topic === 'Systems of Two Equations')
        {
            variants.push({topic, type:'Generated system of equations',
                q:`Solve for a and b: a + b = ${b+c} and ${a}a + b = ${a*b+c}`,
                a:`a = ${b}, b = ${c}`});
        }
    }
    return variants;
}
let
    current=[],
    selectedTitle='',
    selectedDuration=60,
    selectedPoints=5,
    selectedTopic='ALL';

const
    escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'
    }[c]));
function shuffle(a) {
    for(let i=a.length-1;i>0;i--) {
        const j=Math.floor(Math.random()*(i+1));
        [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
}
function activate(tab) {
    document.querySelectorAll('.tab').forEach(el=> {
        const yes=el.dataset.tab===tab;
        el.classList.toggle('active',yes);
        el.setAttribute('aria-selected',String(yes));
    });
    document.querySelectorAll('.tab-panel').forEach(el=>
        el.classList.toggle('active',el.id===tab)
    );
}
document.querySelectorAll('.tab').forEach(el=>
    el.addEventListener('click',()=>activate(el.dataset.tab))
);

$('topic').innerHTML=
    '<option value="ALL">All topics (mixed test)</option>'+
    names.map((n,i)=>`<option value="${i}">${escapeHtml(n)}</option>`).join('');

$('metric-topics').textContent=names.length;
$('metric-types').textContent=Object.values(bank).reduce((n,rows)=>n+rows.length,0);
$('topic-grid').innerHTML=names.map((n,i)=> `
        <button type="button" class="topic-card" data-topic="${i}">
        <span class="topic-number">${String(i+1).padStart(2,'0')}</span>
        <strong>${escapeHtml(n)}</strong>
        <span>${bank[n].length} question types</span>
        <span class="topic-link">Select topic→</span>
        </button>`).join('');
document.querySelectorAll('.topic-card').forEach(el=>
    el.addEventListener('click',()=> {
        $('topic').value=el.dataset.topic; activate('builder');
        $('topic').focus();
    }));

$('go-topics').addEventListener('click',()=>activate('topics'));
$('go-preview').addEventListener('click',()=>activate('preview'));
$('preview-key').addEventListener('click',()=>activate('answers'));
$('count').addEventListener('change',()=>{
    $('metric-questions').textContent=$('count').value;
});

function generate() {
    const count=Number($('count').value), topicIndex=$('topic').value;
    selectedTopic=topicIndex==='ALL'?'Mixed Algebra':names[Number(topicIndex)];
    let
        pool=(topicIndex==='ALL'?names:[names[Number(topicIndex)]]).flatMap(n=>[...bank[n].map(([type,q,a])=>({topic:n,type,q, a})),...numericalVariants(n)]);
    if (!pool.length) {
        $('status').textContent='No questions available for this topic.';
        return;
    }
    current=[];
    while(current.length<count)
    {
        const round=shuffle([...pool]);
        current.push(...round.slice(0,count-current.length));
    }
    if($('shuffle').checked)shuffle(current); selectedTitle=$('title').value.trim()||'Algebra Assessment';
    selectedDuration=Math.max(1,Number($('duration').value)||60);
    selectedPoints=Math.max(1,Number($('points').value)||5);

    $('test-heading').textContent=selectedTitle;
    $('test-output').classList.remove('placeholder');
    $('test-output').innerHTML=`
        <div class="test-meta">
            <p><strong>Name:</strong>__________________________________ <strong>Date:</strong>_______________</p>
            <p><strong>Topic:</strong> 
                ${escapeHtml(selectedTopic)} &nbsp; <strong>Duration:</strong> ${selectedDuration} minutes &nbsp; <strong>Total:</strong> ${count*selectedPoints}points</p>
        </div>` +current.map((item,i)=>`
        <article class="question">
            <div class="question-label">${escapeHtml(item.topic)} ·${escapeHtml(item.type)}</div>
                <p><strong>${i+1}.</strong>${escapeHtml(item.q)} <span class="point-label">(${selectedPoints} points)</span></p>
                <div class="student-work">
                    <label for="student-answer-${i}">Your answer / working</label>
                    <textarea id="student-answer-${i}"class="student-answer" data-index="${i}" rows="3" placeholder="Type your answer and any calculations here..."></textarea>
                    <div class="student-controls">
                        <button type="button" class="check-answer" data-index="${i}">Check answer</button>
                        <button type="button" class="ask-question" data-index="${i}">Explain in chatbot</button>
                    </div>
                    <div class="answer-feedback" id="feedback-${i}" aria-live="polite"></div>
                    </div>
                </article>`).join('');

    $('answer-output').classList.remove('placeholder');
    $('answer-output').innerHTML=`
            <div class="test-meta">
                <strong>${escapeHtml(selectedTitle)}</strong>
                <p>${escapeHtml(selectedTopic)} · ${count} questions ·${count*selectedPoints}points</p>
            </div>`+current.map((item,i)=>`
            <article class="key-row">
                <strong>${i+1}.</strong>${escapeHtml(item.a)}
                <div class="question-label">${escapeHtml(item.type)}</div>
            </article>`).join('');
    $('chat-question').innerHTML='<option value="">Choose a question (optional)</option>'
        +current.map((item,i)=>`<option value="${i}">Question ${i+1}:${escapeHtml(item.q.slice(0,72))}</option>`).join('');
    $('status').textContent=`Test generated successfully:${count} questions. Open Test Preview to review.`;
    activate('preview');
}
$('generate').addEventListener('click',generate);
function printView(which){
    if(!current.length){alert('Please generate a test first.');
        activate('builder');
        return;
    }
    activate(which);
    document.body.dataset.print=which;
    window.print();
}
$('print').addEventListener('click',()=>printView('preview'));
$('keyprint').addEventListener('click',()=>printView('answers'));
window.addEventListener('afterprint',()=>{
    delete document.body.dataset.print;
});
// Student workspace and local, question-bank-based algebra tutor.
// No external AI service or API key is required.
function normalizeAnswer(value) {
    return String(value)
        .toLowerCase()
        .replace(/\s+/g,'')
        .replace(/[−–]/g,'-')
        .replace(/×/g,'*')
        .replace(/÷/g,'/')
        .replace(/\^2/g,'²')
        .replace(/\^3/g,'³');
}
function numericAnswer(value) {
    const s=normalizeAnswer(value);
    if (/^[+-]?\d+(\.\d+)?(\/[+-]?\d+(\.\d+)?)?$/.test(s)) {
        const bits=s.split('/');
        return Number(bits[0])/(bits.length===2?Number(bits[1]):1);
    }
    return null;
}
function answerMatches(given, expected) {
    const a=normalizeAnswer(given), b=normalizeAnswer(expected);
    if (!a) return false;
    if (a===b) return true;

    const x=numericAnswer(given), y=numericAnswer(expected);
    return x!==null && y!==null && Number.isFinite(x) && Number.isFinite(y) && Math.abs(x-y)<1e-8;
}
function explainQuestion(item) {
    const q=item.q, a=item.a, t=item.topic;
    const lines=[];
    if (item.type==='Generated two-step linear equation') {
        lines.push(
            'Step 1: Subtract the constant term from both sides.',
            'Step 2: Divide both sides by the coefficient of a.',
            'Step 3: Substitute your answer into the original equation to check it.'
        );
    } else if (item.type==='Generated distributive equation') {
        lines.push(
            'Step 1: Divide both sides by the number outside the parentheses.',
            'Step 2: Subtract the constant inside the parentheses to isolate a.',
            'Step 3: Substitute your answer into the original equation to check it.'
        );
    } else if (item.type==='Generated quadratic equation') {
        lines.push(
            'Step 1: Find two numbers whose sum is the coefficient of a and whose product is the constant term.',
            'Step 2: Use those numbers to factor the quadratic into two binomials.',
            'Step 3: Set each factor equal to zero and solve for a.'
        );
    } else if (t==='Linear Equations' || item.type==='Multi-Step Linear Equations') {
        lines.push(
            'Step 1: Expand parentheses and combine like terms if needed.',
            'Step 2: Move variable terms to one side and constants to the other.',
            'Step 3: Divide by the variable coefficient and check the answer.'
        );
    } else if (t==='Systems of Two Equations') {
        lines.push(
            'Step 1: Use substitution or elimination to remove one variable.',
            'Step 2: Solve for the remaining variable, then substitute back to find the other.',
            'Step 3: Check both original equations. A contradiction means no solution; equivalent equations mean infinitely many solutions.'
        );
    } else if (t==='Quadratic Equations') {
        if (item.type==='Discriminant Analysis') {
            lines.push(
                'Step 1: Identify A, B, and C in the form A a² + B a + C = 0.',
                'Step 2: Calculate the discriminant D = B² - 4AC.',
                'Step 3: D > 0 gives two real roots, D = 0 gives one repeated real root, and D < 0 gives no real roots.'
            );
        } else if (item.type==='Vertex & Axis of Symmetry') {
            lines.push(
                'Step 1: Identify A and B in f(a) = A a² + B a + C.',
                'Step 2: Calculate h = -B / (2A).',
                'Step 3: Calculate k = f(h). The vertex is (h, k) and the axis of symmetry is a = h.'
            );
        } else {
            lines.push(
                'Step 1: Write the quadratic with zero on one side.',
                'Step 2: Use factoring, square roots, completing the square, or the quadratic formula.',
                'Step 3: Check each solution in the original equation.'
            );
        }
    } else if (t==='Order of operations') {
        lines.push(
            'Step 1: Evaluate parentheses and brackets first.',
            'Step 2: Evaluate exponents, then multiplication and division from left to right.',
            'Step 3: Complete addition and subtraction from left to right.'
        );
    } else if (t==='Substitution') {
        lines.push(
            'Step 1: Replace each variable with its given value.',
            'Step 2: Put negative substituted values in parentheses.',
            'Step 3: Simplify using the order of operations.'
        );
    } else if (t==='Polynomial') {
        lines.push(
            'Step 1: Identify whether the question asks for addition, subtraction, multiplication, division, or factoring.',
            'Step 2: Apply that operation, distributing signs carefully and combining like terms.',
            'Step 3: Check by expanding factors or multiplying the quotient by the divisor where appropriate.'
        );
    } else if (item.type==='Absolute Value Equations') {
        lines.push(
            'Step 1: Isolate the absolute value expression.',
            'Step 2: Set the expression inside equal to both the positive and negative target values.',
            'Step 3: Solve both equations and check each answer.'
        );
    } else if (t==='Linear & Compound Inequalities') {
        lines.push(
            'Step 1: Expand parentheses and combine like terms.',
            'Step 2: Isolate the variable. Reverse the inequality sign when multiplying or dividing by a negative number.',
            'Step 3: For a compound inequality, satisfy both conditions and check the endpoints.'
        );
    } else if (t==='Exponents & Radicals') {
        lines.push(
            'Step 1: Identify the exponent, radical, or scientific notation rule needed.',
            'Step 2: Simplify powers and roots, and combine compatible terms.',
            'Step 3: Express the answer in the form requested by the question.'
        );
    } else {
        lines.push(
            'Step 1: Identify the algebra operation or rule needed.',
            'Step 2: Simplify or solve while keeping both sides of any equation balanced.',
            'Step 3: Check the result against the original question.'
        );
    }
    return `Question: ${q}\n\n${lines.join('\n')}\n\nAnswer in the question bank: ${a}\n\nNote: These are rule-based guidance steps. For some original questions, they describe the method rather than every algebraic intermediate step.`;
}
function tutorReply(text, selectedIndex) {
    if (!current.length) return 'Generate a test first so I can use its questions and answer key.';

    const input=text.trim();
    if (!input && selectedIndex===null)
        return 'Enter an algebra question or choose a question number.';

    let idx=selectedIndex;
    if (idx===null) {
        const number=input.match(/^(?:question\s*|q\s*|#)(\d+)\b/i);
        if (number && Number(number[1])>=1 && Number(number[1])<=current.length) idx=Number(number[1])-1;
        if (idx===null)
            idx=current.findIndex(item=>item.q.toLowerCase()===input.toLowerCase());
        if (idx===-1)
            idx=current.findIndex(item=>input.length>12 && (item.q.toLowerCase().includes(input.toLowerCase()) || input.toLowerCase().includes(item.q.toLowerCase())));
    }
    if (idx===null || idx<0 || idx>=current.length) return 'I can explain questions from the generated test. Select a question from the menu, enter “Question 1”, or paste its exact question text.';

    return explainQuestion(current[idx]);
}
function appendChat(role, message) {
    const node=document.createElement('div');node.className='chat-message '+role;
    node.textContent=message;
    $('chat-history').appendChild(node);
    $('chat-history').scrollTop=$('chat-history').scrollHeight;
}
function askTutor(index=null) {
    if (index!==null) $('chat-question').value=String(index);
    const raw=$('chat-input').value;
    const indexFromSelect=$('chat-question').value;
    const chosen=index!==null
        ? index
        :(indexFromSelect===''?null:Number(indexFromSelect));
    appendChat('student',raw.trim()||(chosen!==null?`Please explain question ${chosen+1}.`:'Please explain this question.'));
    appendChat('tutor',tutorReply(raw,chosen));
    $('chat-input').value=''; }
$('test-output').addEventListener('click',event=>{
    const check=event.target.closest('.check-answer');
    const ask=event.target.closest('.ask-question');

    if(check){
        const i=Number(check.dataset.index), given=$('student-answer-'+i).value.trim();
        const feedback=$('feedback-'+i);

        feedback.className='answer-feedback'+(!given?'':answerMatches(given,current[i].a)?' correct':' incorrect');
        feedback.textContent=!given
            ?'Please type your answer first.'
            :answerMatches(given,current[i].a)
                ?'Correct answer!'
                :'Not matched to the answer key. Review your work or use the chatbot for guidance. Equivalent symbolic forms may need instructor review.';
    }
    if(ask){
        const i=Number(ask.dataset.index);
        $('chat-question').value=String(i);askTutor(i);
        $('chat-panel').scrollIntoView({behavior:'smooth',block:'start'});
    }
});
$('chat-send').addEventListener('click',()=>askTutor());
$('chat-input').addEventListener('keydown',event=>{
    if(event.key==='Enter'&&!event.shiftKey) {
        event.preventDefault();askTutor();
    }
});
