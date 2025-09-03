# DevOps CI/CD Portfolio Project

This project is a demonstration of a **production-style CI/CD pipeline** built and deployed by me as part of my DevOps learning and portfolio.

---

## Project Overview
- **Backend**: Node.js + Express API (with SQLite database for storing reviews).
- **Frontend**: Static HTML portfolio site.
- **Containerization**: Docker images for backend and frontend.
- **Orchestration**: Deployed on Kubernetes (K3s).
- **Automation**: Jenkins pipeline handles build, push, deploy, and rollback.
- **Ingress**: Configured with a custom domain for frontend and backend access.

---

## Pipeline Workflow
1. Code pushed to GitHub triggers Jenkins.
2. Jenkins builds Docker images (backend & frontend).
3. Images are pushed to Docker Hub with version tags.
4. Kubernetes deployments are updated with new images.
5. Rollout status is verified.
6. If deployment fails, automatic rollback is executed.

---

##  Tech Stack
- **Languages**: Node.js, HTML/CSS
- **CI/CD**: Jenkins, GitHub
- **Containers**: Docker
- **Orchestration**: Kubernetes (K3s)
- **Cloud/Infra**: AWS EC2 (t3.small instance)
- **Database**: SQLite (lightweight, file-based DB)

---

##  Why This Project
- Shows **end-to-end CI/CD automation**.
- Demonstrates **rollback strategy** using `kubectl rollout undo`.
- Covers **DevOps best practices** with Docker, Kubernetes, and Jenkins.
- Uses a **custom domain with Ingress** for real-world exposure.

---

## Future Scope
In future iterations, I plan to integrate:
- **Monitoring**: Prometheus + Grafana dashboards.
- **Code Quality**: SonarQube integration.
- **Alerting**: Prometheus alerts triggering Jenkins webhooks.
- **Blue/Green & Canary Deployments** for advanced rollout strategies.

---

##  Live Demo
🌐 [Project URL](https://cicd.devopsbyganraj.cloud)  
📂 [GitHub Repository](https://github.com/GANRAJ99215/devops-portfolio)

---

##  Author
👤 **Ganraj Dol**  
*DevOps Engineer | Cloud Enthusiast | Automation Learner*
