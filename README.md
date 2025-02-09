# Theo Von Quotes
Web App to display Theo Von's quotes

## Setup

### Install Requirement
```
pip install -r requirements.txt
```

### Database
Create sqlite database under instance/app.db by running
``` 
sqlite3 ./app/instance/app.db
```

Table creation will be handled by SQLModel library

### Run App Locally

**Api**
```
fastapi dev app/main.py
```

**Client**
```
python3 -m http.server --directory app/static/ 5500
```

### Docker

### Deployment
