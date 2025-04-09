# Image Gallery API Setup

This is the PHP backend for the Image Gallery component. It provides a RESTful API for managing images with full CRUD operations.

## Setup Instructions

1. **XAMPP Setup**:

   - Install XAMPP if you haven't already (https://www.apachefriends.org/index.html)
   - Start the Apache and MySQL services from the XAMPP Control Panel

2. **Database Setup**:

   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Import the `imm_cms.sql` file to create the database and table
   - Alternatively, you can create the database manually:
     - Create a new database named `imm_cms`
     - Execute the SQL statements from the `imm_cms.sql` file

3. **API Files**:

   - Place the entire `api` folder in your XAMPP htdocs directory
   - Default location: `C:\xampp\htdocs\api`
   - Make sure the `uploads` directory has write permissions

4. **Testing the API**:

   - Access the test interface at: http://localhost/api/test.html
   - This simple interface lets you test uploading, viewing, and deleting images

5. **React Connection**:
   - Update the API_URL in the React component (ImageGallery.jsx) if your local setup is different
   - Default URL is: `http://localhost/api/index.php`

## API Endpoints

The API supports the following operations:

- **GET /api/index.php**: Fetch all images
- **GET /api/index.php?id=X**: Fetch a single image by ID
- **POST /api/index.php**: Upload a new image (requires title, category, and file)
- **PUT /api/index.php**: Update an existing image (requires id, title, category, and optionally a new file)
- **DELETE /api/index.php?id=X**: Delete an image by ID

## Troubleshooting

- **File Upload Issues**: Make sure the `uploads` directory has proper write permissions
- **CORS Errors**: The API has CORS headers set to allow all origins. If you're still having issues, check your browser's CORS settings
- **Database Connection Errors**: Verify your MySQL credentials in `includes/config.php`
