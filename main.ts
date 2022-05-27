import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { KubernetesProvider, Namespace, Service, Deployment } from "./.gen/providers/kubernetes"
const app_name = 'k8s-nginx-app'
const labels = { 'k8s-app': app_name, owner: 'kuongknight' }
class MyStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);
    new KubernetesProvider(this, name, { host: 'https://kubernetes.docker.internal:6443', insecure: true, configPath: '~/.kube/config' });
    new Namespace(this, name + '-namespace', { metadata: { name } })
    new Service(this, name + '-service', { metadata: { name, namespace: name, labels }, spec: { port: [{ port: 8080, targetPort: "80" }], selector: { "k8s-app": app_name } } })
    new Deployment(this, name + '-deployment', {
      metadata: { name, namespace: name, labels },
      spec: {
        replicas: "1",
        revisionHistoryLimit: 10,
        selector: { matchLabels: { "k8s-app": app_name } },
        template: {
          metadata: { labels: { "k8s-app": app_name } },
          spec: {
            container: [{
              name: app_name,
              image: 'nginx:latest',
              port: [{ containerPort: 8443, protocol: 'TCP' }],
              livenessProbe: {
                httpGet: {
                  scheme: "HTTP",
                  port: "80",
                  path: "/"
                },
                initialDelaySeconds: 30,
                timeoutSeconds: 30
              }
            }]
          }
        }
      }
    })
  }
}

const app = new App();
new MyStack(app, app_name);
app.synth();
