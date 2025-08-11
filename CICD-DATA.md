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
## User Access:
- Frontend: https://cicd.devopsbyganraj.cloud
- Backend:  https://cicd.devopsbyganraj.cloud/api
- Monitoring Tools:
    - /prometheus
    - /grafana
    - /sonarqube
    - /zabbix

### Components :

| Layer        | Tool                            |
|--------------|----------------------------------|
| CI/CD        | Jenkins                          |
| Container    | Docker, Docker Hub               |
| Cluster      | K3s (lightweight Kubernetes)     |
| Source       | GitHub                           |
| Monitoring   | Prometheus + Grafana             |
| Code Quality | SonarQube                        |
| Infra Watch  | Zabbix                           |


## 🌍 Access Points : -

```
| Service     | URL                                                  | Login Info       |
|-------------|------------------------------------------------------|------------------|
| Frontend    | https://cicd.devopsbyganraj.cloud/                  | -                |
| Backend API | https://cicd.devopsbyganraj.cloud/api               | -                |
| Prometheus  | https://cicd.devopsbyganraj.cloud/prometheus        | No login         |
| Grafana     | https://cicd.devopsbyganraj.cloud/grafana           | `admin` / `admin`|
| SonarQube   | https://cicd.devopsbyganraj.cloud/sonarqube         | `admin` / `admin`|
| Zabbix      | https://cicd.devopsbyganraj.cloud/zabbix            | `Admin` / `zabbix`|
```
---

## 🌐 Domain Setup: `cicd.devopsbyganraj.cloud`

### ✅ Steps to point your domain (via Cloudflare or DNS provider)

1. Go to DNS panel of `devopsbyganraj.cloud`
2. Add A record:
```
| Type | Name | Value (Your EC2 IP) | Proxy |
|------|------|---------------------|--------|
| A    | cicd | `13.234.123.45`     | DNS Only (not proxied) |
```
> ✅ Required for HTTPS + Ingress to work
---

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
- Ubuntu 22.04
- Open ports: 22, 80, 443, 8080, 3000, 9090, 9000, 10051
---
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
Check status:
```bash
sudo kubectl get nodes
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
### Wait until the controller pod is running:
```bash
kubectl get pods -n ingress-nginx
```
### Change Ingress Controller to NodePort (Permanent Fix for HTTP 404)
```bash
kubectl patch svc ingress-nginx-controller -n ingress-nginx \
  -p '{"spec": {"type": "NodePort"}}'
```
### Check the assigned NodePort (80 and 443):
```bash
kubectl get svc -n ingress-nginx
```
### Example output:
```css
ingress-nginx-controller   NodePort    10.43.x.x   <none>   80:31617/TCP,443:30975/TCP   ...
```
Here 31617 is the NodePort for HTTP traffic.

### Apply All Manifests
```bash
kubectl apply -n portfolio -f k8s/
```

Check pod status:
```bash
kubectl get pods -n portfolio
```
### Apply the Ingress Resource
```bash
kubectl apply -n portfolio -f k8s/ingress.yaml
```
---
## 📌 DNS Configuration for CI/CD Ingress

Before accessing your application via **cicd.devopsbyganraj.cloud**, you must configure DNS in Cloudflare.

### Steps:
1. **Log in** to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Select the domain: **devopsbyganraj.cloud**.
3. Navigate to **DNS → Records → Add Record**.
4. Add a new **A Record**:
   - **Type:** `A`
   - **Name:** `cicd`
   - **IPv4 Address:** `<YOUR_EC2_PUBLIC_IP>`  
     *(Run `curl ifconfig.me` on your EC2 instance to get this.)*
   - **Proxy status:** ☁️ **DNS Only** *(disable proxy for Kubernetes ingress to work properly)*
   - **TTL:** Auto
5. Save the record.

Once added, you can test with:
```bash
curl -I http://<YOUR_EC2_PUBLIC_IP>/ -H "Host: cicd.devopsbyganraj.cloud"
curl -I http://<EC2-IP>:<NODE_PORT>/api -H "Host: cicd.devopsbyganraj.cloud"
```
### You should see:
```
HTTP/1.1 200 OK
```
---

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
### Accessing Jenkins Portal 
```
http://<EC2's_Public-Ip>:8080
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
