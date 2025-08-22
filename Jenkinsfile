pipeline {
  agent any

  environment {
    REGISTRY = "docker.io"
    DOCKERHUB_USER = credentials('ganraj99215')
    DOCKERHUB_PASS = credentials('9921569869')
    KUBECONFIG_CRED = credentials('kubeconfig-portfolio')
    SONAR_TOKEN = credentials('sonar-token')
    SONAR_HOST_URL = "https://cicd.devopsbyganraj.cloud/sonarqube"
    FRONTEND_IMAGE = "ganraj99215/portfolio-frontend"
    BACKEND_IMAGE  = "ganraj99215/portfolio-backend"
    APP_VERSION = "${params.APP_VERSION}"
  }

  parameters {
    string(name: 'APP_VERSION', defaultValue: "v${env.BUILD_NUMBER}", description: 'Docker image tag')
    booleanParam(name: 'DO_DEPLOY', defaultValue: true, description: 'Deploy to cluster after build?')
    booleanParam(name: 'ROLLBACK_IF_UNHEALTHY', defaultValue: true, description: 'Auto rollback on failed rollout')
  }

  stages {
    stage('Checkout') { steps { checkout scm } }

    stage('SonarQube Scan (frontend)') {
      steps {
        sh '''
          docker run --rm -v "$WORKSPACE/frontend":/usr/src sonarsource/sonar-scanner-cli           -Dsonar.projectBaseDir=/usr/src           -Dsonar.host.url=$SONAR_HOST_URL           -Dsonar.login=$SONAR_TOKEN || true
        '''
      }
    }

    stage('SonarQube Scan (backend)') {
      steps {
        sh '''
          docker run --rm -v "$WORKSPACE/backend":/usr/src sonarsource/sonar-scanner-cli           -Dsonar.projectBaseDir=/usr/src           -Dsonar.host.url=$SONAR_HOST_URL           -Dsonar.login=$SONAR_TOKEN || true
        '''
      }
    }

    stage('Build & Push Images') {
      steps {
        sh '''
          docker build -t $FRONTEND_IMAGE:$APP_VERSION -f frontend/Dockerfile frontend
          docker build -t $BACKEND_IMAGE:$APP_VERSION  -f backend/Dockerfile.backend backend
          echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin $REGISTRY
          docker push $FRONTEND_IMAGE:$APP_VERSION
          docker push $BACKEND_IMAGE:$APP_VERSION
          docker tag $FRONTEND_IMAGE:$APP_VERSION $FRONTEND_IMAGE:latest
          docker tag $BACKEND_IMAGE:$APP_VERSION  $BACKEND_IMAGE:latest
          docker push $FRONTEND_IMAGE:latest
          docker push $BACKEND_IMAGE:latest
        '''
      }
    }

    stage('Patch Image Tags in Manifests') {
      when { expression { return params.DO_DEPLOY } }
      steps {
        sh '''
          sed -i "s#\(image: ${FRONTEND_IMAGE}\):.*#\1:${APP_VERSION}#g" k8s/frontend-deployment.yaml
          sed -i "s#\(image: ${BACKEND_IMAGE}\):.*#\1:${APP_VERSION}#g" k8s/backend-deployment.yaml
        '''
      }
    }

    stage('Deploy to Kubernetes') {
      when { expression { return params.DO_DEPLOY } }
      steps {
        withEnv(["KUBECONFIG=$WORKSPACE/kubeconfig"]) {
          sh '''
            echo "$KUBECONFIG_CRED" > $KUBECONFIG
            kubectl apply -f k8s/namespace.yaml
            kubectl apply -f k8s/frontend-deployment.yaml
            kubectl apply -f k8s/frontend-service.yaml
            kubectl apply -f k8s/backend-deployment.yaml
            kubectl apply -f k8s/backend-service.yaml
            kubectl apply -f k8s/ingress.yaml
            kubectl apply -f k8s/monitoring.yaml
            kubectl rollout status deploy/frontend -n portfolio --timeout=90s || true
            kubectl rollout status deploy/backend  -n portfolio --timeout=120s || true
          '''
        }
      }
    }

    stage('Health Check & Optional Rollback') {
      when { allOf { expression { return params.DO_DEPLOY }; expression { return params.ROLLBACK_IF_UNHEALTHY } } }
      steps {
        script {
          def failed = sh(script: '''
            set -e
            FRONT_OK=$(kubectl get deploy frontend -n portfolio -o jsonpath='{.status.availableReplicas}'); test "${FRONT_OK:-0}" -ge 1 || echo FAIL
            BACK_OK=$(kubectl get deploy backend  -n portfolio -o jsonpath='{.status.availableReplicas}'); test "${BACK_OK:-0}" -ge 1 || echo FAIL
          ''', returnStatus: true)
          if (failed != 0) {
            sh 'kubectl rollout undo deploy/frontend -n portfolio || true; kubectl rollout undo deploy/backend -n portfolio || true'
          }
        }
      }
    }
  }
}
