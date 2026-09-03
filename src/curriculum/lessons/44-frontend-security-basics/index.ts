import Concept from './concept.mdx'

import type { Lesson } from '../../types'

export const lesson: Lesson = {
  slug: 'frontend-security-basics',
  title: 'Frontend Security Basics',
  summary:
    'Understand client trust boundaries, XSS risks, tokens, and safe rendering habits.',
  track: 'frontend',
  order: 44,
  concept: Concept,
  problems: [
    {
      id: 'escape-html',
      kind: 'code',
      completionMode: 'all-tests-pass',
      title: 'Escape untrusted text for HTML',
      prompt:
        "Implement escapeHtml, the output encoder that lets untrusted text land in an HTML context without becoming markup. Replace each of the five characters that carry meaning to the HTML parser with its entity: `&` becomes `&amp;`, `<` becomes `&lt;`, `>` becomes `&gt;`, `\"` becomes `&quot;`, and `'` becomes `&#39;`. Order matters — escape the ampersand first, because every other replacement introduces one, and escaping it last would double-encode them. Every other character passes through unchanged. Example: `escapeHtml('<img src=x onerror=\"steal()\">')` returns `'&lt;img src=x onerror=&quot;steal()&quot;&gt;'`, and `escapeHtml('Tom & Jerry')` returns `'Tom &amp; Jerry'`.",
      estimatedMinutes: 12,
      functionName: 'escapeHtml',
      starter: `export function escapeHtml(text: string): string {
  return text
}

console.log(escapeHtml('<img src=x onerror="steal()">'))
`,
      tests: [
        {
          name: 'neutralizes a script tag',
          args: ['<script>steal()</script>'],
          expected: '&lt;script&gt;steal()&lt;/script&gt;',
        },
        {
          name: 'escapes a bare ampersand',
          args: ['Tom & Jerry'],
          expected: 'Tom &amp; Jerry',
        },
        {
          name: 'does not double-encode an existing entity',
          args: ['&lt;'],
          expected: '&amp;lt;',
        },
        {
          name: 'escapes an injection payload with quotes',
          args: ['<img src=x onerror="steal()">'],
          expected: '&lt;img src=x onerror=&quot;steal()&quot;&gt;',
        },
        {
          name: 'escapes both quote characters',
          args: ['it\'s "quoted"'],
          expected: 'it&#39;s &quot;quoted&quot;',
        },
        {
          name: 'leaves ordinary text untouched',
          args: ['plain text 123'],
          expected: 'plain text 123',
        },
        { name: 'handles the empty string', args: [''], expected: '' },
      ],
    },
    {
      id: 'fix-comment-list-xss',
      kind: 'react-code',
      completionMode: 'all-tests-pass',
      title: 'Move the comment list back onto the safe path',
      prompt:
        "CommentList renders reader comments, and to keep newlines it hands each comment's text to `dangerouslySetInnerHTML` — so a comment containing markup is parsed as HTML, and a crafted one runs script in every reader's session. Fix it by rendering the text on React's escaped-by-default path: drop `dangerouslySetInnerHTML` entirely and produce the newline formatting with element structure instead, splitting the text on `\\n` and rendering each line in its own element. Keep the author in a `<strong>`, keep every line's text on screen, and change nothing else. Your component is rendered for real, and the tests confirm a payload appears as visible characters rather than becoming an element. Example: a comment `read this <b>important</b> note` must show the literal characters `<b>important</b>` on screen, not a bold word.",
      estimatedMinutes: 15,
      componentName: 'CommentList',
      starter: `type Comment = { author: string; text: string }

// Comments are user input. Render them so their characters can never
// become elements.
export function CommentList({ comments }: { comments: Comment[] }) {
  return (
    <ul>
      {comments.map((comment) => (
        <li key={comment.author + comment.text}>
          <strong>{comment.author}</strong>
          <div dangerouslySetInnerHTML={{ __html: comment.text.replaceAll('\\n', '<br>') }} />
        </li>
      ))}
    </ul>
  )
}
`,
      tests: [
        {
          name: 'renders a plain comment with its author',
          props: { comments: [{ author: 'ada', text: 'great write-up' }] },
          expect: [
            { type: 'text-present', text: 'ada' },
            { type: 'text-present', text: 'great write-up' },
          ],
        },
        {
          name: 'markup arrives as characters, not elements',
          props: {
            comments: [
              { author: 'mallory', text: 'read this <b>important</b> note' },
            ],
          },
          expect: [{ type: 'text-present', text: '<b>important</b>' }],
        },
        {
          name: 'an injection payload is displayed, not executed',
          props: {
            comments: [
              {
                author: 'mallory',
                text: 'nice post! <img src=x onerror="steal()">',
              },
            ],
          },
          expect: [
            { type: 'text-present', text: '<img src=x' },
            { type: 'text-present', text: 'steal()' },
          ],
        },
        {
          name: 'newlines still become separate paragraphs',
          props: {
            comments: [
              { author: 'grace', text: 'first thought\nsecond thought' },
            ],
          },
          expect: [
            { type: 'text-present', text: 'first thought' },
            { type: 'text-present', text: 'second thought' },
          ],
        },
        {
          name: 'several comments all render',
          props: {
            comments: [
              { author: 'ada', text: 'one' },
              { author: 'grace', text: 'two' },
            ],
          },
          expect: [
            { type: 'text-present', text: 'one' },
            { type: 'text-present', text: 'two' },
          ],
        },
      ],
    },
    {
      id: 'settings-trust-boundary-design',
      kind: 'design',
      completionMode: 'submitted-with-rubric-review',
      title: 'Design the trust boundaries for account settings',
      prompt:
        'Design where each check lives, where the token lives, and how untrusted content is rendered for the account-settings feature in the scenario, then defend your token-storage decision.',
      estimatedMinutes: 25,
      scenario:
        "You are building an account-settings feature. Users can change their display name (shown to others), change their email (requires their current password), and — for admins only — open a panel that suspends other users. The display name is rendered on public profile pages that also show a free-text bio with basic formatting. The app authenticates with a token issued at login. A recent pen test flagged \"client-side authorization\" and \"XSS on profile pages\" as the two concerns to close.",
      sections: [
        {
          id: 'check-placement',
          type: 'short-answer',
          label: 'Where each check runs',
          prompt:
            'For each action — rename, change email, suspend a user — say what the client checks (for feedback) and what the server must independently enforce (for safety). Be explicit about the admin suspend action.',
        },
        {
          id: 'token-storage',
          type: 'tradeoff',
          label: 'Where the token lives',
          prompt:
            'Choose where the auth token is stored and justify it against the XSS concern the pen test raised.',
          options: [
            'localStorage: convenient, readable by app code',
            'An httpOnly cookie: sent automatically, invisible to JavaScript',
            'A regular (non-httpOnly) cookie: sent automatically, readable by JavaScript',
          ],
        },
        {
          id: 'rendering-untrusted',
          type: 'short-answer',
          label: 'Rendering the name and bio',
          prompt:
            'The display name is plain text; the bio allows basic formatting (bold, links). Say how each is rendered safely on the profile page, and what you do if the bio genuinely must support HTML.',
        },
        {
          id: 'admin-panel',
          type: 'tradeoff',
          label: 'Hiding versus protecting the admin panel',
          prompt:
            'A non-admin should not see the suspend panel. Decide what hiding it in the client buys and what actually protects the suspend capability, and justify it.',
          options: [
            'Hide the panel client-side and authorize the suspend endpoint server-side',
            'Hide the panel client-side only; the check that it is hidden is the protection',
            'Show the panel to everyone but disable the button for non-admins',
          ],
        },
      ],
      rubric: [
        {
          id: 'server-enforces',
          label: 'The server is the wall',
          description:
            'Every action names a server-side enforcement independent of the client: rename validates and authorizes ownership, email change re-verifies the current password server-side, and suspend authorizes the caller as an admin on the endpoint — client checks are framed as feedback only.',
        },
        {
          id: 'httponly-token',
          label: 'Token kept out of JavaScript',
          description:
            'The token goes in an httpOnly cookie (or memory), justified by XSS: localStorage and non-httpOnly cookies are readable by any injected script, so one XSS anywhere leaks every token.',
        },
        {
          id: 'escaped-by-default',
          label: 'Untrusted content is escaped',
          description:
            'The display name renders as React-escaped text; the bio is either escaped text with structure-based formatting or, if HTML is truly required, passed through a configured sanitizer — never raw dangerouslySetInnerHTML on user input.',
        },
        {
          id: 'hide-is-not-protect',
          label: 'Hiding is not protecting',
          description:
            'Hiding the admin panel is acknowledged as UX/tidiness only; the suspend capability is protected by server-side authorization on the endpoint, and the option relying on client hiding as protection is rejected.',
        },
        {
          id: 'client-ux-server-safety',
          label: 'The client/server split is explicit',
          description:
            'Draws the general line — client validates for feedback, server validates and authorizes for safety — and applies it consistently rather than per-feature ad hoc.',
        },
      ],
      referenceAnswer:
        "Where each check runs. Rename: the client checks length and allowed characters for instant feedback; the server re-validates the same rules and authorizes that the caller owns the account being renamed — a request can name any account id, so ownership is enforced server-side, not assumed from the UI. Change email: the client can check the new email's format and that a password was entered, but the current-password verification is a security check and must happen on the server against the stored hash; a client-side password compare would mean shipping the hash to the browser, which is absurd. Suspend a user: the client may only reach this if it believes the user is an admin, but the suspend endpoint must independently authorize the caller as an admin on every request, because the endpoint is reachable with curl regardless of what UI called it. The pattern is uniform: client for feedback, server for safety.\n\nToken storage. An httpOnly cookie. The pen test flagged XSS on profile pages, and that is exactly the threat that decides this: a token in localStorage or a non-httpOnly cookie is readable by any JavaScript running on the page, so a single successful XSS — in our code or any dependency — reads document.cookie or localStorage and exfiltrates every user's token. An httpOnly cookie is attached to requests by the browser but hidden from JavaScript entirely, so even a live XSS cannot read it. It shifts the concern to CSRF, which the backend addresses with same-site cookies and CSRF tokens, but it closes the exact leak the pen test named.\n\nRendering the name and bio. The display name is plain text, so it renders as {name} in JSX — React escapes it, and a name like <img onerror=…> shows as literal characters instead of parsing. The bio wanting bold and links does not justify dangerouslySetInnerHTML on raw user input; that is precisely the XSS the pen test found. Two safe routes: render the bio as escaped text and derive formatting from a safe markup the app controls (parse a limited Markdown to React elements, never to an HTML string), or, if the product genuinely requires stored HTML, run it through a configured, audited sanitizer (like DOMPurify with an explicit allowlist) before rendering, and treat the sanitizer config as security-critical. Escaped-by-default is the rule; leaving it is a deliberate, justified, sanitized exception.\n\nAdmin panel. Hide it client-side and authorize the endpoint server-side. Hiding buys tidiness — a non-admin is not shown a control they cannot use — and nothing more: the JavaScript, the API shape, and the suspend endpoint are all reachable by a determined user who opens devtools or curls the API. The protection is the server authorizing the caller as an admin on the suspend endpoint itself. Relying on the client hiding as the protection is the 'client-side authorization' finding restated, and showing a disabled button changes nothing about the endpoint. My example of the failure mode: a dashboard that hid its delete-org button for viewers but left DELETE /orgs/:id unauthorized — a viewer who guessed the endpoint deleted the org, and the hidden button had never been the point.",
    },
    {
      id: 'trust-boundary-review',
      kind: 'written',
      completionMode: 'submitted-with-reference-review',
      title: 'Explain why a client check secures nothing',
      prompt:
        "A teammate ships a feature and calls it secure: the delete button is hidden for non-owners, the form rejects bad input before submitting, and the auth token is kept in localStorage \"so we can attach it to requests.\" In your own words, review each claim. Explain: why the hidden button and the client-side validation secure nothing and what they are actually good for, what makes the browser a trust boundary, why a token in localStorage is a liability and where it should live, and the general rule that connects all three. Use a short example of your own.",
      estimatedMinutes: 12,
      referenceAnswer:
        "None of the three claims is a security control, though two are worth keeping for other reasons. The hidden delete button and the client-side validation run on the user's own machine, and that is the whole problem: the user can open devtools and un-hide the button, disable the JavaScript, or ignore the page entirely and send the DELETE request with curl. So the hidden button stops nothing — the endpoint it would have called is still reachable — and the validation stops nothing an attacker cares about. What they are genuinely good for is the honest user: the hidden button keeps the UI uncluttered and prevents accidental clicks, and the validation gives instant feedback and saves a round-trip. They are UX features wearing security costumes. The real protection for delete is the server authorizing the caller as the owner on the delete endpoint, every time, independent of what UI called it.\n\nThat is what makes the browser a trust boundary: it is the last place you control before code crosses onto a machine you do not. Everything you send the browser — markup, scripts, validation rules, hidden flags — arrives somewhere the user can read and rewrite all of it. So nothing enforced only in the browser is enforced at all; the browser can advise the user and shape their experience, but the server is the one side of the boundary the user cannot reach behind, which is why every safety decision has to live there.\n\nThe token in localStorage is the sharpest liability of the three, because it converts any XSS into total account compromise. localStorage is readable by any JavaScript on the page — yours, a dependency's, an injected script's — so one successful injection anywhere reads the token and the attacker becomes the user everywhere, silently. It belongs in an httpOnly cookie: the browser attaches it to requests automatically, exactly the convenience the teammate wanted, but JavaScript cannot read it, so an injected script cannot steal it. The 'so we can attach it to requests' reasoning actually argues for the cookie, which attaches itself.\n\nThe rule connecting all three is one sentence: anything from outside your code is data until you decide otherwise, and anything running inside the browser is under the user's control. Client code advises; the server enforces. My example: a signup flow that validated the promo code client-side and applied the discount from a hidden field the client sent — a user edited the field to 100% off and checked out free. The fix was not a better hidden field; it was the server computing the price from the code it looked up itself, treating the client's number as a suggestion, which is all a client's number ever is.",
      rubric: [
        {
          id: 'client-checks-are-ux',
          label: 'Client checks are UX, not security',
          description:
            'Explains that hidden controls and client validation run on a user-controlled machine and are bypassable, and reframes their real value as accident-prevention and feedback.',
        },
        {
          id: 'browser-boundary',
          label: 'The browser is a trust boundary',
          description:
            'Articulates that everything sent to the browser is readable and rewritable by the user, so only server-side enforcement is real enforcement.',
        },
        {
          id: 'token-liability',
          label: 'localStorage token is an XSS liability',
          description:
            'Identifies that any script can read localStorage so one XSS leaks the token, and moves it to an httpOnly cookie that still attaches automatically but is hidden from JavaScript.',
        },
        {
          id: 'connecting-rule',
          label: 'The unifying rule',
          description:
            'States the general principle — outside input is data, in-browser code is user-controlled, client advises and server enforces — with a concrete example of the failure.',
        },
      ],
    },
  ],
  approaches: {
    'escape-html': [
      {
        name: 'Five replacements, ampersand first',
        code: `export function escapeHtml(text: string): string {
  // Ampersand first: it is the escape character itself, so escaping it
  // later would corrupt every entity written before it.
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}`,
        explanation:
          "Five characters carry meaning to the HTML parser, and the whole function is replacing each with a form that renders as the character but parses as nothing. The order is the one subtlety, and the double-encode test pins it: every replacement after the first writes an ampersand, so the ampersand pass has to run first — escape it last and the &amp; you just wrote for a < would itself get rewritten to &amp;amp;. With < and > gone, an attacker's string can no longer open a tag, and with both quotes gone it cannot break out of an attribute value into a new one, which are the two ways injected text becomes markup. The reason you rarely call this by hand is the next problem's lesson: React runs the equivalent on every {value}. You reach for an explicit escaper only where you have left React's escaped path on purpose, and then it is exactly this, or a vetted library that also handles the rarer contexts.",
        complexity:
          'O(n) time and space in the text length, one pass per character class. The guarantee that matters is that no output of this function can introduce an HTML tag or attribute the input did not already render as inert text.',
      },
    ],
    'fix-comment-list-xss': [
      {
        name: 'Escaped text plus element structure',
        code: `type Comment = { author: string; text: string }

// Comments are user input. Render them so their characters can never
// become elements.
export function CommentList({ comments }: { comments: Comment[] }) {
  return (
    <ul>
      {comments.map((comment) => (
        <li key={comment.author + comment.text}>
          <strong>{comment.author}</strong>
          {comment.text.split('\\n').map((line, index) => (
            // Structure comes from our code; the user's characters stay
            // characters, escaped by React on the way to the screen.
            <p key={index}>{line}</p>
          ))}
        </li>
      ))}
    </ul>
  )
}`,
        explanation:
          "The whole fix is deleting dangerouslySetInnerHTML and letting JSX do what it does by default. The starter reached for HTML to solve a formatting problem — it wanted newlines to become line breaks — and paid for it by handing the browser every comment as markup, so <img src=x onerror=…> parsed into a live element. Splitting on the newline and rendering each line inside a <p> produces the same visual structure with the opposite security posture: the paragraph elements come from our code, and each line's text sits in a {line} expression, where React escapes it. Now the injection payload renders as the literal characters <img src=x onerror=…>, which the tests assert are on screen — visible and inert — exactly the harmless outcome the lesson's safe version showed. The key on each line is the index, acceptable here because the lines are derived fresh from the text on every render and never reordered. The general shape to remember: when user content needs formatting, add the formatting as elements around escaped text, never by turning the content into HTML.",
        complexity:
          'O(n) render work in the total comment length. The guarantee that matters is that no comment, however crafted, can render as anything but text — the framework escapes every character on the default path this component now stays on.',
      },
    ],
  },
}
