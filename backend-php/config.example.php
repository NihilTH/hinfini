<?php
// Copy to config.local.php OUTSIDE public_html. Never commit actual secrets.
return [
 'BANK_ACCOUNT_NAME'=>'',
 'BANK_ACCOUNT_NUMBER'=>'',
 'APP_ENV'=>'production',
 'DB_HOST'=>'localhost', 'DB_PORT'=>3306, 'DB_NAME'=>'cpaneluser_hinfini',
 'DB_USER'=>'cpaneluser_shop', 'DB_PASSWORD'=>'',
 'ADMIN_TOKEN'=>'', // Generate: php -r 'echo bin2hex(random_bytes(32)), PHP_EOL;'
 'PUBLIC_SITE_URL'=>'https://sajatdomain.hu',
 'CORS_ORIGINS'=>'', // Empty = same-origin only. Development: http://localhost:3000
 // Barion: disabled until configured and tested. Test and live keys are separate.
 'PAYMENT_PROVIDER'=>'barion', 'BARION_ENABLED'=>false, 'BARION_ENV'=>'sandbox',
 'BARION_TEST_POS_KEY'=>'', 'BARION_TEST_PAYEE_EMAIL'=>'',
 'BARION_PIXEL_ENABLED'=>false, 'BARION_PIXEL_ID'=>'', 'BARION_TEST_PIXEL_ID'=>'',
 'BARION_POS_KEY'=>'', 'BARION_PAYEE_EMAIL'=>'',
 // Legacy SimplePay retained only for historical transactions.
 'SIMPLEPAY_MERCHANT_ID'=>'', 'SIMPLEPAY_SECRET_KEY'=>'',
 'SIMPLEPAY_BASE_URL'=>'https://sandbox.simplepay.hu/payment/v2',
 'FREE_SHIPPING_FROM'=>25000, 'SHIPPING_FEE_HOME'=>1990, 'SHIPPING_FEE_PICKUP'=>1290,
 'LOW_STOCK_THRESHOLD'=>5,
 'STORAGE_DRIVER'=>'local', 'MAX_UPLOAD_MB'=>5,
 // Local files stay in backend-php/uploads, served by the PHP image endpoint.
 'S3_ENDPOINT_URL'=>'', 'S3_REGION'=>'auto', 'S3_BUCKET'=>'',
 'S3_ACCESS_KEY_ID'=>'', 'S3_SECRET_ACCESS_KEY'=>'', 'S3_PUBLIC_BASE_URL'=>'',
 'EMAIL_PROVIDER'=>'none', // none | php_mail | resend | sendgrid
 'EMAIL_FROM'=>'', 'EMAIL_FROM_NAME'=>"H'INFINI Candles", 'EMAIL_REPLY_TO'=>'',
 'RESEND_API_KEY'=>'', 'SENDGRID_API_KEY'=>'', 'ORDER_NOTIFY_EMAIL'=>'hinfinicandles@hinfinicandles.hu', 'ORDER_NOTIFY_COPY_EMAIL'=>'hinfinicandles@gmail.com', 'SUPPORT_EMAIL'=>'',
 'INVOICE_PROVIDER'=>'none', 'INVOICE_TRIGGER'=>'paid',
 'SZAMLAZZ_ENABLED'=>false, 'SZAMLAZZ_TEST_AGENT_KEY'=>'', 'SZAMLAZZ_AGENT_KEY'=>'',
 'INVOICE_VAT'=>'AAM', 'SZAMLAZZ_E_INVOICE'=>false, 'SZAMLAZZ_PREFIX'=>'',
];
