#!/bin/bash
set -e

echo "[Step 1] Update system"
sudo apt-get update -y
sudo apt-get upgrade -y

echo "[Step 2] Install dependencies"
sudo apt-get install -y curl wget apt-transport-https ca-certificates gnupg lsb-release git

echo "[Step 3] Install Docker"
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

echo "[Step 4] Install kubectl"
curl -LO "https://dl.k8s.io/release/$(curl -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

echo "[Step 5] Install Minikube"
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

echo "[Step 6] Install Helm"
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

echo "[Step 7] Start Minikube"
minikube start --driver=docker --memory=4096 --cpus=2

echo "[Step 8] Enable Ingress"
minikube addons enable ingress

echo "[Done] Please log out and log in again so Docker group changes apply."
