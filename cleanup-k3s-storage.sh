#!/bin/bash

echo "⚠️ WARNING: This will delete all unused container data!"
echo "Stopping K3s..."
sudo systemctl stop k3s

echo "Deleting containerd containers and snapshots..."
sudo ctr -n k8s.io containers ls -q | xargs -r sudo ctr -n k8s.io containers delete
sudo ctr -n k8s.io snapshots ls -q | xargs -r sudo ctr -n k8s.io snapshots rm

echo "Removing temporary snapshot directories..."
sudo rm -rf /var/lib/rancher/k3s/agent/containerd/io.containerd.snapshotter.v1.overlayfs/snapshots/*

echo "Starting K3s again..."
sudo systemctl start k3s

echo "✅ Cleanup complete. Disk usage now:"
df -h | grep '/$'
