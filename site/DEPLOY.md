# Deploying the website to the Oracle server

The site runs as its own small container on the shared Oracle VM (`svc-agent`, 140.238.251.141), bound to `127.0.0.1` only. The server's Caddy is the front door and handles HTTPS.

The website goes live together with the Bhava app, so the hosting session deploys both. Before going live, set `app.signupUrl` in `site.config.json` to the app's sign-up page.

| | Value |
| --- | --- |
| Address | https://bhava.140-238-251-141.sslip.io (until a real domain is bought) |
| Folder | `~/bhava-site` (a clone of this repo; the website is in `~/bhava-site/site`) |
| Docker project | `bhava-site` (service `web`) |
| Port | `127.0.0.1:8150`: the next free number after the ports below. Confirm it on the server first (step 2). |
| Caddy site file | `/etc/caddy/sites/bhava-site.caddy` (or `bhava.caddy` if made with `add-site.sh`) |
| Data | None. The site is static, so there is no volume to back up. |

Ports already taken on this server: 8000 (alerts), 8080 (service bot), 8100 (Mehta Mart), 8110 (Plant Store demo), 8120 and 8130 (NurseryPOS), 8140 (Bhava QA).

## Shared-server rules

- Touch only the `bhava-site` folder, container and Caddy site file.
- Never stop, restart or edit other projects' containers or Caddy site files.
- Never publish on `0.0.0.0`, never run `docker compose down -v` or `docker system prune -a`.
- Back up the main Caddyfile before any Caddy change.

## First deploy

1. **Connect.** Disconnect the Voltas VPN first; port 22 times out on the office network. Use a phone hotspot or Oracle Cloud Shell if it still times out.

   ```bash
   ssh -i ~/.ssh/oracle-svc-agent.key ubuntu@140.238.251.141
   ```

2. **Get the code and check the port (read-only).**

   ```bash
   git clone https://github.com/nexoraconsulting001-art/Auto_DM_Plugin ~/bhava-site
   cd ~/bhava-site/site
   bash deploy/check-server.sh 8150      # must end with "Port 8150 is free."
   ```

   If 8150 is taken, try 8151, 8152 and so on, and use that number in steps 3 and 5.

3. **Set the port and start the container.**

   ```bash
   cd ~/bhava-site/site/deploy
   cp .env.example .env && nano .env     # PORT=8150 (or the free port from step 2)
   docker compose up -d --build
   curl -s -o /dev/null -w "%{http_code}\n" 127.0.0.1:8150/            # 200
   curl -s -o /dev/null -w "%{http_code}\n" 127.0.0.1:8150/pricing     # 200
   curl -s -o /dev/null -w "%{http_code}\n" 127.0.0.1:8150/nope        # 404
   ```

4. **Back up Caddy's config.**

   ```bash
   sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak-$(date +%F-%H%M)
   sudo cp -r /etc/caddy/sites /etc/caddy/sites.bak-$(date +%F-%H%M)
   ```

5. **Add the site to Caddy.** Either use the server's helper, as for the other sites:

   ```bash
   sudo bash ~/Service-Call-Bot/infra/oracle-vm/add-site.sh bhava proxy 8150
   ```

   or copy the site block in this repo (check that its port matches):

   ```bash
   sudo cp ~/bhava-site/site/deploy/bhava-site.caddy /etc/caddy/sites/bhava-site.caddy
   sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy
   ```

6. **Check it from outside:** open https://bhava.140-238-251-141.sslip.io on a phone. The first visit can take a few seconds while Caddy gets the certificate.

## Updating

```bash
cd ~/bhava-site && git pull && cd site/deploy && docker compose up -d --build
docker compose logs web --tail 30      # logs, this project only
```

Once every detail in `site/site.config.json` is confirmed, set `BUILD_FLAGS=--release` in `site/deploy/.env`. The build then fails, and the running site stays as it was, if anything is still open.

## Taking it down

```bash
cd ~/bhava-site/site/deploy && docker compose stop      # this project only
sudo rm /etc/caddy/sites/bhava-site.caddy && sudo caddy validate --config /etc/caddy/Caddyfile && sudo systemctl reload caddy
```

## Moving to a real domain

Point the domain's DNS A record at 140.238.251.141, change the address in the Caddy site file and `siteUrl` in `site.config.json`, then update as above.
