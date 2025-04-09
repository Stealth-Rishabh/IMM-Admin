# IMM Admin Panel

A comprehensive admin panel for managing website content including events, image gallery, and more.

## Project Overview

This admin panel provides a user-friendly interface for managing website content. It includes features for managing events, image galleries, and other website content through a modern React-based UI with a PHP backend API.

## Features

- **Image Gallery Management**: Upload, edit, and delete images with category organization
- **Event Management**: Create and manage events with titles, dates, descriptions, and image galleries
- **Modern UI**: Built with React and styled with Tailwind CSS
- **RESTful API**: PHP-based backend API for data management

## Directory Structure

```
imm-admin-panel/
├── api/               # PHP API endpoints
│   ├── classes/       # PHP classes for data models
│   ├── config/        # Database configuration
│   ├── events/        # Event API endpoints
│   └── includes/      # Common includes
├── classes/           # Core PHP classes
├── config/            # Application configuration
├── database/          # Database SQL files
├── db/                # Additional database scripts
├── public/            # Public assets
├── src/               # Frontend React source code
│   ├── components/    # UI components
│   └── pages/         # Page components
└── uploads/           # Uploaded files (created at runtime)
```

## Installation

### Prerequisites

- PHP 7.4 or higher
- MySQL/MariaDB database
- Node.js and npm/pnpm
- Web server (Apache, Nginx, etc.)

### Setup

1. Clone the repository:

```bash
git clone [repository-url]
cd imm-admin-panel
```

2. Install frontend dependencies:

```bash
pnpm install
```

3. Create a MySQL database and import the SQL files from the `database` and `db` directories.

4. Configure the database connection in the `config/Database.php` file.

5. Start the development server:

```bash
pnpm dev
```

## API Documentation

### Events API

**Endpoints:**

- `GET /api/events.php` - Get all events
- `GET /api/events.php?id={id}` - Get a specific event
- `POST /api/events.php` - Create a new event
- `PUT /api/events.php?id={id}` - Update an event
- `DELETE /api/events.php?id={id}` - Delete an event

**Event Object:**

```json
{
  "id": 1,
  "title": "Event Title",
  "date": "2023-12-31",
  "category": "Event Category",
  "description": "Event description",
  "image": "path/to/image.jpg",
  "tags": ["tag1", "tag2"],
  "gallery": ["path/to/gallery1.jpg", "path/to/gallery2.jpg"],
  "created_at": "2023-01-01 12:00:00"
}
```

### Image Gallery API

**Endpoints:**

- `GET /api/index.php` - Get all images
- `POST /api/index.php` - Upload a new image
- `PUT /api/index.php?id={id}` - Update an image
- `DELETE /api/index.php?id={id}` - Delete an image

## Development

### Frontend

The frontend is built with React.js and uses Tailwind CSS for styling. To modify the frontend:

1. Navigate to the `src` directory
2. Make changes to the components or pages
3. Run the development server with `pnpm dev`

### Backend

The backend uses PHP with a MySQL database. To modify the backend:

1. Navigate to the `api` directory
2. Modify the PHP files as needed
3. Test the API endpoints using tools like Postman or the built-in test pages

## License

[Include license information here]
