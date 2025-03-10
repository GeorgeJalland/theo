# Theo Von Quotes
**Python FastAPI** Web App to display Theo Von's quotes. Client written in **HTML**, **CSS** and **Vanilla JS**. Current setup with **SQLite** database using **aiosqlite** async database driver.

### Optimisations:
- Utilised **FastAPI** asynchronous functionality in all API functions
- Async database driver
- **asyncio** background tasks for certain database operations
- Minimised API calls in javascript by rendering component changes using client side logic, .e.g incrementing counters
- Static files to be served directly from NGINX server as opposed to through FastAPI

## Setup
*python>= 3.10 required*

### Git Clone

```bash
git clone https://github.com/GeorgeJalland/theo.git
```
### Venv Setup

```bash
python -m venv venv
source venv/bin/activate #bash
source venv/Scripts/activate #git-bash
```
### Install Requirements
```bash
pip install -r requirements.txt
```

### Database
Create sqlite database under instance/app.db by running
```bash
mkdir ./app/instance
touch ./app/instance.db
sqlite3 ./app/instance/app.db #check
```

Table creation will be handled by SQLModel library

### Run App Locally

**Api**
```bash
fastapi dev app/main.py --port 7000
```

**Client**
```bash
python3 -m http.server --directory app/static/ 5500
```

### Docker

Make sure database is created under ./app/instance/app.db

```bash
sudo docker compose up --build --detach
```

## Deployment

 - Make sure nginx file is copied to nginx folder
 - Make sure repo is cloned in deployment environment
 - Checkout require branch, e.g.
 - Start the Container

```bash
git checkout master
git pull origin master
sudo docker compose up --build --detach
```

### Nginx

Copy nginx.conf file nginx folder, e.g.:
```bash
sudo cp /var/www/html/theo/nginx.conf /etc/nginx/sites-available/theo
# Create symlink
sudo ln -s /etc/nginx/sites-available/theo /etc/nginx/sites-enabled/
sudo nginx -t # test config
sudo systemctl restart nginx
```
### Migrate Local SQLite Database to Server

Can use SFTP to copy SQLite database file to server since for current setup we are on the same private network

```powershell
sftp <user>@<server>
put <local_file_path> <remote_file_path>
```