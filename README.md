# magda-auth-aaf

![Version: 1.0.0](https://img.shields.io/badge/Version-1.0.0-informational?style=flat-square)

A Magda Authentication Plugin for Australian Access Federation (AAF) Rapid Connect.

## Version Compatibility

Pick the chart version that matches your Magda release:

| This chart | Requires Magda | Notes |
| ---------- | -------------- | ----- |
| **`v2.x`** (from `v2.0.0-alpha.0`) | **v7.0.0 or above** | Connects to `session-db` over **TLS** when the database enforces SSL. Uses the versioned `magda.db-client-sslmode-env-v1` Helm helper contract plus `magda.db-client-ca-env-v1` for `sslmode: verify-ca`/`verify-full` server-certificate verification (needs `magda-core` `>= 7.0.0-alpha.1`), and runs on **Node.js 22**. |
| **`v1.x`** | **v6.x or below** (v0.0.58+) | Use this line if you run **Magda v6 or lower**. Does not emit `PGSSLMODE` and will not work against an SSL-enforced external database. |

> ⚠️ **`v2.x` is a breaking change and requires Magda v7+** (on the v7 pre-release line, **`>= 7.0.0-alpha.1`**, which first shipped the `db-client-ca-env-v1` contract this chart now calls). Do **not** deploy `v2.x` alongside Magda v6 or lower, or an earlier v7 alpha — the required helper contracts are only provided by a recent enough `magda-core`, and rendering will fail closed with `no template "magda.compatibility-check" associated` or a contract-not-supported error (this is intentional — the render-time compatibility handshake is controlled by `global.magdaCompatibilityCheck`, default `true`; see the [Magda Helm Helper Contracts](https://github.com/magda-io/magda/blob/next/docs/docs/helm-helper-contracts.md) documentation).

> **Deploy as a chart dependency in the same Helm release as Magda** (not a separate `helm install`), so the `magda.compatibility-check` template resolves.

### How to Use

1. Register your AAF Rapid Connect Service at:
- https://rapid.test.aaf.edu.au/registration (Test)
- Or https://rapid.aaf.edu.au/registration (Production)

When register:
- the `[external domain]` should be the external domain that is used to access Magda.
- the callback URL should be: `https://[external domain]/auth/login/plugin/aaf/jwt`

> If you change the auth plugin key, the `aaf` part in the callback URL should be replaced with the new auth plugin key.

2. Add the auth plugin as a [Helm Chart Dependency](https://helm.sh/docs/helm/helm_dependency/)
```yaml
- name: magda-auth-aaf
  version: 1.0.0
  repository: https://charts.magda.io
```

3. Config the auth plugin with required parameters
```yaml
magda-auth-aaf:
  aafClientUri: "https://rapid.test.aaf.edu.au/jwt/authnrequest/research/xxxxxxxxxxxx"
```

4. Supply aaf client secret via secret `oauth-secrets` key `aaf-client-secret`.

5. Config Gatway to add the auth plugin to Gateway's plugin list (More details see [here](https://github.com/magda-io/magda/blob/master/deploy/helm/internal-charts/gateway/README.md))
```yaml
gateway:
  authPlugins:
  - key: "aaf"
    baseUrl: http://magda-auth-aaf
```

## Requirements

Kubernetes: `>= 1.14.0-0`

| Repository | Name | Version |
|------------|------|---------|
| oci://ghcr.io/magda-io/charts | magda-common | 7.0.0-alpha.1 |

## Values

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| aafClientUri | string | `""` | The aaf client Uri to use for AAF Rapid Connect Auth. e.g. https://rapid.test.aaf.edu.au/jwt/authnrequest/research/xxxxxxxxxxxx aaf client secret should be supplied via secret `aaf-client-secret` key `secret`. |
| authPluginConfig.authenticationMethod | string | `"IDP-URI-REDIRECTION"` | The authentication method of the plugin. Support values are: <ul> <li>`IDP-URI-REDIRECTION`: the plugin will redirect user agent to idp (identity provider) for authentication. e.g. Google & facebook oauth etc.</li> <li>`PASSWORD`: the plugin expect frontend do a form post that contains username & password to the plugin for authentication.</li> <li>`QR-CODE`: the plugin offers a url that is used by the frontend to request auth challenge data. The data will be encoded into a QR-code image and expect the user scan the QR code with a mobile app to complete the authentication request.</li> </ul> See [Authentication Plugin Specification](https://github.com/magda-io/magda/blob/master/docs/docs/authentication-plugin-spec.md) for more details |
| authPluginConfig.iconUrl | string | `"/icon.png"` | the display icon URL of the auth plugin. |
| authPluginConfig.key | string | `"aaf"` | the unique key of the auth plugin. Allowed characters: [a-zA-Z0-9\-] |
| authPluginConfig.loginFormExtraInfoContent | string | `""` | Optional; Only applicable when authenticationMethod = "PASSWORD". If present, will displayed the content underneath the login form to provide extra info to users. e.g. how to reset password Can support content in markdown format. |
| authPluginConfig.loginFormExtraInfoHeading | string | `""` | Optional; Only applicable when authenticationMethod = "PASSWORD". If present, will displayed the heading underneath the login form to provide extra info to users. e.g. how to reset password |
| authPluginConfig.loginFormPasswordFieldLabel | string | "Password" | Optional; Only applicable when authenticationMethod = "PASSWORD". |
| authPluginConfig.loginFormUsernameFieldLabel | string | "Username" | Optional; Only applicable when authenticationMethod = "PASSWORD". |
| authPluginConfig.name | string | `"AAF Rapid Connect"` | the display name of the auth plugin. |
| authPluginConfig.qrCodeAuthResultPollUrl | string | `""` | Only applicable & compulsory when authenticationMethod = "QR-CODE". The url that is used by frontend to poll the authentication processing result. See [Authentication Plugin Specification](https://github.com/magda-io/magda/blob/master/docs/docs/authentication-plugin-spec.md) for more details |
| authPluginConfig.qrCodeExtraInfoContent | string | `""` | Only applicable & compulsory when authenticationMethod = "QR-CODE". If present, will displayed the content underneath the login form to provide extra info to users. e.g. how to download moile app to scan the QR Code. Can support content in markdown format. |
| authPluginConfig.qrCodeExtraInfoHeading | string | `""` | Only applicable & compulsory when authenticationMethod = "QR-CODE". If present, will displayed the heading underneath the QR Code image to provide extra instruction to users. e.g. how to download moile app to scan the QR Code |
| authPluginConfig.qrCodeImgDataRequestUrl | string | `""` | Only applicable & compulsory when authenticationMethod = "QR-CODE". The url that is used by frontend client to request auth challenge data from the authentication plugin. See [Authentication Plugin Specification](https://github.com/magda-io/magda/blob/master/docs/docs/authentication-plugin-spec.md) for more details |
| authPluginRedirectUrl | string | `nil` | the redirection url after the whole authentication process is completed. Authentication Plugins will use this value as default. The following query parameters can be used to supply the authentication result: <ul> <li>result: (string) Compulsory. Possible value: "success" or "failure". </li> <li>errorMessage: (string) Optional. Text message to provide more information on the error to the user. </li> </ul> This field is for overriding the value set by `global.authPluginRedirectUrl`. Unless you want to have a different value only for this auth plugin, you shouldn't set this value. |
| autoscaler.enabled | bool | `false` | turn on the autoscaler or not |
| autoscaler.maxReplicas | int | `3` |  |
| autoscaler.minReplicas | int | `1` |  |
| autoscaler.targetCPUUtilizationPercentage | int | `80` |  |
| defaultAdminUserId | string | `"00000000-0000-4000-8000-000000000000"` | which system account we used to talk to auth api The value of this field will only be used when `global.defaultAdminUserId` has no value |
| defaultImage.imagePullSecret | bool | `false` |  |
| defaultImage.pullPolicy | string | `"IfNotPresent"` |  |
| defaultImage.repository | string | `"docker.io/data61"` |  |
| global | object | `{"authPluginRedirectUrl":"/sign-in-redirect","externalUrl":"","image":{},"magdaCompatibilityCheck":true,"rollingUpdate":{}}` | only for providing appropriate default value for helm lint |
| global.magdaCompatibilityCheck | bool | `true` | Whether to run the Magda Helm helper-contract compatibility check. Leave as `true` in normal deployments alongside Magda v7+; set to `false` (unquoted) only for a standalone `helm template`/`helm lint` (no magda-core). See https://github.com/magda-io/magda/blob/next/docs/docs/helm-helper-contracts.md |
| image.name | string | `"magda-auth-aaf"` |  |
| replicas | int | `1` | no. of initial replicas |
| resources.limits.cpu | string | `"50m"` |  |
| resources.requests.cpu | string | `"10m"` |  |
| resources.requests.memory | string | `"30Mi"` |  |
