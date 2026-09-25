# Public Extraction Resistance Boundary

Infrastructure Product Works is intentionally demonstrable without publishing the implementation recipe.

## Increment 1: credential and artifact leakage

This first gate is intentionally narrow and additive. It does **not** remove, rewrite, score, or hide existing website content.

It fails closed on:
- conventional dotenv files and variants;
- private-key files and private-key signatures;
- GitHub and AWS credential signatures;
- source maps;
- Terraform state and state backups;
- conventional machine-readable OpenAPI/Swagger specification filenames.

Later increments will separately address:
1. private implementation-repository/reference exposure; and
2. content, diagram, and demo-surface preservation.

Those concerns are intentionally split so each protection can be reviewed, merged, and verified independently without blocking the others.

Anything committed to this public repository must still be treated as disclosed.
