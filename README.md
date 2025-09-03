#  DevOps CI/CD Portfolio Project

This project demonstrates a **production-like CI/CD pipeline** with:
- **Docker & Docker Compose**
- **K3s (lightweight Kubernetes)**
- **SQLite DB**
- **Ingress + Custom Domain**
- **Jenkins Pipeline (with rollback strategy)**
- **Monitoring (Prometheus + Grafana via Ingress)**

---

## 1. Launch EC2 Instance
- Ubuntu 22.04 LTS, `t3.small` (or higher).  
- Open ports in **Security Group**:  
  - 22 (SSH), 80 (HTTP), 443 (HTTPS), 5000(Backend)
  - 8080 (Jenkins)

Connect:
```bash
ssh -i your-key.pem ubuntu@<EC2-Public-IP>
```

---
## Cloudflare DNS Setup

 **A record** in Cloudflare DNS settings:

| Type | Name | Content (Value)        | TTL  | Proxy Status |
|------|------|-------------------------|------|--------------|
| A    | cicd | Your-EC2-Public-IP   | Auto | DNS only     |

site accessible at:  
`https://cicd.devopsbyganraj.cloud`

(Optional) want the **root domain** (`devopsbyganraj.cloud`) to point to EC2:

| Type | Name | Content (Value)        | TTL  | Proxy Status |
|------|------|-------------------------|------|--------------|
| A    | @    | Your-EC2-Public-IP   | Auto | DNS only     |

---

## 2.  Install Docker & Docker Compose
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git unzip

# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/2.24.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

docker --version
docker-compose --version
```

---

## 3.  Docker Hub Login
```bash
docker login
```

---

## 4.  Build & Push Images

### Backend
```bash
cd backend
docker build -t ganraj99215/backend:latest -f Dockerfile.backend .
docker push ganraj99215/backend:latest

```

### Frontend
```bash
cd frontend
docker build -t ganraj99215/frontend:latest -f Dockerfile.frontend .
docker push ganraj99215/frontend:latest

```

---

## 5. (Optional) Run with Docker Compose
`docker-compose.yml`:
```yaml
version: "3.8"
services:
  backend:
    image: ganraj99215/backend:latest
    ports:
      - "5000:5000"
    volumes:
      - ./backend/data:/app/data

  frontend:
    image: ganraj99215/frontend:latest
    ports:
      - "80:80"
```

Run:
```bash
docker-compose up -d
```

---

## 6. Install K3s
```bash
curl -sfL https://get.k3s.io | sh -
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
kubectl get nodes
```

---

## 7.  Deploy App on K3s

### Namespace
```bash
kubectl apply -f namespace.yaml
```

### Backend (with SQLite PVC)
```bash
kubectl apply -f backend.yaml -n cicd
```

### Frontend
```bash
kubectl apply -f frontend.yaml -n cicd
```

### Ingress
```bash
kubectl apply -f ingress-backend.yaml -n cicd
kubectl apply -f ingress-frontend.yaml -n cicd
```

Check:
```bash
kubectl get pods -n cicd
kubectl get svc -n cicd
kubectl get ingress -n cicd
```

---

## 8.  Ingress Controller Clarification

**Important:** An Ingress resource requires an **Ingress Controller**.  

- On **K3s**: Traefik Ingress Controller is pre-installed (no extra setup needed).
- **Note**: I faced 404 errors at first. Fixed it by correcting ingress path rules
and keeping backend + frontend ingress separate for Traefik.

- On **vanilla Kubernetes (kubeadm, EKS, GKE, AKS, etc.)**: you must install an Ingress Controller. Example (NGINX):  
  ```bash
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
  ```  
  Then set in your ingress.yaml:  
  ```yaml
  spec:
    ingressClassName: nginx
  ```

---

## 9.  Domain Setup
- Add A-record in your DNS → EC2 public IP.  
- Example: `cicd.devopsbyganraj.cloud`.

---

#  Jenkins Setup (CI/CD with Rollback)

## Install Jenkins
```bash
# Update packages
sudo apt update -y

# Install Java (required for Jenkins)
sudo apt install -y openjdk-17-jdk

# Add Jenkins repo
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | \
  sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

# Install Jenkins
sudo apt update -y
sudo apt install -y jenkins

