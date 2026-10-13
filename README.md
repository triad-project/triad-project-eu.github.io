# triad-project.eu

Website of TRIAD (Horizon Europe, Grant Agreement 101289995), in English. Maintained by VILNIUS TECH as part of WP9 and WP10.

The site has four pages in the menu:

- **About** - what the project does, the four questions it studies, the four phases with their work packages, and the project record.
- **Consortium** - the eleven partners.
- **Outputs** - public deliverables, publications and materials, with links once they are published.
- **News** - project news, events, results and press releases.

## Adding and changing content (for editors)

Content is edited in the browser with [Pages CMS](https://app.pagescms.org). No code is needed.

1. Open https://app.pagescms.org and sign in. You need an invitation to this site first: ask Monika Maciuliene (VILNIUS TECH).
2. Choose this site. The menu on the left lists what can be edited.
3. **To add a news item**, open "News" and press "Add an entry".
   - Write the title, pick the date and the type (News, Event, Result, Press release).
   - If the news comes from one partner, pick the partner.
   - Write a summary of one or two sentences and the text.
   - Upload a picture if you have one, with a short description and the picture credit.
   - A new item is saved as a **draft**. Drafts are not shown on the site. Untick "Draft" to publish.
4. Press "Save". The site rebuilds by itself and the change is live in about two minutes.

Other things in the menu:

- **Outputs** - when a deliverable is public, paste its link into the "Link" field of that deliverable. It is then marked as published and its title becomes the link. Papers, policy briefs, toolkits and videos go under "Publications and materials".
- **Consortium** - partner names, websites and logos.
- **Home page texts, About page texts** - the fixed texts of those pages.
- **Contact and social media links** - a channel shows in the footer once its link is filled in. The visit counter is switched on here too.
- **Privacy notice** - the text of the privacy page, which is linked from the footer and from the newsletter form.

Rules we keep on this site:

- No invented facts or numbers. Figures come from the Grant Agreement or a published deliverable.
- No recognisable pupils in pictures without a signed consent form. Every picture that is not ours has a credit.
- No em dashes. Sentence case in headings.
- The EU emblem and the funding statement in the footer are never edited.

## How it works

- Content lives in `content/` as JSON files. News items are in `content/news/`, one file per item.
- Pages are built from `src/` with [Eleventy](https://www.11ty.dev). The stylesheet and the logos are in `static/`, uploaded pictures in `assets/uploads/`.
- The editor is configured in `.pages.yml`.
- Every change on `main` is built and published by GitHub Actions (`.github/workflows/deploy.yml`) to GitHub Pages.
- News items marked as draft show in the local preview only.
- The newsletter form sends sign-ups straight into the contact list of Hostinger Reach, where the newsletter is sent from. The id of the Reach form is in `content/site.json`.
- Visits are counted with GoatCounter, without cookies, once its site code is filled in under "Contact and social media links". While the field is empty nothing is counted. The privacy notice shows the matching text by itself.
- The work plan (`content/workplan.json`) follows the Grant Agreement and is changed only after an amendment.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:8092.
