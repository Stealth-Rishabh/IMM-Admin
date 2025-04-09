<?php
require_once 'includes/config.php';
header("Content-Type: text/html; charset=UTF-8");
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Image Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, select {
            width: 100%;
            padding: 8px;
            margin-bottom: 10px;
        }
        button {
            padding: 10px 15px;
            background-color: #4CAF50;
            color: white;
            border: none;
            cursor: pointer;
        }
        .image-preview {
            max-width: 300px;
            max-height: 300px;
            margin: 10px 0;
            border: 1px solid #ddd;
            padding: 5px;
        }
        .results {
            margin-top: 20px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 5px;
        }
        pre {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
    </style>
</head>
<body>
    <h1>Edit Image Test</h1>
    
    <?php
    // Load image data if ID is provided
    $imageData = null;
    $imageId = isset($_GET['id']) ? $_GET['id'] : null;
    
    if ($imageId) {
        require_once 'includes/gallery.php';
        $gallery = new Gallery();
        $gallery->id = $imageId;
        
        if ($gallery->readSingle()) {
            $imageData = [
                'id' => $gallery->id,
                'title' => $gallery->title,
                'category' => $gallery->category,
                'filename' => $gallery->filename,
                'url' => 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/uploads/' . $gallery->filename
            ];
        }
    }
    
    // Process form submission
    $formResult = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
        $formData = [
            'id' => $_POST['id'],
            'title' => $_POST['title'] ?? '',
            'category' => $_POST['category'] ?? 'Uncategorized'
        ];
        
        $requestData = [
            'method' => 'PUT',
            'post_data' => $formData,
            'files' => isset($_FILES['file']) ? $_FILES['file'] : null
        ];
        
        // Create a new instance and set properties
        $gallery = new Gallery();
        $gallery->id = $formData['id'];
        $gallery->title = $formData['title'];
        $gallery->category = $formData['category'];
        
        // Update with or without file
        if (isset($_FILES['file']) && $_FILES['file']['size'] > 0) {
            $result = $gallery->update($_FILES['file']);
        } else {
            $result = $gallery->update();
        }
        
        // Prepare result data
        $formResult = [
            'request' => $requestData,
            'result' => $result
        ];
        
        // If update was successful, redirect to view the updated image
        if ($result === true) {
            $formResult['success'] = true;
            $formResult['message'] = 'Image updated successfully!';
            // Reload the image data
            if ($gallery->readSingle()) {
                $imageData = [
                    'id' => $gallery->id,
                    'title' => $gallery->title,
                    'category' => $gallery->category,
                    'filename' => $gallery->filename,
                    'url' => 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/uploads/' . $gallery->filename
                ];
            }
        } else {
            $formResult['success'] = false;
            $formResult['message'] = 'Failed to update image.';
        }
    }
    
    // If no image data is available, show form to select image by ID
    if (!$imageData):
    ?>
    <form action="test-edit.php" method="GET">
        <div class="form-group">
            <label for="id">Enter Image ID to Edit:</label>
            <input type="number" id="id" name="id" required>
        </div>
        <button type="submit">Load Image</button>
    </form>
    <?php else: ?>
    <!-- Edit form for the selected image -->
    <form action="test-edit.php?id=<?php echo htmlspecialchars($imageData['id']); ?>" method="POST" enctype="multipart/form-data">
        <input type="hidden" name="id" value="<?php echo htmlspecialchars($imageData['id']); ?>">
        
        <div class="form-group">
            <label>Current Image:</label>
            <img src="<?php echo htmlspecialchars($imageData['url']); ?>" class="image-preview" alt="<?php echo htmlspecialchars($imageData['title']); ?>">
        </div>
        
        <div class="form-group">
            <label for="title">Title:</label>
            <input type="text" id="title" name="title" value="<?php echo htmlspecialchars($imageData['title']); ?>" required>
        </div>
        
        <div class="form-group">
            <label for="category">Category:</label>
            <select id="category" name="category">
                <option value="Uncategorized" <?php echo $imageData['category'] === 'Uncategorized' ? 'selected' : ''; ?>>Uncategorized</option>
                <option value="Nature" <?php echo $imageData['category'] === 'Nature' ? 'selected' : ''; ?>>Nature</option>
                <option value="Travel" <?php echo $imageData['category'] === 'Travel' ? 'selected' : ''; ?>>Travel</option>
                <option value="Food" <?php echo $imageData['category'] === 'Food' ? 'selected' : ''; ?>>Food</option>
                <option value="People" <?php echo $imageData['category'] === 'People' ? 'selected' : ''; ?>>People</option>
                <option value="Architecture" <?php echo $imageData['category'] === 'Architecture' ? 'selected' : ''; ?>>Architecture</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="file">Replace Image (optional):</label>
            <input type="file" id="file" name="file" accept="image/*">
        </div>
        
        <button type="submit">Update Image</button>
    </form>
    <?php endif; ?>
    
    <?php if ($formResult): ?>
    <div class="results">
        <h2><?php echo $formResult['success'] ? 'Success!' : 'Error'; ?></h2>
        <p><?php echo htmlspecialchars($formResult['message']); ?></p>
        <h3>Debug Information:</h3>
        <pre><?php echo htmlspecialchars(json_encode($formResult, JSON_PRETTY_PRINT)); ?></pre>
    </div>
    <?php endif; ?>
    
    <div style="margin-top: 20px;">
        <a href="test.html">Back to Test Page</a>
    </div>
    
    <script>
        // If a file is selected, show a preview
        document.addEventListener('DOMContentLoaded', function() {
            const fileInput = document.getElementById('file');
            if (fileInput) {
                fileInput.addEventListener('change', function(e) {
                    if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            const preview = document.querySelector('.image-preview');
                            preview.src = e.target.result;
                        }
                        reader.readAsDataURL(e.target.files[0]);
                    }
                });
            }
        });
    </script>
</body>
</html> 