<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Notification;

$notifications = Notification::all();

$search = [
    'Si ',
    ' ay nag-submit ng Premium Pass request via ',
    '. Paki-verify ang payment sa counter.',
    ' ay nag-register bilang Premium (',
    ' ay nag-register bilang Daily Pass.',
    '. Paki-verify ang payment at i-activate ang account.',
    '. Paki-verify at i-activate ang account bago mag-login.',
    ' ay nag-order ng ',
    ' Paki-verify sa Shop orders.',
    'Na-submit na ang iyong Premium Pass request',
    'Paki-punta sa gym counter o ipakita ang iyong GCash reference sa staff para ma-verify at ma-activate ang iyong account.',
    'Na-verify na ng gym staff ang iyong bayad! Handa na ang iyong order para ma-claim sa counter.',
    'Ang iyong shop order ay na-reject ng staff. Kung may katanungan tungkol sa order, lumapit sa gym counter.'
];

$replace = [
    '',
    ' submitted a Premium Pass renewal request via ',
    '. Please verify payment at the counter.',
    ' registered as Premium (',
    ' registered as Daily Pass.',
    '. Please verify payment and activate account.',
    '. Please verify and activate account before login.',
    ' placed an order for ',
    ' Please verify in Shop orders.',
    'Your Premium Pass request has been submitted',
    'Please proceed to the gym counter or present your payment reference to staff for verification and activation.',
    'Your payment has been verified by the gym staff! Your order is now ready for pickup at the counter.',
    'Your shop order was declined by staff. If you have questions regarding your order, please approach the gym counter.'
];

$count = 0;
foreach ($notifications as $n) {
    $old = $n->message;
    $new = str_replace($search, $replace, $old);
    if ($old !== $new) {
        $n->update(['message' => $new]);
        $count++;
    }
}

echo "Successfully updated {$count} notifications to English.\n";
