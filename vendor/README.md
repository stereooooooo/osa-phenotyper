# Self-hosted browser dependencies

The clinician application serves these fixed versions from its private S3 origin through CloudFront. No third-party JavaScript, CSS, font, or PDF worker is loaded into a page that may contain PHI.

| Package | Version | Browser assets | Upstream |
|---|---:|---|---|
| Bootstrap | 5.3.3 | `bootstrap.min.css`, `bootstrap.bundle.min.js` | `cdn.jsdelivr.net/npm/bootstrap@5.3.3` |
| Bootstrap Icons | 1.11.3 | `bootstrap-icons.css`, WOFF/WOFF2 fonts | `cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3` |
| Amazon Cognito Identity JS | 6.3.12 | `amazon-cognito-identity.min.js` | `cdn.jsdelivr.net/npm/amazon-cognito-identity-js@6.3.12` |
| PDF.js | 3.11.174 | `pdf.min.js`, `pdf.worker.min.js` | `cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174` |
| jsPDF | 2.5.1 | `jspdf.umd.min.js` | `cdn.jsdelivr.net/npm/jspdf@2.5.1` |
| html2canvas | 1.4.1 | `html2canvas.min.js` | `cdn.jsdelivr.net/npm/html2canvas@1.4.1` |
| Inter | Fontsource 5.0.17 | Latin normal WOFF2, weights 400/500/600/700 | `cdn.jsdelivr.net/npm/@fontsource/inter@5.0.17` |

Upstream license files are stored beside each package.

## Update rule

Do not replace a vendored asset during a clinical pilot without recording the new version and source, reviewing the upstream release/security notes, comparing file hashes, running the full headless suite, and completing a hosted login, PDF import, and PDF export smoke test. Dependency updates are a new application release, not a runtime CDN change.

Current asset hashes are recorded by Git. To produce an independent manifest for release review:

```bash
find vendor -type f ! -name README.md -exec shasum -a 256 {} +
```
