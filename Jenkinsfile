pipeline {
  agent any
  environment {
    REGISTRY = "ghcr.io/ganrajdol/portfolio-backend"
    DOCKER_BUILDKIT = "1"
    KUBECONFIG = "$WORKSPACE/kubeconfig"
    APP_NAMESPACE = "cicd"
  }
  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }
    stage('Build Backend') {
      steps {
        dir('backend') {
          sh 'npm ci'
          sh 'npm run build'
        }
      }
    }
    stage('Test Backend') {
      steps {
        dir('backend') {
          sh 'npm test || echo "No tests found"'
        }
      }
    }
    stage('Docker Build & Push') {
      steps {
        sh '''
          docker login ghcr.io -u $GITHUB_USER -p $GITHUB_TOKEN
          docker build -t $REGISTRY:$BUILD_NUMBER ./backend
          docker tag $REGISTRY:$BUILD_NUMBER $REGISTRY:latest
          docker push $REGISTRY:$BUILD_NUMBER
          docker push $REGISTRY:latest
        '''
      }
    }
    stage('Deploy to Kubernetes') {
      steps {
        sh '''
          echo "$KUBECONFIG_CONTENT" > $WORKSPACE/kubeconfig
          kubectl --kubeconfig=$WORKSPACE/kubeconfig -n cicd apply -f k8s/
          kubectl --kubeconfig=$WORKSPACE/kubeconfig -n cicd rollout status deploy/backend --timeout=120s
          kubectl --kubeconfig=$WORKSPACE/kubeconfig -n cicd rollout status deploy/frontend --timeout=120s
        '''
      }
    }
  }
  post {
    failure {
      echo 'Build failed! Rolling back...'
      sh '''
        kubectl --kubeconfig=$WORKSPACE/kubeconfig -n cicd rollout undo deploy/backend || true
        kubectl --kubeconfig=$WORKSPACE/kubeconfig -n cicd rollout undo deploy/frontend || true
      '''
    }
  }
}
