# My CMS

A custom content management system for managing Facebook-style timeline posts. Built with SvelteKit, Tailwind CSS, shadcn-svelte, Drizzle ORM, and Supabase.

## Features

- 📝 **Rich Text Editor** - Create posts with formatted text, images, videos, and YouTube embeds using TipTap
- 🖼️ **Media Library** - Upload and manage images, videos, and audio files
- 🔐 **Authentication** - Email/password login with Supabase Auth
- 🔑 **API Access** - Secure API routes with API key authentication for external clients
- 📱 **Responsive Design** - Beautiful dark theme UI that works on all devices
- 🔄 **Future-Ready** - Architecture designed to support multiple content types

## Tech Stack

- **Frontend**: SvelteKit, Tailwind CSS, shadcn-svelte
- **Editor**: TipTap (rich text editor)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Drizzle ORM
- **Auth & Storage**: Supabase
- **Icons**: Lucide

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Supabase project

### Installation

1. Clone the repository and install dependencies:

```bash
bun install
```

2. Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

3. Update `.env` with your Supabase project details:

```env
DATABASE_URL="your-database-url"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

4. Run the development server:

```bash
bun dev
```

### Database Setup

The database schema is managed through Supabase migrations. The schema includes:

- **posts** - Timeline posts with rich text content
- **media** - Uploaded media files (images, videos, audio)
- **post_media** - Junction table linking posts to media
- **api_keys** - API keys for external access

### Creating a User

Since this is a single-user CMS without signup functionality, you'll need to create your user account through the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user" and create your account with email/password

## Project Structure

```
src/
├── lib/
│   ├── components/          # Reusable components
│   │   ├── ui/             # shadcn-svelte components
│   │   └── PostEditor.svelte
│   ├── server/
│   │   ├── db/             # Drizzle schema and client
│   │   └── supabase.ts     # Server-side Supabase client
│   ├── supabase.ts         # Browser Supabase client
│   └── utils.ts
├── routes/
│   ├── (app)/              # Protected app routes
│   │   ├── +layout.svelte  # App layout with sidebar
│   │   ├── +page.svelte    # Dashboard
│   │   ├── posts/          # Posts management
│   │   ├── media/          # Media library
│   │   └── settings/       # Settings & API keys
│   ├── api/
│   │   ├── upload/         # Media upload endpoint
│   │   └── v1/             # Public API routes
│   ├── login/              # Login page
│   └── +layout.svelte      # Root layout
└── hooks.server.ts         # Auth middleware
```

## API Routes

The CMS provides API routes for external consumption:

### Authentication

All API routes require a valid API key in the Authorization header:

```
Authorization: Bearer tlcms_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Endpoints

#### List Posts

```
GET /api/v1/posts?page=1&limit=10
```

Returns paginated list of published posts.

#### Get Post

```
GET /api/v1/posts/:id
```

Returns a single published post by ID.

### Response Format

```json
{
  "data": {
    "id": "uuid",
    "title": "Post Title",
    "content": "<p>HTML content</p>",
    "excerpt": "Brief summary",
    "publishedAt": "2024-01-01T00:00:00Z",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "media": [
      {
        "id": "uuid",
        "url": "https://...",
        "mediaType": "image",
        "altText": "Description"
      }
    ]
  }
}
```

## Future Content Types

The CMS is designed to support additional content types in the future. The sidebar navigation includes a content type selector that can be extended to support:

- Articles (long-form content)
- Projects (portfolio items)
- Notes (quick thoughts)
- And more...

## Development

```bash
# Start dev server
bun dev

# Build for production
bun run build

# Preview production build
bun run preview

# Type checking
bun run check
```

## Deployment

This app is configured to deploy on **Netlify**. The backend (server-side routes, API endpoints, database queries) runs on Netlify Functions, which connect to your Supabase backend.

### Deploy to Netlify

#### Option 1: Netlify CLI (Recommended)

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Initialize and deploy:
   ```bash
   netlify init
   netlify deploy --prod
   ```

#### Option 2: Git Integration (Easiest)

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [Netlify Dashboard](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your repository
5. Configure build settings:
   - **Build command:** `bun run build`
   - **Publish directory:** `.svelte-kit/netlify`

### Environment Variables

**Important:** You must set these environment variables in Netlify:

1. Go to your site settings → Environment variables
2. Add the following variables:

```
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** 
- Get `DATABASE_URL` from Supabase Dashboard → Settings → Database → Connection string (Transaction pooler)
- Get `SUPABASE_URL` and `SUPABASE_ANON_KEY` from Supabase Dashboard → Settings → API

### How Backend Works on Netlify

- **Server Routes** (`+page.server.ts`, `+server.ts`) run on Netlify Functions (serverless)
- **API Routes** (`/api/*`) execute as Netlify Functions
- **Database queries** connect to Supabase from Netlify Functions
- **Authentication** works via Supabase Auth (cookies handled automatically)
- **File uploads** go directly to Supabase Storage

All your backend code works exactly the same as in development!

## License

MIT
