pipeline {
    agent any
    environment {
        KUBECONFIG = "/var/lib/jenkins/.kube/config"
    }
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/ganrajdol99215/devops-ci-cd-portfolio.git'
            }
        }

        stage('Build & Push Backend') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        IMAGE_TAG=backend-${BUILD_NUMBER}
                        docker build -t $DOCKER_USER/backend:$IMAGE_TAG -f backend/Dockerfile.backend backend/
                        docker push $DOCKER_USER/backend:$IMAGE_TAG
                        kubectl set image deployment/backend backend=$DOCKER_USER/backend:$IMAGE_TAG -n cicd
                    '''
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        IMAGE_TAG=frontend-${BUILD_NUMBER}
                        docker build -t $DOCKER_USER/frontend:$IMAGE_TAG -f frontend/Dockerfile.frontend frontend/
                        docker push $DOCKER_USER/frontend:$IMAGE_TAG
                        kubectl set image deployment/frontend frontend=$DOCKER_USER/frontend:$IMAGE_TAG -n cicd
                    '''
                }
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
