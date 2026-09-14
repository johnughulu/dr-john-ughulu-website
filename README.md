# Dr. John Ughulu Personal Website

A new, multi-page static website built from scratch for Dr. John Ughulu. The public frontend can be hosted on GitHub Pages. Visitor access records are stored in Supabase with row-level security so the public browser can insert records but cannot read or export them.

## Setup

1. The supplied, unedited headshot is stored at `public/assets/dr-john-ughulu-headshot.png`.
2. Create a Supabase project and run `supabase/schema.sql` in its SQL Editor.
3. Copy `public/config.example.js` to `public/config.js` and add the Supabase project URL and public anon key.
4. Run `npm run build`.
5. Publish the `dist` directory with GitHub Pages.

## Administration

Sign in to the Supabase project, open **Table Editor → resource_access**, filter or review submissions, then choose **Export CSV**. The table records the visitor's name, email, selected resource, destination provider, required privacy consent, optional marketing consent, consent version, and submission date. Anonymous users have insert-only permission and cannot view stored submissions.

## Privacy and security

- The service-role key must never be placed in this repository or browser code.
- The public anon key is safe to expose only with the supplied row-level-security policies enabled.
- Marketing consent is optional and stored separately from required privacy consent.
- Redirect occurs only after a successful database write.
- The browser remembers completed consent for the current visitor and still logs each selected resource.
- Update the Privacy Policy contact address before the final public launch if a different address is preferred.

No domain or DNS configuration is included in this repository.
