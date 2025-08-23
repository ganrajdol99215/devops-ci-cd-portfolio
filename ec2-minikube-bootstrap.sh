#!/bin/bash
set -e

echo "🚀 Updating system..."
sudo apt-get update -y
sudo apt-get upgrade -y

echo "🐳 Installing Docker..."
sudo apt-get install -y docker.io
sudo systemctl enable docker
sudo usermod -aG docker $USER

echo "📦 Installing curl, apt-transport-https, ca-certificates..."
sudo apt-get install -y curl apt-transport-https ca-certificates

echo "🔧 Installing kubectl..."
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

echo "🎩 Installing Helm..."
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

echo "🎡 Installing Minikube..."
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64

echo "🚦 Starting Minikube..."
minikube start --driver=docker --force

echo "🌐 Enabling Ingress..."
minikube addons enable ingress

echo "✅ Bootstrap complete. Run: 'newgrp docker'"
