# Optimize Teacher AI

Teacher-specific, school-specific essay feedback with predicted grades. Students select a school and teacher, paste their essay, and get AI-powered feedback that mimics how that specific teacher would grade and comment.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4
- **Database & Auth:** Supabase (Postgres + Auth)
- **AI Engine:** Anthropic Claude API
- **Deployment:** Vercel

## Getting Started

### 1. Clone and Install

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the database schema:
   - Open the SQL Editor in your Supabase dashboard
   - Copy the contents of `supabase-schema.sql` and execute it
3. Enable Email Auth in Authentication → Providers

### 3. Configure Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon/public key
- `ANTHROPIC_API_KEY` — Your Anthropic API key

### 4. Seed Some Data

Before using the app, you need at least one school and one teacher in the database. Run these in your Supabase SQL Editor:

```sql
-- Add a school
INSERT INTO schools (name, district, state, school_type)
VALUES ('Lincoln High School', 'Springfield USD', 'CA', 'public_high');

-- Add a teacher (use the school ID from above)
INSERT INTO teachers (school_id, name, department, years_experience)
VALUES (
  (SELECT id FROM schools WHERE name = 'Lincoln High School'),
  'Ms. Johnson',
  'English',
  12
);

-- Optionally add a teacher profile for more personalized feedback
INSERT INTO teacher_profiles (teacher_id, grading_strictness, feedback_detail_level, tone_keywords, common_phrases, rubric_weights)
VALUES (
  (SELECT id FROM teachers WHERE name = 'Ms. Johnson'),
  7,
  'detailed',
  ARRAY['encouraging', 'thorough', 'academic'],
  ARRAY['Great observation!', 'Consider expanding on this point.', 'How does this connect to your thesis?'],
  '{"thesis": 25, "evidence": 25, "organization": 20, "style": 15, "mechanics": 15}'
);
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 6. Deploy to Vercel

```bash
npx vercel
```

Set the same environment variables in your Vercel project settings.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Tailwind imports + theme
│   ├── login/page.tsx        # Login form
│   ├── signup/page.tsx       # Signup form
│   ├── dashboard/page.tsx    # User dashboard (essay history)
│   ├── analyze/page.tsx      # 3-step essay submission flow
│   ├── results/[id]/page.tsx # Results page with grade + comments
│   └── api/
│       ├── analyze/route.ts  # Claude AI analysis endpoint
│       └── auth/
│           ├── callback/route.ts  # Auth callback
│           └── signout/route.ts   # Sign out
├── lib/
│   ├── types.ts              # TypeScript types
│   ├── utils.ts              # Utility functions
│   └── supabase/
│       ├── client.ts         # Browser Supabase client
│       ├── server.ts         # Server Supabase client
│       └── middleware.ts     # Auth session middleware
└── middleware.ts             # Next.js middleware (auth routing)
```

## How It Works

1. **Student signs up** and selects their school and teacher
2. **Pastes their essay** along with the assignment prompt (optionally a rubric)
3. **Claude AI analyzes the essay** in the voice of the selected teacher, using the teacher's profile (grading strictness, tone, rubric weights)
4. **Results page shows:** predicted grade (letter + numeric + confidence), 8-12 inline comments anchored to specific excerpts, an end comment summary, strengths/weaknesses, and revision priorities
