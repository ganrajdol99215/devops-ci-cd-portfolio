pipeline {
  agent any

  environment {
    DOCKER_HUB_USER = 'ganraj99215'
    IMAGE_TAG = "v${BUILD_NUMBER}"
    BACKEND_IMAGE = "${DOCKER_HUB_USER}/portfolio-backend:${IMAGE_TAG}"
    FRONTEND_IMAGE = "${DOCKER_HUB_USER}/portfolio-frontend:${IMAGE_TAG}"
  }

  stages {

    stage('Checkout Code') {
      steps {
        git branch: 'main', url: 'https://github.com/ganrajdol99215/devops-ci-cd-portfolio.git'
      }
    }

    stage('Build Backend Docker Image') {
      steps {
        dir('backend') {
          sh "docker build -t ${BACKEND_IMAGE} -f Dockerfile.backend ."
        }
      }
    }

    stage('Build Frontend Docker Image') {
      steps {
        dir('frontend') {
          sh "docker build -t ${FRONTEND_IMAGE} ."
        }
      }
    }

    stage('Login & Push to DockerHub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh '''
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
            docker push $BACKEND_IMAGE
            docker push $FRONTEND_IMAGE
          '''
        }
      }
    }

    stage('Deploy to Kubernetes') {
      steps {
        sh """
          kubectl set image deployment/frontend frontend=$FRONTEND_IMAGE -n portfolio
          kubectl set image deployment/backend backend=$BACKEND_IMAGE -n portfolio
        """
      }
    }

    stage('Verify & Optional Rollback') {
      steps {
        input(message: 'Was the deployment successful?', ok: 'Yes')
      }
      post {
        failure {
          echo 'Deployment failed. Rolling back...'
          sh 'kubectl rollout undo deployment/frontend -n portfolio'
          sh 'kubectl rollout undo deployment/backend -n portfolio'
        }
      }
    }
  }
}
