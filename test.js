const express = require('express');
const app = express();
const port = 1000;

app.get('/', (req, res) => {
  const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Obfuscated Page</title>
        </head>
        <body>
            <h1>Hello, this is an obfuscated page!</h1>
            <script>
                document.addEventListener('contextmenu', function (e) {
                    e.preventDefault();
                    console.log('Right-click is disabled.');
                });

                document.addEventListener('keydown', function (e) {
                    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
                        e.preventDefault();
                        console.log('Inspect Element is disabled.');
                    }
                });
            </script>
        </body>
        </html>
    `;

  res.send(html);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
