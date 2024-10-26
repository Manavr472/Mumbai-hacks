document.addEventListener('DOMContentLoaded', () => {
    new QRious({
        element: document.getElementById('qrcode-injection'),
        value: 'https://example.com/injection-simulation'
    });

    new QRious({
        element: document.getElementById('qrcode-tools'),
        value: 'https://example.com/medical-tool-familiarization'
    });

    new QRious({
        element: document.getElementById('qrcode-cbc'),
        value: 'https://example.com/cbc-simulation'
    });
});
