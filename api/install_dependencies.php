<?php
// Check if Composer is installed
$composerInstalled = shell_exec('composer --version');

if (empty($composerInstalled)) {
    echo "Composer is not installed. Please install Composer first: https://getcomposer.org/download/\n";
    exit(1);
}

// Check if composer.json exists, if not create it
if (!file_exists('composer.json')) {
    $composerJson = [
        "require" => [
            "phpmailer/phpmailer" => "^6.9"
        ]
    ];
    
    file_put_contents('composer.json', json_encode($composerJson, JSON_PRETTY_PRINT));
    echo "Created composer.json file\n";
}

// Install dependencies
echo "Installing dependencies...\n";
shell_exec('composer install');
echo "Dependencies installed successfully!\n";

// Check if PHPMailer was installed correctly
if (file_exists('vendor/phpmailer/phpmailer/src/PHPMailer.php')) {
    echo "PHPMailer installed successfully!\n";
} else {
    echo "PHPMailer installation failed. Please run 'composer require phpmailer/phpmailer' manually.\n";
}

// Include a note about configuring email settings
echo "\n===================================================\n";
echo "IMPORTANT: Update email configuration in api/includes/recruitandpartner.php\n";
echo "Replace the following values:\n";
echo "- \$mail->Host = 'smtp.gmail.com' (or your SMTP server)\n";
echo "- \$mail->Username = 'your_email@gmail.com' (your email)\n";
echo "- \$mail->Password = 'your_app_password' (your password)\n";
echo "===================================================\n";

// Include a note about installing axios
echo "\nFrontend dependencies:\n";
echo "Please run the following command to install axios:\n";
echo "npm install axios\n";
echo "===================================================\n";
?> 