# Start Jenkins service
sudo systemctl enable jenkins
sudo systemctl start jenkins

```
## Install Docker & Give Jenkins Permissions:
```bash
sudo apt install -y docker.io
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins

```
## Install kubectl
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s \
https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

chmod +x kubectl
sudo mv kubectl /usr/local/bin/

```

## Access Jenkins:
```
# Unlock Jenkins
sudo cat /var/lib/jenkins/secrets/initialAdminPassword

```
- Open browser: http://<EC2_PUBLIC_IP>:8080
- Paste the password, install Suggested Plugins, and create an admin user

## Add DockerHub Credentials

- Jenkins Dashboard → Manage Jenkins → Credentials → Global
- Add:
  - ID: 'dockerhub-creds'
  - Username: 'ganraj99215'
  - Password: 'your DockerHub password'
       Password / Access Token: (your DockerHub password or PAT)
---

## Jenkins Pipeline (with Rollback)
Create Jenkins Pipeline
- In Jenkins UI → New Item → Pipeline
- Use this Jenkinsfile:
Create pipeline in Jenkins → use this script:

```groovy
pipeline {
    agent any
    environment {
        DOCKER_USER = 'ganraj99215'
        DOCKER_PASS = credentials('dockerhub-creds')
    }
    stages {
        stage('Checkout') {
            steps {
                git 'https://github.com/ganrajdol99215/devops-ci-cd-portfolio.git'
            }
        }
        stage('Build & Push Backend') {
            steps {
                sh """
                echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                docker build -t $DOCKER_USER/backend:latest backend/
                docker push $DOCKER_USER/backend:latest
                """
            }
        }
        stage('Build & Push Frontend') {
            steps {
                sh """
                echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                docker build -t $DOCKER_USER/frontend:latest frontend/
                docker push $DOCKER_USER/frontend:latest
                """
            }
        }
        stage('Deploy to K3s') {
            steps {
                sh 'kubectl apply -f k8s/ -n cicd'
            }
        }
    }
    post {
        failure {
            echo "Deployment failed. Rolling back..."
            sh 'kubectl rollout undo deployment backend -n cicd || true'
            sh 'kubectl rollout undo deployment frontend -n cicd || true'
        }
    }
}

```

---
### Configure GitHub Webhook

1. Go to your GitHub repo → Settings → Webhooks → Add Webhook
2. Payload URL:

   ```arduino
   http://<your-server-ip>:8080/github-webhook/
   ```
   3.Content type: 'application/json'
   4.Select → 'Just the push event'
   5.Save 
---
## 11. Monitoring (Prometheus + Grafana via Ingress)

### Prometheus
`prometheus.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: cicd
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus
        ports:
        - containerPort: 9090
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: cicd
spec:
  ports:
  - port: 9090
    targetPort: 9090
  selector:
    app: prometheus
```

### Grafana
`grafana.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: cicd
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana
        ports:
        - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: cicd
spec:
  ports:
  - port: 3000
    targetPort: 3000
  selector:
    app: grafana
```

Apply:
```bash
kubectl apply -f prometheus.yaml -n monitoring
kubectl apply -f grafana.yaml -n monitoring
```

---

## 12. Update Ingress for App + Monitoring

Final `ingress.yaml` (single Ingress with all routes):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cicd-ingress
  namespace: cicd
spec:
  # For K3s (Traefik is default) → remove or set "traefik"
  ingressClassName: traefik
  rules:
  - host: cicd.devopsbyganraj.cloud
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 5000
      - path: /prometheus
        pathType: Prefix
        backend:
          service:
            name: prometheus
            port:
              number: 9090
      - path: /grafana
        pathType: Prefix
        backend:
          service:
            name: grafana
            port:
              number: 3000

```

Reapply:
```bash
kubectl apply -f ingress.yaml -n cicd
```

---

## Final Outcome
- Full portfolio-webpage (Frontend + Backend + SQLite DB).  
- Dockerized & pushed to Docker Hub.  
- Deployed on **K3s** with **Ingress**.  
- Jenkins automates build → deploy → rollback on failure.  
- Monitoring via **Prometheus** → `https://cicd.devopsbyganraj.cloud/prometheus`  
- Monitoring via **Grafana** → `https://cicd.devopsbyganraj.cloud/grafana` (login: `admin/admin`)  
