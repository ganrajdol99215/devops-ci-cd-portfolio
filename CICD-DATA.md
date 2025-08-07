# 🚀 DevOps CI/CD Portfolio Project (Jenkins + Docker + K3s + GitHub + Monitoring)

> A complete CI/CD setup with Jenkins, Docker, Kubernetes (K3s), GitHub, and monitoring tools — Prometheus, Grafana, SonarQube, Zabbix — deployed on a domain like `https://cicd.devopsbyganraj.cloud`.
---

## ✅ CI/CD & Monitoring Workflow

```text
Push to GitHub
  └─> Jenkins Webhook Triggers
       └─> Jenkins stages:
             - SonarQube scan (frontend + backend)
             - Build + Push Docker Images
             - Deploy to K3s cluster
                └─> Ingress routes to services
```
User Access:
- Frontend: https://cicd.devopsbyganraj.cloud
- Backend:  https://cicd.devopsbyganraj.cloud/api
- Monitoring Tools:
    - /prometheus
    - /grafana
    - /sonarqube
    - /zabbix
```
---
## 🧩 Components

| Layer        | Tool                            |
|--------------|----------------------------------|
| CI/CD        | Jenkins                          |
| Container    | Docker, Docker Hub               |
| Cluster      | K3s (lightweight Kubernetes)     |
| Source       | GitHub                           |
| Monitoring   | Prometheus + Grafana             |
| Code Quality | SonarQube                        |
| Infra Watch  | Zabbix                           |

---
## 🌍 Access Points

| Service     | URL                                                  | Login Info       |
|-------------|------------------------------------------------------|------------------|
| Frontend    | https://cicd.devopsbyganraj.cloud/                  | -                |
| Backend API | https://cicd.devopsbyganraj.cloud/api               | -                |
| Prometheus  | https://cicd.devopsbyganraj.cloud/prometheus        | No login         |
| Grafana     | https://cicd.devopsbyganraj.cloud/grafana           | `admin` / `admin`|
| SonarQube   | https://cicd.devopsbyganraj.cloud/sonarqube         | `admin` / `admin`|
| Zabbix      | https://cicd.devopsbyganraj.cloud/zabbix            | `Admin` / `zabbix`|
---

## 🌐 Domain Setup: `cicd.devopsbyganraj.cloud`

### ✅ Steps to point your domain (via Cloudflare or DNS provider)

1. Go to DNS panel of `devopsbyganraj.cloud`
2. Add A record:

| Type | Name | Value (Your EC2 IP) | Proxy |
|------|------|---------------------|--------|
| A    | cicd | `13.234.123.45`     | DNS Only (not proxied) |

> ✅ Required for HTTPS + Ingress to work

### Ingress Rule YAML Example:
```yaml
spec:
  rules:
    - host: cicd.devopsbyganraj.cloud
```

---
## 🌐 1. Launch EC2 Instance (t3.small, Ubuntu 22.04)
```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

## 🐳 2. Install Docker
```bash
sudo apt update -y
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker
docker --version
```

## 🐋 3. Build & Push Docker Images to Docker Hub

### Backend `Dockerfile.backend`
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "server.js"]
```

### Frontend `Dockerfile`
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

### Build & Push Commands
```bash
cd backend
docker build -t ganraj99215/portfolio-backend:v1 -f Dockerfile.backend .
docker push ganraj99215/portfolio-backend:v1

cd ../frontend
docker build -t ganraj99215/portfolio-frontend:v1 .
docker push ganraj99215/portfolio-frontend:v1
```

## ☸️ 4. Install Kubernetes (K3s)
```bash
curl -sfL https://get.k3s.io | sh -
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
export KUBECONFIG=~/.kube/config
kubectl get nodes
```

## 📦 5. Kubernetes YAML Files

### Create Namespace
```bash
kubectl create namespace portfolio
```

### Ingress Controller
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.2.1/deploy/static/provider/cloud/deploy.yaml
```

### `frontend-deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: portfolio
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: ganraj99215/portfolio-frontend:v1
          ports:
            - containerPort: 80
```

### `frontend-service.yaml`
```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: portfolio
spec:
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
```

### `ingress.yaml`
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cicd-ingress
  namespace: portfolio
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$1
spec:
  ingressClassName: nginx
  rules:
    - host: cicd.devopsbyganraj.cloud
      http:
        paths:
          - path: /?(.*)
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
          - path: /api/?(.*)
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 3000
          - path: /prometheus/?(.*)
            pathType: Prefix
            backend:
              service:
                name: prometheus
                port:
                  number: 9090
          - path: /grafana/?(.*)
            pathType: Prefix
            backend:
              service:
                name: grafana
                port:
                  number: 3000
          - path: /sonarqube/?(.*)
            pathType: Prefix
            backend:
              service:
                name: sonarqube
                port:
                  number: 9000
          - path: /zabbix/?(.*)
            pathType: Prefix
            backend:
              service:
                name: zabbix-server
                port:
                  number: 80
```

### Apply All Manifests
```bash
kubectl apply -f k8s-manifests/ -n portfolio
```

## 🧪 6. Install Jenkins
```bash
sudo apt install -y openjdk-17-jdk
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt update
sudo apt install -y jenkins
sudo systemctl enable jenkins
sudo systemctl start jenkins
```

### Get Initial Admin Password
```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

## 🔑 7. Jenkins Credentials
Jenkins > Manage Jenkins > Credentials > Add Credentials

- Kind: Username & Password  
- ID: `dockerhub-creds`  
- Username: `<dockerhub-username>`  
- Password: `<dockerhub-password>`

Then:
- Install required plugins (Docker, Kubernetes CLI, SonarQube Scanner)
- Add DockerHub credentials
- Configure SonarQube under `Global Tool Config`
- Add GitHub webhook URL: `http://<ec2-ip>:8080/github-webhook/`

---

## 🔁 9. GitHub Webhook
- GitHub > Repo Settings > Webhooks > Add Webhook  
- Payload URL: `http://<EC2-IP>:8080/github-webhook/`  
- Content type: `application/json`  
- Trigger: `Just the push event`

## 📊 10. Monitoring: Prometheus + Grafana

| Service     | URL                                                  | Login Info       |
|-------------|------------------------------------------------------|------------------|
| Frontend    | https://cicd.devopsbyganraj.cloud/                  | -                |
| Backend API | https://cicd.devopsbyganraj.cloud/api               | -                |
| Prometheus  | https://cicd.devopsbyganraj.cloud/prometheus        | No login         |
| Grafana     | https://cicd.devopsbyganraj.cloud/grafana           | `admin` / `admin`|
| SonarQube   | https://cicd.devopsbyganraj.cloud/sonarqube         | `admin` / `admin`|
| Zabbix      | https://cicd.devopsbyganraj.cloud/zabbix            | `Admin` / `zabbix`|

## ✅ Final Pipeline Flow

```text
Developer → GitHub Push
→ Jenkins Webhook → Build Docker Images
→ Push to DockerHub → Deploy to K8s
→ Access at https://cicd.devopsbyganraj.cloud
→ Monitor via Grafana/Prometheus
```

## ♻️ EC2 Re-Creation Checklist

If EC2 terminates:
- Launch new instance
- Install Docker, Jenkins, K3s
- Re-clone repo, rebuild images (optional)
- Re-apply K8s YAMLs
- Re-add DockerHub creds to Jenkins
