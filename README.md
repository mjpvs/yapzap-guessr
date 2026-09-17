# YapZap Guessr

Run `npm start`, then open http://localhost:3030. No dependencies need installing.

Songs are loaded from `submissions.json` when the server starts. Each song starts as Unknown; each user can be assigned to at most three songs. Submit at any time to score your guesses and reveal the answers. Play again clears all guesses.

The server keeps submitters out of the playlist API and validates the selection limit when scoring. This is a casual local game without accounts or saved scores.

Run `npm test` to check scoring and validation.

## Nginx and PM2

Start the app with `pm2 start server.js --name yapzapguessr` from this directory. After deploying changes, run `pm2 restart yapzapguessr`.

For a subpath such as `/guessr/`, add these locations inside your Nginx `server` block:

```nginx
location = /guessr {
    return 301 /guessr/;
}

location /guessr/ {
    proxy_pass http://127.0.0.1:3030/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

The trailing slash on `proxy_pass` strips the `/guessr/` prefix before forwarding to Node. The redirect ensures relative asset URLs resolve inside `/guessr/`. Assets, API calls, and shared links use the app's public path. For a dedicated domain, use `location /` with the same proxy settings.

Validate with `sudo nginx -t`, then reload with `sudo systemctl reload nginx`.
